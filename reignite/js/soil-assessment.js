/* ============================================================================
   Reignite — التربة
   soil-assessment.js — تدفّق البنود + الحفظ التدريجي + رابط الاستكمال
   نفس منطق assessment.js بالظبط، متظبّط للّيكرت + "مش منطبق".
============================================================================ */

import { SOIL_ITEMS, SOIL_SCALE, computeSoil } from './soil-config-items.js';
import {
  db, collection, addDoc, doc, setDoc, deleteDoc,
  serverTimestamp, COLLECTION_SOIL, COLLECTION_SOIL_DRAFTS
} from './soil-config.js';

const TOTAL = SOIL_ITEMS.length;
const $ = (id) => document.getElementById(id);

/* ---------- الجلسة ---------- */
let session;
try { session = JSON.parse(sessionStorage.getItem('soil_session')); } catch { session = null; }
if (!session || !session.cohort || !session.resumeCode) { location.replace('soil-index.html'); }

const answers = (session && session.answers) ? session.answers : {};
let idx = (session && Number.isInteger(session.idx)) ? session.idx : 0;
if (idx < 0 || idx >= TOTAL) idx = 0;

/* تثبيت الكود في الرابط */
(function ensureCodeInUrl() {
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('c') !== session.resumeCode) {
      url.searchParams.set('c', session.resumeCode);
      history.replaceState(null, '', url.toString());
    }
  } catch (e) {}
})();

const card = $('qcard'), bar = $('bar'), counter = $('counter'), pillarName = $('pillarName');
const prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
const curItem = () => SOIL_ITEMS[idx];

/* ---------- رابط الاستكمال ---------- */
$('copyCodeBtn').onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); $('copyCodeBtn').textContent='اتنسخ ✓'; }
  catch { $('copyCodeBtn').textContent='اضغط مطوّل على الرابط'; }
  setTimeout(() => { $('copyCodeBtn').textContent='انسخ رابط رحلتك'; }, 1800);
};

/* ---------- الحفظ التدريجي ---------- */
let saveTimer = null;
function persistSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(persistNow, 800); }
async function persistNow() {
  try {
    await setDoc(doc(db, COLLECTION_SOIL_DRAFTS, session.resumeCode), {
      resumeCode: session.resumeCode, alias: session.alias || 'مجهول', cohort: session.cohort,
      category: session.category, categoryLabel: session.categoryLabel, department: session.department,
      answers, idx, updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.error('Soil: تعذّر حفظ المسودة', e); }
}
function cacheLocal() {
  try { session.answers = answers; session.idx = idx; sessionStorage.setItem('soil_session', JSON.stringify(session)); } catch (e) {}
}

/* ---------- التحقّق ---------- */
function isValid() {
  const it = curItem();
  const a = answers[it.id];
  return a != null; // 0..4 أو 5 (مش منطبق)
}

function updateNav() {
  nextBtn.disabled = !isValid();
  const done = idx + (isValid() ? 1 : 0);
  bar.style.width = Math.round((done / TOTAL) * 100) + '%';
  counter.textContent = `البند ${idx + 1} من ${TOTAL}`;
  pillarName.textContent = `ركيزة ${curItem().pillarName} · ${curItem().sectionName}`;
  nextBtn.textContent = idx === TOTAL - 1 ? 'أوشكت الإنهاء يالا ✦' : 'التالي ←';
  prevBtn.textContent = idx === 0 ? '→ رجوع للبداية' : '← السابق';
  cacheLocal(); persistSoon();
}

/* ---------- رسم البند ---------- */
function render() {
  const it = curItem();
  card.classList.remove('fade'); void card.offsetWidth; card.classList.add('fade');
  card.innerHTML = '';

  const tag = document.createElement('div');
  tag.className = 'qnum';
  tag.textContent = `ركيزة ${it.pillarName} · ${it.sectionName}`;
  card.appendChild(tag);

  if (it.intro) {
    const intro = document.createElement('div');
    intro.className = 'qintro';
    intro.textContent = it.intro;
    card.appendChild(intro);
  }

  const t = document.createElement('div');
  t.className = 'qtext';
  t.textContent = it.text;
  card.appendChild(t);

  // خيارات الليكرت
  const opts = document.createElement('div');
  opts.className = 'opts';
  SOIL_SCALE.options.forEach((o, i) => {
    const el = document.createElement('div');
    el.className = 'opt' + (answers[it.id] === i ? ' sel' : '');
    el.innerHTML = `<span class="dot"></span><span>${o.label}</span>`;
    el.onclick = () => { answers[it.id] = i; paintSelection(); updateNav(); };
    opts.appendChild(el);
  });
  card.appendChild(opts);

  // زرار "مش منطبق"
  let naBtn = null;
  if (it.allowNA) {
    naBtn = document.createElement('button');
    naBtn.type = 'button';
    naBtn.className = 'na-btn' + (answers[it.id] === 5 ? ' sel' : '');
    naBtn.textContent = SOIL_SCALE.na.label;
    naBtn.onclick = () => { answers[it.id] = 5; paintSelection(); updateNav(); };
    card.appendChild(naBtn);
  }

// صندوق التعليق الاختياري
  const cWrap = document.createElement('div');
  cWrap.className = 'field'; cWrap.style.marginTop = '18px';
  const cLab = document.createElement('label');
  cLab.style.fontWeight = '700';
  cLab.textContent = 'عايز تشرح اختيارك؟ (اختياري)';
  const cTa = document.createElement('textarea');
  cTa.placeholder = 'لو فيه حاجة في بالك تبرّر بيها إجابتك، اكتبها هنا...';
  cTa.value = answers[it.id + '_c'] || '';
  cTa.oninput = () => { answers[it.id + '_c'] = cTa.value; cacheLocal(); persistSoon(); };
  cWrap.appendChild(cLab); cWrap.appendChild(cTa);
  card.appendChild(cWrap);
   
   function paintSelection() {
    [...opts.children].forEach((c, i) => c.classList.toggle('sel', answers[it.id] === i));
    if (naBtn) naBtn.classList.toggle('sel', answers[it.id] === 5);
  }

  updateNav();
}

/* ---------- التنقّل ---------- */
prevBtn.onclick = () => { if (idx === 0) { location.href='soil-index.html'; return; } idx--; render(); };
nextBtn.onclick = async () => {
  if (!isValid()) return;
  if (idx < TOTAL - 1) { idx++; render(); return; }
  await finish();
};

/* ---------- الإنهاء ---------- */
async function finish() {
  nextBtn.disabled = true; nextBtn.textContent = 'بنحفظ إجابتك...';
  await persistNow();

  const results = computeSoil(answers);
  const payload = {
    alias: session.alias || 'مجهول', cohort: session.cohort,
    category: session.category, categoryLabel: session.categoryLabel, department: session.department,
    answers, results, createdAt: serverTimestamp()
  };
  try {
    await addDoc(collection(db, COLLECTION_SOIL), payload);
    sessionStorage.removeItem('soil_save_error');
    try { await deleteDoc(doc(db, COLLECTION_SOIL_DRAFTS, session.resumeCode)); } catch (e) {}
  } catch (e) {
    console.error('Soil: فشل الحفظ النهائي', e);
    sessionStorage.setItem('soil_save_error', '1');
  }
  sessionStorage.setItem('soil_result', JSON.stringify({ session, answers, results }));
  location.href = 'soil-results.html';
}

/* ---------- إقلاع ---------- */
render();
