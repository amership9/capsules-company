/* ============================================================================
   Reignite — التربة
   soil-results.js — صفحة نتيجة الفرد (قراءته لأنظمة الشركة)
   بتعرض مثلث التربة + الركايز + أضعف رافعة + الترمومتر. بلا كروسووك
   (الكروسووك جماعي — بيظهر في الأدمن واللقاء عشان ما نحرقش لحظة الكشف).
============================================================================ */

import { renderSoilTriangle, renderPillarBars, renderThermometer } from './soil-visuals.js';
import { SOIL_PILLARS } from './soil-config-items.js';

let data;
try { data = JSON.parse(sessionStorage.getItem('soil_result')); } catch { data = null; }
if (!data || !data.results) { location.replace('soil-index.html'); }

const R = data.results;
const session = data.session || {};
const saveErr = sessionStorage.getItem('soil_save_error');
const root = document.getElementById('root');

const pillarName = { T: 'التماسك', H: 'الحيوية', N: 'الانتماء' };
const weakNote = {
  T: 'الأرضية (التماسك) هي الأضعف عندك — وضوح الأنظمة أو الأدوات أو الاستقرار المادي محتاج دعم.',
  H: 'النار (الحيوية) هي الأضعف عندك — التحدّي والتطوير والمبادرة محتاجين غذاء. ده غالباً اللي بيجوّع الشركة.',
  N: 'العلاقة (الانتماء) هي الأضعف عندك — المدير المباشر أو التقدير أو العدالة محتاجين بناء. ده غالباً اللي بيكبت الشركة.'
};

/* تعليق المثلث حسب أضعف ركيزة */
const triCaption = R.weakestPillar
  ? `شكل تربتك بيميل ناحية ضعف <b style="color:var(--ember-soft)">${pillarName[R.weakestPillar]}</b> — كل ما الرأس قرّب من المركز، كل ما الركيزة دي محتاجة دعم أكتر.`
  : 'تربتك متوازنة نسبياً عبر الركايز الثلاث.';

const pillarCards = SOIL_PILLARS.map(p => {
  const val = R.pillars[p.key];
  const isWeak = R.weakestPillar === p.key;
  return `
    <div class="pillar-stat ${p.key}">
      ${isWeak ? '<span class="weak">● الأضعف</span>' : ''}
      <div class="pk">${p.name}</div>
      <div class="pq">${p.q}</div>
      <div class="pv">${val ?? '—'}</div>
      <div class="pmini"><i style="width:${val ?? 0}%"></i></div>
    </div>`;
}).join('');

root.innerHTML = `
  <div class="card fade">
    <span class="pill-tag">🌱 قراءة التربة</span>
    <h1 style="font-size:26px;margin-top:12px">أهلاً ${session.alias || ''} — دي قراءتك لأنظمة الشركة</h1>
    <div class="note note-info" style="margin-top:14px">
      دي <b>قراءتك إنت</b> للرافعات التشغيلية، مش حُكم. الصورة الكاملة بتظهر لما تتجمّع كل القراءات —
      واللي هيكشفها الميسّر في اللقاء. خد نتيجتك كبداية تأمّل.
    </div>
    ${saveErr ? `<div class="note note-amber" style="margin-top:10px">حصل تعثّر في حفظ إجابتك على السيرفر — لو ينفع راجع الميسّر، بس قراءتك ظاهرة تحت كاملة.</div>` : ''}
  </div>

  <div class="card">
    <div class="section-title">مثلث التربة</div>
    <div class="soil-tri-card">
      ${renderSoilTriangle(R.pillars, { caption: triCaption })}
    </div>
  </div>

  <div class="card">
    <div class="section-title">الركايز الثلاث</div>
    <div class="pillar-grid">${pillarCards}</div>
    ${R.weakestPillar ? `<div class="note note-amber" style="margin-top:14px">${weakNote[R.weakestPillar]}</div>` : ''}
    ${R.weakestSection ? `<div class="tiny" style="margin-top:10px">أضعف نقطة محدّدة عندك: <b style="color:var(--ember-soft)">${R.weakestSection.name}</b> (${R.weakestSection.score}). من هنا تبدأ الرافعة.</div>` : ''}
  </div>

  <div class="card">
    <div class="section-title">ترمومتر بقائك</div>
    <div class="tiny" style="margin-bottom:10px">ده إحساسك الشخصي ناحية الاستمرار — منفصل عن تقييم الأنظمة.</div>
    ${renderThermometer(R.retention, R.retentionBand)}
  </div>
`;
