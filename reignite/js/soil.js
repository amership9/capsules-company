/* ============================================================================
   Reignite — التربة (قراءة الأنظمة على المحاور التلاتة)
   soil.js — بنك بنود الطبقة التشغيلية + محرّك بروفايل التربة + كروسووك النوع

   الفكرة الحاكمة:
   - مقياس الاحتراق (questions.js) بيقرا "الخاصية الناشئة" — الروح، الفجوة، النوع.
   - التربة (soil.js) بتقرا "المكوّنات اللي الخاصية بتنشأ منها" — الأنظمة والظروف.
   - التربة بتفسّر الروح: بروفايل الركايز التلاتة بيأكّد نوع الاحتراق أو يكشف تعارض.

   البنية:
   - كل بند = رافعة قابلة للتحريك بقرار (مرتب/مدير/تدريب/أدوات)، مش حالة شعورية.
   - مقروء على المحاور التلاتة: T=تماسك (أمان)، H=حيوية (تجديد)، N=انتماء (علاقة/تقدير).
   - مقياس Likert خماسي + "مش منطبق". القيمة العالية دايماً = تغذية أعلى = صحة أعلى
     (متّسقة مع مسطرة الاحتراق 0–100).
   - بنود معكوسة (reverse) لكسر الموافقة الآلية. بنود allowNA لمن لم يجرّبها.

   حقول البند:
   - id          : معرّف ثابت (S1, S2, ...)
   - pillar      : 'T' | 'H' | 'N'
   - pillarName  : اسم المحور للعرض
   - section     : رقم القسم الفرعي (مرجعي للتقرير)
   - sectionName : اسم القسم الفرعي
   - type        : 'likert' (كل البنود)
   - intro       : تمهيد قصير يهيّئ الذهن
   - text        : نص البند (جملة-فكرة-واحدة، عامية)
   - reverse     : true لو الصياغة عكسية (الموافقة = سوء التغذية)
   - allowNA     : true لو يُسمح بـ"مش منطبق"

   ملاحظة تحويل: الإجابة تُخزَّن بفهرس 0–4 (لا أوافق بشدة → أوافق بشدة)،
   و5 = "مش منطبق" (تتحوّل null وتُستبعد من المتوسط). انظر محرّك الحساب (الجزء 3).
============================================================================ */

/* أقسام المستجيب — قائمة منسدلة. أقسام كابسولز الفعلية + مخرج عام. */
export const DEPARTMENTS = [
  'التعليم (Education)',
  'العمليات (Operations)',
  'التسويق والمبيعات (Marketing & Sales)',
  'الموارد البشرية (HR)',
  'ضمان الجودة (QA)',
  'أخرى / مش محدّد'
];

/* فئة المستجيب — نفس منطق A/B/C في مقياس الاحتراق (للتوطين والسرية) */
export const SOIL_RESPONDENT_CATEGORIES = {
  A: 'قيادة عليا',
  B: 'إدارة وسطى',
  C: 'قاعدة'
};

/* مقياس Likert الموحّد. الفهارس 0–4 = درجات، 5 = مش منطبق.
   درجة الأساس = الفهرس × 25 (0/25/50/75/100). تُعكَس في البنود reverse.
   حدّ السرية: لا يُعرض تفصيل لأي تقطيع (قسم/فئة) أقل من MIN_DISCLOSURE. */
export const SOIL_SCALE = {
  options: [
    { label: 'لا أوافق بشدة', base: 0 },
    { label: 'لا أوافق', base: 25 },
    { label: 'محايد', base: 50 },
    { label: 'أوافق', base: 75 },
    { label: 'أوافق بشدة', base: 100 }
  ],
  na: { label: 'مش منطبق عليّا', value: null }
};
export const MIN_DISCLOSURE = 5;

