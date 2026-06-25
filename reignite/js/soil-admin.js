/* ============================================================================
   Reignite — التربة
   soil-admin.js — لوحة الأدمن الكاملة (٦ تبويبات) + شاشة العرض

   التبويبات:
   1) اللوحة التنفيذية   — المثلث + الكروسووك + الركايز + الترمومتر + التوزيع
   2) التشريح بالركيزة    — كل ركيزة مفتوحة على أقسامها الفرعية بدرجاتها
   3) التوطين بالإدارة     — heat-map إدارة × ركيزة (بحدّ السرية) + أضعف قسم
   4) القيادة مقابل القاعدة — عمى الأنظمة (A مقابل C على كل ركيزة)
   5) الكروسووك المفصّل    — ليه التربة تؤكّد/تعارض النوع، بصمة متوقّعة مقابل فعلية
   6) البنود والأصوات      — تفصيل كل بند + تعليقاته، فلترة بالفئة/الإدارة

   الربط الوحيد بالاحتراق: نقرأ كولكشن الاحتراق لنفس الدفعة → النوع الغالب → الكروسووك.
============================================================================ */

import {
  db, collection, getDocs, query, where,
  COLLECTION_SOIL, BURNOUT_COLLECTION_NAME, ADMIN_PASSCODE
} from './soil-config.js';
import {
  SOIL_ITEMS, SOIL_SCALE, SOIL_PILLARS, DEPARTMENTS, MIN_DISCLOSURE, aggregateSoil
} from './soil-config-items.js';
import {
  renderSoilTriangle, renderPillarBars, renderCrosswalk, renderThermometer, heatClass
} from './soil-visuals.js';

const $ = (id) => document.getElementById(id);
const PILLAR_NAME = { T: 'التماسك', H: 'الحيوية', N: 'الانتماء' };
const TYPE_NAME = { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' };

let soilResponses = [], agg = null, burnoutType = null;
let itemFilterCat = 'all', itemFilterDept = 'all';

/* ---------- البوابة ---------- */
function openApp() { $('gate').classList.add('hidden'); $('app').classList.remove('hidden'); load(); }
if (sessionStorage.getItem('reignite_admin') === '1') openApp();
$('gateBtn').onclick = () => {
  if ($('passInput').value.trim() === ADMIN_PASSCODE) { sessionStorage.setItem('reignite_admin', '1'); openApp(); }
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
    const soilSnap = await getDocs(query(collection(db, COLLECTION_SOIL), where('cohort', '==', cohort)));
    soilResponses = soilSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    soilResponses.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    burnoutType = await fetchBurnoutType(cohort);
    agg = aggregateSoil(soilResponses, burnoutType);

    $('loadMsg').textContent = `الدفعة «${cohort}» — ${soilResponses.length} مستجيب للتربة` +
      (burnoutType ? ` · نوع الاحتراق الغالب: ${TYPE_NAME[burnoutType]}` : ' · (لسه مفيش دفعة احتراق للمطابقة)');

    if (!agg) {
      $('content').innerHTML = `<div class="card"><div class="note note-info">لسه مفيش إجابات تربة للدفعة دي. وزّع رابط الدفعة وكود «${cohort}».</div></div>`;
      return;
    }
    renderAll();
  } catch (e) {
    console.error(e);
    $('content').innerHTML = `<div class="card"><div class="note note-amber">تعذّر التحميل من Firestore. تأكد إن قواعد الأمان بتسمح بالقراءة للكولكشن <b>${COLLECTION_SOIL}</b> (راجع firestore.rules).</div></div>`;
  }
}

/* النوع الغالب من كولكشن الاحتراق لنفس الدفعة (للكروسووك) */
async function fetchBurnoutType(cohort) {
  try {
    const snap = await getDocs(query(collection(db, BURNOUT_COLLECTION_NAME), where('cohort', '==', cohort)));
    if (snap.empty) return null;
    const c = { M: 0, G: 0, K: 0 };
    snap.docs.forEach(d => { const t = d.data()?.results?.type?.primary; if (c[t] != null) c[t]++; });
    const sorted = Object.entries(c).sort((x, y) => y[1] - x[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : null;
  } catch (e) { console.warn('Soil: تعذّر قراءة دفعة الاحتراق', e); return null; }
}

/* ---------- التبويبات ---------- */
function renderAll() {
  $('content').innerHTML = `
    <div class="card"><div class="tabs">
      <div class="tab active" data-tab="exec">اللوحة التنفيذية</div>
      <div class="tab" data-tab="anatomy">التشريح بالركيزة</div>
      <div class="tab" data-tab="depts">التوطين بالإدارة</div>
      <div class="tab" data-tab="compare">القيادة مقابل القاعدة</div>
      <div class="tab" data-tab="crosswalk">الكروسووك المفصّل</div>
      <div class="tab" data-tab="items">البنود والأصوات</div>
    </div><div id="tabbody"></div></div>`;
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active'); showTab(t.dataset.tab);
  });
  showTab('exec');
}

