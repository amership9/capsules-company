/* ============================================================================
   Reignite — منحني الاحتراق
   scoring.js — المحرّك التحليلي

   بيطبّق:
   - تحويل الإجابات لمسطرة موحّدة 0–100 (العالي = حيوية/صحة)
   - المخرجات الستة (مرحلة، فجوة، مستويات، محور+حالة، نوع، إيقاع+فلاتر)
   - تصنيف النصوص (نار التأسيس، المعنى، البُعد المدفون، صوت الشركة) بالكلمات المفتاحية
   - تصويت النوع المرجّح من 3 زوايا + قواعد الحسم الخمسة
   - التحليل الفئوي (A مقابل C) ومؤشر العمى — على مستوى الدفعة

   الإدخال: كائن answers مفتاحه id السؤال.
     choice   → فهرس الخيار (رقم)
     scale    → رقم 1..10
     textarea → نصّ
     compound → { value, text }  حيث value = فهرس/نص الجزء الأساسي، text = الجزء الفرعي/النص
                (Q5: value=فهرس الـ followUp، text=النص الأساسي)
                (Q6: value=فهرس الأساسي، text=نص الـ followUp)
                (Q24: value=فهرس الـ followUp، text=النص الأساسي)
============================================================================ */

import { QMAP } from './questions.js';

/* ---------- أدوات مساعدة ---------- */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

/* درجة خيار choice حسب الفهرس */
function optScore(qid, idx) {
  const q = QMAP[qid];
  if (!q || idx == null || !q.options || !q.options[idx]) return null;
  return q.options[idx].score;
}
function optTag(qid, idx) {
  const q = QMAP[qid];
  if (!q || idx == null || !q.options || !q.options[idx]) return null;
  return q.options[idx].tag;
}
/* درجة scale على مسطرة الصحة (0–100): طردي = ans*10 ، عكسي = (11-ans)*10 */
function scaleHealth(qid, ans) {
  if (ans == null) return null;
  const q = QMAP[qid];
  return q.dir === 'neg' ? (11 - ans) * 10 : ans * 10;
}

/* استخراج الأجزاء من compound */
function compoundParts(a) {
  if (a == null) return { value: null, text: '' };
  if (typeof a === 'object') return { value: a.value ?? null, text: a.text ?? '' };
  return { value: a, text: '' };
}

/* ---------- تصنيف النصوص بالكلمات المفتاحية ---------- */
const KW = {
  axisH: ['نغيّر', 'نغير', 'نعلّم', 'نعلم', 'تعليم', 'رسالة', 'حلم', 'شغف', 'تغيير', 'أثر', 'اثر', 'جيل', 'حياة', 'نطور', 'إبداع', 'ابداع', 'نلهم'],
  axisT: ['مستقبل', 'أمان', 'امان', 'كيان', 'استقرار', 'استقلال', 'رزق', 'نأمّن', 'نامن', 'دخل', 'حماية'],
  axisN: ['ناس', 'فريق', 'عائلة', 'مجتمع', 'نجمع', 'خدمة', 'علاقات', 'انتماء', 'مكانة', 'سمعة', 'تأثير في الناس'],
  meaningPos: ['نغيّر', 'نغير', 'نعلّم', 'نعلم', 'نبني', 'حياة', 'رسالة', 'جيل', 'أثر', 'اثر', 'نطور', 'فرق', 'إنسان', 'انسان'],
  meaningNeg: ['فلوس', 'مكسب', 'مفيش', 'مش هيلاقوا', 'مش هيلاقو', 'ماشي', 'شغل وخلاص', 'مجرد'],
  typeM: ['تعبان', 'مرهق', 'مستنزف', 'ضغط', 'مش قادر', 'مش قادرة', 'إرهاق', 'ارهاق', 'تعبانة', 'محترق'],
  typeG: ['وحشاني', 'النار', 'روتين', 'ملل', 'زمان', 'فقدنا', 'الحماس راح', 'بقى عادي', 'باهت'],
  typeK: ['مش أنا', 'مش انا', 'اتغيّرت', 'اتغيرت', 'غريبة', 'غريب', 'ناقص', 'فراغ', 'من الأول', 'من الاول', 'مش اللي كنت']
};
function countHits(text, words) {
  if (!text) return 0;
  const t = String(text);
  return words.reduce((c, w) => c + (t.includes(w) ? 1 : 0), 0);
}
/* يصنّف نار التأسيس لمحور T/H/N */
function classifyFoundingAxis(text) {
  const h = countHits(text, KW.axisH), t = countHits(text, KW.axisT), n = countHits(text, KW.axisN);
  const max = Math.max(h, t, n);
  if (max === 0) return null;
  if (h === max) return 'H';
  if (t === max) return 'T';
  return 'N';
}
/* درجة المعنى الضمنية من Q14 (0–100) */
function meaningImplicit(text) {
  if (!text || String(text).trim().length < 3) return 30;
  const pos = countHits(text, KW.meaningPos), neg = countHits(text, KW.meaningNeg);
  if (neg > pos) return 25;
  if (pos > 0) return 85;
  return 55;
}
/* ترجيح نوع من نصّ صوت الشركة (Q34) */
function classifyTypeFromText(text) {
  const m = countHits(text, KW.typeM), g = countHits(text, KW.typeG), k = countHits(text, KW.typeK);
  const max = Math.max(m, g, k);
  if (max === 0) return null;
  if (m === max) return 'M';
  if (g === max) return 'G';
  return 'K';
}

