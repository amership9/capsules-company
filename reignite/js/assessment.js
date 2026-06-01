/* ============================================================================
   Reignite — منحني الاحتراق
   assessment.js — تحكّم تدفّق الأسئلة (يبني كل سؤال، يخزّن الإجابة بالعقد الصحيح،
   يحسب النتيجة، يحفظها في Firestore، ثم ينقل لصفحة النتيجة)

   عقد تخزين الإجابات (لازم يطابق scoring.js):
     choice    → فهرس الخيار (رقم)
     scale     → رقم 1..10
     textarea  → نصّ
     compound  → { value, text }
                 value = فهرس الجزء الذي هو "choice" (سواء كان main أو followUp)
                 text  = نصّ الجزء الذي هو "textarea"
============================================================================ */

import { QUESTIONS } from './questions.js';
import { computeResults } from './scoring.js';
import { db, collection, addDoc, serverTimestamp, COLLECTION } from './firebase-config.js';

const TOTAL = QUESTIONS.length;
const $ = (id) => document.getElementById(id);

/* ---------- الجلسة ---------- */
let session;
try { session = JSON.parse(sessionStorage.getItem('reignite_session')); } catch { session = null; }
if (!session || !session.cohort) { location.replace('index.html'); }

const answers = (session && session.answers) ? session.answers : {};
let idx = 0;

const card    = $('qcard');
const bar     = $('bar');
const counter = $('counter');
const axisName = $('axisName');
const prevBtn = $('prevBtn');
const nextBtn = $('nextBtn');

const curQ = () => QUESTIONS[idx];

/* ---------- التحقّق ---------- */
function isValid() {
  const q = curQ();
  const a = answers[q.id];
  if (q.type === 'choice')   return a != null;
  if (q.type === 'scale')    return a != null;
  if (q.type === 'textarea') return true;                 // النصّ المنفرد اختياري
  if (q.type === 'compound') return a && a.value != null; // جزء الاختيار إجباري
  return false;
}

function updateNav() {
  nextBtn.disabled = !isValid();
  const done = idx + (isValid() ? 1 : 0);
  bar.style.width = Math.round((done / TOTAL) * 100) + '%';
  counter.textContent  = `السؤال ${idx + 1} من ${TOTAL}`;
  axisName.textContent = `المحور ${curQ().axis} — ${curQ().axisName}`;
  nextBtn.textContent  = idx === TOTAL - 1 ? 'اعرض النتيجة ✦' : 'التالي ←';
  prevBtn.textContent  = idx === 0 ? '→ رجوع للبداية' : '← السابق';
}

/* ---------- لبنات العناصر ---------- */
function choiceBlock(options, selectedIdx, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'opts';
  options.forEach((o, i) => {
    const el = document.createElement('div');
    el.className = 'opt' + (selectedIdx === i ? ' sel' : '');
    el.innerHTML = `<span class="dot"></span><span>${o.label}</span>`;
    el.onclick = () => {
      [...wrap.children].forEach(c => c.classList.remove('sel'));
      el.classList.add('sel');
      onPick(i);
    };
    wrap.appendChild(el);
  });
  return wrap;
}

function scaleBlock(q, selected, onPick) {
  const box = document.createElement('div'); box.className = 'scale';
  const row = document.createElement('div'); row.className = 'scale-row';
  for (let n = 1; n <= 10; n++) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = n;
    if (selected === n) b.classList.add('sel');
    b.onclick = () => {
      [...row.children].forEach(c => c.classList.remove('sel'));
      b.classList.add('sel');
      onPick(n);
    };
    row.appendChild(b);
  }
  const labels = document.createElement('div');
  labels.className = 'scale-labels';
  labels.innerHTML = `<span>${q.labels[0]}</span><span>${q.labels[1]}</span>`;
  box.appendChild(row); box.appendChild(labels);
  return box;
}

function textareaBlock(placeholder, value, onInput) {
  const ta = document.createElement('textarea');
  ta.placeholder = placeholder || 'اكتب هنا...';
  ta.value = value || '';
  ta.oninput = () => onInput(ta.value);
  return ta;
}