function showTab(name) {
  const b = $('tabbody');
  if (name === 'exec')      b.innerHTML = tabExec();
  if (name === 'anatomy')   b.innerHTML = tabAnatomy();
  if (name === 'depts')     b.innerHTML = tabDepts();
  if (name === 'compare')   b.innerHTML = tabCompare();
  if (name === 'crosswalk') b.innerHTML = tabCrosswalk();
  if (name === 'items')   { b.innerHTML = tabItems(); wireItemFilters(); }
}

/* ============================================================================
   تبويب ١ — اللوحة التنفيذية
============================================================================ */
function tabExec() {
  const cap = agg.weakestPillar
    ? `أضعف ركيزة على مستوى الشركة: <b style="color:var(--ember-soft)">${agg.weakestPillarName}</b>. شكل المثلث بيكشف النوع التشغيلي.`
    : 'بروفايل التربة المجمّع عبر الركايز الثلاث.';

  const deptCount = agg.departments.filter(d => d.disclosed).length;
  const hiddenCount = agg.departments.length - deptCount;

  return `
    <div class="grid grid-4" style="margin-top:18px">
      <div class="stat"><div class="k">مستجيبي التربة</div><div class="v gold">${agg.count}</div></div>
      <div class="stat"><div class="k">أضعف ركيزة</div><div class="v ember">${agg.weakestPillarName}</div></div>
      <div class="stat"><div class="k">الكروسووك</div><div class="v ${agg.crosswalk.verdict === 'confirm' ? 'sky' : agg.crosswalk.verdict === 'conflict' ? 'ember' : 'gold'}">${agg.crosswalk.verdict === 'confirm' ? 'تأكيد ✓' : agg.crosswalk.verdict === 'conflict' ? 'تعارض ⚠' : 'ميل ≈'}</div></div>
      <div class="stat"><div class="k">ترمومتر البقاء</div><div class="v sky">${agg.retentionBand}${agg.retention != null ? ` · ${agg.retention}` : ''}</div></div>
    </div>

    <div class="card" style="background:transparent;border:none;padding:0;margin-top:18px">
      <div class="soil-tri-card">${renderSoilTriangle(agg.pillars, { caption: cap })}</div>
    </div>

    <div class="divider"></div>
    <div class="section-title">الكروسووك — التربة تؤكّد نوع الاحتراق ولا تعارضه؟</div>
    ${renderCrosswalk(agg.crosswalk, burnoutType)}
    <div class="tiny" style="margin-top:10px;text-align:center">تفصيل أعمق في تبويب «الكروسووك المفصّل».</div>

    <div class="divider"></div>
    <div class="section-title">الركايز الثلاث</div>
    <div class="pillar-grid">
      ${SOIL_PILLARS.map(p => {
        const val = agg.pillars[p.key], weak = agg.weakestPillar === p.key;
        return `<div class="pillar-stat ${p.key}">${weak ? '<span class="weak">● الأضعف</span>' : ''}
          <div class="pk">${p.name}</div><div class="pq">${p.q}</div>
          <div class="pv">${val ?? '—'}</div><div class="pmini"><i style="width:${val ?? 0}%"></i></div></div>`;
      }).join('')}
    </div>

    <div class="divider"></div>
    <div class="section-title">ترمومتر البقاء (نتيجة سلوكية منفصلة)</div>
    ${renderThermometer(agg.retention, agg.retentionBand)}
    <div class="tiny" style="margin-top:10px">ده مؤشر النزيف الجاي — مش رافعة، لكن بيقولك قد إيه الناس ناوية تكمّل.</div>

    <div class="divider"></div>
    <div class="section-title">توزيع المستجيبين</div>
    <div class="grid grid-2">
      <div class="stat"><div class="k">حسب الفئة (قيادة · وسطى · قاعدة)</div><div class="v sky" style="font-size:18px">${countCat('A')} · ${countCat('B')} · ${countCat('C')}</div></div>
      <div class="stat"><div class="k">إدارات ظاهرة · مخفية للسرية</div><div class="v gold" style="font-size:18px">${deptCount} · ${hiddenCount}</div></div>
    </div>
  `;
}
function countCat(c) { return soilResponses.filter(r => r.category === c).length; }

