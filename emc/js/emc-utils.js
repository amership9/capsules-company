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
