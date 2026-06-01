/* ============================================================================
   Reignite — منحني الاحتراق
   admin.js — لوحة الأدمن: تحميل إجابات الدفعة، تشغيل المحرّك التجميعي،
   عرض القراءة + المنحني + الفجوة الإدراكية + النوع + الفلاتر + صوت الشركة
   + تفصيل الأسئلة + شاشة المرآة الجماعية (Overlay).
============================================================================ */

import { db, collection, getDocs, query, where, COLLECTION, ADMIN_PASSCODE } from './firebase-config.js';
import { aggregate } from './scoring.js';
import { QUESTIONS } from './questions.js';
import { renderCurve } from './curve.js';
import { READINGS, severityFromGapBand, FILTER_PATH, AXIS_STATE_NOTE } from './readings.js';

const $ = (id) => document.getElementById(id);
const STAGES = ['التطابق', 'التباعد المبكر', 'الفجوة الصامتة', 'الانكشاف', 'المفترق'];
const TYPE_Q = { M: 'هنكمل قد الضغط ده؟', G: 'فين النار اللي كانت معانا؟', K: 'هل ده هو؟ ده اللي كنا عايزينه؟' };

let responses = [];
let agg = null;
let qFilterCat = 'all';

/* ---------- البوابة ---------- */
function openApp() { $('gate').classList.add('hidden'); $('app').classList.remove('hidden'); load(); }
if (sessionStorage.getItem('reignite_admin') === '1') openApp();

$('gateBtn').onclick = () => {
  const v = $('passInput').value.trim();
  if (v === ADMIN_PASSCODE) { sessionStorage.setItem('reignite_admin', '1'); openApp(); }
  else { $('gateMsg').textContent = 'الكود غير صحيح'; }
};
$('passInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('gateBtn').click(); });

/* ---------- التحميل ---------- */
$('loadBtn').onclick = load;
async function load() {
  const cohort = $('cohortInput').value.trim();
  if (!cohort) return;
  $('loadMsg').textContent = 'بنحمّل...';
  $('content').innerHTML = '<div class="spinner"></div>';
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('cohort', '==', cohort)));
    responses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    responses.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    agg = aggregate(responses);
    $('loadMsg').textContent = `الدفعة «${cohort}» — ${responses.length} مستجيب`;
    if (!agg) { $('content').innerHTML = `<div class="card"><div class="note note-info">لسه مفيش إجابات للدفعة دي. شارك رابط الاستبيان وكود الدفعة «${cohort}».</div></div>`; return; }
    renderAll();
  } catch (e) {
    console.error(e);
    $('content').innerHTML = `<div class="card"><div class="note note-amber">تعذّر التحميل من Firestore. تأكد إن قواعد الأمان بتسمح بالقراءة للكولكشن <b>${COLLECTION}</b> (راجع firestore.rules).</div></div>`;
  }
}

/* ---------- أدوات عرض ---------- */
const levelColor = (v) => v >= 66 ? 'var(--sky)' : v >= 40 ? '#E0A458' : 'var(--ember-soft)';
const stageIdxOf = (s) => Math.max(0, STAGES.indexOf(s));

function bars(levels, eroded) {
  const rows = [['الطاقة', levels.energy, 'energy'], ['العلاقة', levels.relation, 'relation'], ['المعنى', levels.meaning, 'meaning']];
  return rows.map(([n, v, k]) => `
    <div class="bar-row">
      <span class="tiny">${n}${k === eroded ? ' ●' : ''}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${v ?? 0}%;background:${levelColor(v ?? 0)}"></div></div>
      <span class="tiny">${v ?? '—'}</span>
    </div>`).join('');
}

function filterBars(filterAgg) {
  return filterAgg.map(f => `
    <div class="frow">
      <span class="tiny">${f.filter}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${f.score ?? 0}%;background:${(f.score ?? 0) >= 60 ? 'var(--sky)' : 'var(--ember-soft)'}"></div></div>
      <span class="tiny">${f.score ?? '—'}</span>
    </div>`).join('');
}