/* ============================================================================
   تبويب ٢ — التشريح بالركيزة (الأقسام الفرعية بدرجاتها)
============================================================================ */
function tabAnatomy() {
  // نجمّع الأقسام الفرعية تحت ركايزها بالترتيب من البنك
  const order = []; const seen = {};
  SOIL_ITEMS.forEach(it => {
    if (it.pillar === 'R') return;
    if (!seen[it.sectionName]) { seen[it.sectionName] = it.pillar; order.push(it.sectionName); }
  });
  const secScore = {};
  agg.sections.forEach(s => { secScore[s.name] = s.score; });

  let html = `<div class="tiny" style="margin:18px 0 6px">كل ركيزة مفتوحة على أقسامها — عشان تعرف الرقم الكبير جاي منين بالظبط.</div>`;

  SOIL_PILLARS.forEach(p => {
    const secs = order.filter(name => seen[name] === p.key);
    const pillarVal = agg.pillars[p.key];
    html += `<div class="card" style="margin-top:14px">
      <div class="section-title" style="margin-bottom:14px">ركيزة ${p.name} <span class="tiny" style="margin-right:10px;color:var(--mute)">${p.q} · الإجمالي ${pillarVal ?? '—'}</span></div>`;
    secs.forEach(name => {
      const v = secScore[name];
      const col = v == null ? 'var(--mute-2)' : v >= 66 ? 'var(--belong)' : v >= 45 ? '#E0A458' : 'var(--ember-soft)';
      html += `<div class="bar-row" style="grid-template-columns:1.5fr 1fr 50px;margin-bottom:8px">
        <span class="tiny">${name}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${v ?? 0}%;background:${col}"></div></div>
        <span class="tiny" style="color:${col};font-weight:700">${v ?? '—'}</span></div>`;
    });
    // أضعف قسم في الركيزة
    const weakest = secs.map(n => ({ n, v: secScore[n] })).filter(x => x.v != null).sort((a, b) => a.v - b.v)[0];
    if (weakest) html += `<div class="note note-amber" style="margin-top:10px">أضعف نقطة في ${p.name}: <b>${weakest.n}</b> (${weakest.v}) — من هنا تبدأ الرافعة في الركيزة دي.</div>`;
    html += `</div>`;
  });
  return html;
}

/* ============================================================================
   تبويب ٣ — التوطين بالإدارة (heat-map)
============================================================================ */
function tabDepts() {
  const cell = (v) => `<span class="dept-cell ${heatClass(v)}">${v ?? '—'}</span>`;

  const rows = agg.departments
    .sort((a, b) => (b.disclosed ? 1 : 0) - (a.disclosed ? 1 : 0))
    .map(d => {
      if (!d.disclosed) {
        return `<div class="dept-row"><span class="dept-name">${d.name}</span>
          <span class="dept-locked">🔒 أقل من ${MIN_DISCLOSURE} أفراد (${d.n}) — مخفي للسرية</span></div>`;
      }
      return `<div class="dept-row">
        <span class="dept-name">${d.name} <span class="tiny">(${d.n})</span></span>
        ${cell(d.pillars.T)}${cell(d.pillars.H)}${cell(d.pillars.N)}
        <span class="tiny" style="text-align:center;color:var(--ember-soft);font-weight:700">${PILLAR_NAME[d.weakestPillar] || '—'}</span>
      </div>`;
    }).join('');

  return `
    <div class="section-title" style="margin-top:18px">التربة حسب الإدارة</div>
    <div class="tiny" style="margin-bottom:12px">كل خلية = متوسط الركيزة في الإدارة دي. الأخضر تربة غنية، الأحمر فقيرة. مفيش تفصيل لأقل من ${MIN_DISCLOSURE} أفراد.</div>
    <div class="dept-row head"><span>الإدارة</span><span style="text-align:center">تماسك</span><span style="text-align:center">حيوية</span><span style="text-align:center">انتماء</span><span style="text-align:center">الأضعف</span></div>
    ${rows}
    <div class="soil-legend" style="margin-top:16px">
      <span><i class="heat-hi" style="background:rgba(127,196,160,.5)"></i> غنية (66+)</span>
      <span><i class="heat-mid" style="background:rgba(224,164,88,.5)"></i> متوسطة (45–65)</span>
      <span><i class="heat-lo" style="background:rgba(232,98,61,.5)"></i> فقيرة (&lt;45)</span>
    </div>
    <div class="note note-info" style="margin-top:16px">
      ده اللي بيحوّل التشخيص لخطة: بدل "الشركة عندها مشكلة حيوية"، بتعرف "إدارة [س] تربتها أفقر، وأضعف ركيزة عندها [ص]" — فتبدأ التدخّل من البؤرة الحقيقية.
    </div>
  `;
}

