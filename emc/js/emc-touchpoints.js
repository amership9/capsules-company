// ═══════════════════════════════════════════════════════
// emc-touchpoints.js — تتبع نقاط التماس (المرحلة 2)
// ═══════════════════════════════════════════════════════

window.EMC = window.EMC || {};

window.EMC.touchpoints = {
  COLLECTION: 'emc_touchpoints',

  async create(data) {
    const blank = this.blankTouchpoint();
    const tp = this._deepMerge(blank, data);
    if (!tp.timestamp) tp.timestamp = new Date().toISOString();
    return await EMC.store.create(this.COLLECTION, tp);
  },

  async get(id) {
    return await EMC.store.get(this.COLLECTION, id);
  },

  async list(filters = {}) {
    let docs = await EMC.store.list(this.COLLECTION);

    if (filters.source) docs = docs.filter(d => d.source === filters.source);
    if (filters.landingPage) docs = docs.filter(d => d.landingPage === filters.landingPage);
    if (filters.type) docs = docs.filter(d => d.type === filters.type);
    if (filters.contactId) docs = docs.filter(d => d.contactId === filters.contactId);
    if (filters.sessionId) docs = docs.filter(d => d.sessionId === filters.sessionId);

    // الأحدث أولاً
    docs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return docs;
  },

  async update(id, updates) {
    return await EMC.store.update(this.COLLECTION, id, updates);
  },

  async remove(id) {
    return await EMC.store.remove(this.COLLECTION, id);
  },

  // ─── ربط touchpoints بـ contact بعد التحويل ───
  async linkToContact(sessionId, contactId) {
    const all = await this.list({ sessionId });
    for (const tp of all) {
      if (!tp.contactId) {
        await this.update(tp.id, { contactId });
      }
    }
    return all.length;
  },

  // ─── إحصاءات المصادر ───
  async statsBySource() {
    const all = await this.list();
    const stats = {};

    all.forEach(tp => {
      const src = tp.source || 'direct';
      if (!stats[src]) {
        stats[src] = {
          source: src,
          visits: 0,
          uniqueSessions: new Set(),
          formSubmits: 0,
          ctaClicks: 0,
          leads: new Set()
        };
      }
      stats[src].visits++;
      if (tp.sessionId) stats[src].uniqueSessions.add(tp.sessionId);
      if (tp.type === 'form_submit') stats[src].formSubmits++;
      if (tp.type === 'cta_click') stats[src].ctaClicks++;
      if (tp.contactId) stats[src].leads.add(tp.contactId);
    });

    return Object.values(stats).map(s => {
      const uniqueVisitors = s.uniqueSessions.size;
      const leadCount = s.leads.size;
      return {
        source: s.source,
        visits: s.visits,
        uniqueVisitors,
        formSubmits: s.formSubmits,
        ctaClicks: s.ctaClicks,
        leads: leadCount,
        conversionRate: uniqueVisitors > 0
          ? Math.round((leadCount / uniqueVisitors) * 100)
          : 0
      };
    });
  },

  // ─── إحصاءات الـ Landing Pages ───
  async statsByLandingPage() {
    const all = await this.list();
    const stats = {};

    Object.keys(EMC.LANDING_PAGES).forEach(slug => {
      stats[slug] = {
        slug,
        title: EMC.LANDING_PAGES[slug].title,
        visits: 0,
        uniqueSessions: new Set(),
        formSubmits: 0,
        leads: new Set(),
        totalTime: 0,
        timeCount: 0
      };
    });

    all.forEach(tp => {
      if (!tp.landingPage || !stats[tp.landingPage]) return;
      const s = stats[tp.landingPage];
      if (tp.type === 'page_view') s.visits++;
      if (tp.sessionId) s.uniqueSessions.add(tp.sessionId);
      if (tp.type === 'form_submit') s.formSubmits++;
      if (tp.contactId) s.leads.add(tp.contactId);
      if (tp.type === 'time_on_page' && tp.data?.seconds) {
        s.totalTime += tp.data.seconds;
        s.timeCount++;
      }
    });

    return Object.values(stats).map(s => {
      const uniqueVisitors = s.uniqueSessions.size;
      const leadCount = s.leads.size;
      return {
        slug: s.slug,
        title: s.title,
        visits: s.visits,
        uniqueVisitors,
        formSubmits: s.formSubmits,
        leads: leadCount,
        avgTimeOnPage: s.timeCount > 0 ? Math.round(s.totalTime / s.timeCount) : 0,
        conversionRate: uniqueVisitors > 0
          ? Math.round((leadCount / uniqueVisitors) * 100)
          : 0
      };
    });
  },

  blankTouchpoint() {
    return {
      sessionId: '',
      contactId: '',
      type: 'page_view',
      landingPage: '',
      source: '',
      utm: {
        source: '',
        medium: '',
        campaign: '',
        content: '',
        term: ''
      },
      referrer: '',
      userAgent: '',
      data: {}
    };
  },

  _deepMerge(target, source) {
    const out = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        out[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }
};
