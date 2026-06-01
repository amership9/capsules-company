/* ============================================================================
   Reignite — منحني الاحتراق
   results.js — صفحة النتيجة الفرديّة (قراءة المستجيب لحالة الشركة)

   ملاحظة تصميميّة مهمّة: المنحني الجماعي (المرآة) بيتكشف في اللقاء على الشاشة.
   هنا بنعرض قراءة الفرد لحالة الشركة — مع التوضيح إن الصورة الكاملة بتظهر
   لمّا تتجمّع كل القراءات، واللي بيكشفها الميسّر — عشان ما نحرقش لحظة الكشف.
============================================================================ */

import { renderCurve } from './curve.js';
import { READINGS, severityFromGapBand, AXIS_STATE_NOTE, FILTER_PATH } from './readings.js';

let data;
try { data = JSON.parse(sessionStorage.getItem('reignite_result')); } catch { data = null; }
if (!data || !data.results) { location.replace('index.html'); }

const R = data.results;
const session = data.session || {};
const saveErr = sessionStorage.getItem('reignite_save_error');
const root = document.getElementById('root');

const TYPE_NAMES = { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' };
const TYPE_Q = {
  M: 'هنكمل قد الضغط ده؟',
  G: 'فين النار اللي كانت معانا؟',
  K: 'هل ده هو؟ ده اللي كنا عايزينه؟'
};

const levelColor = (v) => v >= 66 ? 'var(--sky)' : v >= 40 ? '#E0A458' : 'var(--ember-soft)';

function levelsBars(L) {
  const rows = [['الطاقة', L.energy], ['العلاقة', L.relation], ['المعنى', L.meaning]];
  return rows.map(([n, v]) => `
    <div class="bar-row">
      <span class="tiny">${n}${n === R.mostEroded ? ' ●' : ''}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${levelColor(v)}"></div></div>
      <span class="tiny">${v}</span>
    </div>`).join('');
}

const reading = READINGS[R.type.primary];
const sev = severityFromGapBand(R.gap.band);
const typeBadgeClass = R.type.primary === 'M' ? 'badge-ember' : R.type.primary === 'G' ? 'badge-gold' : 'badge-sky';

const filtersHtml = R.unhealthyFilters.length
  ? R.unhealthyFilters.map(f => `
      <div class="note note-amber" style="margin-top:10px">
        <b>فلتر «${f}»</b> — ${FILTER_PATH[f] || ''}
      </div>`).join('')
  : `<div class="note note-info">الفلاتر الخمسة شغّالة بصحّة — مفيش فلتر بيغذّي الفجوة من ناحيتك.</div>`;

const flagsHtml = (R.flags || []).map(f => `<div class="note note-info" style="margin-top:8px">${f}</div>`).join('');

root.innerHTML = `
  <div class="card fade">
    <div class="eyebrow">قراءتك لحالة الشركة</div>
    <h1 style="font-size:28px">أهلاً ${session.alias || ''} — دي مرآتك للشركة</h1>
    <div class="note note-info" style="margin-top:14px">
      دي <b>قراءتك إنت</b> لحالة الشركة، مش حُكم نهائي. الصورة الكاملة للشركة بتظهر لمّا تتجمّع
      كل القراءات سوا — واللي هيكشفها الميسّر في اللقاء. خد نتيجتك دي كبداية تأمّل، مش كنهاية.
    </div>
    ${saveErr ? `<div class="note note-amber" style="margin-top:10px">حصل تعثّر في حفظ إجابتك على السيرفر — لو ينفع راجع الميسّر، بس قراءتك ظاهرة تحت بشكل كامل.</div>` : ''}
  </div>

  <div class="card">
    <div class="section-title">الخلاصة في سطر</div>
    <p class="lead">${R.summary}</p>
  </div>

  <div class="card">
    <div class="section-title">المنحني — إنت فين</div>
    ${renderCurve({ gap: R.gap.value, stageIdx: R.stageIdx })}
  </div>

  <div class="grid grid-4" style="margin-top:18px">
    <div class="stat"><div class="k">المرحلة</div><div class="v gold">${R.stage}</div></div>
    <div class="stat"><div class="k">حجم الفجوة</div><div class="v ${R.gap.value <= 30 ? 'sky' : R.gap.value <= 60 ? 'gold' : 'ember'}">${R.gap.band} · ${R.gap.value}</div></div>
    <div class="stat"><div class="k">المحور المهيمن</div><div class="v sky">${R.axis.dominantName} <span class="tiny">(${R.axis.state})</span></div></div>
    <div class="stat"><div class="k">المستوى الأكثر تآكلاً</div><div class="v ember">${R.mostEroded}</div></div>
  </div>

  <div class="card">
    <div class="section-title">تشريح الفجوة</div>
    <div class="bars">${levelsBars(R.levels)}</div>
    <div class="tiny" style="margin-top:10px">● = المستوى الأكثر تآكلاً عندك.</div>
  </div>

  <div class="card">
    <div class="section-title">نوع الاحتراق</div>
    <span class="badge ${typeBadgeClass}">${reading.name}${R.type.composite ? ` بميل للـ${TYPE_NAMES[R.type.secondary]}` : ''}</span>
    <span class="tiny" style="margin-right:8px">ثقة التشخيص: ${R.type.confidence}</span>
    <p style="margin-top:14px;font-size:15px"><b style="color:var(--gold)">${reading.tagline}</b></p>
    <p class="muted" style="margin-top:10px">${reading.core}</p>
    <div class="quote" style="margin-top:14px">${reading.severity[sev]}</div>
    <div class="divider"></div>
    <div class="tiny" style="color:var(--gold);font-weight:700;margin-bottom:6px">السؤال اللي بيقلق الشركة من جوّه</div>
    <p class="lead">«${TYPE_Q[R.type.primary]}»</p>
    <div class="divider"></div>
    <div class="tiny" style="color:var(--sky);font-weight:700;margin-bottom:6px">الطريق</div>
    <p class="muted">${reading.path}</p>
  </div>

  <div class="card">
    <div class="section-title">حالة المحور والآليات</div>
    <div class="note ${R.axis.state === 'قناع' ? 'note-amber' : 'note-info'}">${AXIS_STATE_NOTE[R.axis.state] || ''}</div>
    ${filtersHtml}
  </div>

  ${flagsHtml ? `<div class="card"><div class="section-title">ملاحظات</div>${flagsHtml}</div>` : ''}
`;