/* ============================================================================
   تبويب ٤ — القيادة مقابل القاعدة (عمى الأنظمة)
============================================================================ */
function tabCompare() {
  const A = agg.catProfile.A, C = agg.catProfile.C;
  if (!A?.disclosed || !C?.disclosed) {
    return `<div class="note note-info" style="margin-top:18px">محتاج ${MIN_DISCLOSURE} أفراد على الأقل في القيادة (A) و${MIN_DISCLOSURE} في القاعدة (C) عشان نقارن بأمان.
      الحالي: قيادة ${A?.n || 0}، قاعدة ${C?.n || 0}.</div>`;
  }

  const row = (key) => {
    const a = A.pillars[key], c = C.pillars[key];
    const gap = (a != null && c != null) ? a - c : null;
    const gapColor = gap == null ? 'var(--mute-2)' : Math.abs(gap) <= 10 ? 'var(--sky)' : Math.abs(gap) <= 25 ? '#E0A458' : 'var(--ember-soft)';
    return `<div class="bar-row" style="grid-template-columns:80px 1fr 1fr 90px;gap:10px;align-items:center;margin-bottom:12px">
      <span class="tiny" style="font-weight:700">${PILLAR_NAME[key]}</span>
      <div><div class="tiny" style="color:var(--gold)">قيادة: ${a ?? '—'}</div><div class="bar-track" style="margin-top:3px"><div class="bar-fill" style="width:${a ?? 0}%;background:var(--gold)"></div></div></div>
      <div><div class="tiny" style="color:var(--sky)">قاعدة: ${c ?? '—'}</div><div class="bar-track" style="margin-top:3px"><div class="bar-fill" style="width:${c ?? 0}%;background:var(--sky)"></div></div></div>
      <span class="tiny" style="text-align:center;color:${gapColor};font-weight:700">${gap == null ? '—' : (gap > 0 ? `+${gap}` : gap)}</span>
    </div>`;
  };

  // أكبر فجوة إدراكية
  const gaps = ['T', 'H', 'N'].map(k => ({ k, g: (A.pillars[k] != null && C.pillars[k] != null) ? A.pillars[k] - C.pillars[k] : null })).filter(x => x.g != null);
  const maxGap = gaps.sort((a, b) => Math.abs(b.g) - Math.abs(a.g))[0];
  let verdict = '';
  if (maxGap) {
    if (Math.abs(maxGap.g) <= 10) verdict = 'القيادة والقاعدة بيعيشوا الأنظمة بشكل متقارب — إدراك موحّد، ده صحّي.';
    else if (maxGap.g > 0) verdict = `عمى أنظمة: القيادة شايفة ركيزة «${PILLAR_NAME[maxGap.k]}» بتغذّي أحسن بـ${Math.abs(maxGap.g)} نقطة مما الفريق عايشه فعلاً. القيادة بتفتكر النظام شغّال، والقاعدة بتدفع التمن.`;
    else verdict = `القاعدة بتقيّم «${PILLAR_NAME[maxGap.k]}» أعلى من القيادة بـ${Math.abs(maxGap.g)} نقطة — حالة غير شائعة، تستحق نقاش.`;
  }

  return `
    <div class="section-title" style="margin-top:18px">عمى الأنظمة — القيادة مقابل القاعدة</div>
    <div class="tiny" style="margin-bottom:14px">الفرق (قيادة − قاعدة) لكل ركيزة. الموجب الكبير = القيادة بتشوف الأنظمة أحسن من اللي الفريق عايشه.</div>
    <div class="dept-row head" style="grid-template-columns:80px 1fr 1fr 90px"><span>الركيزة</span><span style="text-align:center">القيادة</span><span style="text-align:center">القاعدة</span><span style="text-align:center">الفرق</span></div>
    <div style="margin-top:14px">${row('T')}${row('H')}${row('N')}</div>
    <div class="note ${maxGap && Math.abs(maxGap.g) > 25 ? 'note-amber' : 'note-info'}" style="margin-top:14px">${verdict}</div>
    <div class="note note-info" style="margin-top:10px">ده عمى على مستوى الأنظمة — بيكمّل عمى الفجوة في الاحتراق. لو الاتنين متّفقين، القيادة بعيدة عن الواقع اليومي في طبقتين.</div>
  `;
}

