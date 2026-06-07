// ═══════════════════════════════════════════════════════
// emc-utils.js — helpers مشتركة
// ═══════════════════════════════════════════════════════

window.EMC = window.EMC || {};

// ─── المراحل الـ 14 ───
window.EMC.STAGES = [
  { id: 1, code: 'suspect',       zone: 1, zoneName: 'إدارة العملاء المحتملين', name: 'المراقب',               sub: 'موجود في الجمهور المستهدف، لكن مفيش تفاعل بعد', color: '#94A3B8' },
  { id: 2, code: 'lead',          zone: 1, zoneName: 'إدارة العملاء المحتملين', name: 'المتفاعل',              sub: 'حصلت أول لمسة موثقة', color: '#94A3B8' },
  { id: 3, code: 'identified',    zone: 1, zoneName: 'إدارة العملاء المحتملين', name: 'المُعرَّف',              sub: 'قدّم بياناته طوعاً', color: '#6B8FB5' },
  { id: 4, code: 'mql',           zone: 1, zoneName: 'إدارة العملاء المحتملين', name: 'مؤهل تسويقياً (MQL)',   sub: 'تفاعل مستمر ودرجة اهتمام عالية', color: '#6B8FB5' },
  { id: 5, code: 'sql',           zone: 2, zoneName: 'إدارة الفرص',             name: 'مؤهل للمبيعات (SQL)',    sub: 'تم التحقق إنه يستحق وقت مبيعات', color: '#0B2545' },
  { id: 6, code: 'discovery',     zone: 2, zoneName: 'إدارة الفرص',             name: 'مكالمة استكشاف',         sub: 'مكالمة تشخيصية مع عبدالله', color: '#0B2545' },
  { id: 7, code: 'proposal',      zone: 2, zoneName: 'إدارة الفرص',             name: 'العرض الرسمي',           sub: 'تم تسليم عرض مخصص', color: '#0B2545' },
  { id: 8, code: 'negotiation',   zone: 2, zoneName: 'إدارة الفرص',             name: 'المفاوضة',               sub: 'معالجة الاعتراضات', color: '#13325C' },
  { id: 9, code: 'decision',      zone: 2, zoneName: 'إدارة الفرص',             name: 'القرار',                 sub: 'Won أو Lost', color: '#13325C' },
  { id: 10, code: 'onboarding',   zone: 3, zoneName: 'دورة حياة العميل',        name: 'التهيئة',                sub: 'من الدفع حتى أول جلسة', color: '#C9A961' },
  { id: 11, code: 'participation',zone: 3, zoneName: 'دورة حياة العميل',        name: 'المشاركة الفعلية',       sub: 'داخل الدورة المكثفة', color: '#C9A961' },
  { id: 12, code: 'implementation',zone:3, zoneName: 'دورة حياة العميل',        name: 'التطبيق بعد البرنامج',   sub: 'تنفيذ مكونات EOS الستة', color: '#C9A961' },
  { id: 13, code: 'alumni',       zone: 4, zoneName: 'الانتماء والإحالة',       name: 'الخريج',                 sub: 'جزء من مجتمع الخريجين', color: '#D72638' },
  { id: 14, code: 'advocate',     zone: 4, zoneName: 'الانتماء والإحالة',       name: 'السفير',                 sub: 'يُحيل ويُساهم بنشاط', color: '#D72638' }
];

window.EMC.SOURCES = {
  facebook: 'فيسبوك', linkedin: 'لينكدإن', referral: 'إحالة', webinar: 'ندوة',
  search: 'بحث', direct: 'دخول مباشر', other: 'مصادر أخرى'
};

window.EMC.INDUSTRIES = {
  manufacturing: 'تصنيع', services: 'خدمات', retail: 'تجزئة', tech: 'تكنولوجيا',
  education: 'تعليم', real_estate: 'عقارات', healthcare: 'صحة', agriculture: 'زراعة', other: 'مجالات أخرى'
};

window.EMC.COMPANY_SIZES = {
  '1_10': '1-10 موظف', '11_50': '11-50 موظف', '51_250': '51-250 موظف',
  '251_1000': '251-1000 موظف', '1000_plus': '+1000 موظف'
};

window.EMC.REVENUE_RANGES = {
  under_1m: 'أقل من مليون', '1m_5m': '1-5 مليون', '5m_10m': '5-10 مليون',
  '10m_50m': '10-50 مليون', '50m_plus': '+50 مليون'
};

window.EMC.YEARS_IN_BUSINESS = {
  under_5: 'أقل من 5 سنين', '5_10': '5-10 سنين', '10_20': '10-20 سنة', '20_plus': '+20 سنة'
};

window.EMC.EOS_ROLES = {
  visionary: 'Visionary — المؤسس / صاحب الرؤية',
  integrator: 'Integrator — المسؤول التشغيلي',
  leadership_member: 'عضو فريق قيادة',
  solo_founder: 'مؤسس فردي'
};

window.EMC.EOS_FAMILIARITY = {
  never_heard: 'لم يسمع عن EOS',
  heard_only: 'سمع لكن لم يقرأ',
  read_traction: 'قرأ Traction',
  partial_implementation: 'يطبق جزئياً',
  full_implementation: 'يطبق بالكامل ومحتاج تطوير'
};