function quotesList(arr, max = 6) {
  if (!arr || !arr.length) return '<div class="tiny muted">— مفيش إجابات نصّية —</div>';
  return arr.slice(0, max).map(t => `<div class="quote">${t}<div class="who">— صوت مجهّل من الدفعة</div></div>`).join('');
}

/* ---------- التبويبات ---------- */
function renderAll() {
  $('content').innerHTML = `
    <div class="card"><div class="tabs">
      <div class="tab active" data-tab="overview">نظرة عامة</div>
      <div class="tab" data-tab="compare">القيادة مقابل الفريق</div>
      <div class="tab" data-tab="anatomy">التشريح وصوت الشركة</div>
      <div class="tab" data-tab="questions">تفصيل الأسئلة</div>
    </div>
    <div id="tabbody"></div></div>`;
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    showTab(t.dataset.tab);
  });
  showTab('overview');
}

function showTab(name) {
  const body = $('tabbody');
  if (name === 'overview')  body.innerHTML = tabOverview();
  if (name === 'compare')   body.innerHTML = tabCompare();
  if (name === 'anatomy')   body.innerHTML = tabAnatomy();
  if (name === 'questions') { body.innerHTML = tabQuestions(); wireQFilter(); }
}

function tabOverview() {
  const t = agg.typeAll.type, reading = t ? READINGS[t] : null;
  const sev = severityFromGapBand(agg.gapBand);
  return `
    <div class="grid grid-4" style="margin-top:18px">
      <div class="stat"><div class="k">عدد المستجيبين</div><div class="v gold">${agg.count}</div></div>
      <div class="stat"><div class="k">قيادة / وسطى / قاعدة</div><div class="v sky" style="font-size:18px">${agg.countByCat.A} · ${agg.countByCat.B} · ${agg.countByCat.C}</div></div>
      <div class="stat"><div class="k">النوع الغالب</div><div class="v ember">${agg.typeAll.name}</div></div>
      <div class="stat"><div class="k">الفجوة</div><div class="v gold">${agg.gapBand} · ${agg.gapMean ?? '—'}</div></div>
    </div>
    <div class="card" style="background:transparent;border:none;padding:0;margin-top:18px">
      ${renderCurve({ gap: agg.gapMean ?? 40, stageIdx: stageIdxOf(agg.modalStage), vitA: agg.vitA, vitC: agg.vitC })}
    </div>
    <div class="note note-info" style="margin-top:6px">${agg.summary}</div>
    ${reading ? `
      <div class="divider"></div>
      <div class="section-title">قراءة النوع — ${reading.name}</div>
      <p style="font-size:15px"><b style="color:var(--gold)">${reading.tagline}</b></p>
      <p class="muted" style="margin-top:8px">${reading.core}</p>
      <div class="quote" style="margin-top:12px">${reading.severity[sev]}</div>
      <div class="tiny" style="margin-top:12px;color:var(--sky)">الطريق: ${reading.path}</div>` : ''}
  `;
}

