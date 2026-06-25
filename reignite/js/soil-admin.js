/* ============================================================================
   Reignite — التربة
   soil-admin.js — لوحة الأدمن: تجميع التربة + الكروسووك مع نوع الاحتراق
   الربط الوحيد بالاحتراق: نقرأ كولكشن الاحتراق لنفس الدفعة، نحسب النوع الغالب،
   ونمرّره لـ aggregateSoil ليشتغل الكروسووك.
============================================================================ */

import {
  db, collection, getDocs, query, where,
  COLLECTION_SOIL, BURNOUT_COLLECTION_NAME, ADMIN_PASSCODE
} from './soil-config.js';
import { SOIL_ITEMS, SOIL_SCALE, SOIL_PILLARS, aggregateSoil } from './soil-config-items.js';
import { renderSoilTriangle, renderPillarBars, renderCrosswalk, renderThermometer, heatClass } from './soil-visuals.js';

const $ = (id) => document.getElementById(id);
let soilResponses = [], agg = null, burnoutType = null;

/* ---------- البوابة ---------- */
function openApp() { $('gate').classList.add('hidden'); $('app').classList.remove('hidden'); load(); }
if (sessionStorage.getItem('reignite_admin') === '1') openApp();
$('gateBtn').onclick = () => {
  if ($('passInput').value.trim() === ADMIN_PASSCODE) { sessionStorage.setItem('reignite_admin','1'); openApp(); }
  else $('gateMsg').textContent = 'الكود غير صحيح';
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
    // إجابات التربة
    const soilSnap = await getDocs(query(collection(db, COLLECTION_SOIL), where('cohort','==',cohort)));
    soilResponses = soilSnap.docs.map(d => ({ id:d.id, ...d.data() }));

    // النوع الغالب من الاحتراق (الربط الوحيد) — اختياري، لو الدفعة موجودة
    burnoutType = await fetchBurnoutType(cohort);

    agg = aggregateSoil(soilResponses, burnoutType);
    $('loadMsg').textContent = `الدفعة «${cohort}» — ${soilResponses.length} مستجيب للتربة` +
      (burnoutType ? ` · نوع الاحتراق الغالب: ${({M:'محترقة',G:'مجوّعة',K:'مكبوتة'})[burnoutType]}` : ' · (لسه مفيش دفعة احتراق للمطابقة)');
    if (!agg) { $('content').innerHTML = `<div class="card"><div class="note note-info">لسه مفيش إجابات تربة للدفعة دي. وزّع رابط الدفعة وكود «${cohort}».</div></div>`; return; }
    renderAll();
  } catch (e) {
    console.error(e);
    $('content').innerHTML = `<div class="card"><div class="note note-amber">تعذّر التحميل من Firestore. تأكد إن قواعد الأمان بتسمح بالقراءة للكولكشن <b>${COLLECTION_SOIL}</b>.</div></div>`;
  }
}

/* النوع الغالب من كولكشن الاحتراق لنفس الدفعة */
async function fetchBurnoutType(cohort) {
  try {
    const snap = await getDocs(query(collection(db, BURNOUT_COLLECTION_NAME), where('cohort','==',cohort)));
    if (snap.empty) return null;
    const c = { M:0, G:0, K:0 };
    snap.docs.forEach(d => { const t = d.data()?.results?.type?.primary; if (c[t] != null) c[t]++; });
    const sorted = Object.entries(c).sort((x,y)=>y[1]-x[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : null;
  } catch (e) { console.warn('Soil: تعذّر قراءة دفعة الاحتراق للكروسووك', e); return null; }
}

/* ---------- التبويبات ---------- */
function renderAll() {
  $('content').innerHTML = `
    <div class="card"><div class="tabs">
      <div class="tab active" data-tab="overview">نظرة عامة + الكروسووك</div>
      <div class="tab" data-tab="depts">التوطين بالإدارة</div>
      <div class="tab" data-tab="items">تفصيل البنود</div>
    </div><div id="tabbody"></div></div>`;
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); showTab(t.dataset.tab);
  });
  showTab('overview');
}
function showTab(name) {
  const b = $('tabbody');
  if (name === 'overview') b.innerHTML = tabOverview();
  if (name === 'depts')    b.innerHTML = tabDepts();
  if (name === 'items')  { b.innerHTML = tabItems(); wireItemFilter(); }
}

