/* ============================================================================
   firebase-config.js  —  إعداد Firebase الخاص بورشة العافية (محلي / مستقل)
   ----------------------------------------------------------------------------
   • نسخة compat (مش ES modules) عشان كل سكربتاتنا بتشتغل على متغيّرات عالمية.
   • مستقل تمامًا عن أي firebase-config في جذر المشروع، فمفيش تصادم مع باقي
     الدورات الشغّالة على نفس مشروع emc-crm.
   • العقد اللي بيوفّره الملف ده لباقي الملفات:
        window.firebase        ← كائن Firebase
        window.db              ← مرجع Firestore
        window.firebaseReady   ← true لما يبقى جاهز
        حدث 'firebaseReady'    ← يتطلق على document لما الكل يبقى تمام
   • SDK لازم يكون متحمّل في <head> قبل الملف ده (نسخة compat).
   ========================================================================== */
(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyDG8eQaToGjmLx_CczY6Vz1q59GetC-P9E",
    authDomain: "emc-crm.firebaseapp.com",
    projectId: "emc-crm",
    storageBucket: "emc-crm.firebasestorage.app",
    messagingSenderId: "75520877393",
    appId: "1:75520877393:web:71931155b19155ad73e970",
    measurementId: "G-ZS8YC5G6XQ"
  };

  function announceReady() {
    window.firebaseReady = true;
    try {
      document.dispatchEvent(new Event('firebaseReady'));
    } catch (e) {
      // متصفّحات قديمة
      var ev = document.createEvent('Event');
      ev.initEvent('firebaseReady', true, true);
      document.dispatchEvent(ev);
    }
  }

  try {
    if (typeof firebase === 'undefined') {
      console.error('[firebase-config] Firebase SDK مش متحمّل. تأكد من سكربتات الـ <head>.');
      window.firebaseReady = false;
      return;
    }

    // ما نهيّئش مرتين لو الملف اتحمّل أكتر من مرة
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    window.firebase = firebase;
    window.db = firebase.firestore();

    announceReady();
    console.log('[firebase-config] Firebase جاهز (مشروع: emc-crm) — كولكشن الورشة: wb_workshop');
  } catch (err) {
    console.error('[firebase-config] فشل التهيئة:', err);
    window.firebaseReady = false;
  }
})();