/* شاشة التصنيف قبل البنود — لا تُحسب، توسم كل الإجابات */
export const SOIL_INTRO_FIELDS = {
  category: {
    id: 'S0_cat',
    intro: 'قبل ما نبدأ، حاجتين بسيطتين تساعدونا نقرا الصورة صح — ومش بيظهروا باسمك.',
    text: 'موقعك في الشركة أقرب لإيه؟',
    options: [
      { label: 'مؤسس / شريك / قيادة عليا', tag: 'A' },
      { label: 'مدير / رئيس قسم / صف تاني', tag: 'B' },
      { label: 'موظف / منفّذ / عضو فريق', tag: 'C' }
    ]
  },
  department: {
    id: 'S0_dept',
    text: 'بتشتغل في أنهي إدارة؟',
    options: DEPARTMENTS
  }
};

export const SOIL_ITEMS = [
  /* ============================================================================
     الركيزة الأولى — تغذية التماسك (ماكينة الاستقرار شغّالة؟)
     بتقرا: هل النظام بيدّي الناس أرضية صلبة — وضوح، أدوات، أمان مادي؟
  ============================================================================ */

  /* --- 1.1 وضوح الأنظمة والأدوار --- */
  {
    id: 'S1', pillar: 'T', pillarName: 'التماسك', section: '1.1', sectionName: 'وضوح الأنظمة والأدوار',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'نبدأ من الأرضية — وضوح اللي إنت واقف عليه.',
    text: 'الهيكل التنظيمي والأدوار في الشركة واضحة ليّا، وعارف مين بيعمل إيه.'
  },
  {
    id: 'S2', pillar: 'T', pillarName: 'التماسك', section: '1.1', sectionName: 'وضوح الأنظمة والأدوار',
    type: 'likert', reverse: true, allowNA: false,
    intro: 'وعن إجراءات الشغل نفسها.',
    text: 'إجراءات العمل عندنا بتعطّلني أكتر ما بتساعدني أنجز.'
  },
  {
    id: 'S3', pillar: 'T', pillarName: 'التماسك', section: '1.1', sectionName: 'وضوح الأنظمة والأدوار',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ولو احتجت ترجع لقاعدة أو سياسة.',
    text: 'بقدر أوصل بسهولة للسياسات والإجراءات الخاصة بشغلي وقت ما أحتاجها.'
  },

  /* --- 1.2 التواصل وإدارة التغيير والثقة في القيادة --- */
  {
    id: 'S4', pillar: 'T', pillarName: 'التماسك', section: '1.2', sectionName: 'التواصل وإدارة التغيير',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'صوتك بيوصل ولا بيضيع؟',
    text: 'فيه قنوات تواصل حقيقية أقدر أعبّر بيها عن رأيي بوضوح.'
  },
  {
    id: 'S5', pillar: 'T', pillarName: 'التماسك', section: '1.2', sectionName: 'التواصل وإدارة التغيير',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ولما الشركة بتغيّر حاجة.',
    text: 'التغييرات اللي بتحصل في الشركة بتتدار بشكل منظّم، مش بتيجي فوضى.'
  },
  {
    id: 'S6', pillar: 'T', pillarName: 'التماسك', section: '1.2', sectionName: 'التواصل وإدارة التغيير',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ووضوح وجهة الشركة.',
    text: 'الإدارة العليا بتدّينا صورة واضحة عن أهداف الشركة واتجاهها.'
  },
  {
    id: 'S7', pillar: 'T', pillarName: 'التماسك', section: '1.2', sectionName: 'التواصل وإدارة التغيير',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وثقتك في اللي ماسكين الدفّة.',
    text: 'بثق في كفاءة القيادة العليا وقدرتها توجّه الشركة في الاتجاه الصح.'
  },

  /* --- 1.3 الأدوات والبيئة --- */
  {
    id: 'S8', pillar: 'T', pillarName: 'التماسك', section: '1.3', sectionName: 'الأدوات والبيئة',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'العُدّة اللي بتشتغل بيها.',
    text: 'عندي الأدوات والتكنولوجيا والمكان المناسب اللي يخلّيني أأدّي شغلي على أكمل وجه.'
  },
  {
    id: 'S9', pillar: 'T', pillarName: 'التماسك', section: '1.3', sectionName: 'الأدوات والبيئة',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'وأمان مكان شغلك.',
    text: 'إجراءات الأمن والسلامة في مكان عملي مطبّقة فعلاً وبتتراعى.'
  },

  /* --- 1.4 الاستقرار المادي --- */
  {
    id: 'S10', pillar: 'T', pillarName: 'التماسك', section: '1.4', sectionName: 'الاستقرار المادي',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'دلوقتي الجزء اللي بيمسّ الأمان المباشر — المقابل المادي.',
    text: 'فاهم إزاي مرتبي بيتحدّد وإزاي بيترتبط بأدائي.'
  },
  {
    id: 'S11', pillar: 'T', pillarName: 'التماسك', section: '1.4', sectionName: 'الاستقرار المادي',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وعدالته بالنسبة لمجهودك.',
    text: 'بشكل عام مرتبي عادل مقارنةً بحجم مسؤولياتي ومستوى أدائي.'
  },
  {
    id: 'S12', pillar: 'T', pillarName: 'التماسك', section: '1.4', sectionName: 'الاستقرار المادي',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ورضاك عنه في المجمل.',
    text: 'بشكل عام، أنا راضي عن المرتب اللي بتقاضاه.'
  },
  {
    id: 'S13', pillar: 'T', pillarName: 'التماسك', section: '1.4', sectionName: 'الاستقرار المادي',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'ومقارنةً بالسوق برّه.',
    text: 'مقارنةً بناس في وظايف زيّي في شركات شبه شركتي، حاسس إن مرتبي كويس.'
  },
  {
    id: 'S14', pillar: 'T', pillarName: 'التماسك', section: '1.4', sectionName: 'الاستقرار المادي',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'وغير المرتب — المزايا.',
    text: 'أنا واعي بالمزايا والخدمات اللي الشركة بتقدّمها (طبية وغيرها) وراضي عنها بشكل عام.'
  },

  /* --- 1.5 مرونة ترتيبات العمل --- */
  {
    id: 'S15', pillar: 'T', pillarName: 'التماسك', section: '1.5', sectionName: 'مرونة ترتيبات العمل',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'وآخر حاجة في الأرضية — مرونة الترتيبات.',
    text: 'راضي عن ترتيبات العمل المرنة المتاحة (زي العمل عن بُعد أو ساعات مرنة) بالشكل اللي بيناسب شغلي.'
  },
  /* ============================================================================
     الركيزة الثانية — تغذية الحيوية (النظام بيجدّد الناس ولا بيخنقهم؟)
     بتقرا: هل النظام بيدّي نمو وتحدّي وتجديد، ولا بيحوّل الناس لمنفّذين بيكرّروا؟
     هذه الركيزة هي الكاشف التشغيلي الأول لـ "مجوّعة".
  ============================================================================ */

  /* --- 2.1 تحدّي الشغل والنمو --- */
  {
    id: 'S16', pillar: 'H', pillarName: 'الحيوية', section: '2.1', sectionName: 'تحدّي الشغل والنمو',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'دلوقتي نبصّ للنار — اللي بتجدّد الناس. نبدأ من الشغل نفسه.',
    text: 'مهام شغلي فيها تحدّي وتجارب بتخلّيني أكتسب مهارات وإمكانيات جديدة.'
  },
  {
    id: 'S17', pillar: 'H', pillarName: 'الحيوية', section: '2.1', sectionName: 'تحدّي الشغل والنمو',
    type: 'likert', reverse: true, allowNA: false,
    intro: 'ولا بقى تكرار؟',
    text: 'شغلي بقى تكرار وروتين، نادراً ما فيه حاجة جديدة بتعلّمني.'
  },

  /* --- 2.2 فرص التطوير والتدريب --- */
  {
    id: 'S18', pillar: 'H', pillarName: 'الحيوية', section: '2.2', sectionName: 'فرص التطوير والتدريب',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'وفرص إنك تكبر.',
    text: 'بحصل على فرص تطوير حقيقية — خبرة عملية أو تدريب — بتحسّن مهاراتي وجودة شغلي.'
  },
  {
    id: 'S19', pillar: 'H', pillarName: 'الحيوية', section: '2.2', sectionName: 'فرص التطوير والتدريب',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'والقيادة واقفة ورا التطوير ده ولا لأ.',
    text: 'القيادة العليا بتدعم تطوير الموظفين فعلاً وبتوفّر الموارد اللازمة لده.'
  },
  {
    id: 'S20', pillar: 'H', pillarName: 'الحيوية', section: '2.2', sectionName: 'فرص التطوير والتدريب',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ووضوح طريق نموّك.',
    text: 'بتلقّى تقييم منتظم لشغلي، وعلى أساسه بتتحدّد لي أهداف تطويرية واحتياجات تدريب واضحة.'
  },

  /* --- 2.3 دعم النظام للمبادرة والتجديد --- */
  {
    id: 'S21', pillar: 'H', pillarName: 'الحيوية', section: '2.3', sectionName: 'دعم المبادرة والتجديد',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'والأفكار الجديدة — بتلاقي مكان؟',
    text: 'الشركة بتقدّر الابتكار وبتاخد بالأفكار وطرق العمل الجديدة فعلاً.'
  },
  {
    id: 'S22', pillar: 'H', pillarName: 'الحيوية', section: '2.3', sectionName: 'دعم المبادرة والتجديد',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وإنت شخصياً مسموحلك تجرّب؟',
    text: 'بيتديلي صلاحية ومساحة إني أفكّر وأشتغل بطرق مبتكرة عشان أنجز شغلي.'
  },
  {
    id: 'S23', pillar: 'H', pillarName: 'الحيوية', section: '2.3', sectionName: 'دعم المبادرة والتجديد',
    type: 'likert', reverse: true, allowNA: false,
    intro: 'ولا أيّ محاولة تجديد بتموت في مهدها؟',
    text: 'لو حد جه بفكرة جديدة، الأغلب إنها بتتقابل بـ"إحنا ماشيين كده وخلاص".'
  },

  /* ============================================================================
     الركيزة الثالثة — تغذية الانتماء (النظام بيبني انتماء ولا بيعامل الناس كمنفّذين؟)
     بتقرا: هل النظام بيبني علاقة وتقدير وعدل، ولا بيخلّي الناس تروس؟
     هذه الركيزة هي الكاشف التشغيلي الأول لـ "مكبوتة".
  ============================================================================ */

  /* --- 3.1 المدير المباشر (ازدواج مكسور — كل سلوك بند مستقل) --- */
  {
    id: 'S24', pillar: 'N', pillarName: 'الانتماء', section: '3.1', sectionName: 'المدير المباشر',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'دلوقتي أقرب علاقة بتشكّل إحساسك اليومي — مديرك المباشر. كل سؤال عن سلوك واحد بس.',
    text: 'مديري بيعاملني باحترام، وبيتعامل بعدل ومساواة مع الكل.'
  },
  {
    id: 'S25', pillar: 'N', pillarName: 'الانتماء', section: '3.1', sectionName: 'المدير المباشر',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'وكلمته.',
    text: 'مديري بيوفي بوعوده والتزاماته.'
  },
  {
    id: 'S26', pillar: 'N', pillarName: 'الانتماء', section: '3.1', sectionName: 'المدير المباشر',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'ووضوح اللي مطلوب منك.',
    text: 'مديري بيوضّح لي أهدافي وأولوياتي بشكل كافي.'
  },
  {
    id: 'S27', pillar: 'N', pillarName: 'الانتماء', section: '3.1', sectionName: 'المدير المباشر',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'والتقييم اللي بيوصلك.',
    text: 'مديري بيدّيني رأيه في أدائي بانتظام وبطريقة بنّاءة، وبيناقشني في طرق التحسين.'
  },
  {
    id: 'S28', pillar: 'N', pillarName: 'الانتماء', section: '3.1', sectionName: 'المدير المباشر',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'ومراعاته لحياتك.',
    text: 'مديري بيدعمني وبيقدّم حلول مرنة تساعدني أوازن بين شغلي واحتياجاتي الشخصية.'
  },
  {
    id: 'S29', pillar: 'N', pillarName: 'الانتماء', section: '3.1', sectionName: 'المدير المباشر',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'واحتفاله باللي بتعمله.',
    text: 'مديري بيقدّر ويحتفل بإنجازات الفريق المهمة وبيخلّي الشغل ممتع ومُكافئ.'
  },

  /* --- 3.2 العلاقات والمناخ --- */
  {
    id: 'S30', pillar: 'N', pillarName: 'الانتماء', section: '3.2', sectionName: 'العلاقات والمناخ',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وجوّ فريقك.',
    text: 'في فريقي جو إيجابي بيشجّع على الشغل بفاعلية وانبساط.'
  },
  {
    id: 'S31', pillar: 'N', pillarName: 'الانتماء', section: '3.2', sectionName: 'العلاقات والمناخ',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وتواصلك مع زمايلك.',
    text: 'بتواصل مع زمايلي بسهولة، والمعلومات والآراء بتتبادل بوضوح وشفافية.'
  },
  {
    id: 'S32', pillar: 'N', pillarName: 'الانتماء', section: '3.2', sectionName: 'العلاقات والمناخ',
    type: 'likert', reverse: false, allowNA: true,
    intro: 'واستقبال الناس الجداد.',
    text: 'الشركة بتعمل شغل كويس في مساعدة الموظفين الجداد إنهم يتأقلموا.'
  },

  /* --- 3.3 التقدير والعدالة --- */
  {
    id: 'S33', pillar: 'N', pillarName: 'الانتماء', section: '3.3', sectionName: 'التقدير والعدالة',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ولمّا حد بيتميّز.',
    text: 'الشركة بتلتزم بتقدير ومكافأة أصحاب الأداء المتميّز.'
  },
  {
    id: 'S34', pillar: 'N', pillarName: 'الانتماء', section: '3.3', sectionName: 'التقدير والعدالة',
    type: 'likert', reverse: true, allowNA: false,
    intro: 'ووضوح طريق الترقي.',
    text: 'معايير الترقّي عندنا غامضة وغير معلنة بوضوح للكل.'
  },
  {
    id: 'S35', pillar: 'N', pillarName: 'الانتماء', section: '3.3', sectionName: 'التقدير والعدالة',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وعدالته.',
    text: 'الترقيات في الشركة بتتبني على تقييم واضح وموضوعي لكفاءة الموظف وإنجازاته.'
  },

  /* ============================================================================
     ترمومتر النتيجة — منفصل عن الركايز (نتيجة سلوكية، مش رافعة)
     بيدّي توطين الخطر (النزيف الجاي) على مستوى القسم، بلا تلويث منطق الرافعات.
     pillar='R' عشان يتفصل في الحساب ومايدخلش متوسطات المحاور.
  ============================================================================ */
  {
    id: 'S36', pillar: 'R', pillarName: 'ترمومتر', section: '4.1', sectionName: 'نية البقاء والترشيح',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'وآخر سؤالين — مش عن النظام، عن إحساسك الشخصي ناحية الشركة.',
    text: 'أنا ناوي أكمّل مع الشركة على المدى الطويل، وحاسس إنها المكان اللي يستاهل أفضل فيه.'
  },
  {
    id: 'S37', pillar: 'R', pillarName: 'ترمومتر', section: '4.1', sectionName: 'نية البقاء والترشيح',
    type: 'likert', reverse: false, allowNA: false,
    intro: 'ولو حد بتحبّه سألك.',
    text: 'هرشّح صاحب ليّا إنه يشتغل في الشركة دي.'
  }
];

