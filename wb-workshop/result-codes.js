/* ============================================================================
   result-codes.js  —  مولّد أكواد المشاركين الدائمة
   ----------------------------------------------------------------------------
   كل مشارك بياخد كود من ٨ خانات بصيغة XXXX-XXXX، يبقى هويته الدائمة.
   الكود ده هو اللي بيخلّي المشارك يرجع لنفس مكانه من أي جهاز لو قفل النت
   أو حدّث الصفحة أو غيّر التليفون.
   يصدّر: window.ResultCodes = { randomCode, normalize, format, isValid }
   ========================================================================== */
(function (global) {
  'use strict';

  // ألفبائية بلا أحرف ملتبسة: مفيش O/0 ولا I/1 ولا L
  var ALPHABET  = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  var SEG_LEN   = 4;
  var SEG_COUNT = 2;
  var TOTAL     = SEG_LEN * SEG_COUNT;

  function randomCode() {
    var raw = '';
    if (global.crypto && global.crypto.getRandomValues) {
      var buf = new Uint32Array(TOTAL);
      global.crypto.getRandomValues(buf);              // عشوائية تشفيرية
      for (var i = 0; i < TOTAL; i++) raw += ALPHABET[buf[i] % ALPHABET.length];
    } else {
      // بديل احتياطي نادر الاستخدام
      for (var j = 0; j < TOTAL; j++) {
        raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
    return raw.slice(0, SEG_LEN) + '-' + raw.slice(SEG_LEN);
  }

  function normalize(code) {
    if (!code) return '';
    return String(code)
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, '')
      .replace(/O/g, '0')   // الالتباس بيتحوّل لرمز خارج الألفبائية فيفشل التحقق عمدًا
      .replace(/I/g, '1')
      .replace(/L/g, '1');
  }

  function format(code) {
    var n = normalize(code);
    if (n.length !== TOTAL) return code;
    return n.slice(0, SEG_LEN) + '-' + n.slice(SEG_LEN);
  }

  function isValid(code) {
    var n = normalize(code);
    if (n.length !== TOTAL) return false;
    for (var i = 0; i < n.length; i++) {
      if (ALPHABET.indexOf(n[i]) === -1) return false;
    }
    return true;
  }

  global.ResultCodes = {
    randomCode: randomCode,
    normalize:  normalize,
    format:     format,
    isValid:    isValid
  };
})(window);