/* ============================================================================
   تبويب ٥ — الكروسووك المفصّل
============================================================================ */
function tabCrosswalk() {
  const cw = agg.crosswalk;
  const expected = {
    M: 'التماسك والحيوية والانتماء كلهم منخفضين (تربة منهَكة عبر اللوح)، والانتماء من الأوطى لأن المدير بقى مصدر ضغط.',
    G: 'التماسك متغذّي (عالي) بينما الحيوية متجوّعة (منخفضة) — الماكينة شغّالة والنار مقطوع عنها الغذاء.',
    K: 'الانتماء رفيع بنيوياً (واطي بفارق) بينما التماسك و/أو الحيوية مقبولين — البُعد الإنساني مبُنيش من الأساس.'
  };
  const actual = `التماسك ${agg.pillars.T ?? '—'} · الحيوية ${agg.pillars.H ?? '—'} · الانتماء ${agg.pillars.N ?? '—'}`;

  let analysis = '';
  if (cw.verdict === 'confirm') {
    analysis = `<div class="note note-info" style="margin-top:14px"><b>تأكيد متقاطع.</b> الأعراض (الاحتراق) والأنظمة (التربة) بيشاوروا على نفس الجذر. ده بيرفع ثقة التشخيص لأقصاها — مش بس عارفين النوع، عارفين السبب التشغيلي تحته. الخطة تبدأ من أضعف ركيزة على طول.</div>`;
  } else if (cw.verdict === 'conflict') {
    analysis = `<div class="note note-amber" style="margin-top:14px"><b>تعارض كاشف (اكتشاف، مش خطأ).</b> الروح بتعاني من مصدر، والأنظمة بتأكّد مصدر تاني. ده بيفتح سؤال حقيقي: يا إما فيه حاجة بتجوّع الحيوية غير الأنظمة (قيادة؟ سوق؟ معنى؟)، يا إما نظام بيكبت الانتماء بشكل مش ظاهر في أعراض الناس لسه. قِف هنا، وارجع لتبويب «البنود والأصوات» تقرا التعليقات — هي اللي هتفك العقدة.</div>`;
  } else {
    analysis = `<div class="note note-info" style="margin-top:14px"><b>ميل بلا حسم.</b> بصمة التربة مش واضحة بما يكفي تأكّد أو تعارض. اقرا الأقسام الفرعية لأضعف ركيزة يدوياً في تبويب «التشريح بالركيزة».</div>`;
  }

  return `
    <div class="section-title" style="margin-top:18px">الكروسووك المفصّل — التربة والاحتراق وجهاً لوجه</div>
    ${renderCrosswalk(cw, burnoutType)}

    <div class="card" style="margin-top:18px">
      <div class="section-title">المثلث جنب النوع</div>
      <div class="soil-tri-card">${renderSoilTriangle(agg.pillars, { caption: burnoutType ? `نوع الاحتراق: <b style="color:var(--ember-soft)">${TYPE_NAME[burnoutType]}</b>` : 'لسه مفيش نوع احتراق محسوب' })}</div>
    </div>

    ${burnoutType ? `
    <div class="grid grid-2" style="margin-top:18px">
      <div class="stat" style="text-align:right"><div class="k">البصمة المتوقّعة لـ«${TYPE_NAME[burnoutType]}»</div><div style="margin-top:8px;font-size:14px;line-height:1.7">${expected[burnoutType]}</div></div>
      <div class="stat" style="text-align:right"><div class="k">البصمة الفعلية للتربة</div><div class="v sky" style="font-size:17px;margin-top:8px">${actual}</div><div class="tiny" style="margin-top:8px">الميل التشغيلي: <b>${cw.soilLean ? TYPE_NAME[cw.soilLean] : 'غير حاسم'}</b></div></div>
    </div>` : ''}

    ${analysis}
  `;
}