/* ============================================================================
   الحساب الكامل لمستجيب واحد
============================================================================ */
export function computeResults(answers) {
  const a = answers || {};
  const flags = [];

  /* ===== المحور الأول — الفجوة ===== */
  const q1 = a.Q1, q2 = a.Q2, q3 = a.Q3, q4 = a.Q4, q7 = a.Q7, q8 = a.Q8;
  const q5p = compoundParts(a.Q5);   // value = followUp index, text = نص أساسي
  const q6p = compoundParts(a.Q6);   // value = فهرس أساسي, text = نص followUp

  const successScore = optScore('Q1', q1);                 // 0–100 خط النجاح
  const q2v = q2 != null ? q2 * 10 : null;                 // تحسّن النجاح
  const q3v = q3 != null ? q3 * 10 : null;                 // تحسّن الحيوية
  const q4score = optScore('Q4', q4);
  const q5fuScore = q5p.value != null ? QMAP.Q5.followUp.options[q5p.value]?.score : null;
  const q6score = optScore('Q6', q6p.value);
  const q7raw = q7;                                        // إجابة خام (عالي = فجوة كبيرة)
  const q7health = scaleHealth('Q7', q7);                  // عالي = صحة
  const q8score = optScore('Q8', q8);

  // مكوّنات حجم الفجوة (كلها: عالي = فجوة أكبر)
  const c1 = (q2v != null && q3v != null) ? clamp(q2v - q3v, 0, 100) : 0;
  const c2 = q4score != null ? (100 - q4score) : 0;
  const c3 = q7raw != null ? q7raw * 10 : 0;
  const c4 = q5fuScore != null ? (100 - q5fuScore) : 0;
  const gapValue = Math.round(c1 * 0.40 + c2 * 0.25 + c3 * 0.25 + c4 * 0.10);
  let gapBand = gapValue <= 30 ? 'صغيرة' : gapValue <= 60 ? 'متوسطة' : 'كبيرة';

  // تنبيه: الحيوية أعلى من النجاح = إشارة صحة لا فجوة
  if (q2v != null && q3v != null && q3v > q2v) flags.push('الحيوية اتحسّنت أكتر من النجاح — إشارة صحة (تطابق/إعادة اشتعال).');

  /* المرحلة على منحني الاحتراق */
  const STAGES = ['التطابق', 'التباعد المبكر', 'الفجوة الصامتة', 'الانكشاف', 'المفترق'];
  const baseStageByGrowth = {
    'الفكرة': 0, 'الكفاح': 0, 'الاستمرار': 1, 'الدوامة': 2, 'الثبات': 2, 'النمو': 2
  };
  const growthStage = optTag('Q1', q1) || 'الاستمرار';
  let stageIdx = baseStageByGrowth[growthStage] ?? 1;

  // تعميق بإشارات الحيوية (تقدر تعمّق فقط، مش تطلّع لمرحلة أصحّ)
  let deepen = stageIdx;
  if (gapValue >= 31) deepen = Math.max(deepen, 2);
  if (gapValue >= 61) deepen = Math.max(deepen, 3);
  if (q6score === 10) deepen = Math.max(deepen, 3);          // تسرّب ملحوظ
  if (q6score === 10 && gapValue >= 61) deepen = 4;          // المفترق
  stageIdx = Math.max(stageIdx, deepen);
  // استثناء: حيوية طالعة مع النجاح + فجوة صغيرة → سقف عند التباعد المبكر
  if (q4score === 100 && gapValue <= 30) stageIdx = Math.min(stageIdx, 1);
  const stage = STAGES[stageIdx];

  /* ===== المحور الثاني — المستويات ===== */
  const energyArr = [scaleHealth('Q9', a.Q9), optScore('Q10', a.Q10)].filter(v => v != null);
  const relationArr = [optScore('Q11', a.Q11), scaleHealth('Q12', a.Q12), optScore('Q13', a.Q13)].filter(v => v != null);
  const meaningArr = [meaningImplicit(a.Q14), scaleHealth('Q15', a.Q15), optScore('Q16', a.Q16)].filter(v => v != null);

  const levels = {
    energy: Math.round(avg(energyArr)),
    relation: Math.round(avg(relationArr)),
    meaning: Math.round(avg(meaningArr))
  };
  const levelNames = { energy: 'الطاقة', relation: 'العلاقة', meaning: 'المعنى' };
  const mostErodedKey = Object.keys(levels).reduce((lo, k) => levels[k] < levels[lo] ? k : lo, 'energy');
  const mostEroded = levelNames[mostErodedKey];

  // فاصل الإرهاق/الاحتراق (قاعدة حاكمة)
  const q10tag = optTag('Q10', a.Q10);
  const restoresEnergy = q10tag === 'إرهاق'; // الراحة بترجّع الطاقة
  if (restoresEnergy && levels.energy < 60) {
    flags.push('إرهاق غالب مش احتراق — الراحة بترجّع الطاقة، فالنبرة ضغط موسمي قابل للحل بالراحة.');
  }

  /* ===== المحور الثالث — المحور المهيمن + الحالة ===== */
  const t17 = optTag('Q17', a.Q17), t18 = optTag('Q18', a.Q18);
  let dominant = t17 || t18 || null;
  let secondary = null;
  if (t17 && t18 && t17 !== t18) { dominant = t17; secondary = t18; } // ترجيح Q17
  const axisNameMap = { T: 'تماسك', H: 'حيوية', N: 'انتماء' };
  const dominantName = axisNameMap[dominant] || '—';
  const secondaryName = secondary ? axisNameMap[secondary] : null;

  const foundingAxis = classifyFoundingAxis(compoundParts(a.Q24).text) ; // احتياط
  const founding = classifyFoundingAxis(a.Q19);
  const foundingName = founding ? axisNameMap[founding] : null;

  const q20score = optScore('Q20', a.Q20);
  const q21score = a.Q21 != null ? a.Q21 * 10 : null;
  let stateScore = null;
  if (q20score != null && q21score != null) stateScore = Math.round(q20score * 0.40 + q21score * 0.60);
  else if (q21score != null) stateScore = q21score;
  else if (q20score != null) stateScore = q20score;
  const state = stateScore == null ? '—' : stateScore >= 70 ? 'فطرة' : stateScore >= 40 ? 'مختلط' : 'قناع';
  // تناقض كاشف: يقول فطرة بس القرارات دفاعية
  if (q20score === 100 && q21score != null && q21score <= 40) {
    flags.push('تناقض كاشف: الشركة بتقول إنها واثقة بس قراراتها دفاعية — قناع متخفّي في ثوب ثقة.');
  }
  // الجوع المحوري
  const axisHunger = (founding && dominant && founding !== dominant);
  if (axisHunger) flags.push(`جوع محوري محتمل: أسّست بـ"${foundingName}" وبتُدار دلوقتي بـ"${dominantName}".`);

  /* ===== المحور الرابع — النوع (تصويت مرجّح من 3 زوايا) ===== */
  const votes = { M: 0, G: 0, K: 0 };
  const addVote = (tag, w) => { if (tag && votes[tag] != null) votes[tag] += w; };

  // الزاوية الأولى — الأعراض
  addVote(optTag('Q22', a.Q22), 1);
  addVote(optTag('Q23', a.Q23), 2);
  addVote(optTag('Q25', a.Q25), 1);
  addVote(optTag('Q26', a.Q26), 2);
  const q24p = compoundParts(a.Q24);
  const q24tag = q24p.value != null ? QMAP.Q24.followUp.options[q24p.value]?.tag : null; // K/G/none
  if (q24tag === 'K' || q24tag === 'G') addVote(q24tag, 2);
  const q27raw = a.Q27; // عالي = فراغ مع النجاح
  if (q27raw != null && q27raw >= 7) addVote('K', 2);
  if (q27raw != null && q27raw <= 3) votes.K = Math.max(0, votes.K - 2); // يلغي/يقلّل K

  // الزاوية الثانية — المحاور
  if (state === 'قناع') addVote('M', 2);
  if (axisHunger) addVote('G', 2);
  const foundingAbsent = founding && founding !== dominant && founding !== secondary;
  if (foundingAbsent && levels.relation < 50) addVote('K', 2);

  // الزاوية الثالثة — المستويات
  if (mostErodedKey === 'energy') addVote('M', 1);
  if (mostErodedKey === 'meaning' && levels.energy >= 50) {
    // يتوزّع حسب Q24
    if (q24tag === 'G') addVote('G', 1); else if (q24tag === 'K') addVote('K', 1); else { addVote('G', 0.5); addVote('K', 0.5); }
  }
  if (mostErodedKey === 'relation' && levels.meaning >= 50) addVote('K', 1);

  // ترتيب الأنواع
  let ranked = Object.entries(votes).sort((x, y) => y[1] - x[1]); // [['G',5],...]
  let primaryType = ranked[0][0];
  let secondaryType = ranked[1][0];
  const decisionRules = [];

  // القاعدة 1 — فارز الطاقة أولاً
  const restNoHelp = (q10tag === 'احتراق_راسخ' || q10tag === 'احتراق_بيتكوّن');
  if (levels.energy < 40 && restNoHelp) {
    if (primaryType !== 'M') { primaryType = 'M'; decisionRules.push('القاعدة 1: استنزاف فعلي للطاقة → أولوية المحترقة.'); }
  }
  // القاعدة 2 — الفارز الزمني يحسم G مقابل K
  const top = ranked[0][1], second = ranked[1][1];
  if (Math.abs(top - second) < 2 && ((ranked[0][0] === 'G' && ranked[1][0] === 'K') || (ranked[0][0] === 'K' && ranked[1][0] === 'G'))) {
    if (q24tag === 'G') { primaryType = 'G'; decisionRules.push('القاعدة 2: البُعد اندفن مع النمو → مجوّعة.'); }
    else if (q24tag === 'K') { primaryType = 'K'; decisionRules.push('القاعدة 2: البُعد اندفن من البداية → مكبوتة.'); }
    else {
      const q5tag = q5p.value != null ? QMAP.Q5.followUp.options[q5p.value]?.tag : null;
      if (q5tag === 'حديثة') { primaryType = 'G'; decisionRules.push('القاعدة 2: الروح خفّت مؤخراً → مجوّعة.'); }
      else if (q5tag === 'قديمة') { primaryType = 'K'; decisionRules.push('القاعدة 2: الروح قديمة الفتور → مكبوتة.'); }
    }
  }
  // القاعدة 3 — فارز النجاح الفارغ يحسم K
  const q16tag = optTag('Q16', a.Q16);
  if (q27raw != null && q27raw >= 8 && q16tag === 'منفصل_تام') {
    primaryType = 'K'; decisionRules.push('القاعدة 3: فراغ بيزيد مع النجاح + مفيش إحساس بعد الإنجاز → مكبوتة بقوة.');
  }
  // القاعدة 5 — النوع المركّب
  ranked = Object.entries(votes).sort((x, y) => y[1] - x[1]);
  let composite = false;
  if (Math.abs(ranked[0][1] - ranked[1][1]) < 2 && ranked[0][1] > 0) {
    composite = true;
    if (decisionRules.length === 0) decisionRules.push('القاعدة 5: نوعان متقاربان → نوع مركّب.');
  }

  const typeNames = { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' };
  const primaryTypeName = typeNames[primaryType] || '—';
  const secondaryTypeName = composite ? typeNames[secondaryType] : null;

  // درجة الثقة
  const diff = Math.abs((votes[primaryType] || 0) - (votes[secondaryType] || 0));
  const confidence = diff >= 4 ? 'عالية' : diff >= 2 ? 'متوسطة' : 'منخفضة';

  // البُعد المدفون / محور التأسيس المتآكل
  const buriedDimension = q24p.text || null;
  const erodedFoundingAxis = axisHunger ? foundingName : null;

  /* ===== المحور الخامس — الإيقاع والفلاتر ===== */
  const rhythm = optTag('Q28', a.Q28) || '—';
  const filterMap = ['Q29', 'Q30', 'Q31', 'Q32', 'Q33'].map(qid => ({
    filter: QMAP[qid].filter,
    score: optScore(qid, a[qid]),
    healthy: optScore(qid, a[qid]) === 100
  }));
  const unhealthyFilters = filterMap.filter(f => f.score != null && f.score <= 10).map(f => f.filter);
  const filtersBand = unhealthyFilters.length <= 1 ? 'آليات صحية'
    : unhealthyFilters.length <= 3 ? 'آليات مختلطة' : 'آليات معتلّة';

  const readiness = a.Q36 != null ? a.Q36 * 10 : null;
  const readinessBand = readiness == null ? '—' : readiness >= 70 ? 'عالية' : readiness >= 40 ? 'متوسطة' : 'منخفضة';

  const quotes = {
    lastSpirit: q5p.text || '',
    foundingFire: a.Q19 || '',
    buried: q24p.text || '',
    talentLeft: q6p.text || '',
    voice: a.Q34 || '',
    change: a.Q35 || '',
    meaningSaid: a.Q14 || ''
  };

  /* ===== جملة القراءة المركّبة ===== */
  const typeQuestionMap = { M: 'هنكمل قد الضغط ده؟', G: 'فين النار اللي كانت معانا؟', K: 'هل ده هو؟ ده اللي كنا عايزينه؟' };
  const summary =
    `الشركة في مرحلة «${stage}» على منحني الاحتراق، والفجوة بين نجاحها الظاهر وحيويتها الداخلية ${gapBand}` +
    `، ومتركزة أساساً في مستوى «${mostEroded}». المحور المهيمن «${dominantName}» شغّال بـ«${state}»` +
    `${composite ? `، ونوع الاحتراق «${primaryTypeName} بميل للـ${secondaryTypeName}»` : `، ونوع الاحتراق «${primaryTypeName}»`}` +
    ` — والسؤال اللي بيقلقها من جوّه: «${typeQuestionMap[primaryType]}». ` +
    `الشركة تحت الضغط بتتحرك بإيقاع «${rhythm}»` +
    `${unhealthyFilters.length ? ` وفلاترها المعتلّة (${unhealthyFilters.join('، ')}) بتغذّي الفجوة` : ''}. ` +
    `لو الفجوة فضلت مفتوحة، خط الحيوية هيبدأ يسحب خط النجاح ناحية الانحدار؛ ولو اتقفلت، الشركة بتعدّي للنمو المستدام. ` +
    `وجاهزيتها للتغيير دلوقتي ${readinessBand}.`;

  return {
    category: optTag('Q0', a.Q0),
    // المخرَج 1
    stage, stageIdx, stages: STAGES, growthStage, successScore,
    // المخرَج 2
    gap: { value: gapValue, band: gapBand },
    // المخرَج 5
    levels, levelNames, mostEroded, mostErodedKey,
    // المخرَج 4
    axis: { dominant, dominantName, secondary, secondaryName, founding, foundingName, axisHunger, state, stateScore },
    // المخرَج 3
    type: { primary: primaryType, primaryName: primaryTypeName, secondary: secondaryType, secondaryName: secondaryTypeName, composite, confidence, votes, buriedDimension, erodedFoundingAxis },
    // المخرَج 6
    rhythm, filterMap, unhealthyFilters, filtersBand, readiness, readinessBand,
    // نصوص + قراءة
    quotes, flags, decisionRules, summary,
    restoresEnergy
  };
}

/* ============================================================================
   التجميع على مستوى الدفعة (للأدمن)
   responses: مصفوفة من { answers, results, category, ... }
============================================================================ */
export function aggregate(responses) {
  if (!responses || !responses.length) return null;
  const byCat = { A: [], B: [], C: [] };
  responses.forEach(r => { const c = r.category || r.results?.category; if (byCat[c]) byCat[c].push(r); });

  // متوسط أسئلة الحيوية المرجعية لكل فئة (Q3, Q7health, Q9, Q15) — على مسطرة الصحة
  const vitalityOf = (r) => {
    const a = r.answers || {};
    const vals = [
      a.Q3 != null ? a.Q3 * 10 : null,
      a.Q7 != null ? (11 - a.Q7) * 10 : null,
      a.Q9 != null ? a.Q9 * 10 : null,
      a.Q15 != null ? a.Q15 * 10 : null
    ].filter(v => v != null);
    return vals.length ? avg(vals) : null;
  };
  const catVitality = (cat) => {
    const arr = byCat[cat].map(vitalityOf).filter(v => v != null);
    return arr.length ? Math.round(avg(arr)) : null;
  };
  const vitA = catVitality('A'), vitC = catVitality('C');
  let blindness = null, blindnessBand = '—';
  if (vitA != null && vitC != null) {
    blindness = Math.round(vitA - vitC); // موجب = القيادة شايفة الشركة أحسن
    const abs = Math.abs(blindness);
    blindnessBand = abs <= 15 ? 'إدراك متقارب' : abs <= 35 ? 'عمى متوسط' : 'عمى حادّ';
  }

  // النوع الغالب على مستوى الدفعة + لكل فئة
  const modalType = (arr) => {
    const c = { M: 0, G: 0, K: 0 };
    arr.forEach(r => { const t = r.results?.type?.primary; if (c[t] != null) c[t]++; });
    const sorted = Object.entries(c).sort((x, y) => y[1] - x[1]);
    return { type: sorted[0][1] > 0 ? sorted[0][0] : null, counts: c, diff: sorted[0][1] - sorted[1][1] };
  };
  const typeAll = modalType(responses);
  const typeA = modalType(byCat.A);
  const typeC = modalType(byCat.C);
  const typeNames = { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' };

  // تعارض القيادة/الموظفين في النوع (القاعدة 4)
  let typeConflict = null;
  if (typeA.type && typeC.type && typeA.type !== typeC.type) {
    typeConflict = `القيادة بتشوف «${typeNames[typeA.type]}» والموظفين بيعيشوا «${typeNames[typeC.type]}» — رجّح قراءة الموظفين، وده عمى عن نوع الاحتراق نفسه (أعمق من عمى الفجوة).`;
  }

  // متوسطات المخرجات الكمية على مستوى الدفعة
  const mean = (fn) => {
    const arr = responses.map(fn).filter(v => v != null);
    return arr.length ? Math.round(avg(arr)) : null;
  };
  const gapMean = mean(r => r.results?.gap?.value);
  const gapBand = gapMean == null ? '—' : gapMean <= 30 ? 'صغيرة' : gapMean <= 60 ? 'متوسطة' : 'كبيرة';
  const levelsMean = {
    energy: mean(r => r.results?.levels?.energy),
    relation: mean(r => r.results?.levels?.relation),
    meaning: mean(r => r.results?.levels?.meaning)
  };
  const erodedKey = Object.keys(levelsMean)
    .filter(k => levelsMean[k] != null)
    .reduce((lo, k) => (lo == null || levelsMean[k] < levelsMean[lo]) ? k : lo, null);
  const levelNames = { energy: 'الطاقة', relation: 'العلاقة', meaning: 'المعنى' };

  // المرحلة الغالبة
  const stageCounts = {};
  responses.forEach(r => { const s = r.results?.stage; if (s) stageCounts[s] = (stageCounts[s] || 0) + 1; });
  const modalStage = Object.entries(stageCounts).sort((x, y) => y[1] - x[1])[0]?.[0] || '—';

  // المحور المهيمن الغالب + الحالة
  const domCounts = { تماسك: 0, حيوية: 0, انتماء: 0 };
  responses.forEach(r => { const d = r.results?.axis?.dominantName; if (domCounts[d] != null) domCounts[d]++; });
  const modalDominant = Object.entries(domCounts).sort((x, y) => y[1] - x[1])[0]?.[0] || '—';
  const stateMean = mean(r => r.results?.axis?.stateScore);
  const stateBand = stateMean == null ? '—' : stateMean >= 70 ? 'فطرة' : stateMean >= 40 ? 'مختلط' : 'قناع';

  // الإيقاع الغالب
  const rhythmCounts = {};
  responses.forEach(r => { const x = r.results?.rhythm; if (x && x !== '—') rhythmCounts[x] = (rhythmCounts[x] || 0) + 1; });
  const modalRhythm = Object.entries(rhythmCounts).sort((x, y) => y[1] - x[1])[0]?.[0] || '—';

  // خريطة الفلاتر المجمّعة (متوسط كل فلتر)
  const filterAgg = ['الوكالة', 'الوفرة', 'الصيرورة', 'النقد', 'نجاح الآخرين'].map(name => {
    const arr = responses.map(r => (r.results?.filterMap || []).find(f => f.filter === name)?.score).filter(v => v != null);
    const m = arr.length ? Math.round(avg(arr)) : null;
    return { filter: name, score: m, healthy: m != null && m >= 60 };
  });
  const unhealthyFiltersAgg = filterAgg.filter(f => f.score != null && f.score < 60).map(f => f.filter);

  // الجاهزية
  const readinessMean = mean(r => r.results?.readiness);
  const readinessBand = readinessMean == null ? '—' : readinessMean >= 70 ? 'عالية' : readinessMean >= 40 ? 'متوسطة' : 'منخفضة';
  const readinessA = (() => { const arr = byCat.A.map(r => r.results?.readiness).filter(v => v != null); return arr.length ? Math.round(avg(arr)) : null; })();
  const readinessC = (() => { const arr = byCat.C.map(r => r.results?.readiness).filter(v => v != null); return arr.length ? Math.round(avg(arr)) : null; })();

  // اقتباسات صوت الشركة (مجهّلة)
  const voices = responses.map(r => r.results?.quotes?.voice).filter(t => t && t.trim().length > 2);
  const changes = responses.map(r => r.results?.quotes?.change).filter(t => t && t.trim().length > 2);
  const fires = responses.map(r => r.results?.quotes?.foundingFire).filter(t => t && t.trim().length > 2);

  // جملة القراءة المركّبة على مستوى الدفعة
  const typeQ = { M: 'هنكمل قد الضغط ده؟', G: 'فين النار اللي كانت معانا؟', K: 'هل ده هو؟ ده اللي كنا عايزينه؟' };
  const summary =
    `الشركة في مرحلة «${modalStage}»، والفجوة ${gapBand}، ومتركزة في مستوى «${erodedKey ? levelNames[erodedKey] : '—'}». ` +
    `المحور المهيمن «${modalDominant}» شغّال بـ«${stateBand}»، والنوع الغالب «${typeNames[typeAll.type] || '—'}»` +
    ` — السؤال اللي بيقلق الشركة: «${typeQ[typeAll.type] || '—'}». ` +
    `الإيقاع تحت الضغط «${modalRhythm}»` +
    `${unhealthyFiltersAgg.length ? ` وفلاترها المعتلّة: ${unhealthyFiltersAgg.join('، ')}` : ''}. ` +
    `${blindnessBand !== '—' ? `الفجوة الإدراكية بين القيادة والموظفين: ${blindnessBand}. ` : ''}` +
    `جاهزية الشركة للتغيير ${readinessBand}.`;

  return {
    count: responses.length,
    countByCat: { A: byCat.A.length, B: byCat.B.length, C: byCat.C.length },
    vitA, vitC, blindness, blindnessBand,
    typeAll: { ...typeAll, name: typeNames[typeAll.type] || '—' },
    typeA: { ...typeA, name: typeNames[typeA.type] || '—' },
    typeC: { ...typeC, name: typeNames[typeC.type] || '—' },
    typeConflict, typeNames,
    gapMean, gapBand,
    levelsMean, erodedKey, erodedName: erodedKey ? levelNames[erodedKey] : '—',
    modalStage, modalDominant, stateMean, stateBand,
    modalRhythm, filterAgg, unhealthyFiltersAgg,
    readinessMean, readinessBand, readinessA, readinessC,
    voices, changes, fires,
    summary
  };
}

export { typeNamesFn as _ };
function typeNamesFn() { return { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' }; }
