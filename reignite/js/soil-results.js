/* ============================================================================
   Reignite — التربة
   soil-results.js — شاشة شكر + تأمّل (مش تقرير فردي)

   ليه مش تقرير فردي؟
   - التربة أداة جماعية: نتيجة فرد واحد مضلِّلة (مدير وحش = انتماء منهار عنه هو،
     مش عن الشركة). القيمة في التجميع، واللي بيكشفه الميسّر في اللقاء.
   - السرية: وعدنا الناس إجاباتهم مجمّعة لا فردية — شاشة الشكر بتأكّد الوعد.
   - بنحترم وقت الموظف بسؤال تأمّل شخصي واحد، بلا أرقام ولا نوع.
============================================================================ */

let data;
try { data = JSON.parse(sessionStorage.getItem('soil_result')); } catch { data = null; }
if (!data || !data.results) { location.replace('soil-index.html'); }

const session = data.session || {};
const saveErr = sessionStorage.getItem('soil_save_error');
const root = document.getElementById('root');

/* عدد البنود اللي كتب فيها الموظف تعليق — لمسة تقدير بسيطة بلا كشف تحليل */
const commentCount = (() => {
  const c = data.results?.comments || {};
  return Object.keys(c).length;
})();

root.innerHTML = `
  <div class="card fade" style="text-align:center">
    <div style="font-size:54px;line-height:1;margin:6px 0 4px">🌱</div>
    <span class="pill-tag">صوتك وصل</span>
    <h1 style="font-size:28px;margin-top:14px">شكراً ${session.alias || ''} — إجابتك اتسجّلت</h1>
    <p class="lead" style="margin-top:14px;max-width:560px;margin-inline:auto">
      كل إجابة بتدخل في المجموع المجهّل، وبتساعد الشركة تشوف تربتها بوضوح أكبر —
      <b style="color:var(--belong-soft)">منين</b> الأنظمة بتغذّي، ومنين محتاجة دعم.
    </p>

    <div class="note note-info" style="margin-top:18px;text-align:right">
      <b>ليه مفيش نتيجة فردية تظهرلك؟</b> لأن التربة بتتقري بمعناها الحقيقي لما كل الأصوات
      تتجمّع — مش من إجابة واحدة. ده اللي بيحمي سرّيتك (بنشوف النسب المجمّعة بس)، وبيخلّي
      الصورة الكاملة تتكشف في اللقاء على إيد الميسّر، حيث تبقى عن الشركة كلها مش عن شخص.
    </div>

    ${saveErr ? `<div class="note note-amber" style="margin-top:12px;text-align:right">حصل تعثّر بسيط في الحفظ على السيرفر — لو ينفع طمئن الميسّر إنك خلّصت، عشان نتأكد إن صوتك دخل.</div>` : ''}
  </div>

  <div class="card fade">
    <div class="section-title">قبل ما تقفل — لحظة تأمّل ليك إنت</div>
    <p class="muted" style="margin-bottom:14px">
      السؤال ده ليك وحدك — مش بيتسجّل ولا بيتبعت لحد. بس فكرة تسيبك بيها.
    </p>
    <div class="field" style="margin-top:0">
      <label>لو فيه حاجة واحدة في أنظمة شغلك أو ظروفه تقدر تتغيّر بكرة، تكون إيه؟</label>
      <textarea id="reflect" placeholder="اكتب لنفسك... (مش بيتحفظ)"></textarea>
    </div>
    <div class="note note-info" style="margin-top:14px">
      الحاجة اللي كتبتها دي — لو حسّيت إنها مهمة، احتفظ بيها لنفسك للقاء. لإن أكبر تغيير
      بيبدأ من إن الناس تعرف بالظبط الحاجة الواحدة اللي تفرق.
    </div>
  </div>

  <div class="card fade" style="text-align:center">
    <p class="muted">
      ${commentCount > 0
        ? `كتبت ${commentCount} ${commentCount === 1 ? 'تعليق' : 'تعليقات'} مع إجاباتك — ده بيدّي الأرقام روح، وبيوصّل صوتك أوضح. شكراً إنك خدت وقتك.`
        : 'لو حابب تضيف سياق لإجاباتك في أي وقت تاني، تقدر ترجع تفتح رحلتك بالرابط وتكتب تعليقاتك. شكراً لوقتك.'}
    </p>
    <div class="btn-row" style="margin-top:18px;justify-content:center">
      <a class="btn btn-ghost" href="soil-index.html">تمام، خلصت</a>
    </div>
  </div>
`;