window.EMC.COMPANY_STAGES = {
  startup: 'تأسيس',
  early_growth: 'نمو مبكر',
  scaling: 'توسع',
  mature: 'نضج'
};

window.EMC.CEILINGS = {
  operational_chaos: 'فوضى تشغيلية',
  leadership_fracture: 'تفكك فريق القيادة',
  strategic_fog: 'غموض استراتيجي',
  growth_stall: 'تباطؤ نمو',
  leadership_transition: 'انتقال قيادي'
};

window.EMC.EOS_COMPONENTS = {
  vision: 'الرؤية (Vision)',
  people: 'الناس (People)',
  data: 'البيانات (Data)',
  issues: 'القضايا (Issues)',
  process: 'العمليات (Process)',
  traction: 'الإنجاز (Traction)'
};

window.EMC.DECISION_ROLES = {
  sole_decision_maker: 'صانع القرار الوحيد',
  strong_influencer: 'مؤثر قوي',
  needs_buy_in: 'يحتاج موافقة آخرين'
};

window.EMC.BUDGET_CONFIRMED = {
  yes: 'مؤكدة',
  exploring: 'يستكشف',
  no: 'غير متاحة'
};

window.EMC.TIMELINE_URGENCY = {
  immediate: 'فوري',
  '1_3_months': '1-3 شهور',
  '3_6_months': '3-6 شهور',
  '6_plus_months': '+6 شهور'
};

window.EMC.PREFERRED_CHANNELS = {
  whatsapp: 'واتساب', email: 'إيميل', phone: 'مكالمة هاتفية'
};

window.EMC.SEGMENT_STATUS = {
  active: 'نشطة',
  paused: 'مؤجلة',
  exhausted: 'مستنفدة'
};

window.EMC.SEGMENT_PRIORITY = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة'
};

window.EMC.SEGMENT_PRIORITY_COLORS = {
  high: { bg: '#FBE0E2', text: '#A2202D', border: '#F1B6BB' },
  medium: { bg: '#FAEEDB', text: '#8C5915', border: '#ECD3A6' },
  low: { bg: '#EDF2F8', text: '#41648C', border: '#D5DFEC' }
};

window.EMC.COUNTRIES = {
  EG: 'مصر',
  SA: 'السعودية',
  AE: 'الإمارات',
  KW: 'الكويت',
  other: 'دولة أخرى'
};

window.EMC.TOUCHPOINT_TYPES = {
  page_view: 'زيارة صفحة',
  form_submit: 'تعبئة نموذج',
  cta_click: 'نقرة CTA',
  scroll_depth: 'تمرير عميق',
  time_on_page: 'وقت على الصفحة',
  exit_intent: 'نية مغادرة'
};

window.EMC.LANDING_PAGES = {
  'eos-guide': {
    slug: 'eos-guide',
    title: 'دليل السقف القيادي',
    subtitle: 'لماذا يصطدم القائد التنفيذي بسقف لا يراه',
    cta: 'حمّل الدليل (مجاناً)',
    expectedStage: 2,
    formFields: ['fullName', 'email']
  },
  'webinar': {
    slug: 'webinar',
    title: 'ندوة: العقل التشغيلي للقائد',
    subtitle: 'كيف تقود شركة 250 موظف بدون أن تكون مختنقاً',
    cta: 'احجز مقعدك',
    expectedStage: 2,
    formFields: ['fullName', 'email', 'companyName']
  },
  'insight': {
    slug: 'insight',
    title: 'الـ 6 مكونات التي تفصل قائد من قائد',
    subtitle: 'مقال تشخيصي قصير عن EOS Methodology',
    cta: 'اقرأ التحليل الكامل',
    expectedStage: 2,
    formFields: ['fullName', 'email']
  },
  'diagnosis': {
    slug: 'diagnosis',
    title: 'التشخيص الكامل',
    subtitle: 'شركتك في 7 أسئلة — تقرير شخصي بنقاط القوة والضعف',
    cta: 'احصل على التقرير',
    expectedStage: 3,
    formFields: ['fullName', 'email', 'mobile', 'title', 'companyName', 'industry', 'companySize', 'ceilings', 'primaryComponent', 'workHours', 'biggestChallenge']
  }
};

window.EMC.SOURCE_COLORS = {
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  referral: '#C9A961',
  webinar: '#D72638',
  search: '#2E7D5B',
  direct: '#6B7689',
  other: '#94A3B8'
};

// ─── أسباب الترقية التلقائية لـ MQL ───
window.EMC.MQL_PROMOTION_REASONS = {
  high_engagement: '🔥 اشتعال تفاعلي — السكور وصل لـ Hot (60+)',
  strong_pain_signal: '⚠️ إشارة ألم قوية — ساعات عمل عالية + سقوف صريحة',
  repeat_visitor: '🔁 زائر متكرر — رجع 3+ مرات للموقع بعد التشخيص'
};

// ═══════════════════════════════════════════════════════
// [المرحلة 5] قواميس تأهيل المبيعات (SQL)
// ═══════════════════════════════════════════════════════
window.EMC.SQL_VERDICTS = {
  qualified: { label: 'مؤهل — جاهز للاستكشاف', color: '#2E7D5B', bg: '#E1F1E8', border: '#BFE0CD' },
  review:    { label: 'يحتاج مراجعتك',          color: '#8C5915', bg: '#FAEEDB', border: '#ECD3A6' },
  not_ready: { label: 'لسه مش جاهز — رعاية',     color: '#41648C', bg: '#EDF2F8', border: '#D5DFEC' }
};