/* ---------- نظرة عامة + الكروسووك ---------- */
function tabOverview() {
  const cap = agg.weakestPillar
    ? `أضعف ركيزة على مستوى الشركة: <b style="color:var(--ember-soft)">${agg.weakestPillarName}</b>. الشكل بيكشف النوع التشغيلي.`
    : 'بروفايل التربة المجمّع.';
  return `
    <div class="grid grid-3" style="margin-top:18px">
      <div class="stat"><div class="k">مستجيبي التربة</div><div class="v gold">${agg.count}</div></div>
      <div class="stat"><div class="k">أضعف ركيزة</div><div class="v ember">${agg.weakestPillarName}</div></div>
      <div class="stat"><div class="k">ترمومتر البقاء</div><div class="v sky">${agg.retentionBand}${agg.retention!=null?` · ${agg.retention}`:''}</div></div>
    </div>

    <div class="card" style="background:transparent;border:none;padding:0;margin-top:18px">
      <div class="soil-tri-card">${renderSoilTriangle(agg.pillars, { caption: cap })}</div>
    </div>

    <div class="divider"></div>
    <div class="section-title">الكروسووك — التربة تؤكّد النوع ولا تعارضه؟</div>
    ${renderCrosswalk(agg.crosswalk, burnoutType)}

    <div class="divider"></div>
    <div class="section-title">الركايز الثلاث</div>
    <div class="pillar-grid">
      ${SOIL_PILLARS.map(p => {
        const val = agg.pillars[p.key], weak = agg.weakestPillar === p.key;
        return `<div class="pillar-stat ${p.key}">${weak?'<span class="weak">● الأضعف</span>':''}
          <div class="pk">${p.name}</div><div class="pq">${p.q}</div>
          <div class="pv">${val ?? '—'}</div><div class="pmini"><i style="width:${val??0}%"></i></div></div>`;
      }).join('')}
    </div>

    <div class="divider"></div>
    <div class="section-title">ترمومتر البقاء (نتيجة سلوكية منفصلة)</div>
    ${renderThermometer(agg.retention, agg.retentionBand)}
  `;
}

/* ---------- التوطين بالإدارة ---------- */
function tabDepts() {
  const rows = agg.departments.map(d => {
    if (!d.disclosed) {
      return `<div class="dept-row"><span class="dept-name">${d.name}</span>
        <span class="dept-locked">🔒 أقل من ٥ أفراد (${d.n}) — مخفي للسرية</span></div>`;
    }
    const cell = (v) => `<span class="dept-cell ${heatClass(v)}">${v ?? '—'}</span>`;
    return `<div class="dept-row">
      <span class="dept-name">${d.name} <span class="tiny">(${d.n})</span></span>
      ${cell(d.pillars.T)}${cell(d.pillars.H)}${cell(d.pillars.N)}
      <span class="tiny" style="text-align:center">${({T:'تماسك',H:'حيوية',N:'انتماء'})[d.weakestPillar]||'—'}</span>
    </div>`;
  }).join('');

  const catRows = ['A','B','C'].map(c => {
    const cp = agg.catProfile[c]; const nm = {A:'القيادة',B:'الوسطى',C:'القاعدة'}[c];
    if (!cp || !cp.disclosed) return `<div class="dept-row"><span class="dept-name">${nm}</span><span class="dept-locked">🔒 أقل من ٥ (${cp?cp.n:0}) — مخفي</span></div>`;
    const cell = (v) => `<span class="dept-cell ${heatClass(v)}">${v ?? '—'}</span>`;
    return `<div class="dept-row"><span class="dept-name">${nm} <span class="tiny">(${cp.n})</span></span>${cell(cp.pillars.T)}${cell(cp.pillars.H)}${cell(cp.pillars.N)}<span></span></div>`;
  }).join('');

  return `
    <div class="section-title" style="margin-top:18px">التربة حسب الإدارة</div>
    <div class="tiny" style="margin-bottom:10px">الأخضر تربة غنية، الأحمر تربة فقيرة. مفيش تفصيل لأقل من ٥ أفراد.</div>
    <div class="dept-row head"><span>الإدارة</span><span style="text-align:center">تماسك</span><span style="text-align:center">حيوية</span><span style="text-align:center">انتماء</span><span style="text-align:center">الأضعف</span></div>
    ${rows}
    <div class="divider"></div>
    <div class="section-title">التربة حسب الفئة</div>
    <div class="dept-row head"><span>الفئة</span><span style="text-align:center">تماسك</span><span style="text-align:center">حيوية</span><span style="text-align:center">انتماء</span><span></span></div>
    ${catRows}
    <div class="soil-legend">
      <span><i class="heat-hi" style="background:rgba(127,196,160,.5)"></i> غنية (66+)</span>
      <span><i class="heat-mid" style="background:rgba(224,164,88,.5)"></i> متوسطة (45–65)</span>
      <span><i class="heat-lo" style="background:rgba(232,98,61,.5)"></i> فقيرة (&lt;45)</span>
    </div>
  `;
}

/* ---------- تفصيل البنود ---------- */
let itemFilterCat = 'all';
function subset() { return itemFilterCat === 'all' ? soilResponses : soilResponses.filter(r => r.category === itemFilterCat); }