/* ميتاداتا المحاور — للعرض في التقرير وشاشة الأدمن */
export const SOIL_PILLARS = [
  { key: 'T', name: 'التماسك', q: 'النظام بيدّي أرضية صلبة؟', desc: 'وضوح الأنظمة، التواصل، الأدوات، الاستقرار المادي — كل اللي بيدّي إحساس الأمان.' },
  { key: 'H', name: 'الحيوية', q: 'النظام بيجدّد ولا بيخنق؟', desc: 'تحدّي الشغل، التطوير، دعم المبادرة — كل اللي بيغذّي النار. الكاشف الأول لـ"مجوّعة".' },
  { key: 'N', name: 'الانتماء', q: 'النظام بيبني علاقة وتقدير؟', desc: 'المدير المباشر، العلاقات والمناخ، التقدير والعدالة. الكاشف الأول لـ"مكبوتة".' }
];

/* خريطة سريعة id → بند */
export const SOIL_MAP = SOIL_ITEMS.reduce((m, it) => { m[it.id] = it; return m; }, {});

/* ============================================================================
   محرّك التربة — الحساب والتجميع والكروسووك
============================================================================ */

const _avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const _round = (v) => v == null ? null : Math.round(v);

/* تحويل إجابة بند واحدة لدرجة صحة 0–100 (أو null لو "مش منطبق") */
function itemHealth(item, ansIdx) {
  if (ansIdx == null || ansIdx === 5) return null;        // 5 = مش منطبق
  const base = SOIL_SCALE.options[ansIdx]?.base;
  if (base == null) return null;
  return item.reverse ? (100 - base) : base;              // العكسي يُقلب
}