/* ============================================================================
   تبويب ٦ — البنود والأصوات
============================================================================ */
function subset() {
  return soilResponses.filter(r =>
    (itemFilterCat === 'all' || r.category === itemFilterCat) &&
    (itemFilterDept === 'all' || r.department === itemFilterDept)
  );
}

function tabItems() {
  const rs = subset();
  const catChips = ['all', 'A', 'B', 'C'].map(c =>
    `<div class="tab ${itemFilterCat === c ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'كل الفئات' : ({ A: 'قيادة', B: 'وسطى', C: 'قاعدة' })[c]}</div>`).join('');
  const deptOpts = ['all', ...DEPARTMENTS].map(d =>
    `<option value="${d}" ${itemFilterDept === d ? 'selected' : ''}>${d === 'all' ? 'كل الإدارات' : d}</option>`).join('');

  let html = `
    <div class="tabs" id="itemCatFilter" style="margin-top:18px">${catChips}</div>
    <div class="field" style="margin-top:10px;max-width:340px"><label>فلترة بالإدارة</label>
      <select id="itemDeptFilter">${deptOpts}</select></div>
    <div class="tiny" style="margin:8px 0 4px">عدد الإجابات في الفلتر الحالي: <b>${rs.length}</b>${rs.length < MIN_DISCLOSURE ? ' — أقل من حدّ السرية، التفصيل قد لا يكون ذا دلالة.' : ''}</div>`;

  let curPillar = null;
  SOIL_ITEMS.forEach(it => {
    if (it.pillar !== curPillar) {
      curPillar = it.pillar;
      const nm = it.pillar === 'R' ? 'ترمومتر البقاء' : `ركيزة ${it.pillarName}`;
      html += `<div class="section-title" style="margin-top:22px">${nm}</div>`;
    }
    html += `<div class="card" style="margin-top:10px"><div class="qnum">${it.id} · ${it.sectionName}${it.reverse ? ' · (معكوس)' : ''}</div>
      <div style="margin:6px 0 12px;font-weight:700">${it.text}</div>${itemDist(rs, it)}</div>`;
  });

  // قسم مجمّع لكل التعليقات (صوت التربة)
  const allComments = [];
  rs.forEach(r => {
    const cs = r.results?.comments || {};
    Object.keys(cs).forEach(qid => allComments.push({ qid, text: cs[qid], dept: r.department }));
  });
  html += `<div class="section-title" style="margin-top:26px">صوت التربة — كل التعليقات المجهّلة (${allComments.length})</div>`;
  html += allComments.length
    ? allComments.slice(0, 40).map(c => `<div class="quote" style="margin-top:8px">${c.text}<div class="who">— ${c.qid} · ${c.dept || 'إدارة غير محدّدة'}</div></div>`).join('')
      + (allComments.length > 40 ? `<div class="tiny" style="margin-top:8px">+ ${allComments.length - 40} تعليق آخر (نزّل CSV للكل)</div>` : '')
    : `<div class="tiny muted">— مفيش تعليقات في الفلتر الحالي —</div>`;

  return html;
}

function itemDist(rs, it) {
  const counts = [0, 0, 0, 0, 0]; let na = 0, answered = 0;
  rs.forEach(r => {
    const v = r.answers?.[it.id];
    if (v === 5) { na++; answered++; }
    else if (v != null && counts[v] != null) { counts[v]++; answered++; }
  });
  const scored = answered - na;
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
  const naRow = na ? `<div class="tiny" style="margin-top:8px">مش منطبق: ${na} (${Math.round((na / total) * 100)}%) — مستبعدة من المتوسط</div>` : '';
  const avgRow = avg != null ? `<div class="tiny" style="margin-top:6px">متوسط الصحة (بعد قلب المعكوس): <b style="color:${avg >= 66 ? 'var(--belong-soft)' : avg >= 45 ? '#E0A458' : 'var(--ember-soft)'}">${avg}</b> · ${scored} رد محسوب</div>` : '';

  const comments = rs.map(r => r.results?.comments?.[it.id]).filter(t => t && t.trim().length > 1);
  const cBlock = comments.length
    ? `<div class="tiny" style="margin:12px 0 6px;color:var(--gold)">تعليقات الناس (${comments.length}):</div>` +
      comments.slice(0, 10).map(t => `<div class="quote" style="margin-top:6px">${t}</div>`).join('') +
      (comments.length > 10 ? `<div class="tiny" style="margin-top:6px">+ ${comments.length - 10} تعليق آخر</div>` : '')
    : '';
  return `<div class="bars">${bars}</div>${naRow}${avgRow}${cBlock}`;
}

