/* ============================================================================
   session-data.js  —  قلب المحتوى ومصدر الحقيقة الوحيد
   ----------------------------------------------------------------------------
   كل نص يظهر على أي شاشة بييجي من هنا. الواجهات بتقرأ وتُصيّر بس — مفيش نصوص
   مكتوبة جوّاها. لتغيير الورشة بالكامل، يكفي إعادة كتابة الملف ده.

   مبدأ حاكم: الشاشة مساعِدة مش بديلة عن المقدّم. فكل مرحلة بتعرض "إشارة واحدة
   قوية" (عنوان كبير + بصرية بسيطة)، مش الاسكربت كله. المقدّم هو اللي بيتكلم.

   المصطلحات الإنجليزية اتختارت علميًا/عمليًا — مش ترجمة حرفية.
   ========================================================================== */
(function () {
  'use strict';

  /* ====================================================================
     المصطلحات الثنائية (عربي + إنجليزي) — مصدر حقيقة واحد
     ==================================================================== */
  var TERMS = {
    // المفاهيم المركزية
    wellbeing:        { ar: 'العافية الداخلية', en: 'Inner Wellbeing' },
    success:          { ar: 'النجاح الظاهر',     en: 'Visible Success' },
    burnout:          { ar: 'الاحتراق',          en: 'Burnout' },
    exhaustion:       { ar: 'الإرهاق',           en: 'Exhaustion' },
    hiddenCommitment: { ar: 'الالتزام المخفي',   en: 'Hidden Commitment' },
    bigAssumption:    { ar: 'الافتراض الكبير',   en: 'Big Assumption' },
    trigger:          { ar: 'التريجر',           en: 'Trigger' },
    filters:          { ar: 'الفلاتر الدفاعية',  en: 'Defensive Filters' },
    innerTheatre:     { ar: 'المسرح الداخلي',    en: 'The Inner Theatre' },

    // المحاور الثلاثة
    cohesion:  { ar: 'التماسك', en: 'Cohesion' },
    vitality:  { ar: 'الحيوية', en: 'Vitality' },
    belonging: { ar: 'الانتماء', en: 'Belonging' },

    // المستويات الثلاثة (تتوافق مع أبعاد Maslach)
    energy:       { ar: 'الطاقة', en: 'Energy' },
    relationship: { ar: 'العلاقة', en: 'Engagement' },
    meaning:      { ar: 'المعنى', en: 'Meaning' }
  };

  /* ====================================================================
     الأنواع الثلاثة — أوصاف بنبرة مرآة (مش حكم)
     ==================================================================== */
  var TYPES = {
    burned: {
      key: 'burned',
      ar: 'المحترق', en: 'The Burned',
      essence: 'طاقته بتشتغل بالخوف، وبيشتري نجاحه باستنزاف نفسه.',
      threeAm: '«هكمّل قد الضغط ده؟»',
      mirror: 'أقرب نمط ليك دلوقتي: المحترق. ده وصف لمكان فجوتك — مش حكم عليك. علاجك مش راحة أكتر، لكن إعادة نظر في اللي بيشغّل خوفك.',
      color: '#ef5350'
    },
    starved: {
      key: 'starved',
      ar: 'المجوّع', en: 'The Starved',
      essence: 'مش مرهق بالضرورة — فقد النار اللي بدأ بيها. الروتين بلع المعنى.',
      threeAm: '«فين النار اللي كانت معايا؟»',
      mirror: 'أقرب نمط ليك دلوقتي: المجوّع. ده وصف لمكان فجوتك — مش حكم عليك. علاجك مش شغل أكتر، لكن إعادة وصل بالمعنى اللي اتفقد.',
      color: '#ffa726'
    },
    repressed: {
      key: 'repressed',
      ar: 'المكبوت', en: 'The Repressed',
      essence: 'نجح ووصل، ومع ذلك بيحس بغربة وفراغ — لأن جزء منه اندفن عشان يكبر.',
      threeAm: '«هل ده هو؟ ده اللي كنت عايزه؟»',
      mirror: 'أقرب نمط ليك دلوقتي: المكبوت. ده وصف لمكان فجوتك — مش حكم عليك. علاجك إنك ترجع للجزء اللي دفنته، مش إنك تنجح أكتر.',
      color: '#ab8def'
    }
  };

  /* ====================================================================
     الطيف — اتزان / إفراط / تفريط
     ==================================================================== */
  var SPECTRUM = {
    balance:    { key: 'balance',    ar: 'اتزان',  en: 'Balance',        note: 'نجاحك وعافيتك ماشيين قريّبين من بعض. ده مكان نادر — حافظ عليه بوعي.' },
    excess:     { key: 'excess',     ar: 'إفراط',  en: 'Over-extension', note: 'الفجوة مفتوحة وإنت بتدفع نفسك فوق طاقتك. الطاقة لسه موجودة، بس بتتحرق أسرع مما بتتجدّد.' },
    depletion:  { key: 'depletion',  ar: 'تفريط',  en: 'Depletion',      note: 'الفجوة مفتوحة والطاقة خلصت. المحرّك بيخبو — ده مش وقت دفع، ده وقت استرجاع.' }
  };

  /* ====================================================================
     المستويات الثلاثة المتآكلة
     ==================================================================== */
  var LEVELS = {
    energy:       { key: 'energy',       ar: 'الطاقة',  en: 'Energy',     note: 'أكتر اللي متآكل عندك هو طاقتك — بتصحى مش متجدّد، والجسم بيطالبك بحقه.' },
    relationship: { key: 'relationship', ar: 'العلاقة', en: 'Engagement', note: 'أكتر اللي متآكل عندك هو علاقتك بشغلك ومين حواليك — حاضر بجسمك، غايب بقلبك.' },
    meaning:      { key: 'meaning',      ar: 'المعنى',  en: 'Meaning',    note: 'أكتر اللي متآكل عندك هو المعنى — بتنجح والإحساس مش بيمتلي. ده أهدأ مستوى وأخطره.' }
  };

  /* ====================================================================
     خيارات التفاعل الأول — "آخر مرة بخير من جوّه؟"
     ==================================================================== */
  var LASTWELL_OPTIONS = [
    { id: 'recent',  label: 'إمبارح أو الأسبوع ده' },
    { id: 'month',   label: 'في الشهر اللي فات' },
    { id: 'quarter', label: 'في الأشهر التلاتة اللي فاتوا' },
    { id: 'year',    label: 'في السنة اللي فاتت' },
    { id: 'unsure',  label: 'مش متذكّر بدقة' }
  ];

  /* ====================================================================
     الأسئلة الـ١٢ للتشخيص الفردي
     كل خيار معلّم بـ:
       type   ← 'burned' | 'starved' | 'repressed'  (للأسئلة اللي بتحدّد النوع)
       score  ← 0..10 الأعلى = أصحّ        (لحساب المستوى المتآكل)
     الأسئلة الرقمية (scale) كلها طردية: العالي = أصحّ (عافية أعلى).
     ==================================================================== */
  var DIAGNOSTIC = [
    {
      id: 'q1', kind: 'scale', dim: 'success',
      text: 'على مدار آخر سنتين، نجاحك الظاهر اتحسّن قد إيه؟',
      minLabel: 'تقريبًا ثابت', maxLabel: 'تحسّن كبير جدًا'
    },
    {
      id: 'q2', kind: 'scale', dim: 'wellbeing',
      text: 'في نفس السنتين، عافيتك الداخلية — طاقتك وإحساسك بالمعنى — اتحسّنت قد إيه؟',
      minLabel: 'نزلت', maxLabel: 'تحسّنت كتير'
    },
    {
      id: 'q3', kind: 'choice', dim: 'energy',
      text: 'الإجازات بترجّعلك طاقتك فعلًا؟',
      options: [
        { id: 'a', label: 'أيوه، بأرجع متجدّد',                       score: 10 },
        { id: 'b', label: 'بأرجع أحسن شوية، بس برجع لنفس النقطة بسرعة', score: 5  },
        { id: 'c', label: 'مفيش فرق، الإجازة مبتغيّرش حاجة',           score: 1  }
      ]
    },
    {
      id: 'q4', kind: 'scale', dim: 'energy',
      text: 'بتصحى بطاقة للي قدامك، ولا بتجرجر نفسك؟',
      minLabel: 'بأجرجر نفسي', maxLabel: 'بطاقة حقيقية'
    },
    {
      id: 'q5', kind: 'choice', dim: 'relationship',
      text: 'علاقتك بشغلك بقت إزاي؟',
      options: [
        { id: 'a', label: 'لسه بحب اللي بعمله',          score: 10 },
        { id: 'b', label: "بقى «شغل بيتعمل»، الحماس راح", score: 5  },
        { id: 'c', label: 'بقى عبء بشيله',               score: 1  }
      ]
    },
    {
      id: 'q6', kind: 'choice', dim: 'meaning',
      text: 'لما تحقّق إنجاز كبير، الإحساس الغالب:',
      options: [
        { id: 'a', label: 'فرحة حقيقية بتفضل',              score: 10 },
        { id: 'b', label: 'فرحة لحظة وبعدين فاضي',          score: 5  },
        { id: 'c', label: 'مفيش إحساس أصلًا، بعدّي للي بعده', score: 1  }
      ]
    },
    {
      id: 'q7', kind: 'choice', dim: 'type',
      text: 'أقرب وصف لإحساسك دلوقتي:',
      options: [
        { id: 'a', label: 'مرهق ومستنزف، شغّال تحت ضغط دايم',                 type: 'burned'    },
        { id: 'b', label: 'مش مرهق بالضرورة، بس فقدت النار اللي كانت معايا',   type: 'starved'   },
        { id: 'c', label: 'ناجح بس حاسس بغربة وفراغ، كأن حاجة ناقصة من الأول', type: 'repressed' }
      ]
    },
    {
      id: 'q8', kind: 'choice', dim: 'type',
      text: 'لو صحيت التلاتة الفجر بقلق، السؤال اللي بيقلقك:',
      options: [
        { id: 'a', label: '«هكمّل قد الضغط ده؟»',          type: 'burned'    },
        { id: 'b', label: '«فين النار اللي كانت معايا؟»',   type: 'starved'   },
        { id: 'c', label: '«هل ده هو؟ ده اللي كنت عايزه؟»', type: 'repressed' }
      ]
    },
    {
      id: 'q9', kind: 'choice', dim: 'typeAux',
      text: 'فيه جزء منك دفنته أو أجّلته عشان تنجح؟ ولو أيوه، اتأجّل من امتى؟',
      options: [
        { id: 'a', label: 'آه، من بداية الطريق',   type: 'repressed' },
        { id: 'b', label: 'آه، لما الشركة كبرت',    type: 'starved'   },
        { id: 'c', label: 'لأ، كل حاجة فيّا موجودة', type: 'burned'    }
      ]
    },
    {
      id: 'q10', kind: 'choice', dim: 'type',
      text: 'اللي بيستنزفك أكتر:',
      options: [
        { id: 'a', label: 'الضغط والتحكّم والخوف من إني أفقد موقعي', type: 'burned'    },
        { id: 'b', label: 'التكرار والروتين وغياب التجديد',          type: 'starved'   },
        { id: 'c', label: 'إحساس إني بقيت غريب عن اللي بدأت عشانه',  type: 'repressed' }
      ]
    },
    {
      id: 'q11', kind: 'choice', dim: 'meaning',
      text: 'كل ما بتحقّق نجاح أكبر، الإحساس بالفراغ بيزيد ولا بيقلّ؟',
      options: [
        { id: 'a', label: 'بيقلّ — النجاح بيدّيني إحساس حقيقي', score: 10, type: 'burned'    },
        { id: 'b', label: 'زيّه زيّه، مفيش فرق كبير',           score: 5,  type: 'starved'   },
        { id: 'c', label: 'بيزيد — كل ما نجحت أكتر حسّيت بفراغ أكبر', score: 1, type: 'repressed' }
      ]
    },
    {
      id: 'q12', kind: 'open', dim: 'qualitative',
      text: 'لو حياتك الداخلية إنسان قاعد قدّامك، وعارف إن محدّش هيسمع — هتقول له إيه؟',
      placeholder: 'اكتب اللي يجي في بالك… محدّش هيشوفه'
    }
  ];

  /* ====================================================================
     دالة التشخيص — بتطلّع النوع + الطيف + المستوى المتآكل
     answers = { q1: <1..10>, q2:.., q3:'a'|'b'|'c', ... q12: '<text>' }
     ==================================================================== */
  function scoreDiagnostic(answers) {
    answers = answers || {};

    function optOf(qid, optId) {
      var q = DIAGNOSTIC.filter(function (x) { return x.id === qid; })[0];
      if (!q || !q.options) return null;
      return q.options.filter(function (o) { return o.id === optId; })[0] || null;
    }
    function num(v, def) { var n = Number(v); return isNaN(n) ? (def || 0) : n; }

    /* ---------- (١) النوع: الأغلبية بين q7 / q8 / q10 ---------- */
    var votes = [];
    ['q7', 'q8', 'q10'].forEach(function (qid) {
      var o = optOf(qid, answers[qid]);
      if (o && o.type) votes.push(o.type);
    });
    var tally = { burned: 0, starved: 0, repressed: 0 };
    votes.forEach(function (t) { tally[t]++; });

    var sorted = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; });
    var top = sorted[0];
    var topCount = tally[top];
    var type, confidence;

    if (topCount === 3) {
      type = top; confidence = 'عالية';
    } else if (topCount === 2) {
      type = top; confidence = 'متوسطة';
    } else {
      // التلاتة مختلفين (أو ناقص) → نحتكم لـ q11 ثم q9
      var o11 = optOf('q11', answers['q11']);
      if (o11 && o11.type === 'repressed') {
        type = 'repressed';
      } else {
        var o9 = optOf('q9', answers['q9']);
        type = (o9 && o9.type) ? o9.type : (top || 'burned');
      }
      confidence = 'مبدئية';
    }

    /* ---------- (٢) الطيف: من q1 / q2 / q4 ---------- */
    var q1 = num(answers['q1'], 5);
    var q2 = num(answers['q2'], 5);
    var q4 = num(answers['q4'], 5);
    var gap = q1 - q2;                  // فجوة النجاح ناقص العافية
    var spectrum;
    if (gap <= 2) {
      spectrum = 'balance';
    } else {
      // فجوة متوسطة/كبيرة: q4 بيحسم إفراط (طاقة موجودة) ولا تفريط (طاقة خلصت)
      spectrum = (q4 <= 4) ? 'depletion' : 'excess';
    }

    /* ---------- (٣) المستوى المتآكل: مقارنة طاقة/علاقة/معنى ---------- */
    var o3 = optOf('q3', answers['q3']);
    var o5 = optOf('q5', answers['q5']);
    var o6 = optOf('q6', answers['q6']);
    var o11b = optOf('q11', answers['q11']);

    var energyScore       = (num(o3 ? o3.score : 5, 5) + q4) / 2;
    var relationshipScore = num(o5 ? o5.score : 5, 5);
    var meaningScore      = (num(o6 ? o6.score : 5, 5) + num(o11b ? o11b.score : 5, 5)) / 2;

    var levelScores = {
      energy: energyScore,
      relationship: relationshipScore,
      meaning: meaningScore
    };
    var erodedLevel = Object.keys(levelScores).sort(function (a, b) {
      return levelScores[a] - levelScores[b];
    })[0];

    return {
      type: type,
      typeConfidence: confidence,
      typeTally: tally,
      spectrum: spectrum,
      gap: gap,
      erodedLevel: erodedLevel,
      levelScores: levelScores,
      reflection: answers['q12'] || '',
      // نُسخ جاهزة للعرض
      typeInfo: TYPES[type],
      spectrumInfo: SPECTRUM[spectrum],
      levelInfo: LEVELS[erodedLevel]
    };
  }

  /* ====================================================================
     المراحل — كل مرحلة بتعرض إشارة واحدة قوية
     kind: نوع العرض على الشاشة الكبيرة
     interaction: لو فيه تفاعل على الموبايل
     ==================================================================== */
  var phases = {

    waiting: {
      id: 'waiting', part: 0, block: 'قبل البداية',
      kind: 'waiting',
      title: 'العافية', titleEn: 'Inner Wellbeing',
      subtitle: 'ورشة فهم ما وراء الاحتراق للقادة',
             subtitle: 'Executive Mastery Camp'

    },

    /* ---------- الافتتاح ---------- */
    open_hook: {
      id: 'open_hook', part: 1, block: 'الافتتاح',
      kind: 'statement-hero',
      title: 'الخطّاف المزدوج',
      headline: 'لو نجاح شركتك فضل طالع عشر سنين كمان — إنت من جوّه هتكون طالع معاه؟',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    open_lastwell: {
      id: 'open_lastwell', part: 1, block: 'الافتتاح',
      kind: 'interaction-bars',
      title: 'بولة الغرفة',
      headline: 'آخر مرة حسّيت إنك بخير من جوّه — كانت إمتى؟',
      interaction: { type: 'single-choice', saveKey: 'lastwell', options: LASTWELL_OPTIONS },
      participantPrompt: 'اختار آخر مرة تفتكرها — بصدق.'
    },

    /* ---------- الجزء ١ ---------- */
    p1_curve_intro: {
      id: 'p1_curve_intro', part: 2, block: 'الجزء ١ · المنحني',
      kind: 'visual-curve',
      title: 'المنحني',
      headline: 'الاحتراق هو المسافة بين خطين',
      sub: 'نجاحك الظاهر · وعافيتك الداخلية',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p1_exhaustion_vs_burnout: {
      id: 'p1_exhaustion_vs_burnout', part: 2, block: 'الجزء ١ · المنحني',
      kind: 'visual-contrast',
      title: 'الإرهاق ≠ الاحتراق',
      headline: 'الإرهاق بيخفّ بالراحة. الاحتراق بيرجّعك لنفس النقطة.',
      left:  { tag: 'الإرهاق', en: 'Exhaustion', note: 'طاقة نفدت ورجعت — بيتصلّح بالنوم.' },
      right: { tag: 'الاحتراق', en: 'Burnout',    note: 'اعتلال في العلاقة — بيتصلّح بالفهم.' },
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p1_three_levels: {
      id: 'p1_three_levels', part: 2, block: 'الجزء ١ · المنحني',
      kind: 'visual-levels',
      title: 'المستويات الثلاثة',
      headline: 'الاحتراق بيحصل على ثلاث مستويات في وقت واحد',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p1_principle: {
      id: 'p1_principle', part: 2, block: 'الجزء ١ · المنحني',
      kind: 'visual-curve-bend',
      title: 'المبدأ اللي بيقلب الموضوع',
      headline: 'خط العافية بيتنبّأ بخط النجاح',
      sub: 'الفجوة اللي بتحسّها وإنت ناجح، هي أول علامة لانحدار جاي بعد سنين.',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p1_raise_self: {
      id: 'p1_raise_self', part: 2, block: 'الجزء ١ · المنحني',
      kind: 'interaction-cloud',
      title: 'ارفع نفسك على المنحني',
      headline: 'ارفع نفسك إنت — مش شركتك',
      cloudTitle: 'غرفة القادة',
      interaction: {
        type: 'two-scales', saveKey: 'curve_self',
        scaleA: { key: 'success',   label: 'فين نجاحك إنت؟', sub: 'مكانتك، إنجازاتك، اللي وصلتله', min: 'بسيط', max: 'عالي جدًا' },
        scaleB: { key: 'wellbeing', label: 'فين عافيتك الداخلية؟', sub: 'طاقتك، حضورك مع الناس، إحساسك بالمعنى', min: 'منخفضة', max: 'عالية' }
      },
      participantPrompt: 'حدّد نقطتين — خد وقتك.'
    },

    /* ---------- الجزء ٢ ---------- */
    p2_three_types: {
      id: 'p2_three_types', part: 3, block: 'الجزء ٢ · ليه الفجوة بتفضل',
      kind: 'visual-types',
      title: 'الأنواع الثلاثة',
      headline: 'الفجوة مش نوع واحد — هي تلاتة',
      sub: 'علاج كل نوع مختلف. واللي بيعالج النوع الغلط بيتعب أكتر.',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p2_hidden_commitment: {
      id: 'p2_hidden_commitment', part: 3, block: 'الجزء ٢ · ليه الفجوة بتفضل',
      kind: 'visual-immunity',
      title: 'الالتزام المخفي',
      headline: 'ليه القائد اللي بيشوف كل تفصيلة في شركته — مش بيشوف فجوته هو؟',
      example: {
        stated: 'التزام معلَن: «نفسي أفوّض، أنا مرهق»',
        hidden: 'التزام مخفي: «أفضل أنا المتحكّم في كل حاجة»',
        assumption: 'افتراض كبير: «لو بان إني مش متحكّم، شرعيتي كقائد هتروح»'
      },
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p2_trigger_filters: {
      id: 'p2_trigger_filters', part: 3, block: 'الجزء ٢ · ليه الفجوة بتفضل',
      kind: 'visual-layers',
      title: 'التريجر والفلاتر',
      headline: 'التزام مخفي يتلمس → تريجر → دفاعات تشتعل',
      filters: [
        'الظروف هي السبب — مش أنا',
        'الموارد مش هتكفي — مفيش فرصة',
        'عدّي بسرعة للهدف اللي بعده',
        'النقد = هجوم  (← اللي هنعيشه)',
        'نجاح اللي جنبي على حسابي'
      ],
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p2_criticism: {
      id: 'p2_criticism', part: 3, block: 'الجزء ٢ · ليه الفجوة بتفضل',
      kind: 'visual-mirror-arrow',
      title: 'النقد — الفلتر الحيّ',
      headline: '«القرار ده غلط» — بتترجمها جوّاك إزاي؟',
      mirror: { tag: 'مرآة', en: 'Mirror', note: 'فيه معلومة هنا تكشفلي حاجة.' },
      arrow:  { tag: 'سهم',  en: 'Arrow',  note: 'ده بيهاجمني — لازم أدافع.' },
      participantPrompt: 'تخيّل الموقف — إيه أول حاجة بتحصل جوّاك؟'
    },

    /* ---------- الجزء ٣ ---------- */
    p3_diagnostic: {
      id: 'p3_diagnostic', part: 4, block: 'الجزء ٣ · شخّص نفسك',
      kind: 'interaction-diagnostic',
      title: 'التشخيص الحيّ',
      headline: 'دلوقتي تعرف نفسك بدقة',
      sub: 'اثنا عشر سؤال — اصدق مع نفسك عشان النتيجة تبقى بتاعتك.',
      interaction: { type: 'diagnostic', saveKey: 'diagnostic' },
      participantPrompt: 'جاوب على موبايلك.'
    },

    p3_results: {
      id: 'p3_results', part: 4, block: 'الجزء ٣ · شخّص نفسك',
      kind: 'visual-typedist',
      title: 'مرآة غرفة القادة',
      headline: 'مرآة غرفة القادة',
      sub: 'مفيش نوع أحسن ونوع أوحش. النوع وصف لمكان فجوتك — مش حكم عليك.',
      participantPrompt: 'دي بطاقتك. اقراها بهدوء.'
    },

    p3_vitality_belonging: {
      id: 'p3_vitality_belonging', part: 4, block: 'الجزء ٣ · شخّص نفسك',
      kind: 'visual-axes',
      title: 'المحاور الثلاثة',
      headline: 'ورا النوع فيه محور — والمحور بيحدّد طاقتك رايحة فين',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    /* ---------- الجزء ٤ ---------- */
    p4_inner_theatre: {
      id: 'p4_inner_theatre', part: 5, block: 'الجزء ٤ · الطبقة الأعمق',
      kind: 'visual-iceberg',
      title: 'المسرح الداخلي',
      headline: 'المحور المدفون بيشوّه المحور الرئيسي نفسه',
      sub: 'النجاح مبيغيّرش السكربت — بيدّيله مسرح أكبر وإضاءة أقوى.',
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    p4_shadow: {
      id: 'p4_shadow', part: 5, block: 'الجزء ٤ · الطبقة الأعمق',
      kind: 'visual-shadow-cloud',
      title: 'اكتشاف الظلّ',
      headline: 'الشركة بتتنفّس من نَفَس مؤسسها',
      cloudTitle: 'ده إنتو. وده شركاتكم.',
      note: 'مش الأرقام اللي بتعكس حالتك — العافية الحقيقية جوّه شركتك هي اللي بتعكس عافيتك إنت.',
      participantPrompt: 'خليك مع الشاشة، في صمت.'
    },

    p4_paths: {
      id: 'p4_paths', part: 5, block: 'الجزء ٤ · الطبقة الأعمق',
      kind: 'visual-paths',
      title: 'لمحة الطريق',
      headline: 'تسعة طرق — كل واحد يخصّ نوعه ومكان فجوته',
      paths: ['السُّكنى', 'الكَفَاف', 'الحِلم', 'اليقظة', 'البيان', 'التجدّد', 'الميزان', 'التأصّل', 'الفيض'],
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    /* ---------- الإغلاق ---------- */
    close_charter: {
      id: 'close_charter', part: 6, block: 'الإغلاق',
      kind: 'interaction-charter',
      title: 'الميثاق الذاتي',
      headline: 'الميثاق — لنفسك',
      sub: 'محدّش هيشوفه. اكتب لنفسك.',
      interaction: {
        type: 'charter', saveKey: 'charter',
        fields: [
          { key: 'touched',   label: 'أكتر لحظة لمستك النهارده.' },
          { key: 'discovered', label: 'الحاجة اللي اكتشفت إنها بتشتغل جوّاك من غير ما تاخد بالك.' },
          { key: 'question',  label: 'السؤال اللي عايز تمشي بيه من الغرفة دي.' }
        ]
      },
      participantPrompt: 'اكتب تلات حاجات — لنفسك.'
    },

    close_doors: {
      id: 'close_doors', part: 6, block: 'الإغلاق',
      kind: 'visual-doors',
      title: 'البابان',
      headline: 'فيه بابان',
      doorA: { tag: 'باب ليك إنت', note: 'تعرف نفسك بدقة، تقفل فجوتك، تمشي في طريقك.' },
      doorB: { tag: 'باب لشركتك', note: 'نرفعها على المنحني بنفس الدقة، ونشتغل عليها كفريق.' },
      participantPrompt: 'وجّه انتباهك للشاشة.'
    },

    close_ayah: {
      id: 'close_ayah', part: 6, block: 'الإغلاق',
      kind: 'visual-ayah',
      title: 'الآية',
      ayah: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
      headline: 'الإنسان مش مخلوق عشان يحترق — مخلوق عشان يتّزن',
      participantPrompt: 'احتفظ بكودك. ده مفتاحك لو حبيت ترجع.'
    }
  };

  /* ====================================================================
     ترتيب المراحل
     ==================================================================== */
  var phaseOrder = [
    'waiting',
    'open_hook', 'open_lastwell',
    'p1_curve_intro', 'p1_exhaustion_vs_burnout', 'p1_three_levels', 'p1_principle', 'p1_raise_self',
    'p2_three_types', 'p2_hidden_commitment', 'p2_trigger_filters', 'p2_criticism',
    'p3_diagnostic', 'p3_results', 'p3_vitality_belonging',
    'p4_inner_theatre', 'p4_shadow', 'p4_paths',
    'close_charter', 'close_doors', 'close_ayah'
  ];

  /* ====================================================================
     التصدير
     ==================================================================== */
  window.SessionData = {
    terms: TERMS,
    types: TYPES,
    spectrum: SPECTRUM,
    levels: LEVELS,
    lastwellOptions: LASTWELL_OPTIONS,
    diagnostic: DIAGNOSTIC,
    scoreDiagnostic: scoreDiagnostic,
    phases: phases,
    phaseOrder: phaseOrder
  };
})();
