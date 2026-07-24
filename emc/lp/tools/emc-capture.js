/* ═══════════════════════════════════════════════════════════════
   emc-capture.js — التقاط العملاء + نتائجهم (create-only, fail-safe)
   يكتب في emc-crm/emc_leads فقط. لا يقرأ قاعدة البيانات إطلاقًا.
   - save(payload): كتابة سجل واحد بأمان.
   - autowatch(tool): يراقب ظهور النتيجة، يسحب ملخّصها من لينك
     الواتساب (من غير ما يلمس كود الأداة)، ويسجّله.
   لو Firebase وقع → بيرجع بهدوء ومبيوقفش أي حاجة في الصفحة.
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
      _db = firebase.firestore(); return _db;
    } catch (e) { return null; }
  }
  function stamp() {
    try {
      if (firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp)
        return firebase.firestore.FieldValue.serverTimestamp();
    } catch (e) {}
    return new Date().toISOString();
  }
  function identity() {
    try { return JSON.parse(sessionStorage.getItem('emc_lead') || '{}') || {}; }
    catch (e) { return {}; }
  }
  // يسحب نص رسالة الواتساب من لينك النتيجة (فيه الدرجة/النوع/التفاصيل)
  function extractResult(scope) {
    try {
      var a = (scope || document).querySelector('a[href*="wa.me"]');
      if (!a) return '';
      var href = a.getAttribute('href') || '';
      var m = href.split('text=')[1];
      if (!m) return '';
      var txt = decodeURIComponent(m.split('&')[0]);
      return txt.replace(/^[^\n]*👋?\n*/, '').replace(/\n+حاب[^\n]*$/, '').trim();
    } catch (e) { return ''; }
  }
  var API = {
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
      } catch (e) { return Promise.resolve(false); }
    },
    autowatch: function (tool) {
      try {
        var res = document.getElementById('result');
        if (!res) return;
        var id = identity();
        var fired = false;
        function fire() {
          if (fired) return; fired = true;
          setTimeout(function () {
            API.save({
              source: 'tool_complete',
              tool: tool,
              toolTitle: document.title,
              resultSummary: extractResult(res),
              name: id.name || '',
              mobile: id.mobile || '',
              company: id.company || '',
              email: id.email || '',
              leadId: id.leadId || ''
            });
          }, 120);
        }
        var mo = new MutationObserver(function () {
          if (!res.classList.contains('hidden') && res.children.length) { fire(); mo.disconnect(); }
        });
        mo.observe(res, { attributes: true, childList: true });
      } catch (e) {}
    }
  };
  window.EMCLeadCapture = API;
})();