/* ============================================================================
   حساب مستجيب واحد
   answers: { S1: idx, S2: idx, ... , S0_cat: 'A'|'B'|'C', S0_dept: '...' }
============================================================================ */
export function computeSoil(answers) {
  const a = answers || {};
  const category = a.S0_cat || null;
  const department = a.S0_dept || 'أخرى / مش محدّد';

  /* متوسط كل محور (يستبعد null تلقائياً) */
  const pillarVals = { T: [], H: [], N: [] };
  const sectionVals = {};   // sectionName → []
  SOIL_ITEMS.forEach(it => {
    if (it.pillar === 'R') return;                         // الترمومتر منفصل
    const h = itemHealth(it, a[it.id]);
    if (h == null) return;
    pillarVals[it.pillar].push(h);
    (sectionVals[it.sectionName] = sectionVals[it.sectionName] || []).push(h);
  });

  const pillars = {
    T: _round(_avg(pillarVals.T)),
    H: _round(_avg(pillarVals.H)),
    N: _round(_avg(pillarVals.N))
  };
  const pillarNames = { T: 'التماسك', H: 'الحيوية', N: 'الانتماء' };

  /* الأقسام الفرعية بدرجاتها (للتقرير التفصيلي) */
  const sections = Object.keys(sectionVals).map(name => ({
    name, score: _round(_avg(sectionVals[name]))
  }));

  /* أضعف محور + أضعف قسم (نقطة بداية الرافعات) */
  const ranked = Object.keys(pillars)
    .filter(k => pillars[k] != null)
    .sort((x, y) => pillars[x] - pillars[y]);
  const weakestPillar = ranked[0] || null;
  const weakestPillarName = weakestPillar ? pillarNames[weakestPillar] : '—';
  const weakestSection = sections.filter(s => s.score != null)
    .sort((x, y) => x.score - y.score)[0] || null;

  /* الترمومتر (نتيجة سلوكية منفصلة) */
  const rArr = SOIL_ITEMS.filter(it => it.pillar === 'R')
    .map(it => itemHealth(it, a[it.id])).filter(v => v != null);
  const retention = rArr.length ? _round(_avg(rArr)) : null;
  const retentionBand = retention == null ? '—'
    : retention >= 70 ? 'مستقر' : retention >= 45 ? 'مهتزّ' : 'نزيف محتمل';

  /* بصمة التربة — توقيع كل نوع احتراق على مستوى الفرد (تُجمَّع للأدمن) */
  const soilFingerprint = fingerprintOf(pillars);

  return {
    category, department,
    pillars, pillarNames, sections,
    weakestPillar, weakestPillarName, weakestSection,
    retention, retentionBand,
    soilFingerprint
  };
}