function tabItems() {
  const rs = subset();
  const chips = ['all','A','B','C'].map(c => `<div class="tab ${itemFilterCat===c?'active':''}" data-cat="${c}">${c==='all'?'الكل':({A:'قيادة',B:'وسطى',C:'قاعدة'})[c]}</div>`).join('');
  let html = `<div class="tabs" id="itemFilter" style="margin-top:18px">${chips}</div>`;

  let curPillar = null;
  SOIL_ITEMS.forEach(it => {
    if (it.pillar !== curPillar) {
      curPillar = it.pillar;
      const nm = it.pillar === 'R' ? 'ترمومتر البقاء' : `ركيزة ${it.pillarName}`;
      html += `<div class="section-title" style="margin-top:22px">${nm}</div>`;
    }
    html += `<div class="card" style="margin-top:10px"><div class="qnum">${it.id} · ${it.sectionName}${it.reverse?' · (معكوس)':''}</div>
      <div style="margin:6px 0 12px;font-weight:700">${it.text}</div>${itemDist(rs, it)}</div>`;
  });
  return html;
}

function itemDist(rs, it) {
  const counts = [0,0,0,0,0]; let na = 0, answered = 0;
  rs.forEach(r => {
    const v = r.answers?.[it.id];
    if (v === 5) { na++; answered++; }
    else if (v != null && counts[v] != null) { counts[v]++; answered++; }
  });
  const scored = answered - na;
  // متوسط الصحة (مع قلب المعكوس)
  let sum = 0;
  counts.forEach((c, i) => { const base = SOIL_SCALE.options[i].base; sum += c * (it.reverse ? 100 - base : base); });
  const avg = scored ? Math.round(sum / scored) : null;

  const total = answered || 1;
  const bars = SOIL_SCALE.options.map((o, i) => {
    const pct = Math.round((counts[i] / total) * 100);
    return `<div class="bar-row" style="grid-template-columns:1fr 90px 60px">
      <span class="tiny">${o.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--sky)"></div></div>
      <span class="tiny">${counts[i]} · ${pct}%</span></div>`;
  }).join('');
  const naRow = na ? `<div class="tiny" style="margin-top:8px">مش منطبق: ${na} (${Math.round((na/total)*100)}%) — مستبعدة من المتوسط</div>` : '';
  const avgRow = avg != null ? `<div class="tiny" style="margin-top:6px">متوسط الصحة (بعد قلب المعكوس): <b style="color:${avg>=66?'var(--belong-soft)':avg>=45?'#E0A458':'var(--ember-soft)'}">${avg}</b> · ${scored} رد محسوب</div>` : '';
  const comments = rs.map(r => r.results?.comments?.[it.id]).filter(t => t && t.trim().length > 1);
  const cBlock = comments.length
    ? `<div class="tiny" style="margin:12px 0 6px;color:var(--gold)">تعليقات الناس (${comments.length}):</div>` +
      comments.slice(0, 10).map(t => `<div class="quote" style="margin-top:6px">${t}</div>`).join('') +
      (comments.length > 10 ? `<div class="tiny" style="margin-top:6px">+ ${comments.length - 10} تعليق آخر</div>` : '')
    : '';
  return `<div class="bars">${bars}</div>${naRow}${avgRow}${cBlock}`;
   
}

function wireItemFilter() {
  const f = $('itemFilter'); if (!f) return;
  f.querySelectorAll('.tab').forEach(t => t.onclick = () => { itemFilterCat = t.dataset.cat; showTab('items'); });
}

/* ---------- رابط الدفعة ---------- */
$('genLinkBtn').onclick = () => {
  const cohort = $('cohortInput').value.trim();
  if (!cohort) { $('linkMsg').textContent='اكتب كود الدفعة الأول'; return; }
  const base = location.href.split('#')[0].replace(/soil-admin\.html(\?.*)?$/, 'soil-index.html');
  const link = `${base}?cohort=${encodeURIComponent(cohort)}`;
  $('linkText').textContent = link; $('linkBox').classList.remove('hidden');
  window._soilLink = link; $('linkMsg').textContent='';
};
$('copyLinkBtn').onclick = async () => {
  if (!window._soilLink) return;
  try { await navigator.clipboard.writeText(window._soilLink); $('linkMsg').textContent='تم النسخ ✓'; }
  catch { $('linkMsg').textContent='انسخ يدوياً من فوق'; }
};

/* ---------- تصدير CSV ---------- */
$('csvBtn').onclick = () => {
  if (!soilResponses.length) return;
  const head = ['alias','category','department','T','H','N','weakest','retention'];
  const rows = soilResponses.map(r => {
    const R = r.results || {};
    return [r.alias, r.category, r.department, R.pillars?.T, R.pillars?.H, R.pillars?.N, R.weakestPillarName, R.retention]
      .map(x => `"${(x ?? '').toString().replace(/"/g,'""')}"`).join(',');
  });
  const csv = '\uFEFF' + [head.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `soil-${$('cohortInput').value.trim()}.csv`; a.click();
};
