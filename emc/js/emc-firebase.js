// ═══════════════════════════════════════════════════════
// emc-firebase.js — Storage & Auth Bootstrap
//
// مهم: النظام مصمم بحيث التحويل من LocalStorage لـ Firestore
// يتم بتغيير سطرين فقط (STORAGE_MODE + AUTH_MODE). راجع
// /emc/MIGRATION.md للخطوات الكاملة.
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── إعدادات التشغيل ───
  // غيّر هاتين القيمتين لـ 'firestore' و 'firebase' عند الإنتاج
  const STORAGE_MODE = 'firestore';   // 'local' | 'firestore'
  const AUTH_MODE    = 'local';   // 'local' | 'firebase'

  // ─── Firebase Config ───
  const firebaseConfig = {
    apiKey: "AIzaSyDj0bV5gsyRbqpxzW0Zd9wjYmq53-Xdj3w",
    authDomain: "fouad-perspective.firebaseapp.com",
    projectId: "fouad-perspective",
    storageBucket: "fouad-perspective.firebasestorage.app",
    messagingSenderId: "1068763865336",
    appId: "1:1068763865336:web:b791abcd22d536aedd5b0d",
    measurementId: "G-RY1FYVB3Q9"
  };

  // ─── تهيئة Firebase (لو الـ SDK محمّل) ───
  let firebaseReady = false;
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      firebaseReady = true;
    } catch (err) {
      console.warn('⚠️ Firebase initialization failed:', err);
    }
  }

  // ═══════════════════════════════════════════════════════
  // STORAGE ADAPTERS
  // ═══════════════════════════════════════════════════════

  // ─── LocalStorage Adapter ───
  const STORAGE_PREFIX = 'emc_v1_';
  const LocalStore = {
    _key(coll) { return STORAGE_PREFIX + coll; },
    _read(coll) {
      try { return JSON.parse(localStorage.getItem(this._key(coll)) || '{}'); }
      catch (e) { return {}; }
    },
    _write(coll, data) {
      localStorage.setItem(this._key(coll), JSON.stringify(data));
    },
    _now() { return new Date().toISOString(); },
    _genId() {
      return 'c_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-4);
    },

    async create(coll, data, id) {
      const docs = this._read(coll);
      const docId = id || this._genId();
      docs[docId] = { ...data, id: docId, createdAt: this._now(), updatedAt: this._now() };
      this._write(coll, docs);
      return docId;
    },
    async update(coll, id, data) {
      const docs = this._read(coll);
      if (!docs[id]) throw new Error('Document not found: ' + id);
      docs[id] = { ...docs[id], ...data, updatedAt: this._now() };
      this._write(coll, docs);
      return true;
    },
    async get(coll, id) {
      const docs = this._read(coll);
      return docs[id] || null;
    },
    async list(coll) {
      const docs = this._read(coll);
      return Object.values(docs);
    },
    async remove(coll, id) {
      const docs = this._read(coll);
      delete docs[id];
      this._write(coll, docs);
      return true;
    },
    async clear(coll) {
      this._write(coll, {});
    }
  };

  // ─── Firestore Adapter (جاهز للتفعيل) ───
  const FirestoreAdapter = {
    _db: null,

    _init() {
      if (!this._db) {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
          throw new Error('Firebase Firestore SDK not loaded. Add the SDK scripts to your HTML before activating firestore mode.');
        }
        this._db = firebase.firestore();
      }
      return this._db;
    },

    _genId() {
      return this._init().collection('_ids').doc().id;
    },

    _normalizeDoc(doc) {
      if (!doc.exists) return null;
      const data = doc.data();
      const normalized = { id: doc.id };
      for (const key in data) {
        const val = data[key];
        if (val && typeof val.toDate === 'function') {
          normalized[key] = val.toDate().toISOString();
        } else {
          normalized[key] = val;
        }
      }
      return normalized;
    },

    _sanitize(data) {
      if (data === null || data === undefined) return null;
      if (Array.isArray(data)) return data.map(v => this._sanitize(v));
      if (typeof data !== 'object' || data instanceof Date) return data;
      const clean = {};
      for (const key in data) {
        if (data[key] === undefined) continue;
        clean[key] = this._sanitize(data[key]);
      }
      return clean;
    },

    async create(coll, data, id) {
      const db = this._init();
      const docId = id || this._genId();
      const ref = db.collection(coll).doc(docId);
      const ts = firebase.firestore.FieldValue.serverTimestamp();
      await ref.set({
        ...this._sanitize(data),
        id: docId,
        createdAt: ts,
        updatedAt: ts
      });
      return docId;
    },

    async update(coll, id, data) {
      const db = this._init();
      await db.collection(coll).doc(id).update({
        ...this._sanitize(data),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    },

    async get(coll, id) {
      const db = this._init();
      const doc = await db.collection(coll).doc(id).get();
      return this._normalizeDoc(doc);
    },

    async list(coll) {
      const db = this._init();
      const snapshot = await db.collection(coll).get();
      const docs = [];
      snapshot.forEach(doc => docs.push(this._normalizeDoc(doc)));
      return docs;
    },

    async remove(coll, id) {
      const db = this._init();
      await db.collection(coll).doc(id).delete();
      return true;
    },

    async clear(coll) {
      const db = this._init();
      const snapshot = await db.collection(coll).get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    }
  };

  // ═══════════════════════════════════════════════════════
  // AUTH ADAPTERS
  // ═══════════════════════════════════════════════════════

  // ─── Local Auth (للتطوير والديمو) ───
  const LocalAuth = {
    SESSION_KEY: 'emc_v1_session',

    async signIn(email, password) {
      const validUsers = {
        'abdullah@emc.academy': { name: 'عبدالله عامر', role: 'super_admin', initials: 'ع.ع' },
        'admin@emc.academy':    { name: 'مساعد الأكاديمية', role: 'admin', initials: 'م.أ' }
      };
      const user = validUsers[email.toLowerCase()];
      if (user && password === 'demo2026') {
        const session = { email, ...user, signedInAt: new Date().toISOString() };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
      }
      throw new Error('بيانات الدخول غير صحيحة');
    },

    async signOut() {
      localStorage.removeItem(this.SESSION_KEY);
      window.location.href = './login.html';
    },

    getSession() {
      try {
        return JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null');
      } catch (e) { return null; }
    },

    // مهم: ترجع Promise للتوافق مع FirebaseAuth.protect()
    async protect() {
      const session = this.getSession();
      if (!session) {
        window.location.href = './login.html';
        return null;
      }
      return session;
    }
  };

  // ─── Firebase Auth (جاهز للتفعيل) ───
  const FirebaseAuth = {
    _adminProfile: null,

    async signIn(email, password) {
      if (!firebaseReady) throw new Error('Firebase not initialized');
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const adminDoc = await firebase.firestore()
        .collection('emc_admins').doc(cred.user.uid).get();

      if (!adminDoc.exists || !adminDoc.data().isActive) {
        await firebase.auth().signOut();
        throw new Error('هذا الحساب غير مصرّح له بالدخول لنظام EMC');
      }

      this._adminProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        ...adminDoc.data()
      };
      return this._adminProfile;
    },

    async signOut() {
      await firebase.auth().signOut();
      this._adminProfile = null;
      window.location.href = './login.html';
    },

    getSession() {
      return this._adminProfile;
    },

    protect() {
      return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged(async (user) => {
          if (!user) {
            window.location.href = './login.html';
            return resolve(null);
          }
          try {
            const doc = await firebase.firestore()
              .collection('emc_admins').doc(user.uid).get();
            if (!doc.exists || !doc.data().isActive) {
              await firebase.auth().signOut();
              window.location.href = './login.html';
              return resolve(null);
            }
            this._adminProfile = { uid: user.uid, email: user.email, ...doc.data() };
            resolve(this._adminProfile);
          } catch (err) {
            console.error('Auth verification failed:', err);
            window.location.href = './login.html';
            resolve(null);
          }
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════════
  // ACTIVATION — اختيار الـ Adapter حسب الـ MODE
  // ═══════════════════════════════════════════════════════

  window.EMC = window.EMC || {};
  window.EMC.firebaseReady = firebaseReady;
  window.EMC.config = {
    storageMode: STORAGE_MODE,
    authMode: AUTH_MODE,
    namespace: 'emc_'
  };

  // Storage selection
  if (STORAGE_MODE === 'firestore' && firebaseReady) {
    window.EMC.store = FirestoreAdapter;
    console.log('🔥 EMC: Using Firestore storage');
  } else {
    if (STORAGE_MODE === 'firestore' && !firebaseReady) {
      console.warn('⚠️ EMC: STORAGE_MODE=firestore but Firebase SDK not loaded. Falling back to LocalStorage.');
    }
    window.EMC.store = LocalStore;
    console.log('📦 EMC: Using LocalStorage (development mode)');
  }

  // Auth selection
  if (AUTH_MODE === 'firebase' && firebaseReady) {
    window.EMC.auth = FirebaseAuth;
    console.log('🔐 EMC: Using Firebase Auth');
  } else {
    if (AUTH_MODE === 'firebase' && !firebaseReady) {
      console.warn('⚠️ EMC: AUTH_MODE=firebase but Firebase SDK not loaded. Falling back to LocalAuth.');
    }
    window.EMC.auth = LocalAuth;
    console.log('🔓 EMC: Using Local Auth (demo mode)');
  }

  // ═══════════════════════════════════════════════════════
  // SEED DATA — يستخدم الـ active store تلقائياً
  // ═══════════════════════════════════════════════════════

  window.EMC.seedIfEmpty = async function () {
    const existingContacts = await window.EMC.store.list('emc_contacts');
    const existingSegments = await window.EMC.store.list('emc_segments');

    // Skip only if BOTH already seeded
    if (existingContacts.length > 0 && existingSegments.length > 0) return;

    // ─── Segments-only top-up (لما الـ contacts موجودة من إصدار قديم بدون segments) ───
    if (existingContacts.length > 0 && existingSegments.length === 0) {
      const sampleSegmentsOnly = [
        {
          name: 'صناعيين القاهرة الكبرى',
          description: 'مؤسسو ومديرو شركات التصنيع في القاهرة وحجم 50-250 موظف، فيهم تفكك تشغيلي وما طبقوش EOS',
          criteria: { industries: ['manufacturing'], companySizes: ['51_250'], revenueRanges: ['10m_50m', '5m_10m'], yearsInBusiness: ['10_20', '20_plus'], cities: ['القاهرة', 'الجيزة', '6 أكتوبر'], countries: ['EG'], eosFamiliarity: ['never_heard', 'heard_only'], ceilings: ['operational_chaos', 'leadership_fracture'] },
          estimatedSize: 480, priority: 'high', acquisitionStrategy: 'LinkedIn Sales Navigator + غرفة الصناعات + ندوة شهرية + إحالات من خريجين',
          status: 'active', notes: 'أعلى أولوية - معدل التحويل المتوقع 8-12%',
          counters: { targeted: 64, engaged: 18, converted: 4 }
        },
        {
          name: 'شركات تكنولوجيا ناشئة — Series A+',
          description: 'CEOs شركات SaaS ومنتجات تقنية بعد جولة A، حجمهم 11-50 موظف، عندهم سقف تشغيلي',
          criteria: { industries: ['tech'], companySizes: ['11_50'], revenueRanges: ['1m_5m', '5m_10m'], yearsInBusiness: ['5_10', 'under_5'], cities: ['القاهرة', 'الإسكندرية'], countries: ['EG'], eosFamiliarity: ['heard_only', 'read_traction'], ceilings: ['operational_chaos', 'strategic_fog'] },
          estimatedSize: 120, priority: 'high', acquisitionStrategy: 'LinkedIn outreach مباشر + شراكات مع VCs محليين + محتوى متخصص',
          status: 'active', notes: 'الجمهور دا مطّلع على EOS غالباً — التركيز على التطبيق العملي',
          counters: { targeted: 28, engaged: 9, converted: 2 }
        },
        {
          name: 'شركات عائلية — انتقال جيلي',
          description: 'مؤسسون في الجيل الأول، عندهم وريث جاهز، شركاتهم >20 سنة وحجمها كبير',
          criteria: { industries: ['manufacturing', 'real_estate', 'services'], companySizes: ['51_250', '251_1000'], revenueRanges: ['10m_50m', '50m_plus'], yearsInBusiness: ['20_plus'], cities: ['القاهرة', 'الجيزة', 'الإسكندرية'], countries: ['EG'], eosFamiliarity: ['never_heard', 'heard_only', 'partial_implementation'], ceilings: ['leadership_transition', 'leadership_fracture'] },
          estimatedSize: 220, priority: 'medium', acquisitionStrategy: 'ندوات متخصصة في الانتقال الجيلي + شراكات مع مكاتب محاماة ومحاسبة عائلية',
          status: 'active', notes: 'دورة بيع طويلة (6-12 شهر) لكن قيمة الصفقة عالية جداً',
          counters: { targeted: 15, engaged: 5, converted: 1 }
        },
        {
          name: 'تجارة تجزئة — متعددة الفروع',
          description: 'مالكو سلاسل تجارية لها 3+ فروع، يواجهون فوضى تشغيلية ومشاكل في الـ scaling',
          criteria: { industries: ['retail'], companySizes: ['51_250'], revenueRanges: ['5m_10m', '10m_50m'], yearsInBusiness: ['5_10', '10_20'], cities: ['القاهرة', 'الإسكندرية', 'المنصورة'], countries: ['EG'], eosFamiliarity: ['never_heard'], ceilings: ['operational_chaos'] },
          estimatedSize: 180, priority: 'medium', acquisitionStrategy: 'Facebook Ads + غرف تجارة + ندوة "الانتشار بدون فوضى"',
          status: 'active', notes: '', counters: { targeted: 12, engaged: 3, converted: 0 }
        },
        {
          name: 'شركات الخدمات المهنية',
          description: 'مكاتب محاسبة، استشارات، محاماة — شركاء يديرون فرق 30+ شخص',
          criteria: { industries: ['services'], companySizes: ['11_50', '51_250'], revenueRanges: ['1m_5m', '5m_10m'], yearsInBusiness: ['5_10', '10_20'], cities: ['القاهرة'], countries: ['EG'], eosFamiliarity: ['heard_only'], ceilings: ['leadership_fracture', 'strategic_fog'] },
          estimatedSize: 90, priority: 'low', acquisitionStrategy: 'إحالات + شراكات مهنية',
          status: 'paused', notes: 'مؤجلة — نركز على الصناعات والتكنولوجيا أولاً',
          counters: { targeted: 0, engaged: 0, converted: 0 }
        }
      ];

      const segmentIds = [];
      for (const s of sampleSegmentsOnly) {
        const sid = await window.EMC.store.create('emc_segments', s);
        segmentIds.push(sid);
      }

      // اربط الـ contacts الحالية بالشرائح المناسبة (حسب الصناعة)
      const industryToSegment = {
        manufacturing: segmentIds[0],
        tech: segmentIds[1],
        real_estate: segmentIds[2],
        retail: segmentIds[3]
      };
      for (const c of existingContacts) {
        const segId = industryToSegment[c.identity?.industry];
        if (segId && !c.context?.segmentId) {
          await window.EMC.store.update('emc_contacts', c.id, {
            context: { ...c.context, segmentId: segId }
          });
        }
      }

      console.log('✅ EMC: Top-up seeded segments + linked existing contacts');
      return;
    }

    // ─── Full seed (لما القاعدة فاضية تماماً) ───
    if (existingContacts.length > 0) return;

    const sampleContacts = [
      {
        identity: {
          fullName: 'كريم سلامة', firstName: 'كريم', lastName: 'سلامة',
          title: 'مؤسس وشريك إداري', companyName: 'سلامة للأغذية',
          industry: 'manufacturing', companySize: '51_250', revenueRange: '10m_50m',
          yearsInBusiness: '10_20', country: 'EG', city: 'القاهرة', preferredLanguage: 'ar'
        },
        channels: {
          primaryEmail: 'k.salama@example.com', mobile: '+201001234567',
          whatsapp: '+201001234567', linkedinUrl: 'linkedin.com/in/ksalama',
          preferredChannel: 'whatsapp', bestContactTime: 'morning', isContactable: true, optedOutChannels: []
        },
        context: {
          source: 'referral', sourceDetails: 'إحالة من د. هشام يونس',
          firstTouchAt: '2026-04-22T10:00:00Z', lastInteractionAt: '2026-05-14T16:30:00Z',
          referrerId: '', tags: ['c_level', 'manufacturing', 'high_intent'],
          notes: 'مهتم جداً، اتفقنا على مكالمة استكشاف الأسبوع الجاي'
        },
        eosProfile: {
          currentRole: 'visionary', eosFamiliarity: 'read_traction',
          companyStage: 'scaling', ceiling: 'leadership_fracture',
          pains: ['تفكك فريق القيادة', 'صعوبة المساءلة', 'بطء اتخاذ القرار'],
          primaryComponent: 'people', goals12Months: 'بناء فريق قيادة مستقل ومضاعفة الإيرادات'
        },
        engagement: {
          emailOpens: 12, emailClicks: 5, contentConsumed: [], eventsAttended: [],
          callsCount: 1, engagementScore: 78, lastEngagedAt: '2026-05-14T16:30:00Z', temperature: 'hot'
        },
        opportunity: {
          expectedValue: 85000, closeProbability: 65, expectedCloseDate: '2026-06-15',
          objections: [], decisionRole: 'sole_decision_maker', stakeholders: ['الشريك المؤسس'],
          budgetConfirmed: 'yes', timelineUrgency: '1_3_months'
        },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 6, stageHistory: [
          { stage: 1, enteredAt: '2026-04-22T10:00:00Z' },
          { stage: 3, enteredAt: '2026-04-22T10:15:00Z' },
          { stage: 4, enteredAt: '2026-04-28T11:00:00Z' },
          { stage: 5, enteredAt: '2026-05-08T09:30:00Z' },
          { stage: 6, enteredAt: '2026-05-12T14:00:00Z' }
        ],
        assignedTo: 'abdullah', status: 'active', createdBy: 'abdullah@emc.academy'
      },
      {
        identity: {
          fullName: 'منى الشريف', firstName: 'منى', lastName: 'الشريف',
          title: 'الرئيس التنفيذي', companyName: 'إنوفيت للحلول الرقمية',
          industry: 'tech', companySize: '11_50', revenueRange: '1m_5m',
          yearsInBusiness: '5_10', country: 'EG', city: 'الإسكندرية', preferredLanguage: 'ar'
        },
        channels: { primaryEmail: 'mona.s@innovate.eg', mobile: '+201112345678', whatsapp: '+201112345678', linkedinUrl: '', preferredChannel: 'email', bestContactTime: 'afternoon', isContactable: true, optedOutChannels: [] },
        context: { source: 'linkedin', sourceDetails: 'بوست عن السقف القيادي', firstTouchAt: '2026-05-02T14:00:00Z', lastInteractionAt: '2026-05-15T09:00:00Z', referrerId: '', tags: ['c_level', 'tech', 'female_leader'], notes: '' },
        eosProfile: { currentRole: 'visionary', eosFamiliarity: 'heard_only', companyStage: 'early_growth', ceiling: 'operational_chaos', pains: ['فوضى في العمليات', 'كل شيء بيرجعلي'], primaryComponent: 'process', goals12Months: 'مضاعفة الفريق بدون إرهاق' },
        engagement: { emailOpens: 8, emailClicks: 3, contentConsumed: [], eventsAttended: [], callsCount: 0, engagementScore: 52, lastEngagedAt: '2026-05-15T09:00:00Z', temperature: 'warm' },
        opportunity: { expectedValue: 0, closeProbability: 0, expectedCloseDate: null, objections: [], decisionRole: '', stakeholders: [], budgetConfirmed: 'exploring', timelineUrgency: '3_6_months' },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 4, stageHistory: [
          { stage: 1, enteredAt: '2026-05-02T14:00:00Z' },
          { stage: 2, enteredAt: '2026-05-02T14:30:00Z' },
          { stage: 3, enteredAt: '2026-05-05T10:00:00Z' },
          { stage: 4, enteredAt: '2026-05-12T11:15:00Z' }
        ],
        assignedTo: 'abdullah', status: 'active', createdBy: 'system'
      },
      {
        identity: { fullName: 'أحمد الباز', firstName: 'أحمد', lastName: 'الباز', title: 'العضو المنتدب', companyName: 'الباز للمقاولات', industry: 'real_estate', companySize: '51_250', revenueRange: '50m_plus', yearsInBusiness: '20_plus', country: 'EG', city: 'الجيزة', preferredLanguage: 'ar' },
        channels: { primaryEmail: 'a.elbaz@elbaz.com.eg', mobile: '+201223456789', whatsapp: '+201223456789', linkedinUrl: '', preferredChannel: 'whatsapp', bestContactTime: 'evening', isContactable: true, optedOutChannels: [] },
        context: { source: 'webinar', sourceDetails: 'ندوة: السقف القيادي في الشركات العائلية', firstTouchAt: '2026-03-10T18:00:00Z', lastInteractionAt: '2026-05-10T20:00:00Z', referrerId: '', tags: ['c_level', 'family_business', 'high_value'], notes: 'حضر ندوتين، استلم عرض' },
        eosProfile: { currentRole: 'visionary', eosFamiliarity: 'partial_implementation', companyStage: 'mature', ceiling: 'leadership_transition', pains: ['الانتقال للجيل الثاني', 'مقاومة التغيير'], primaryComponent: 'vision', goals12Months: 'تنظيم انتقال القيادة لابني خلال 18 شهر' },
        engagement: { emailOpens: 24, emailClicks: 11, contentConsumed: [], eventsAttended: [], callsCount: 3, engagementScore: 88, lastEngagedAt: '2026-05-10T20:00:00Z', temperature: 'burning' },
        opportunity: { expectedValue: 120000, closeProbability: 80, expectedCloseDate: '2026-05-25', objections: [{ type: 'timing', raisedAt: '2026-05-08T00:00:00Z', status: 'addressed' }], decisionRole: 'sole_decision_maker', stakeholders: ['الابن — الوريث المرتقب'], budgetConfirmed: 'yes', timelineUrgency: 'immediate' },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 8, stageHistory: [{ stage: 1, enteredAt: '2026-03-10T18:00:00Z' }, { stage: 2, enteredAt: '2026-03-10T18:30:00Z' }, { stage: 3, enteredAt: '2026-03-15T10:00:00Z' }, { stage: 4, enteredAt: '2026-04-01T11:00:00Z' }, { stage: 5, enteredAt: '2026-04-15T11:00:00Z' }, { stage: 6, enteredAt: '2026-04-22T15:00:00Z' }, { stage: 7, enteredAt: '2026-05-02T14:00:00Z' }, { stage: 8, enteredAt: '2026-05-08T16:00:00Z' }],
        assignedTo: 'abdullah', status: 'active', createdBy: 'abdullah@emc.academy'
      },
      {
        identity: { fullName: 'ياسر الجندي', firstName: 'ياسر', lastName: 'الجندي', title: 'الشريك المؤسس', companyName: 'لوجستيك بلس', industry: 'services', companySize: '11_50', revenueRange: '5m_10m', yearsInBusiness: '5_10', country: 'EG', city: 'القاهرة', preferredLanguage: 'ar' },
        channels: { primaryEmail: 'yasser@logistics-plus.com', mobile: '+201334567890', whatsapp: '+201334567890', linkedinUrl: '', preferredChannel: 'whatsapp', bestContactTime: 'morning', isContactable: true, optedOutChannels: [] },
        context: { source: 'facebook', sourceDetails: 'إعلان عن الكوهورت', firstTouchAt: '2026-05-08T12:00:00Z', lastInteractionAt: '2026-05-13T15:00:00Z', referrerId: '', tags: ['mid_market'], notes: 'سجل في الندوة المجانية' },
        eosProfile: { currentRole: 'integrator', eosFamiliarity: 'never_heard', companyStage: 'early_growth', ceiling: 'strategic_fog', pains: [], primaryComponent: '', goals12Months: '' },
        engagement: { emailOpens: 3, emailClicks: 1, contentConsumed: [], eventsAttended: [], callsCount: 0, engagementScore: 28, lastEngagedAt: '2026-05-13T15:00:00Z', temperature: 'cold' },
        opportunity: { expectedValue: 0, closeProbability: 0, expectedCloseDate: null, objections: [], decisionRole: '', stakeholders: [], budgetConfirmed: '', timelineUrgency: '' },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 3, stageHistory: [{ stage: 1, enteredAt: '2026-05-08T12:00:00Z' }, { stage: 2, enteredAt: '2026-05-08T12:15:00Z' }, { stage: 3, enteredAt: '2026-05-08T12:30:00Z' }],
        assignedTo: 'abdullah', status: 'active', createdBy: 'system'
      },
      {
        identity: { fullName: 'هدى عبد الفتاح', firstName: 'هدى', lastName: 'عبد الفتاح', title: 'مديرة عامة', companyName: 'تيراكوتا للديكور', industry: 'retail', companySize: '11_50', revenueRange: '1m_5m', yearsInBusiness: '5_10', country: 'EG', city: 'الجيزة', preferredLanguage: 'ar' },
        channels: { primaryEmail: 'huda@terracotta.eg', mobile: '+201445678901', whatsapp: '+201445678901', linkedinUrl: '', preferredChannel: 'email', bestContactTime: 'afternoon', isContactable: true, optedOutChannels: [] },
        context: { source: 'referral', sourceDetails: 'إحالة من كريم سلامة', firstTouchAt: '2026-05-10T09:00:00Z', lastInteractionAt: '2026-05-15T11:00:00Z', referrerId: '', tags: ['c_level', 'referral'], notes: 'إحالة قوية' },
        eosProfile: { currentRole: 'visionary', eosFamiliarity: 'heard_only', companyStage: 'scaling', ceiling: 'operational_chaos', pains: ['عدم وضوح الأدوار', 'تأخر في النمو'], primaryComponent: 'people', goals12Months: '' },
        engagement: { emailOpens: 6, emailClicks: 4, contentConsumed: [], eventsAttended: [], callsCount: 1, engagementScore: 62, lastEngagedAt: '2026-05-15T11:00:00Z', temperature: 'hot' },
        opportunity: { expectedValue: 55000, closeProbability: 50, expectedCloseDate: '2026-06-30', objections: [], decisionRole: 'strong_influencer', stakeholders: ['مجلس الإدارة'], budgetConfirmed: 'exploring', timelineUrgency: '1_3_months' },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 5, stageHistory: [{ stage: 1, enteredAt: '2026-05-10T09:00:00Z' }, { stage: 3, enteredAt: '2026-05-10T09:15:00Z' }, { stage: 4, enteredAt: '2026-05-13T10:00:00Z' }, { stage: 5, enteredAt: '2026-05-15T11:00:00Z' }],
        assignedTo: 'abdullah', status: 'active', createdBy: 'abdullah@emc.academy'
      },
      {
        identity: { fullName: 'طارق عبد الله', firstName: 'طارق', lastName: 'عبد الله', title: 'المدير التنفيذي', companyName: 'دلتا فارما', industry: 'healthcare', companySize: '51_250', revenueRange: '10m_50m', yearsInBusiness: '10_20', country: 'EG', city: 'القاهرة', preferredLanguage: 'ar' },
        channels: { primaryEmail: 't.abdullah@deltapharma.eg', mobile: '+201556789012', whatsapp: '+201556789012', linkedinUrl: '', preferredChannel: 'email', bestContactTime: 'morning', isContactable: true, optedOutChannels: [] },
        context: { source: 'referral', sourceDetails: 'إحالة من خريج (أحمد الباز)', firstTouchAt: '2026-01-12T10:00:00Z', lastInteractionAt: '2026-05-10T14:00:00Z', referrerId: '', tags: ['c_level', 'alumni_referral'], notes: 'خريج كوهورت 2025، متابعة تطبيق' },
        eosProfile: { currentRole: 'visionary', eosFamiliarity: 'full_implementation', companyStage: 'mature', ceiling: 'growth_stall', pains: [], primaryComponent: 'data', goals12Months: 'تحسين Scorecard وزيادة الـ Rocks المنجزة' },
        engagement: { emailOpens: 32, emailClicks: 18, contentConsumed: [], eventsAttended: [], callsCount: 6, engagementScore: 72, lastEngagedAt: '2026-05-10T14:00:00Z', temperature: 'hot' },
        opportunity: { expectedValue: 0, closeProbability: 100, expectedCloseDate: '2026-02-01', objections: [], decisionRole: 'sole_decision_maker', stakeholders: [], budgetConfirmed: 'yes', timelineUrgency: 'immediate' },
        customer: { cohortId: 'cohort-2026-01', enrollmentDate: '2026-02-01', paymentStatus: 'complete', paymentAmount: 95000, attendanceRate: 92, rocksCompletionRate: 78, sessionsAttended: [], assignedCoach: 'عبدالله عامر' },
        outcomes: { resultsNarrative: 'تطبيق كامل لـ EOS بعد 90 يوم. زيادة 22% في الإيرادات.', metricsBefore: { revenue: '12M' }, metricsAfter: { revenue: '14.6M' }, nps3Month: 9, nps6Month: null, nps12Month: null, testimonialStatus: 'received', testimonialContent: 'البرنامج غير شركتي من الجذور.', caseStudyApproved: true, eosComponentsImplemented: ['vto', 'accountability_chart', 'level_10', 'rocks', 'scorecard', 'ids'] },
        advocacy: { referralsCount: 2, successfulReferrals: 1, referralsValue: 120000, referredContactIds: [], contentContributions: ['شهادة فيديو', 'حالة دراسية'], eventsSpoken: [], advocateLevel: 'active_referrer' },
        currentStage: 13, stageHistory: [],
        assignedTo: 'abdullah', status: 'active', createdBy: 'system'
      }
    ];

    // ─── Sample segments (المرحلة 1) ───
    const sampleSegments = [
      {
        name: 'صناعيين القاهرة الكبرى',
        description: 'مؤسسو ومديرو شركات التصنيع في القاهرة وحجم 50-250 موظف، فيهم تفكك تشغيلي وما طبقوش EOS',
        criteria: {
          industries: ['manufacturing'],
          companySizes: ['51_250'],
          revenueRanges: ['10m_50m', '5m_10m'],
          yearsInBusiness: ['10_20', '20_plus'],
          cities: ['القاهرة', 'الجيزة', '6 أكتوبر'],
          countries: ['EG'],
          eosFamiliarity: ['never_heard', 'heard_only'],
          ceilings: ['operational_chaos', 'leadership_fracture']
        },
        estimatedSize: 480,
        priority: 'high',
        acquisitionStrategy: 'LinkedIn Sales Navigator + غرفة الصناعات + ندوة شهرية + إحالات من خريجين',
        status: 'active',
        notes: 'أعلى أولوية - معدل التحويل المتوقع 8-12%',
        counters: { targeted: 64, engaged: 18, converted: 4 }
      },
      {
        name: 'شركات تكنولوجيا ناشئة — Series A+',
        description: 'CEOs شركات SaaS ومنتجات تقنية بعد جولة A، حجمهم 11-50 موظف، عندهم سقف تشغيلي',
        criteria: {
          industries: ['tech'],
          companySizes: ['11_50'],
          revenueRanges: ['1m_5m', '5m_10m'],
          yearsInBusiness: ['5_10', 'under_5'],
          cities: ['القاهرة', 'الإسكندرية'],
          countries: ['EG'],
          eosFamiliarity: ['heard_only', 'read_traction'],
          ceilings: ['operational_chaos', 'strategic_fog']
        },
        estimatedSize: 120,
        priority: 'high',
        acquisitionStrategy: 'LinkedIn outreach مباشر + شراكات مع VCs محليين + محتوى متخصص للـ Series A founders',
        status: 'active',
        notes: 'الجمهور دا مطّلع على EOS غالباً — التركيز على التطبيق العملي مش التعريف',
        counters: { targeted: 28, engaged: 9, converted: 2 }
      },
      {
        name: 'شركات عائلية — انتقال جيلي',
        description: 'مؤسسون في الجيل الأول، عندهم وريث جاهز، شركاتهم >20 سنة وحجمها كبير',
        criteria: {
          industries: ['manufacturing', 'real_estate', 'services'],
          companySizes: ['51_250', '251_1000'],
          revenueRanges: ['10m_50m', '50m_plus'],
          yearsInBusiness: ['20_plus'],
          cities: ['القاهرة', 'الجيزة', 'الإسكندرية'],
          countries: ['EG'],
          eosFamiliarity: ['never_heard', 'heard_only', 'partial_implementation'],
          ceilings: ['leadership_transition', 'leadership_fracture']
        },
        estimatedSize: 220,
        priority: 'medium',
        acquisitionStrategy: 'ندوات متخصصة في الانتقال الجيلي + شراكات مع مكاتب محاماة ومحاسبة عائلية',
        status: 'active',
        notes: 'دورة بيع طويلة (6-12 شهر) لكن قيمة الصفقة عالية جداً',
        counters: { targeted: 15, engaged: 5, converted: 1 }
      },
      {
        name: 'تجارة تجزئة — متعددة الفروع',
        description: 'مالكو سلاسل تجارية لها 3+ فروع، يواجهون فوضى تشغيلية ومشاكل في الـ scaling',
        criteria: {
          industries: ['retail'],
          companySizes: ['51_250'],
          revenueRanges: ['5m_10m', '10m_50m'],
          yearsInBusiness: ['5_10', '10_20'],
          cities: ['القاهرة', 'الإسكندرية', 'المنصورة'],
          countries: ['EG'],
          eosFamiliarity: ['never_heard'],
          ceilings: ['operational_chaos']
        },
        estimatedSize: 180,
        priority: 'medium',
        acquisitionStrategy: 'Facebook Ads + غرف تجارة + ندوة "الانتشار بدون فوضى"',
        status: 'active',
        notes: '',
        counters: { targeted: 12, engaged: 3, converted: 0 }
      },
      {
        name: 'شركات الخدمات المهنية',
        description: 'مكاتب محاسبة، استشارات، محاماة — شركاء يديرون فرق 30+ شخص',
        criteria: {
          industries: ['services'],
          companySizes: ['11_50', '51_250'],
          revenueRanges: ['1m_5m', '5m_10m'],
          yearsInBusiness: ['5_10', '10_20'],
          cities: ['القاهرة'],
          countries: ['EG'],
          eosFamiliarity: ['heard_only'],
          ceilings: ['leadership_fracture', 'strategic_fog']
        },
        estimatedSize: 90,
        priority: 'low',
        acquisitionStrategy: 'إحالات + شراكات مهنية',
        status: 'paused',
        notes: 'مؤجلة — نركز على الصناعات والتكنولوجيا أولاً',
        counters: { targeted: 0, engaged: 0, converted: 0 }
      }
    ];

    // ─── أنشئ الـ segments أولاً واحتفظ بـ IDs ───
    const segmentIds = [];
    for (const s of sampleSegments) {
      const id = await window.EMC.store.create('emc_segments', s);
      segmentIds.push(id);
    }

    // ─── اربط كل contact مناسب بالشريحة الصحيحة ───
    sampleContacts[0].context.segmentId = segmentIds[0]; // كريم سلامة — صناعيين
    sampleContacts[1].context.segmentId = segmentIds[1]; // منى الشريف — تكنولوجيا
    sampleContacts[2].context.segmentId = segmentIds[2]; // أحمد الباز — انتقال جيلي
    sampleContacts[4].context.segmentId = segmentIds[3]; // هدى عبد الفتاح — تجزئة
    // ياسر الجندي (خدمات/3) + طارق عبد الله (خريج/5) بدون ربط — للتنوع

    for (const c of sampleContacts) {
      await window.EMC.store.create('emc_contacts', c);
    }

    await window.EMC.store.create('emc_cohorts', {
      name: 'كوهورت يونيو 2026',
      startDate: '2026-06-15',
      endDate: '2026-08-30',
      capacity: 12,
      enrolled: 7,
      price: 95000,
      currency: 'EGP',
      status: 'upcoming',
      sessions: []
    }, 'cohort-2026-06');

    // ─── Sample touchpoints (المرحلة 2) ───
    const existingTPs = await window.EMC.store.list('emc_touchpoints');
    if (existingTPs.length === 0) {
      const now = Date.now();
      const day = 86400000;

      const sampleTouchpoints = [
        // Session 1: LinkedIn → eos-guide → converted
        { sessionId: 's_lk001', type: 'page_view', landingPage: 'eos-guide', source: 'linkedin',
          utm: { source: 'linkedin', campaign: 'eos-guide-may', medium: 'social', content: '', term: '' },
          referrer: 'https://www.linkedin.com/', userAgent: '', data: {},
          timestamp: new Date(now - 3 * day).toISOString() },
        { sessionId: 's_lk001', type: 'scroll_depth', landingPage: 'eos-guide', source: 'linkedin',
          utm: {}, data: { depth: 50 }, timestamp: new Date(now - 3 * day + 30000).toISOString() },
        { sessionId: 's_lk001', type: 'scroll_depth', landingPage: 'eos-guide', source: 'linkedin',
          utm: {}, data: { depth: 75 }, timestamp: new Date(now - 3 * day + 60000).toISOString() },
        { sessionId: 's_lk001', type: 'cta_click', landingPage: 'eos-guide', source: 'linkedin',
          utm: {}, data: { ctaId: 'hero-submit', label: 'حمّل الدليل' }, timestamp: new Date(now - 3 * day + 90000).toISOString() },
        { sessionId: 's_lk001', type: 'form_submit', landingPage: 'eos-guide', source: 'linkedin',
          utm: {}, data: { fields: ['fullName', 'email'] }, timestamp: new Date(now - 3 * day + 100000).toISOString() },
        { sessionId: 's_lk001', type: 'time_on_page', landingPage: 'eos-guide', source: 'linkedin',
          utm: {}, data: { seconds: 180, maxScroll: 90 }, timestamp: new Date(now - 3 * day + 120000).toISOString() },

        // Session 2: Facebook → webinar → converted
        { sessionId: 's_fb002', type: 'page_view', landingPage: 'webinar', source: 'facebook',
          utm: { source: 'facebook', campaign: 'webinar-may-cohort', medium: 'ads' },
          data: {}, timestamp: new Date(now - 2 * day).toISOString() },
        { sessionId: 's_fb002', type: 'form_submit', landingPage: 'webinar', source: 'facebook',
          utm: {}, data: { fields: ['fullName', 'email', 'companyName'] },
          timestamp: new Date(now - 2 * day + 240000).toISOString() },

        // Session 3: Direct → insight → didn't convert
        { sessionId: 's_dr003', type: 'page_view', landingPage: 'insight', source: 'direct',
          utm: {}, data: {}, timestamp: new Date(now - 1 * day).toISOString() },
        { sessionId: 's_dr003', type: 'scroll_depth', landingPage: 'insight', source: 'direct',
          utm: {}, data: { depth: 100 }, timestamp: new Date(now - 1 * day + 180000).toISOString() },
        { sessionId: 's_dr003', type: 'time_on_page', landingPage: 'insight', source: 'direct',
          utm: {}, data: { seconds: 240, maxScroll: 100 }, timestamp: new Date(now - 1 * day + 250000).toISOString() },

        // Session 4: Google → eos-guide → bounce
        { sessionId: 's_sr004', type: 'page_view', landingPage: 'eos-guide', source: 'search',
          utm: { source: 'google' }, data: {}, timestamp: new Date(now - 5 * 3600000).toISOString() },
        { sessionId: 's_sr004', type: 'time_on_page', landingPage: 'eos-guide', source: 'search',
          utm: {}, data: { seconds: 12, maxScroll: 20 }, timestamp: new Date(now - 5 * 3600000 + 15000).toISOString() }
      ];

      for (const tp of sampleTouchpoints) {
        await window.EMC.store.create('emc_touchpoints', tp);
      }

      // ─── Create 2 sample Lead contacts from landing pages ───
      const lead1Id = await window.EMC.store.create('emc_contacts', {
        identity: {
          fullName: 'سارة الفقي', firstName: 'سارة', lastName: 'الفقي',
          title: '', companyName: '',
          industry: '', companySize: '', revenueRange: '', yearsInBusiness: '',
          country: 'EG', city: '', preferredLanguage: 'ar'
        },
        channels: {
          primaryEmail: 'sara.elfeky@example.com', mobile: '', whatsapp: '',
          linkedinUrl: '', facebookUrl: '',
          preferredChannel: 'email', bestContactTime: '', isContactable: true, optedOutChannels: []
        },
        context: {
          source: 'linkedin',
          sourceDetails: 'Landing: دليل السقف القيادي',
          firstTouchAt: new Date(now - 3 * day).toISOString(),
          lastInteractionAt: new Date(now - 3 * day + 100000).toISOString(),
          referrerId: '',
          tags: ['landing_page', 'eos-guide'],
          notes: 'حملة: eos-guide-may'
        },
        eosProfile: { currentRole: '', eosFamiliarity: '', companyStage: '', ceiling: '', pains: [], primaryComponent: '', goals12Months: '' },
        engagement: { emailOpens: 0, emailClicks: 0, contentConsumed: [], eventsAttended: [], callsCount: 0, engagementScore: 18, lastEngagedAt: new Date(now - 3 * day + 100000).toISOString(), temperature: 'cold' },
        opportunity: { expectedValue: 0, closeProbability: 0, expectedCloseDate: null, objections: [], decisionRole: '', stakeholders: [], budgetConfirmed: '', timelineUrgency: '' },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 2, stageHistory: [{ stage: 2, enteredAt: new Date(now - 3 * day).toISOString() }],
        assignedTo: 'abdullah', status: 'active', createdBy: 'landing-page'
      });

      const lead2Id = await window.EMC.store.create('emc_contacts', {
        identity: {
          fullName: 'أحمد جمال', firstName: 'أحمد', lastName: 'جمال',
          title: '', companyName: 'جمال للتجارة',
          industry: '', companySize: '', revenueRange: '', yearsInBusiness: '',
          country: 'EG', city: '', preferredLanguage: 'ar'
        },
        channels: {
          primaryEmail: 'a.gamal@example.com', mobile: '', whatsapp: '',
          linkedinUrl: '', facebookUrl: '',
          preferredChannel: 'email', bestContactTime: '', isContactable: true, optedOutChannels: []
        },
        context: {
          source: 'facebook',
          sourceDetails: 'Landing: ندوة العقل التشغيلي',
          firstTouchAt: new Date(now - 2 * day).toISOString(),
          lastInteractionAt: new Date(now - 2 * day + 240000).toISOString(),
          referrerId: '',
          tags: ['landing_page', 'webinar'],
          notes: 'حملة: webinar-may-cohort'
        },
        eosProfile: { currentRole: '', eosFamiliarity: '', companyStage: '', ceiling: '', pains: [], primaryComponent: '', goals12Months: '' },
        engagement: { emailOpens: 0, emailClicks: 0, contentConsumed: [], eventsAttended: [], callsCount: 0, engagementScore: 25, lastEngagedAt: new Date(now - 2 * day + 240000).toISOString(), temperature: 'cold' },
        opportunity: { expectedValue: 0, closeProbability: 0, expectedCloseDate: null, objections: [], decisionRole: '', stakeholders: [], budgetConfirmed: '', timelineUrgency: '' },
        customer: { cohortId: '', paymentStatus: '', paymentAmount: 0, attendanceRate: 0, rocksCompletionRate: 0, sessionsAttended: [], assignedCoach: '' },
        outcomes: { resultsNarrative: '', metricsBefore: {}, metricsAfter: {}, nps3Month: null, nps6Month: null, nps12Month: null, testimonialStatus: 'not_requested', testimonialContent: '', caseStudyApproved: false, eosComponentsImplemented: [] },
        advocacy: { referralsCount: 0, successfulReferrals: 0, referralsValue: 0, referredContactIds: [], contentContributions: [], eventsSpoken: [], advocateLevel: '' },
        currentStage: 2, stageHistory: [{ stage: 2, enteredAt: new Date(now - 2 * day).toISOString() }],
        assignedTo: 'abdullah', status: 'active', createdBy: 'landing-page'
      });

      // ─── ربط الـ touchpoints بالـ contacts ───
      const allTPs = await window.EMC.store.list('emc_touchpoints');
      for (const tp of allTPs) {
        if (tp.sessionId === 's_lk001' && !tp.contactId) {
          await window.EMC.store.update('emc_touchpoints', tp.id, { contactId: lead1Id });
        }
        if (tp.sessionId === 's_fb002' && !tp.contactId) {
          await window.EMC.store.update('emc_touchpoints', tp.id, { contactId: lead2Id });
        }
      }

      console.log('✅ EMC: Seeded touchpoints + landing-page leads');
    }

    // ─── Sample Templates (5 قوالب) ───
    const existingTpls = await window.EMC.store.list('emc_templates');
    if (existingTpls.length === 0) {
      const sampleTemplates = [
        {
          name: 'ترحيب — يوم 0 (إيميل)',
          channel: 'email', stage: 3, sequence: 'welcome', dayOffset: 0,
          subject: 'أهلاً {{firstName}}، الدليل في طريقه ليك',
          body: 'أهلاً {{firstName}}،\n\nشكراً إنك حمّلت "دليل السقف القيادي" — هتلاقيه مرفق مع الإيميل ده.\n\nأنا عبدالله، مدرب EOS معتمد ومؤسس Executive Mastery Camp. اللي بنشتغل عليه في الـ EMC هو إن قائد شركة 50-250 موظف يقدر يدير شركته بكفاءة بدون ما يكون مختنق في كل تفصيلة.\n\nبصراحة، الـ 3 صفحات الأولى من الدليل هي الأهم — لو وقفت عندهم بس ودنت لنفسك 15 دقيقة للتفكير، هتلاقي حاجات ما كنتش بتركز عليها قبل كده.\n\nلو حابب تتعمق أكتر، خد التشخيص المجاني الكامل (3 دقايق) — هيوريك بالظبط منين تبدأ:\n\nhttps://mahmoudfouad25.github.io/fouad-perspective/emc/lp/diagnosis.html?email={{email}}\n\nشوفك قريب،\nعبدالله عامر\nExecutive Mastery Camp',
          language: 'ar', isActive: true, tags: ['welcome', 'eos-guide']
        },
        {
          name: 'ترحيب — يوم 0 (واتساب)',
          channel: 'whatsapp', stage: 3, sequence: 'welcome', dayOffset: 0,
          subject: '',
          body: 'أهلاً {{firstName}} 👋\n\nأنا عبدالله من Executive Mastery Camp. شكراً إنك حمّلت الدليل.\n\nلو حابب نتكلم بشكل سريع عن وضع {{companyName}} والسقف اللي وصلتوله، احجز مكالمة 20 دقيقة مجاناً من اللينك ده:\nhttps://mahmoudfouad25.github.io/fouad-perspective/emc/lp/diagnosis.html?email={{email}}\n\nمكالمة تشخيصية بحتة، مش بيع.',
          language: 'ar', isActive: true, tags: ['welcome']
        },
        {
          name: 'متابعة — يوم 5 (قصة عميل)',
          channel: 'email', stage: 3, sequence: 'welcome', dayOffset: 5,
          subject: 'كيف خفّض كريم ساعات شغله من 70 لـ 40 في 4 شهور',
          body: 'أهلاً {{firstName}}،\n\nاتمنى الدليل أفادك.\n\nحبيت أحكيلك قصة سريعة عن كريم — مؤسس شركة تصنيع 80 موظف في القاهرة. لما جالنا، كان شغّال 70 ساعة في الأسبوع، فريق القيادة بيتنازع كل اجتماع، والقرارات بتتأجل لأسابيع.\n\nبعد 4 شهور من تطبيق EOS:\n- بيشتغل 40 ساعة في الأسبوع\n- فريق القيادة بيقرّر في 30 دقيقة بدل ساعتين\n- الإيرادات زادت 28%\n\nاللي عمله كريم مش معجزة — تطبيق منظم لـ 6 مكونات بسيطة، بمتابعة أسبوعية.\n\nلو حابب تشوف لو شركتك جاهزة لنفس التحوّل، التشخيص المجاني هيوريك بالظبط منين تبدأ:\nhttps://mahmoudfouad25.github.io/fouad-perspective/emc/lp/diagnosis.html?email={{email}}\n\nعبدالله',
          language: 'ar', isActive: true, tags: ['follow_up', 'case_study']
        },
        {
          name: 'متابعة — يوم 9 (فيديو شخصي)',
          channel: 'email', stage: 3, sequence: 'welcome', dayOffset: 9,
          subject: '{{firstName}}، 4 دقايق فيديو خصيصاً ليك',
          body: 'أهلاً {{firstName}}،\n\nسجّلت فيديو قصير (4 دقايق) عن أكبر خطأ بيقع فيه قادة الشركات في حجم {{companyName}} لما بيحاولوا يبنوا نظام تشغيلي.\n\nمش محتاج تشترك ولا تسجل، اضغط واتفرج:\n[لينك الفيديو]\n\nبعد ما تشوفه، لو حسيت إن ده فعلاً بيلامس وضعك، احجز التشخيص المجاني:\nhttps://mahmoudfouad25.github.io/fouad-perspective/emc/lp/diagnosis.html?email={{email}}\n\nعبدالله',
          language: 'ar', isActive: true, tags: ['follow_up', 'video']
        },
        {
          name: 'متابعة — يوم 14 (دعوة ندوة، واتساب)',
          channel: 'whatsapp', stage: 3, sequence: 'welcome', dayOffset: 14,
          subject: '',
          body: '{{firstName}} 👋\n\nبنعمل ندوة مجانية الأسبوع الجاي عن "العقل التشغيلي للقائد" — 90 دقيقة + Q&A مفتوحة.\n\nالمحتوى بيخدم {{companyName}} تحديداً — قادة شركات في حجمكوا.\n\nاحجز مقعدك من هنا:\nhttps://mahmoudfouad25.github.io/fouad-perspective/emc/lp/webinar.html\n\nالمقاعد محدودة (120) وعادةً بيتمليوا في 48 ساعة.\n\nعبدالله',
          language: 'ar', isActive: true, tags: ['follow_up', 'webinar']
        }
      ];

      for (const t of sampleTemplates) {
        await window.EMC.store.create('emc_templates', t);
      }
      console.log('✅ EMC: Seeded 5 message templates');
    }

    // ─── ترقية sara.elfeky إلى Identified (P3 demo) ───
    const allContactsNow = await window.EMC.store.list('emc_contacts');
    const sara = allContactsNow.find(c =>
      (c.channels?.primaryEmail || '').toLowerCase() === 'sara.elfeky@example.com'
    );
    if (sara && sara.currentStage === 2) {
      const nowIso = new Date().toISOString();
      const history = [...(sara.stageHistory || [])];
      if (history.length) history[history.length - 1].exitedAt = nowIso;
      history.push({
        stage: 3,
        enteredAt: nowIso,
        reason: 'تقديم نموذج التشخيص الكامل',
        performedBy: 'system'
      });
      await window.EMC.store.update('emc_contacts', sara.id, {
        identity: {
          ...(sara.identity || {}),
          title: 'COO',
          companyName: 'الفقي للتجارة',
          industry: 'retail',
          companySize: '51_250'
        },
        channels: {
          ...(sara.channels || {}),
          mobile: '+201001234567',
          whatsapp: '+201001234567',
          preferredChannel: 'whatsapp'
        },
        eosProfile: {
          ...(sara.eosProfile || {}),
          eosFamiliarity: 'read_traction'
        },
        context: {
          ...(sara.context || {}),
          tags: [...new Set([...(sara.context?.tags || []), 'diagnosis'])]
        },
        currentStage: 3,
        stageHistory: history
      });
      console.log('✅ EMC: Promoted Sara to Identified (stage 3)');
    }

    // ─── ريفريش السكور لكل الـ contacts الموجودين (أول 10) ───
    if (window.EMC.utils?.refreshContactScore) {
      const refreshList = (await window.EMC.store.list('emc_contacts')).slice(0, 10);
      for (const c of refreshList) {
        try { await window.EMC.utils.refreshContactScore(c.id); } catch (e) {}
      }
      console.log('✅ EMC: Refreshed engagement scores');
    }

    console.log('✅ EMC: Seeded sample data');
  };

})();