/* ============================================================================
   بصمة التربة → ميل النوع
   - مجوّعة (G): التماسك متغذّي والحيوية متجوّعة (T عالي، H منخفض، الفارق واضح)
   - مكبوتة (K): الانتماء هو الأوطى بفارق، والباقي مقبول (غياب بنيوي)
   - محترقة (M): انهيار عام مع الانتماء منخفض (الضغط يأكل عبر الركايز، والمدير بوابته)
============================================================================ */
function fingerprintOf(p) {
  const { T, H, N } = p;
  if (T == null || H == null || N == null) return { lean: null, note: 'بيانات ناقصة' };

  const mean = (T + H + N) / 3;
  const gapTH = T - H;                                    // موجب كبير = ماكينة تماسك بتجوّع الحيوية
  const nBelow = mean - N;                                // كم الانتماء تحت المتوسط

  // محترقة: كل الركايز منخفضة (تربة منهَكة عبر اللوح) والانتماء من بين الأوطى
  if (mean < 45 && N <= T && N <= H + 5) {
    return { lean: 'M', note: 'تربة منهَكة عبر الركايز والانتماء من الأوطى — توقيع المحترقة (الضغط يأكل النظام كله، والمدير بوابة الخوف).' };
  }
  // مجوّعة: تماسك واضح أعلى من حيوية متجوّعة
  if (gapTH >= 20 && H <= 55) {
    return { lean: 'G', note: 'التماسك متغذّي والحيوية متجوّعة — توقيع المجوّعة (الماكينة شغّالة، والنار مقطوع عنها الغذاء).' };
  }
  // مكبوتة: الانتماء الأوطى بفارق واضح والباقي مقبول
  if (N === Math.min(T, H, N) && nBelow >= 15 && Math.min(T, H) >= 50) {
    return { lean: 'K', note: 'الانتماء رفيع بنيوياً والباقي مقبول — توقيع المكبوتة (البُعد الإنساني مبُنيش من الأساس).' };
  }
  return { lean: null, note: 'بصمة غير حاسمة — لا ميل تشغيلي واضح لنوع بعينه.' };
}