window.EMC.SQL_BANT_LABELS = {
  authority: 'السلطة (Authority)',
  budget:    'الميزانية (Budget)',
  need:      'الحاجة (Need)',
  timeline:  'التوقيت (Timeline)'
};

window.EMC.SQL_FLAGS = {
  authority_unknown: 'سلطة القرار غير معروفة',
  no_budget:         'لا توجد ميزانية',
  ceiling_unknown:   'السقف غير محدد',
  size_stretch:      'حجم الشركة أكبر من المنطقة المثالية لـ EOS'
};

window.EMC.DISQUALIFY_REASONS = {
  no_budget:          'لا توجد ميزانية كافية',
  not_decision_maker: 'ليس صاحب قرار ولا مؤثر',
  size_mismatch:      'حجم الشركة لا يناسب EOS',
  no_real_need:       'لا يوجد سقف/ألم حقيقي',
  bad_timing:         'التوقيت غير مناسب (مؤجل بعيد)',
  chose_competitor:   'اختار حلاً آخر',
  other:              'سبب آخر'
};

// ─── [المرحلة 5] خيارات استمارة التأهيل (Form B) بصياغة "تجهيز المكالمة" ───
// كل خيار بيتربط بقيمة في طبقة الفرصة (decisionRole / budgetConfirmed / timelineUrgency)
window.EMC.APPLY_AUTHORITY = {
  sole_decision_maker: 'أنا اللي بقرر في النهاية',
  strong_influencer:   'القرار بإيدي بس بستشير شريك/مجلس',
  needs_buy_in:        'محتاج موافقة أطراف تانية'
};

window.EMC.APPLY_READINESS = {
  yes:       'آه، لو ده الحل الصح أنا جاهز أبدأ',
  exploring: 'بستكشف وبجمع معلومات لسه',
  no:        'مهتم بالمعرفة بس مش في وضع التزام دلوقتي'
};

// ═══════════════════════════════════════════════════════
// [المرحلة 6] قواميس مكالمة الاستكشاف (Discovery)
// ═══════════════════════════════════════════════════════