function tabCompare() {
  const b = agg;
  const blindColor = b.blindnessBand === 'عمى حادّ' ? 'var(--ember-soft)' : b.blindnessBand === 'عمى متوسط' ? '#E0A458' : 'var(--sky)';
  return `
    <div class="grid grid-3" style="margin-top:18px">
      <div class="stat"><div class="k">حيوية كما تراها القيادة</div><div class="v gold">${b.vitA ?? '—'}</div></div>
      <div class="stat"><div class="k">حيوية كما يعيشها الفريق</div><div class="v sky">${b.vitC ?? '—'}</div></div>
      <div class="stat"><div class="k">الفجوة الإدراكية</div><div class="v" style="color:${blindColor}">${b.blindnessBand}${b.blindness != null ? ` · ${b.blindness}` : ''}</div></div>
    </div>
    <div class="note ${b.blindnessBand === 'عمى حادّ' ? 'note-amber' : 'note-info'}" style="margin-top:14px">
      ${b.blindness == null ? 'محتاج إجابات من القيادة (A) ومن الفريق (C) عشان نقيس الفجوة الإدراكية.'
        : b.blindness > 0 ? `القيادة بتشوف الشركة أحسن من اللي الفريق بيعيشه بفرق ${Math.abs(b.blindness)} نقطة. ده مؤشر عمى — كل ما الفرق كبر، كل ما القيادة بعيدة عن الواقع اليومي.`
        : `الفريق بيقيّم الحيوية أعلى من القيادة — حالة غير شائعة، تستحق نقاش.`}
    </div>
    ${b.typeConflict ? `<div class="note note-amber" style="margin-top:10px"><b>تعارض في النوع:</b> ${b.typeConflict}</div>` : ''}
    <div class="divider"></div>
    <div class="section-title">النوع حسب الفئة</div>
    <div class="grid grid-3">
      <div class="stat"><div class="k">القيادة (A)</div><div class="v gold">${agg.typeA.name}</div></div>
      <div class="stat"><div class="k">الوسطى (B)</div><div class="v sky">${agg.typeNames[agg.typeAll.type] || '—'}</div></div>
      <div class="stat"><div class="k">القاعدة (C)</div><div class="v ember">${agg.typeC.name}</div></div>
    </div>
    <div class="divider"></div>
    <div class="section-title">جاهزية التغيير</div>
    <div class="grid grid-3">
      <div class="stat"><div class="k">عام</div><div class="v gold">${agg.readinessBand} · ${agg.readinessMean ?? '—'}</div></div>
      <div class="stat"><div class="k">القيادة</div><div class="v sky">${agg.readinessA ?? '—'}</div></div>
      <div class="stat"><div class="k">الفريق</div><div class="v ember">${agg.readinessC ?? '—'}</div></div>
    </div>
    ${agg.readinessA != null && agg.readinessC != null && Math.abs(agg.readinessA - agg.readinessC) >= 20
      ? `<div class="note note-amber" style="margin-top:10px">فرق واضح في الاستعداد بين القيادة والفريق — التغيير هيلاقي مقاومة من الطرف الأقل استعداداً. ابدأ التدخّل من حيث الجاهزية أعلى.</div>` : ''}
  `;
}

function tabAnatomy() {
  const fAgg = agg.filterAgg || [];
  const unhealthy = agg.unhealthyFiltersAgg || [];
  const talentReasons = responses.map(r => r.results?.quotes?.talentLeft).filter(t => t && t.trim().length > 2);
  return `
    <div class="section-title" style="margin-top:18px">المستويات التلاتة</div>
    <div class="bars">${bars(agg.levelsMean, agg.erodedKey)}</div>
    <div class="tiny" style="margin-top:8px">● = المستوى الأكثر تآكلاً (${agg.erodedName}) — من هنا يبدأ التدخّل.</div>
    <div class="divider"></div>
    <div class="section-title">المحور المهيمن والحالة</div>
    <div class="grid grid-2">
      <div class="stat"><div class="k">المحور المهيمن</div><div class="v gold">${agg.modalDominant}</div></div>
      <div class="stat"><div class="k">الحالة</div><div class="v ${agg.stateBand === 'قناع' ? 'ember' : 'sky'}">${agg.stateBand}${agg.stateMean != null ? ` · ${agg.stateMean}` : ''}</div></div>
    </div>
    <div class="note ${agg.stateBand === 'قناع' ? 'note-amber' : 'note-info'}" style="margin-top:10px">${AXIS_STATE_NOTE[agg.stateBand] || ''}</div>
    <div class="divider"></div>
    <div class="section-title">الإيقاع والفلاتر الخمسة</div>
    <div class="stat" style="margin-bottom:12px"><div class="k">الإيقاع تحت الضغط</div><div class="v sky">${agg.modalRhythm}</div></div>
    <div class="filters">${filterBars(fAgg)}</div>
    ${unhealthy.length ? unhealthy.map(f => `<div class="note note-amber" style="margin-top:10px"><b>فلتر «${f}»</b> — ${FILTER_PATH[f] || ''}</div>`).join('') : '<div class="note note-info" style="margin-top:10px">الفلاتر الخمسة على مستوى الدفعة شغّالة بصحّة.</div>'}
    <div class="divider"></div>
    <div class="section-title">صوت الشركة (مجهّل)</div>
    <div class="tiny" style="margin-bottom:6px">لو الشركة إنسان قاعد قدامك، إيه اللي هتقوله؟</div>
    ${quotesList(agg.voices)}
    <div class="tiny" style="margin:16px 0 6px">النار اللي بدأت الشركة:</div>
    ${quotesList(agg.fires)}
    <div class="tiny" style="margin:16px 0 6px">أكبر تغيير يرجّع الروح:</div>
    ${quotesList(agg.changes)}
    ${talentReasons.length ? `<div class="tiny" style="margin:16px 0 6px">أسباب ترك المواهب:</div>${quotesList(talentReasons)}` : ''}
  `;
}