/* ============================================================================
   التجميع على مستوى الدفعة (للأدمن) + الكروسووك مع نوع الاحتراق
   soilResponses: مصفوفة { results(computeSoil), ... }
   burnoutType  : نوع الاحتراق الغالب من aggregate() في scoring.js ('M'|'G'|'K'|null)
============================================================================ */
export function aggregateSoil(soilResponses, burnoutType = null) {
  if (!soilResponses || !soilResponses.length) return null;

  const meanPillar = (key) => {
    const arr = soilResponses.map(r => r.results?.pillars?.[key]).filter(v => v != null);
    return arr.length ? _round(_avg(arr)) : null;
  };
  const pillars = { T: meanPillar('T'), H: meanPillar('H'), N: meanPillar('N') };
  const pillarNames = { T: 'التماسك', H: 'الحيوية', N: 'الانتماء' };

  /* أضعف محور على مستوى الدفعة */
  const rankedP = Object.keys(pillars).filter(k => pillars[k] != null)
    .sort((x, y) => pillars[x] - pillars[y]);
  const weakestPillar = rankedP[0] || null;

  /* تجميع الأقسام الفرعية */
  const secAcc = {};
  soilResponses.forEach(r => (r.results?.sections || []).forEach(s => {
    if (s.score == null) return;
    (secAcc[s.name] = secAcc[s.name] || []).push(s.score);
  }));
  const sections = Object.keys(secAcc).map(name => ({
    name, score: _round(_avg(secAcc[name])), n: secAcc[name].length
  })).sort((x, y) => x.score - y.score);

  /* الترمومتر المجمّع */
  const retArr = soilResponses.map(r => r.results?.retention).filter(v => v != null);
  const retention = retArr.length ? _round(_avg(retArr)) : null;
  const retentionBand = retention == null ? '—'
    : retention >= 70 ? 'مستقر' : retention >= 45 ? 'مهتزّ' : 'نزيف محتمل';

  /* التوطين بالقسم — بحدّ السرية MIN_DISCLOSURE */
  const byDept = {};
  soilResponses.forEach(r => {
    const d = r.results?.department || 'أخرى / مش محدّد';
    (byDept[d] = byDept[d] || []).push(r);
  });
  const departments = Object.keys(byDept).map(name => {
    const grp = byDept[name];
    if (grp.length < MIN_DISCLOSURE) {
      return { name, n: grp.length, disclosed: false };
    }
    const pm = (key) => {
      const arr = grp.map(r => r.results?.pillars?.[key]).filter(v => v != null);
      return arr.length ? _round(_avg(arr)) : null;
    };
    const dp = { T: pm('T'), H: pm('H'), N: pm('N') };
    const weakest = Object.keys(dp).filter(k => dp[k] != null)
      .sort((x, y) => dp[x] - dp[y])[0] || null;
    return { name, n: grp.length, disclosed: true, pillars: dp, weakestPillar: weakest };
  });

  /* التوطين بالفئة A/B/C — بحدّ السرية */
  const byCat = { A: [], B: [], C: [] };
  soilResponses.forEach(r => { const c = r.results?.category; if (byCat[c]) byCat[c].push(r); });
  const catProfile = {};
  ['A', 'B', 'C'].forEach(c => {
    const grp = byCat[c];
    if (grp.length < MIN_DISCLOSURE) { catProfile[c] = { n: grp.length, disclosed: false }; return; }
    const pm = (key) => { const arr = grp.map(r => r.results?.pillars?.[key]).filter(v => v != null); return arr.length ? _round(_avg(arr)) : null; };
    catProfile[c] = { n: grp.length, disclosed: true, pillars: { T: pm('T'), H: pm('H'), N: pm('N') } };
  });

  /* الكروسووك: هل بصمة التربة تؤكّد نوع الاحتراق أم تعارضه؟ */
  const soilLean = fingerprintOf(pillars).lean;
  const crosswalk = crosswalkVerdict(burnoutType, soilLean, pillars, pillarNames);

  return {
    count: soilResponses.length,
    pillars, pillarNames, weakestPillar,
    weakestPillarName: weakestPillar ? pillarNames[weakestPillar] : '—',
    sections, retention, retentionBand,
    departments, catProfile,
    soilLean, crosswalk
  };
}

