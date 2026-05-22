// ═══════════════════════════════════════════════════════
// emc-templates.js — قوالب الرسائل (P3)
// Display-only في P4: لا إرسال آلي، فقط نسخ يدوي
// ═══════════════════════════════════════════════════════

window.EMC = window.EMC || {};

window.EMC.templates = {
  COLLECTION: 'emc_templates',

  async create(data) {
    const blank = this.blankTemplate();
    const tpl = this._deepMerge(blank, data);
    tpl.createdAt = new Date().toISOString();
    tpl.updatedAt = tpl.createdAt;
    return await EMC.store.create(this.COLLECTION, tpl);
  },

  async get(id) {
    return await EMC.store.get(this.COLLECTION, id);
  },

  async list(filters = {}) {
    let docs = await EMC.store.list(this.COLLECTION);

    if (filters.channel) docs = docs.filter(d => d.channel === filters.channel);
    if (filters.stage) docs = docs.filter(d => d.stage === filters.stage);
    if (filters.sequence) docs = docs.filter(d => d.sequence === filters.sequence);
    if (filters.active === true) docs = docs.filter(d => d.isActive);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      docs = docs.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.subject || '').toLowerCase().includes(q) ||
        (d.body || '').toLowerCase().includes(q)
      );
    }

    docs.sort((a, b) => {
      if ((a.sequence || '') !== (b.sequence || '')) {
        return (a.sequence || '').localeCompare(b.sequence || '');
      }
      return (a.dayOffset || 0) - (b.dayOffset || 0);
    });

    return docs;
  },

  async update(id, updates) {
    return await EMC.store.update(this.COLLECTION, id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async remove(id) {
    return await EMC.store.remove(this.COLLECTION, id);
  },

  // ─── render template مع متغيرات contact ───
  render(templateBody, contact) {
    if (!templateBody) return '';
    if (!contact) return templateBody;
    const id = contact.identity || {};
    const map = {
      '{{firstName}}': id.firstName || (id.fullName || '').split(/\s+/)[0] || 'صديقي',
      '{{fullName}}': id.fullName || '',
      '{{companyName}}': id.companyName || 'شركتك',
      '{{title}}': id.title || '',
      '{{email}}': contact.channels?.primaryEmail || '',
      '{{mobile}}': contact.channels?.mobile || ''
    };
    let out = templateBody;
    Object.keys(map).forEach(k => {
      out = out.split(k).join(map[k]);
    });
    return out;
  },

  async stats() {
    const all = await this.list();
    const byChannel = { email: 0, whatsapp: 0 };
    const bySequence = {};
    let active = 0;
    all.forEach(t => {
      if (t.channel && byChannel[t.channel] !== undefined) byChannel[t.channel]++;
      const seq = t.sequence || 'standalone';
      bySequence[seq] = (bySequence[seq] || 0) + 1;
      if (t.isActive) active++;
    });
    return { total: all.length, active, byChannel, bySequence };
  },

  blankTemplate() {
    return {
      name: '',
      channel: 'email',
      stage: 3,
      sequence: 'standalone',
      dayOffset: 0,
      subject: '',
      body: '',
      language: 'ar',
      isActive: true,
      tags: []
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

window.EMC.TEMPLATE_SEQUENCES = {
  welcome: 'سلسلة الترحيب',
  follow_up: 'متابعة',
  nurture: 'رعاية',
  standalone: 'مستقل'
};

window.EMC.TEMPLATE_CHANNELS = {
  email: 'إيميل',
  whatsapp: 'واتساب'
};