/* ---------- تفصيل الأسئلة ---------- */
function subset() { return qFilterCat === 'all' ? responses : responses.filter(r => r.category === qFilterCat); }

function countChoice(rs, id, opts, getIdx) {
  const counts = opts.map(() => 0); let answered = 0;
  rs.forEach(r => { const v = getIdx(r); if (v != null && counts[v] != null) { counts[v]++; answered++; } });
  return { opts, counts, answered };
}
function countScale(rs, id) {
  const vals = rs.map(r => r.answers?.[id]).filter(v => v != null);
  const hist = Array(10).fill(0); vals.forEach(v => hist[v - 1]++);
  const av = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  return { hist, avg: av == null ? null : Math.round(av * 10) / 10, answered: vals.length };
}
function collectTexts(rs, get) { return rs.map(get).filter(t => t && t.trim().length > 1); }

function tabQuestions() {
  const rs = subset();
  const chips = ['all', 'A', 'B', 'C'].map(c => `<div class="tab ${qFilterCat === c ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'الكل' : c}</div>`).join('');
  let html = `<div class="tabs" id="qfilter" style="margin-top:18px">${chips}</div>`;

  QUESTIONS.forEach(q => {
    html += `<div class="card" style="margin-top:12px"><div class="qnum">${q.id} · المحور ${q.axis} — ${q.axisName}</div><div style="margin:6px 0 12px;font-weight:700">${q.text}</div>`;

    const isChoiceVal = (q.type === 'compound') ? !!(q.options || (q.followUp && q.followUp.type === 'choice')) : false;
    if (q.type === 'choice') {
      const c = countChoice(rs, q.id, q.options, r => r.answers?.[q.id]);
      html += choiceTable(c);
    } else if (q.type === 'scale') {
      html += scaleView(countScale(rs, q.id), q.labels);
    } else if (q.type === 'textarea') {
      html += textList(collectTexts(rs, r => (typeof r.answers?.[q.id] === 'string' ? r.answers[q.id] : '')));
    } else if (q.type === 'compound') {
      const opts = q.options || (q.followUp.type === 'choice' ? q.followUp.options : null);
      if (opts) {
        const lbl = q.options ? '' : `<div class="tiny" style="margin-bottom:6px">${q.followUp.text}</div>`;
        html += lbl + choiceTable(countChoice(rs, q.id, opts, r => { const v = r.answers?.[q.id]; return (v && typeof v === 'object') ? v.value : null; }));
      }
      const txts = collectTexts(rs, r => { const v = r.answers?.[q.id]; return (v && typeof v === 'object') ? (v.text || '') : ''; });
      const tlabel = q.options ? q.followUp.text : q.text;
      html += `<div class="tiny" style="margin:10px 0 6px">${tlabel}</div>` + textList(txts);
    }
    html += `</div>`;
  });
  return html;
}