// حالة جدولة المكالمة
window.EMC.DISCOVERY_SCHEDULE_STATUS = {
  not_scheduled: { label: 'لم تُجدوَل بعد', color: '#6B7689', bg: '#EDF2F8', border: '#D5DFEC' },
  scheduled:     { label: 'محجوزة',         color: '#1B3A66', bg: '#E0EBF7', border: '#B5CFE8' },
  completed:     { label: 'تمت المكالمة',    color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD' },
  no_show:       { label: 'لم يحضر',         color: '#A2202D', bg: '#FBE0E2', border: '#F1B6BB' }
};

// طريقة الحجز
window.EMC.DISCOVERY_BOOKING_METHOD = {
  calendly: 'عبر Calendly (حجز ذاتي)',
  manual:   'حجز يدوي (واتساب/هاتف)'
};

// نتيجة المكالمة (Fit assessment)
window.EMC.DISCOVERY_VERDICTS = {
  fit:         { label: '✅ مناسب — للعرض الرسمي',  color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD', nextStage: 7 },
  needs_nurture:{ label: '🟡 يحتاج رعاية',          color: '#8C5915', bg: '#FAEEDB', border: '#ECD3A6', nextStage: null },
  no_fit:      { label: '🔴 غير مناسب',             color: '#A2202D', bg: '#FBE0E2', border: '#F1B6BB', nextStage: null }
};

// محاور الـ Pain Funnel (سكريبت EOS للمكالمة)
window.EMC.DISCOVERY_SCRIPT = [
  {
    phase: 'افتتاح (5 دقائق)',
    color: '#0B2545',
    points: [
      'رحّب واشكره على وقته — وأكّد إن دي مكالمة تشخيص مش بيع.',
      'اطلب إذن: "ممكن أسألك شوية أسئلة عن وضع الشركة عشان أفهم أكتر؟"',
      'اسأل: "إيه اللي خلّاك مهتم بالموضوع ده دلوقتي بالذات؟"'
    ]
  },
  {
    phase: 'Identify — تحديد الألم (15 دقيقة)',
    color: '#D72638',
    points: [
      'إيه أكبر 3 تحديات بتواجهك في إدارة الشركة دلوقتي؟',
      'من المكونات الستة (رؤية/ناس/بيانات/قضايا/عمليات/إنجاز) — أنهي واحد أضعف؟',
      'السقف اللي حاسس بيه — فوضى تشغيلية؟ تفكك قيادة؟ غموض استراتيجي؟',
      'بتشتغل كام ساعة في الأسبوع؟ والقرارات بترجعلك إنت في الآخر؟'
    ]
  },
  {
    phase: 'Discuss — تعميق الألم (15 دقيقة)',
    color: '#B87333',
    points: [
      'التحدي ده مأثّر إزاي على نموك/أرباحك بالأرقام؟',
      'جرّبت تحلّه قبل كده إزاي؟ وإيه اللي حصل؟',
      'لو فضل الوضع زي ما هو سنة كمان — هتكون فين؟',
      'مين تاني في الشركة بيتأثر بالمشكلة دي؟'
    ]
  },
  {
    phase: 'Solve — توجيه الحل (15 دقيقة)',
    color: '#2E7D5B',
    points: [
      'اربط ألمه بمكوّن EOS المحدد اللي هيحلّه.',
      'احكِ قصة عميل مشابه (نفس الحجم/الصناعة) وكيف تحوّل.',
      'وضّح المسار: تشخيص → تطبيق → نتيجة خلال X شهور.',
      'اسأل: "ده بيكلّم وضعك؟ تحب نتكلم في الخطوة الجاية؟"',
      'حدّد الميزانية والتوقيت وصاحب القرار لو لسه مش واضحين.'
    ]
  }
];


// ═══════════════════════════════════════════════════════
// [المرحلة 8] قواميس التفاوض ومعالجة الاعتراضات (Negotiation)
// ═══════════════════════════════════════════════════════

// الحالة العامة للتفاوض على مستوى العميل
window.EMC.NEGOTIATION_STATUS = {
  active:      { label: 'تفاوض نشط',    color: '#1B3A66', bg: '#E0EBF7', border: '#B5CFE8' },
  leaning_yes: { label: 'مايل للموافقة', color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD' },
  leaning_no:  { label: 'مايل للرفض',    color: '#8C5915', bg: '#FAEEDB', border: '#ECD3A6' },
  stalled:     { label: 'راكد',          color: '#A2202D', bg: '#FBE0E2', border: '#F1B6BB' }
};

// حالة كل اعتراض على حدة
window.EMC.OBJECTION_STATUS = {
  open:     { label: 'مفتوح',   color: '#A2202D', bg: '#FBE0E2', border: '#F1B6BB' },
  handled:  { label: 'تم الرد', color: '#8C5915', bg: '#FAEEDB', border: '#ECD3A6' },
  resolved: { label: 'اطمأن ✓', color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD' }
};

// شجرة الاعتراضات + الردود المعدّة مسبقاً (مخصّصة لجمهور C-level وبرنامج EOS)
window.EMC.NEGOTIATION_OBJECTIONS = {
  price_high: {
    label: 'السعر عالي',
    icon: '💰',
    signal: 'غالباً مش اعتراض على المبلغ نفسه — ده اعتراض على القيمة مقابله. شغلك تخلّي تكلفة "عدم الحل" واضحة.',
    responses: [
      'ارجع للسقف اللي شخّصناه: السقف ده بيكلّفك كام في الشهر (وقت ضايع، قرارات متأخرة، فريق مش منتج)؟ قارن ده بسعر البرنامج لمرة واحدة.',
      'أعِد التأطير من "تكلفة" لـ "استثمار": البرنامج بيركّب نظام تشغيلي بيفضل شغّال سنين، مش مصروف بينتهي.',
      'لو السيولة هي العائق مش القيمة، اطرح التقسيط — بيحوّل الاعتراض من "لأ" لـ "إزاي".',
      'احكِ نتيجة عميل مشابه: كام استثمر وكام رجعله (ROI بالأرقام لو متاح).'
    ]
  },
  timing_bad: {
    label: 'التوقيت مش مناسب',
    icon: '⏳',
    signal: 'القائد المشغول هو بالظبط اللي محتاج النظام. "مفيش وقت" نفسها هي العَرَض اللي بنحله.',
    responses: [
      'وضّح إن السقف مش هيستنى — كل شهر تأجيل بيكبّر التكلفة، مش بيقللها.',
      'طمّنه على حجم الالتزام: وقت مركّز محدود أسبوعياً، مش انقلاب في يومه.',
      'اربط بإلحاح حقيقي من تشخيصه (نمو متوقف، فريق بيتفكك) — التوقيت "الأنسب" نادراً بييجي لوحده.',
      'اقترح بداية خفيفة أو تاريخ كوهورت محدد عشان يبقى فيه نقطة التزام واضحة.'
    ]
  },
  need_partner_buyin: {
    label: 'محتاج أناقش مع شريكي / مجلس الإدارة',
    icon: '👥',
    signal: 'دي إشارة شراء مش رفض — معناها بيتخيّل التنفيذ فعلاً. سهّل النقاش الداخلي بدل ما تسيبه يحصل بدونك.',
    responses: [
      'اعرض تنضم لمكالمة قصيرة مع الشريك/المجلس عشان ترد على أسئلتهم مباشرة.',
      'جهّزله ملخص صفحة واحدة (التشخيص + القيمة + الاستثمار) يعرضه عليهم.',
      'اسأل: "إيه السؤال اللي متوقع شريكك يسأله؟" وجهّزوا الإجابة سوا دلوقتي.',
      'حدّد تاريخ متوقع للقرار بعد النقاش عشان متفضلش الفرصة معلّقة.'
    ]
  },
  tried_before: {
    label: 'جربت برامج زي دي قبل كده',
    icon: '🔁',
    signal: 'تجربة سابقة فاشلة = فرصة لتوضيح الفرق الحقيقي. اسأل الأول إيه اللي فشل بالظبط.',
    responses: [
      'اسأل: "جربت إيه بالظبط وإيه اللي حصل؟" — غالباً كانت نظرية بدون متابعة منظمة.',
      'وضّح الفرق: EMC بيوصّل الـ Implementation كاملة بمتابعة (الـ check-ins الخمسة)، مش محتوى ويسيبك.',
      'اذكر فجوة التطبيق: معظم اللي بيقروا Traction ما بيطبقوش — الفرق في نظام المتابعة مش في المعلومة.',
      'اربط بنتيجة خريج طبّق فعلاً (قبل/بعد) عشان يشوف الفرق بين "كورس" و"تطبيق مصحوب".'
    ]
  },
  diy: {
    label: 'ممكن أطبقها بنفسي من الكتاب',
    icon: '📖',
    signal: 'القراءة ≠ التطبيق. الاعتراض الحقيقي إنه بيقلّل قيمة المرافقة والمساءلة.',
    responses: [
      'أكّد إن الكتاب ممتاز — بس فجوة التطبيق هي اللي بتوقف 80% من اللي قرأوه.',
      'القيمة في المساءلة المنظمة: حد بيتابعك أسبوعياً ويصحّح المسار، مش كتاب على الرف.',
      'الوقت: التطبيق المنفرد بياخد شهور بالتجربة والخطأ — المرافقة بتختصر المنحنى.',
      'اعرض إنه يبدأ ويشوف بنفسه قيمة أول جلستين قبل ما يحكم.'
    ]
  },
  need_time_think: {
    label: 'محتاج وقت أفكر',
    icon: '🤔',
    signal: '"محتاج أفكر" دايماً بتخبّي اعتراض حقيقي تحتها (سعر/توقيت/ثقة). شغلك تطلّعه للسطح بلطف.',
    responses: [
      'اسأل بلطف: "أكيد — فيه نقطة معيّنة محتاج تطمن عليها أكتر؟ السعر؟ التوقيت؟ النتيجة؟"',
      'لو طلع اعتراض حقيقي، عالجه بالرد المناسب ليه بدل ما تسيبه يفكر في فراغ.',
      'ذكّره بصلاحية العرض أو تاريخ الكوهورت — إلحاح حقيقي بدون ضغط.',
      'اتفقوا على موعد متابعة محدد بدل "هرجعلك" المفتوحة.'
    ]
  }
};


// ═══════════════════════════════════════════════════════════════════
// [المرحلة 10] قاموس مهام الإعداد (Onboarding)
// ═══════════════════════════════════════════════════════════════════

// أصحاب المهام — المساران
window.EMC.ONBOARDING_OWNERS = {
  admin:  { label: 'مهام عبد الله', short: 'إداري',  color: '#1B3A66', bg: '#E0EBF7', border: '#B5CFE8' },
  client: { label: 'مهام العميل',   short: 'جاهزية', color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD' }
};

// مهام الإعداد — مسارين متوازيين، الترتيب مقصود
window.EMC.ONBOARDING_TASKS = [
  // ── مسار عبد الله (إداري) ──
  { key: 'payment_confirmed', owner: 'admin', icon: '💳', label: 'تأكيد الدفع الكامل', hint: 'اتأكد إن قيمة الكوهورت اتدفعت بالكامل أو حسب الاتفاق.' },
  { key: 'coach_assigned',    owner: 'admin', icon: '🎯', label: 'تحديد المدرب المسؤول', hint: 'حدّد مين هيدرّب ويتابع العميل خلال الكوهورت.' },
  { key: 'added_to_group',    owner: 'admin', icon: '💬', label: 'إضافته لجروب الكوهورت', hint: 'ضيف العميل لقناة التواصل (واتساب/جروب) الخاصة بالكوهورت.' },
  { key: 'welcome_sent',      owner: 'admin', icon: '📦', label: 'إرسال حزمة الترحيب', hint: 'ابعت حزمة الترحيب الرسمية خلال 48 ساعة من الدفع.' },

  // ── مسار العميل (جاهزية) ──
  { key: 'intro_viewed',      owner: 'client', icon: '🎬', label: 'شاهد مادة التعريف', hint: 'العميل اطّلع على مادة التعريف الأساسية قبل أول جلسة.' },
  { key: 'numbers_collected', owner: 'client', icon: '📊', label: 'جمع أرقام شركته', hint: 'العميل جمّع الأرقام الأساسية: الإيراد، عدد الموظفين، أكبر تحديات.' },
  { key: 'team_identified',   owner: 'client', icon: '👥', label: 'حدّد فريق القيادة المشارك', hint: 'العميل حدّد مين من فريقه هيشارك في الرحلة.' },
  { key: 'session_confirmed', owner: 'client', icon: '📅', label: 'أكّد موعد أول جلسة', hint: 'العميل أكّد حضوره وموعد أول يوم في الكوهورت.' }
];


// ═══════════════════════════════════════════════════════════════════
// [المرحلة 11] قاموس المشاركة والحضور (Participation)
// ═══════════════════════════════════════════════════════════════════

// عدد أيام الكوهورت (جمعة وسبت × 3 أسابيع)
window.EMC.COHORT_DAYS = 6;

// حالة الحضور لكل يوم
window.EMC.ATTENDANCE_STATUS = {
  present: { label: 'حاضر',   icon: '✓', color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD', weight: 1 },
  late:    { label: 'متأخر',  icon: '◑', color: '#8C5915', bg: '#FAEEDB', border: '#ECD3A6', weight: 0.5 },
  absent:  { label: 'غايب',   icon: '✕', color: '#A2202D', bg: '#FBE0E2', border: '#F1B6BB', weight: 0 }
};

// مؤشر التفاعل لكل يوم (اختياري)
window.EMC.ENGAGEMENT_LEVEL = {
  active:    { label: 'نشط',     icon: '🔥', color: '#1E5C42', bg: '#E1F1E8', border: '#BFE0CD' },
  normal:    { label: 'عادي',    icon: '•',  color: '#1B3A66', bg: '#E0EBF7', border: '#B5CFE8' },
  withdrawn: { label: 'منسحب',   icon: '⚠',  color: '#A2202D', bg: '#FBE0E2', border: '#F1B6BB' }
};


// ─── Helpers ───
window.EMC.utils = {
  getStage(id) {
    return window.EMC.STAGES.find(s => s.id === id);
  },

  initials(name) {
    if (!name) return '؟';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  },

  avatarColor(name) {
    if (!name) return '#0B2545';
    const palette = ['#0B2545', '#13325C', '#1B3A66', '#C9A961', '#A36F1E', '#2E7D5B', '#1F5E47', '#A2202D'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  },

  formatDate(iso, opts = {}) {
    if (!iso) return '—';
    const d = new Date(iso);
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    if (opts.relative) {
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      if (diffHr < 24) return `منذ ${diffHr} ساعة`;
      if (diffDay < 7) return `منذ ${diffDay} يوم`;
    }
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  formatCurrency(value, currency = 'EGP') {
    if (value === 0 || value == null) return '—';
    const formatted = new Intl.NumberFormat('ar-EG').format(value);
    return `${formatted} جم`;
  },

  formatNumber(value) {
    if (value == null) return '—';
    return new Intl.NumberFormat('ar-EG').format(value);
  },

  temperatureFromScore(score) {
    if (score >= 81) return 'burning';
    if (score >= 61) return 'hot';
    if (score >= 31) return 'warm';
    return 'cold';
  },

  temperatureLabel(t) {
    return { cold: 'بارد', warm: 'دافئ', hot: 'حار', burning: 'مشتعل' }[t] || '—';
  },

  // ─── [المرحلة 6] إعدادات النظام (لينك Calendly وغيره) ───
  // بتتخزّن في collection اسمه emc_settings، document واحد ثابت id='global'
  async getSettings() {
    try {
      const s = await EMC.store.get('emc_settings', 'global');
      return s || {};
    } catch (e) {
      return {};
    }
  },

  async saveSetting(key, value) {
    try {
      const existing = await EMC.store.get('emc_settings', 'global');
      if (existing) {
        await EMC.store.update('emc_settings', 'global', { [key]: value });
      } else {
        await EMC.store.create('emc_settings', { [key]: value }, 'global');
      }
      return true;
    } catch (e) {
      console.warn('saveSetting failed:', e?.message);
      return false;
    }
  },

  // ─── حساب الـ Engagement Score ───
  calculateEngagementScore(touchpoints, events) {
    if (!Array.isArray(touchpoints)) touchpoints = [];
    if (!Array.isArray(events)) events = [];

    let score = 0;
    const breakdown = {};

    // (1) Sessions فريدة بـ 2 نقاط (max 20)
    const uniqueSessions = new Set();
    touchpoints.forEach(tp => {
      if (tp.type === 'page_view' && tp.sessionId) uniqueSessions.add(tp.sessionId);
    });
    const sessionPoints = Math.min(uniqueSessions.size * 2, 20);
    if (sessionPoints) breakdown.sessions = sessionPoints;
    score += sessionPoints;

    // (2) Form submits بـ 15 نقطة (max 30)
    const formCount = touchpoints.filter(tp => tp.type === 'form_submit').length;
    const formPoints = Math.min(formCount * 15, 30);
    if (formPoints) breakdown.forms = formPoints;
    score += formPoints;

    // (3) CTA clicks بـ 3 نقاط (max 15)
    const ctaCount = touchpoints.filter(tp => tp.type === 'cta_click').length;
    const ctaPoints = Math.min(ctaCount * 3, 15);
    if (ctaPoints) breakdown.ctas = ctaPoints;
    score += ctaPoints;

    // (4) Scroll depth 75%+ = 5 نقاط
    const deepScroll = touchpoints.some(tp =>
      tp.type === 'scroll_depth' && tp.data?.depth >= 75
    );
    if (deepScroll) { breakdown.deepScroll = 5; score += 5; }

    // (5) Time on page
    const timeRecords = touchpoints.filter(tp =>
      tp.type === 'time_on_page' && typeof tp.data?.seconds === 'number'
    );
    if (timeRecords.length) {
      const avg = timeRecords.reduce((s, t) => s + t.data.seconds, 0) / timeRecords.length;
      if (avg >= 60) { breakdown.timeOnPage = 5; score += 5; }
      else if (avg >= 30) { breakdown.timeOnPage = 2; score += 2; }
    }

    // (6) Stage progress
    const stageUps = events.filter(e =>
      e.type === 'stage_change' && e.data?.to > (e.data?.from || 0)
    ).length;
    const stagePoints = Math.min(stageUps * 10, 25);
    if (stagePoints) breakdown.stageProgress = stagePoints;
    score += stagePoints;

    score = Math.min(score, 100);
    const temperature = window.EMC.utils.temperatureFromScore(score);

    return { score, temperature, breakdown };
  },

  // ═══════════════════════════════════════════════════════
  // [المرحلة 5] حساب درجة التأهيل للمبيعات (SQL) — BANT + EOS Fit
  // دالة نقية بدون أي side-effects: بتاخد contact وترجّع تقييم.
  // الحكم النهائي قرار عبدالله — دي بترتّب وتقترح بس.
  // ═══════════════════════════════════════════════════════
  calculateQualificationScore(contact) {
    if (!contact) return { score: 0, verdict: 'not_ready', breakdown: {}, flags: [], sizeFit: 'unknown' };

    const opp = contact.opportunity || {};
    const eos = contact.eosProfile || {};
    const identity = contact.identity || {};
    const breakdown = {};
    const flags = [];
    let score = 0;

    // (A) Authority — صاحب القرار (max 30)
    const authorityMap = { sole_decision_maker: 30, strong_influencer: 18, needs_buy_in: 8 };
    breakdown.authority = authorityMap[opp.decisionRole] || 0;
    score += breakdown.authority;
    if (!opp.decisionRole) flags.push('authority_unknown');

    // (B) Budget — الميزانية (max 25)
    const budgetMap = { yes: 25, exploring: 12, no: 0 };
    breakdown.budget = budgetMap[opp.budgetConfirmed] || 0;
    score += breakdown.budget;
    if (opp.budgetConfirmed === 'no') flags.push('no_budget');

    // (C) Need — الحاجة (max 25): سقف + نقاط ألم + أهداف
    let needPts = 0;
    if (eos.ceiling) needPts += 15;
    if ((eos.pains || []).length > 0) needPts += 5;
    if (eos.goals12Months) needPts += 5;
    breakdown.need = needPts;
    score += needPts;
    if (!eos.ceiling) flags.push('ceiling_unknown');

    // (D) Timeline — التوقيت (max 20)
    const timelineMap = { immediate: 20, '1_3_months': 15, '3_6_months': 8, '6_plus_months': 3 };
    breakdown.timeline = timelineMap[opp.timelineUrgency] || 0;
    score += breakdown.timeline;

    score = Math.min(score, 100);

    // ─── ملاءمة حجم الشركة لـ EOS (10-250 = المنطقة المثالية) ───
    let sizeFit = 'unknown';
    const sz = identity.companySize;
    if (sz === '11_50' || sz === '51_250') sizeFit = 'ideal';
    else if (sz === '1_10' || sz === '251_1000') sizeFit = 'acceptable';
    else if (sz === '1000_plus') sizeFit = 'stretch';
    if (sizeFit === 'stretch') flags.push('size_stretch');

    // ─── الحكم ───
    let verdict;
    const hardBlocker = (opp.budgetConfirmed === 'no');
    if (hardBlocker) verdict = 'not_ready';
    else if (score >= 70) verdict = 'qualified';
    else if (score >= 45) verdict = 'review';
    else verdict = 'not_ready';

    return { score, verdict, breakdown, flags, sizeFit };
  },

  // ═══════════════════════════════════════════════════════
  // فحص شروط الترقية التلقائية لـ MQL (المرحلة 4)
  // ═══════════════════════════════════════════════════════
  // يُستدعى تلقائياً من refreshContactScore بعد كل تحديث للسكور
  // يفحص 3 شروط — يكفي تحقق واحد منهم لترقية الـ contact
  //
  // الشروط:
  // (1) high_engagement: السكور ≥ 60 (Hot temperature)
  // (2) strong_pain_signal: ساعات شغل ≥ 65 + سقف صريح في eosProfile
  // (3) repeat_visitor: 3+ زيارات للموقع بعد تاريخ آخر submission
  //
  // ─── شروط المنع ───
  // لا ترقّي contact إذا:
  // - مرحلته الحالية ليست 3 (Identified بالظبط)
  // - status = 'unsubscribed' أو 'blacklisted'
  //
  async checkMQLPromotion(contactId) {
    if (!contactId) return { promoted: false, reason: 'no_id' };

    try {
      const contact = await EMC.contacts.get(contactId);
      if (!contact) return { promoted: false, reason: 'not_found' };

      // ─── فلتر: فقط Identified (المرحلة 3) ───
      if (contact.currentStage !== 3) {
        return { promoted: false, reason: 'wrong_stage', currentStage: contact.currentStage };
      }

      // ─── فلتر: status مسموح به ───
      if (contact.status && ['unsubscribed', 'blacklisted'].includes(contact.status)) {
        return { promoted: false, reason: 'inactive_status', status: contact.status };
      }

      // ─── فحص الشروط ───
      const reasons = [];

      // (1) High engagement
      const score = contact.engagement?.engagementScore || 0;
      if (score >= 60) {
        reasons.push({
          code: 'high_engagement',
          detail: `السكور وصل ${score} (≥ 60)`
        });
      }

      // (2) Strong pain signal
      const workHours = contact.engagement?.workHoursPerWeek || 0;
      const hasCeiling = !!(contact.eosProfile?.ceiling);
      if (workHours >= 65 && hasCeiling) {
        reasons.push({
          code: 'strong_pain_signal',
          detail: `يشتغل ${workHours} ساعة/أسبوع + سقف صريح: ${EMC.CEILINGS[contact.eosProfile.ceiling] || contact.eosProfile.ceiling}`
        });
      }

      // (3) Repeat visitor (3+ page_views بعد تاريخ التحوّل لـ Identified)
      try {
        const touchpoints = await EMC.touchpoints.list({ contactId });
        const stage3Entry = (contact.stageHistory || []).find(s => s.stage === 3);
        if (stage3Entry) {
          const stage3Time = new Date(stage3Entry.enteredAt).getTime();
          const postIdentifiedViews = touchpoints.filter(tp =>
            tp.type === 'page_view' &&
            new Date(tp.timestamp).getTime() > stage3Time
          ).length;
          if (postIdentifiedViews >= 3) {
            reasons.push({
              code: 'repeat_visitor',
              detail: `${postIdentifiedViews} زيارات بعد التشخيص`
            });
          }
        }
      } catch (e) {
        // لو touchpoints مش متاحة لأي سبب، نتجاهل ده الشرط
      }

      // ─── لو مفيش شرط متحقق، ما نرقّيش ───
      if (reasons.length === 0) {
        return { promoted: false, reason: 'no_criteria_met', score, workHours };
      }

      // ─── الترقية ───
      await EMC.contacts.moveToStage(
        contactId,
        4,
        'ترقية تلقائية: ' + reasons.map(r => r.detail).join(' · ')
      );

      // سجّل event مفصّل
      if (EMC.events?.log) {
        await EMC.events.log({
          contactId,
          type: 'stage_change',
          stage: 4,
          channel: 'system',
          data: {
            from: 3,
            to: 4,
            automated: true,
            reasons: reasons.map(r => r.code),
            details: reasons,
            triggerScore: score,
            triggerWorkHours: workHours
          },
          performedBy: 'auto-promotion-engine'
        });
      }

      console.log(`✅ Auto-promoted ${contact.identity?.fullName || contactId} → MQL`);
      console.log('   Reasons:', reasons.map(r => r.code).join(', '));

      return {
        promoted: true,
        contactId,
        contactName: contact.identity?.fullName || '',
        reasons,
        newStage: 4
      };

    } catch (e) {
      console.warn('checkMQLPromotion failed:', e?.message);
      return { promoted: false, reason: 'error', error: e?.message };
    }
  },

  // ─── ريفريش السكور لـ contact واحد ───
  // ⭐ بعد تحديث السكور، بنستدعي checkMQLPromotion تلقائياً
  async refreshContactScore(contactId) {
    if (!contactId) return null;
    try {
      const contact = await EMC.contacts.get(contactId);
      if (!contact) return null;
      const touchpoints = await EMC.touchpoints.list({ contactId });
      const events = await EMC.events.listForContact(contactId);
      const { score, temperature, breakdown } = EMC.utils.calculateEngagementScore(touchpoints, events);

      await EMC.contacts.update(contactId, {
        engagement: {
          ...(contact.engagement || {}),
          engagementScore: score,
          temperature,
          lastEngagedAt: new Date().toISOString(),
          scoreBreakdown: breakdown
        }
      });

      // ⭐ فحص ترقية MQL تلقائياً
      const promotionResult = await window.EMC.utils.checkMQLPromotion(contactId);

      return {
        score,
        temperature,
        breakdown,
        promoted: promotionResult.promoted,
        promotionReasons: promotionResult.reasons || []
      };
    } catch (e) {
      console.warn('refreshContactScore failed:', e?.message);
      return null;
    }
  },

  // ─── ريفريش جماعي لكل الـ contacts (لاختبار MQL bulk) ───
  // يُستدعى يدوياً من Console: await EMC.utils.refreshAllScores()
  async refreshAllScores() {
    const all = await EMC.contacts.list();
    const results = { processed: 0, promoted: 0, promotions: [] };
    for (const c of all) {
      const result = await window.EMC.utils.refreshContactScore(c.id);
      results.processed++;
      if (result?.promoted) {
        results.promoted++;
        results.promotions.push({
          name: c.identity?.fullName,
          reasons: result.promotionReasons?.map(r => r.code).join(', ')
        });
      }
    }
    console.log(`✅ Refreshed ${results.processed} contacts. Promoted ${results.promoted} to MQL.`);
    if (results.promotions.length) {
      console.table(results.promotions);
    }
    return results;
  },

  toast(msg, type = 'default') {
    let el = document.getElementById('emc-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'emc-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.className = 'toast';
    if (type !== 'default') el.classList.add(type);
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2400);
  },

  logoSVG(size = 42) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="16" y="18" width="32" height="6" rx="1.5" fill="#FFFFFF"/>
        <rect x="14" y="32" width="36" height="5" rx="1" fill="#D72638"/>
        <line x1="18" y1="24" x2="14" y2="50"/>
        <line x1="46" y1="24" x2="50" y2="50"/>
        <line x1="14" y1="50" x2="50" y2="24"/>
        <line x1="50" y1="50" x2="18" y2="24" opacity="0"/>
        <line x1="12" y1="50" x2="22" y2="50"/>
        <line x1="42" y1="50" x2="52" y2="50"/>
        <line x1="22" y1="20" x2="42" y2="20" stroke="#D72638" stroke-width="2.5"/>
      </g>
    </svg>`;
  }
};