/* ---------- رسم السؤال الحالي ---------- */
function render() {
  const q = curQ();
  card.classList.remove('fade'); void card.offsetWidth; card.classList.add('fade');
  card.innerHTML = '';

  const num = document.createElement('div');
  num.className = 'qnum';
  num.textContent = `المحور ${q.axis} · ${q.axisName}`;
  card.appendChild(num);

  const t = document.createElement('div');
  t.className = 'qtext';
  t.textContent = q.text;
  card.appendChild(t);

  if (q.hint) {
    const h = document.createElement('div');
    h.className = 'qhint';
    h.textContent = q.hint;
    card.appendChild(h);
  }

  if (q.type === 'choice') {
    card.appendChild(choiceBlock(q.options, answers[q.id], (i) => { answers[q.id] = i; updateNav(); }));
  }
  else if (q.type === 'scale') {
    card.appendChild(scaleBlock(q, answers[q.id], (n) => { answers[q.id] = n; updateNav(); }));
  }
  else if (q.type === 'textarea') {
    card.appendChild(textareaBlock(q.textPlaceholder, answers[q.id], (v) => { answers[q.id] = v; updateNav(); }));
  }
  else if (q.type === 'compound') {
    let cur = (answers[q.id] && typeof answers[q.id] === 'object') ? answers[q.id] : { value: null, text: '' };
    answers[q.id] = cur;
    const mainIsChoice = !!q.options;

    /* الجزء الرئيسي */
    if (mainIsChoice) {
      card.appendChild(choiceBlock(q.options, cur.value, (i) => {
        cur.value = i;
        if (q.id === 'Q6' && i === 0) cur.text = '';   // لا متابعة عند "الناس باقية"
        render();                                       // لإظهار/إخفاء المتابعة
      }));
    } else {
      card.appendChild(textareaBlock(q.textPlaceholder, cur.text, (v) => { cur.text = v; updateNav(); }));
    }

    /* جزء المتابعة */
    const fu = q.followUp;
    const show = fu.showWhen === 'always'
      || (fu.showWhen === 'index!=0' && cur.value != null && cur.value !== 0);

    if (show) {
      const sub = document.createElement('div');
      sub.className = 'field'; sub.style.marginTop = '20px';
      const lab = document.createElement('label');
      lab.textContent = fu.text;
      sub.appendChild(lab);
      card.appendChild(sub);
      if (fu.type === 'choice') {
        sub.appendChild(choiceBlock(fu.options, cur.value, (i) => { cur.value = i; updateNav(); }));
      } else {
        sub.appendChild(textareaBlock(fu.textPlaceholder, cur.text, (v) => { cur.text = v; updateNav(); }));
      }
    }
  }

  updateNav();
}

/* ---------- التنقّل ---------- */
prevBtn.onclick = () => {
  if (idx === 0) { location.href = 'index.html'; return; }
  idx--; render();
};

nextBtn.onclick = async () => {
  if (!isValid()) return;
  if (idx < TOTAL - 1) { idx++; render(); return; }
  await finish();
};

/* ---------- الإنهاء والحفظ ---------- */
async function finish() {
  nextBtn.disabled = true;
  nextBtn.textContent = 'بنحفظ إجابتك...';

  const results = computeResults(answers);
  const payload = {
    alias: session.alias || 'مجهول',
    cohort: session.cohort,
    category: session.category,            // A / B / C
    categoryLabel: session.categoryLabel,
    answers,
    results,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, COLLECTION), payload);
    sessionStorage.removeItem('reignite_save_error');
  } catch (e) {
    console.error('Reignite: فشل حفظ الإجابة في Firestore', e);
    sessionStorage.setItem('reignite_save_error', '1');  // نكمل للنتيجة مع تنبيه
  }

  sessionStorage.setItem('reignite_result', JSON.stringify({ session, answers, results }));
  location.href = 'results.html';
}

/* ---------- إقلاع ---------- */
render();