function choiceTable(c) {
  const total = c.answered || 1;
  return `<div class="bars">` + c.opts.map((o, i) => {
    const pct = Math.round((c.counts[i] / total) * 100);
    return `<div class="bar-row" style="grid-template-columns:1fr 90px 60px">
      <span class="tiny">${o.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--sky)"></div></div>
      <span class="tiny">${c.counts[i]} · ${pct}%</span></div>`;
  }).join('') + `</div>`;
}
function scaleView(s, labels) {
  if (!s.answered) return `<div class="tiny muted">— مفيش إجابات —</div>`;
  const maxH = Math.max(...s.hist, 1);
  const cols = s.hist.map((h, i) => `<div style="flex:1;text-align:center">
      <div style="height:60px;display:flex;align-items:flex-end;justify-content:center">
        <div style="width:60%;height:${Math.round((h / maxH) * 100)}%;background:linear-gradient(180deg,var(--gold),var(--ember));border-radius:4px 4px 0 0"></div>
      </div><div class="tiny">${i + 1}</div></div>`).join('');
  return `<div style="display:flex;gap:3px;align-items:flex-end">${cols}</div>
    <div class="scale-labels"><span>${labels[0]}</span><span>المتوسط ${s.avg} · ${s.answered} رد</span><span>${labels[1]}</span></div>`;
}
function textList(texts) {
  if (!texts.length) return `<div class="tiny muted">— مفيش إجابات نصّية —</div>`;
  return texts.slice(0, 12).map(t => `<div class="quote" style="margin-top:6px">${t}</div>`).join('')
    + (texts.length > 12 ? `<div class="tiny" style="margin-top:6px">+ ${texts.length - 12} إجابة أخرى</div>` : '');
}
function wireQFilter() {
  const f = $('qfilter'); if (!f) return;
  f.querySelectorAll('.tab').forEach(t => t.onclick = () => { qFilterCat = t.dataset.cat; showTab('questions'); });
}

/* ---------- شاشة المرآة الجماعية ---------- */
$('mirrorBtn').onclick = () => {
  if (!agg) return;
  const t = agg.typeAll.type;
  const voice = (agg.voices && agg.voices[0]) || '';
  $('mirrorBody').innerHTML = `
    <div class="mirror">
      <div class="eyebrow">المرآة الجماعية — ${$('cohortInput').value.trim()}</div>
      <div style="margin:18px 0">${renderCurve({ gap: agg.gapMean ?? 40, stageIdx: stageIdxOf(agg.modalStage), vitA: agg.vitA, vitC: agg.vitC })}</div>
      <div class="big">النوع: ${agg.typeAll.name}</div>
      <div class="type-q">«${TYPE_Q[t] || '—'}»</div>
      <div class="divider"></div>
      <div class="lead">${agg.summary}</div>
      ${agg.blindnessBand !== '—' ? `<div class="note note-info" style="margin-top:14px">الفجوة الإدراكية بين القيادة والفريق: <b>${agg.blindnessBand}</b></div>` : ''}
      ${voice ? `<div class="quote" style="margin-top:14px">${voice}<div class="who">— صوت مجهّل من الشركة</div></div>` : ''}
      <div class="divider"></div>
      <p class="muted">«اللي بيحصل لكل واحد فيكم، بيحصل للشركة نفسها. دي مش قصة خالد — دي شركتكم. شوفوا فين إحنا على المنحني. الورقة دي مش حكم عليكم — دي مرآة. والمرآة لما بتوريك حاجة، القرار بعدها بإيدك.»</p>
    </div>`;
  $('mirrorOverlay').classList.remove('hidden');
};
$('mirrorClose').onclick = () => $('mirrorOverlay').classList.add('hidden');
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('mirrorOverlay').classList.add('hidden'); });

/* ---------- تصدير CSV ---------- */
$('csvBtn').onclick = () => {
  if (!responses.length) return;
  const head = ['alias', 'category', 'stage', 'gap', 'type', 'dominant', 'state', 'readiness'];
  const rows = responses.map(r => {
    const R = r.results || {};
    return [r.alias, r.category, R.stage, R.gap?.value, R.type?.primaryName, R.axis?.dominantName, R.axis?.state, R.readiness]
      .map(x => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(',');
  });
  const csv = '\uFEFF' + [head.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reignite-${$('cohortInput').value.trim()}.csv`;
  a.click();
};