function wireItemFilters() {
  const cf = $('itemCatFilter');
  if (cf) cf.querySelectorAll('.tab').forEach(t => t.onclick = () => { itemFilterCat = t.dataset.cat; showTab('items'); });
  const df = $('itemDeptFilter');
  if (df) df.onchange = () => { itemFilterDept = df.value; showTab('items'); };
}

/* ============================================================================
   شاشة العرض (للقاء) — خريطة الرافعات، تظهر آخر اللقاء (مش لحظة المرآة)
============================================================================ */
$('mirrorBtn').onclick = () => {
  if (!agg) return;
  const weakSecs = agg.sections.filter(s => s.score != null).sort((a, b) => a.score - b.score).slice(0, 3);
  $('mirrorBody').innerHTML = `
    <div class="mirror">
      <div class="eyebrow">خريطة الرافعات — ${$('cohortInput').value.trim()}</div>
      <div style="margin:18px 0">
        <div class="soil-tri-card" style="background:transparent;border:none">${renderSoilTriangle(agg.pillars, { caption: agg.weakestPillar ? `أضعف ركيزة: <b style="color:var(--ember-soft)">${agg.weakestPillarName}</b>` : '' })}</div>
      </div>
      <div class="big">من هنا نبدأ</div>
      <div class="divider"></div>
      ${renderCrosswalk(agg.crosswalk, burnoutType)}
      <div class="divider"></div>
      <div class="section-title">أضعف ٣ رافعات نبدأ منها</div>
      ${weakSecs.map((s, i) => `<div class="note note-amber" style="margin-top:10px"><b>${i + 1}. ${s.name}</b> — ${s.score}</div>`).join('')}
      <div class="divider"></div>
      <p class="muted">دي مش لحظة الحكم — دي خريطة الطريق. الاحتراق ورانا كشف الروح، والتربة دلوقتي بتورّينا الأرض اللي نزرع فيها. من أضعف رافعة، نبدأ.</p>
    </div>`;
  $('mirrorOverlay').classList.remove('hidden');
};
$('mirrorClose').onclick = () => $('mirrorOverlay').classList.add('hidden');
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('mirrorOverlay').classList.add('hidden'); });

/* ============================================================================
   رابط الدفعة + تصدير CSV
============================================================================ */
$('genLinkBtn').onclick = () => {
  const cohort = $('cohortInput').value.trim();
  if (!cohort) { $('linkMsg').textContent = 'اكتب كود الدفعة الأول'; return; }
  const base = location.href.split('#')[0].replace(/soil-admin\.html(\?.*)?$/, 'soil-index.html');
  const link = `${base}?cohort=${encodeURIComponent(cohort)}`;
  $('linkText').textContent = link; $('linkBox').classList.remove('hidden');
  window._soilLink = link; $('linkMsg').textContent = '';
};
$('copyLinkBtn').onclick = async () => {
  if (!window._soilLink) return;
  try { await navigator.clipboard.writeText(window._soilLink); $('linkMsg').textContent = 'تم النسخ ✓'; }
  catch { $('linkMsg').textContent = 'انسخ يدوياً من فوق'; }
};

$('csvBtn').onclick = () => {
  if (!soilResponses.length) return;
  const head = ['alias', 'category', 'department', 'T', 'H', 'N', 'weakest', 'retention'];
  const itemCols = SOIL_ITEMS.map(it => it.id);
  const commentCols = SOIL_ITEMS.map(it => it.id + '_c');
  const fullHead = [...head, ...itemCols, ...commentCols];
  const rows = soilResponses.map(r => {
    const R = r.results || {};
    const base = [r.alias, r.category, r.department, R.pillars?.T, R.pillars?.H, R.pillars?.N, R.weakestPillarName, R.retention];
    const items = itemCols.map(id => r.answers?.[id] ?? '');
    const cs = commentCols.map(id => r.answers?.[id] ?? '');
    return [...base, ...items, ...cs].map(x => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(',');
  });
  const csv = '\uFEFF' + [fullHead.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `soil-${$('cohortInput').value.trim()}.csv`; a.click();
};
