/* ============================================================================
   training-session.js  —  طبقة الجلسة (SessionManager)
   ----------------------------------------------------------------------------
   غلاف نظيف حوالين Firestore. كل الواجهات التلاتة (admin/display/participant)
   بتتكلم مع قاعدة البيانات عن طريق SessionManager بس.

   بنية البيانات:
     wb_workshop (collection)
       └── {SESSION_ID} (document)        ← حالة الجلسة الحيّة
            ├── currentPhase, timer*, customData, status ...
            └── participants (subcollection)
                 └── {pid} (document)      ← اسم وهمي + result_code + lastSeen ...
                      └── responses (subcollection)
                           └── {type}      ← 'lastwell' / 'curve_self' / 'diagnostic' / 'charter'

   مبدأ السرّية: مفيش ربط بين الاسم الوهمي والإجابة بيظهر للأدمن. الأدمن
   بيشوف عدّادات ونِسَب مجمّعة بس.
   ========================================================================== */
(function () {
  'use strict';

  if (typeof firebase === 'undefined' || typeof db === 'undefined') {
    console.error('[SessionManager] Firebase/db مش متاحين — تأكد إن firebase-config.js اتحمّل الأول.');
    return;
  }

  // مُعرّف ثابت وفريد لجلسة الورشة (مختلف عن أي مشروع تاني على نفس المشروع)
  var SESSION_ID  = 'wb-live-active';
  var COLLECTION  = 'wb_workshop';

  var SessionManager = {

    /* ---------- مراجع سريعة ---------- */
    sessionRef:      function () { return db.collection(COLLECTION).doc(SESSION_ID); },
    participantsRef: function () { return this.sessionRef().collection('participants'); },
    responsesRef:    function (pid) { return this.participantsRef().doc(pid).collection('responses'); },

    /* ---------- إدارة الجلسة ---------- */
    getSession: function () {
      return this.sessionRef().get().then(function (d) { return d.exists ? d.data() : null; });
    },

    initSession: function () {
      var data = {
        sessionName:  'ورشة العافية — Inner Wellbeing',
        currentPhase: 'waiting',
        phaseStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
        timerSeconds: 0,
        timerRunning: false,
        timerStartedAt: 0,
        displayMode:  'default',
        customData:   {},
        status:       'active',
        createdAt:    firebase.firestore.FieldValue.serverTimestamp()
      };
      return this.sessionRef().set(data, { merge: false }).then(function () { return data; });
    },

    ensureSession: function () {
      var self = this;
      return this.getSession().then(function (s) {
        if (s) return s;
        return self.initSession();
      });
    },

    setPhase: function (phaseId, customData) {
      return this.sessionRef().update({
        currentPhase:  phaseId,
        phaseStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
        customData:    customData || {},
        timerSeconds:  0,
        timerRunning:  false
      });
    },

    setCustomData: function (obj) {
      return this.sessionRef().update({ customData: obj || {} });
    },

    /* ---------- المؤقّت (مزامنة بالـ timestamp بالملّي ثانية) ---------- */
    setTimer: function (seconds) {
      return this.sessionRef().update({
        timerSeconds:  seconds,
        timerRunning:  false,
        timerStartedAt: 0
      });
    },

    startTimer: function (seconds) {
      var update = {
        timerStartedAt: Date.now(),
        timerRunning:   true
      };
      if (typeof seconds === 'number') update.timerSeconds = seconds;
      return this.sessionRef().update(update);
    },

    stopTimer: function () {
      return this.sessionRef().update({ timerRunning: false });
    },

    /* ---------- المستمعون اللحظيون ---------- */
    onSessionChange: function (cb) {
      return this.sessionRef().onSnapshot(
        function (doc) { if (doc.exists) cb(doc.data()); },
        function (err) { console.error('[SessionManager] session listener:', err); }
      );
    },

    onParticipantsChange: function (cb) {
      return this.participantsRef().onSnapshot(
        function (snap) {
          var arr = [];
          snap.forEach(function (d) { arr.push(Object.assign({ id: d.id }, d.data())); });
          cb(arr);
        },
        function (err) { console.error('[SessionManager] participants listener:', err); }
      );
    },

    /* ---------- المشاركون ---------- */
    registerParticipant: function (name, code) {
      return this.participantsRef().add({
        name:         (name || '').trim(),
        result_code:  code || null,
        joinedAt:     firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen:     firebase.firestore.FieldValue.serverTimestamp(),
        currentPhase: 'waiting',
        status:       'online'
      }).then(function (ref) { return ref.id; });
    },

    updateParticipantStatus: function (pid, data) {
      return this.participantsRef().doc(pid).update(
        Object.assign({}, data || {}, {
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        })
      ).catch(function (e) { console.warn('[SessionManager] participant update failed:', e); });
    },

    getParticipant: function (pid) {
      return this.participantsRef().doc(pid).get()
        .then(function (d) { return d.exists ? Object.assign({ id: d.id }, d.data()) : null; });
    },

    // قلب الاستئناف عبر الأجهزة: نلاقي المشارك بالكود الدائم
    findParticipantByCode: function (code) {
      if (!code) return Promise.resolve(null);
      return this.participantsRef().where('result_code', '==', code).limit(1).get()
        .then(function (snap) {
          if (snap.empty) return null;
          var d = snap.docs[0];
          return Object.assign({ id: d.id }, d.data());
        });
    },

    /* ---------- إجابات المشاركين ---------- */
    saveResponse: function (pid, type, data) {
      return this.responsesRef(pid).doc(type).set(
        Object.assign({}, data, {
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }),
        { merge: true }
      );
    },

    getResponse: function (pid, type) {
      return this.responsesRef(pid).doc(type).get()
        .then(function (d) { return d.exists ? d.data() : null; });
    },

    getAllResponses: function (pid) {
      return this.responsesRef(pid).get().then(function (snap) {
        var out = {};
        snap.forEach(function (d) { out[d.id] = d.data(); });
        return out;
      });
    },

    /* ---------- إعادة الضبط (حذف جماعي ثم تهيئة) ---------- */
    resetSession: function () {
      var self = this;
      // نحذف كل المشاركين وردودهم على دفعات، وبعدين نهيّئ الجلسة من جديد
      return self.participantsRef().get().then(function (snap) {
        var chain = Promise.resolve();
        snap.forEach(function (p) {
          chain = chain.then(function () {
            return self.responsesRef(p.id).get().then(function (rsnap) {
              var batch = db.batch();
              rsnap.forEach(function (r) { batch.delete(r.ref); });
              batch.delete(p.ref);
              return batch.commit();
            });
          });
        });
        return chain;
      }).then(function () {
        return self.initSession();
      });
    }
  };

  window.SessionManager   = SessionManager;
  window.WB_SESSION_ID    = SESSION_ID;
  window.WB_COLLECTION    = COLLECTION;
})();