/* ============================================================================
   حُكم الكروسووك — يربط نوع الاحتراق ببصمة التربة
   verdict: 'confirm' (تأكيد) | 'conflict' (تعارض-اكتشاف) | 'soft' (ميل بلا حسم)
============================================================================ */
function crosswalkVerdict(burnoutType, soilLean, p, pillarNames) {
  const typeName = { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' };

  if (!burnoutType) {
    return { verdict: 'soft', soilLean,
      text: soilLean
        ? `التربة بتميل لـ«${typeName[soilLean]}» تشغيلياً. لسه مفيش نوع احتراق محسوب للمقارنة — حمّل دفعة الاحتراق عشان نطابق.`
        : 'بصمة التربة غير حاسمة، ولسه مفيش نوع احتراق محسوب للمقارنة.' };
  }

  if (soilLean && soilLean === burnoutType) {
    const why = soilLean === 'G'
      ? `ركيزة الحيوية (${p.H}) متجوّعة بينما التماسك (${p.T}) متغذّي — السبب التشغيلي اللي تحت "${typeName.G}".`
      : soilLean === 'K'
      ? `ركيزة الانتماء (${p.N}) رفيعة بنيوياً بينما الباقي مقبول — السبب التشغيلي اللي تحت "${typeName.K}".`
      : `التربة منهَكة عبر الركايز والانتماء (${p.N}) من الأوطى — السبب التشغيلي اللي تحت "${typeName.M}".`;
    return { verdict: 'confirm', soilLean,
      text: `تأكيد متقاطع: نوع الاحتراق «${typeName[burnoutType]}» والتربة بتأكّده. ${why}` };
  }

  if (soilLean && soilLean !== burnoutType) {
    return { verdict: 'conflict', soilLean,
      text: `تعارض كاشف (اكتشاف، مش خطأ): الأعراض بتقول «${typeName[burnoutType]}» بينما التربة بتقول «${typeName[soilLean]}». ` +
            `يعني الروح بتعاني من مصدر، والأنظمة بتأكّد مصدر تاني. ده بيفتح سؤال: هل فيه مصدر بيجوّع الحيوية غير الأنظمة، أو نظام بيكبت الانتماء بطريقة مش ظاهرة في الأعراض؟ قِف هنا واقرا القسمين سوا.` };
  }

  return { verdict: 'soft', soilLean: null,
    text: `نوع الاحتراق «${typeName[burnoutType]}»، وبصمة التربة غير حاسمة — مفيش تأكيد ولا تعارض تشغيلي واضح. اقرا الأقسام الفرعية لأضعف محور يدوياً.` };
}
