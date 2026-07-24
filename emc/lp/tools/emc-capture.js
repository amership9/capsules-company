/* ═══════════════════════════════════════════════════════════════
   emc-capture.js — التقاط العملاء (create-only, fail-safe)
   يكتب في emc-crm/emc_leads فقط. لا يقرأ قاعدة البيانات إطلاقًا.
   لو Firebase مش محمّل أو الكتابة فشلت → بيرجع بهدوء ومبيوقفش أي حاجة
   في الصفحة (زرار الواتساب والنتيجة بيشتغلوا عادي).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CONFIG = {
    apiKey: "AIzaSyDG8eQaToGjmLx_CczY6Vz1q59GetC-P9E",
    authDomain: "emc-crm.firebaseapp.com",
    projectId: "emc-crm",
    storageBucket: "emc-crm.firebasestorage.app",
    messagingSenderId: "75520877393",
    appId: "1:75520877393:web:71931155b19155ad73e970"
  };

  var _db = null;
  function db() {
    if (_db) return _db;
    if (typeof firebase === 'undefined' || !firebase.firestore) return null;
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(CONFIG);
      _db = firebase.firestore();
      return _db;
    } catch (e) { return null; }
  }

  function stamp() {
    try {
      if (firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp) {
        return firebase.firestore.FieldValue.serverTimestamp();
      }
    } catch (e) {}
    return new Date().toISOString();
  }

  window.EMCLeadCapture = {
    // بيرجع Promise بالـ id لو نجح، أو false لو فشل — من غير ما يرمي أي error
    save: function (payload) {
      try {
        var d = db();
        if (!d) return Promise.resolve(false);
        var rec = Object.assign({}, payload || {}, {
          createdAt: stamp(),
          createdAtISO: new Date().toISOString(),
          page: (location && location.pathname) || '',
          ref: (document && document.referrer) || '',
          ua: (navigator && navigator.userAgent) || '',
          status: 'new'
        });
        return d.collection('emc_leads').add(rec)
          .then(function (r) { return r.id; })
          .catch(function () { return false; });
      } catch (e) {
        return Promise.resolve(false);
      }
    }
  };
})();
