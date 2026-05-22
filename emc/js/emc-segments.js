// ═══════════════════════════════════════════════════════
// emc-segments.js — CRUD للشرائح المستهدفة (المرحلة 1)
// ═══════════════════════════════════════════════════════

window.EMC = window.EMC || {};

window.EMC.segments = {
  COLLECTION: 'emc_segments',

  // ─── إنشاء شريحة ───
  async create(data) {
    const blank = this.blankSegment();
    const segment = this._deepMerge(blank, data);
    segment.createdAt = new Date().toISOString();
    segment.updatedAt = segment.createdAt;
    return await EMC.store.create(this.COLLECTION, segment);
  },

  // ─── جلب واحدة ───
  async get(id) {
    return await EMC.store.get(this.COLLECTION, id);
  },

  // ─── جلب الكل ───
  async list(filters = {}) {
    let docs = await EMC.store.list(this.COLLECTION);

    if (filters.status) docs = docs.filter(d => d.status === filters.status);
    if (filters.priority) docs = docs.filter(d => d.priority === filters.priority);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      docs = docs.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      );
    }

    // ترتيب حسب priority (high أولاً) ثم الأحدث
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    docs.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99;
      const pb = priorityOrder[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return docs;
  },

  // ─── تحديث ───
  async update(id, updates) {
    return await EMC.store.update(this.COLLECTION, id, updates);
  },

  // ─── حذف ───
  async remove(id) {
    // قبل الحذف، نزيل الـ segmentId من أي contacts مرتبطين
    const contacts = await EMC.contacts.list();
    const linked = contacts.filter(c => c.context?.segmentId === id);
    for (const c of linked) {
      await EMC.contacts.update(c.id, {
        context: { ...c.context, segmentId: '' }
      });
    }
    return await EMC.store.remove(this.COLLECTION, id);
  },

  // ─── تحديث counter ───
  async incrementCounter(id, field, delta = 1) {
    const seg = await this.get(id);
    if (!seg) throw new Error('Segment not found');
    const newVal = Math.max(0, (seg.counters?.[field] || 0) + delta);
    await this.update(id, {
      counters: { ...seg.counters, [field]: newVal }
    });
    return newVal;
  },

  // ─── جلب الـ contacts المرتبطين بشريحة ───
  async getLinkedContacts(segmentId) {
    const all = await EMC.contacts.list();
    return all.filter(c => c.context?.segmentId === segmentId);
  },

  // ─── إحصاءات إجمالية ───
  async stats() {
    const all = await this.list();
    const byStatus = { active: 0, paused: 0, exhausted: 0 };
    const byPriority = { high: 0, medium: 0, low: 0 };
    let totalEstimated = 0;
    let totalTargeted = 0;
    let totalEngaged = 0;
    let totalConverted = 0;

    all.forEach(s => {
      if (s.status && byStatus[s.status] !== undefined) byStatus[s.status]++;
      if (s.priority && byPriority[s.priority] !== undefined) byPriority[s.priority]++;
      totalEstimated += s.estimatedSize || 0;
      totalTargeted += s.counters?.targeted || 0;
      totalEngaged += s.counters?.engaged || 0;
      totalConverted += s.counters?.converted || 0;
    });

    return {
      total: all.length,
      byStatus,
      byPriority,
      totalEstimated,
      totalTargeted,
      totalEngaged,
      totalConverted
    };
  },

  // ─── شريحة فارغة ───
  blankSegment() {
    return {
      name: '',
      description: '',
      criteria: {
        industries: [],
        companySizes: [],
        revenueRanges: [],
        yearsInBusiness: [],
        cities: [],
        countries: ['EG'],
        eosFamiliarity: [],
        ceilings: []
      },
      estimatedSize: 0,
      priority: 'medium',
      acquisitionStrategy: '',
      status: 'active',
      notes: '',
      counters: {
        targeted: 0,
        engaged: 0,
        converted: 0
      }
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
