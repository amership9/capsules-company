/* ============================================================================
   participant.js  —  منطق شاشة المشارك (الموبايل)
   ----------------------------------------------------------------------------
   • تسجيل باسم وهمي + موافقة سرّية.
   • طبقة الحفظ بالكود (إجبارية): كود دائم يُكتب في الرابط + localStorage +
     مستند المشارك، فالمشارك يرجع لنفس مكانه من أي جهاز.
   • بيتبع المقدّم لحظيًا: كل مرحلة يا تفاعل يا «وجّه انتباهك للشاشة».

   تحديثات الترابط (مهمة):
     - في «مرآة غرفة القادة» (p3_results) المشارك بيفضل شايف بطاقته الشخصية
       على موبايله — مش شاشة «بصّ للشاشة» — عشان النص بيقوله «دي بطاقتك».
     - تقدّم التشخيص (الإجابات + رقم السؤال) بيتحفظ محليًا أول بأول، فلو قفل
       الموبايل أو اتحدّثت الصفحة وسط الـ12 سؤال، بيرجع لنفس مكانه مش من الصفر.
   ========================================================================== */
(function () {
  'use strict';

  var SAVE_KEY = 'wb_participant_save';
  var state = {
    pid: null,
    name: null,
    code: null,
    currentPhase: 'waiting',
    responses: {},
    diagnosticAnswers: {},   // إجابات الـ12 أثناء الحل
    diagnosticIndex: 0
  };
  var heartbeatTimer = null;

  /* ---------------- إقلاع ---------------- */
  function bootstrap() {
    if (window.firebaseReady) init();
    else document.addEventListener('firebaseReady', init);
  }

  async function init() {
    createStars(60);
    bindRegistration();

    var resumed = await tryResume();
    if (resumed.resumed) {
      enterSession();
    } else {
      showRegistration(resumed.codeFailed);
    }
  }

  /* ---------------- طبقة الحفظ بالكود ---------------- */
  function putCodeInUrl(code) {
    if (!code) return;
    try {
      var url = new URL(location.href);
      if (url.searchParams.get('c') === code) return;
      url.searchParams.set('c', code);
      history.replaceState(null, '', url.toString());
    } catch (e) {}
  }

  function saveLocal() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        pid: state.pid,
        name: state.name,
        code: state.code,
        diagnosticAnswers: state.diagnosticAnswers,
        diagnosticIndex: state.diagnosticIndex,
        savedAt: Date.now()
      }));
    } catch (e) {}
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || (Date.now() - (d.savedAt || 0)) > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(SAVE_KEY); return null;
      }
      return d;
    } catch (e) { return null; }
  }

  // استرجاع تقدّم التشخيص من نفس الجهاز (لو نفس المشارك) — قبل أي حفظ جديد يمسحه
  function restoreLocalDiagnostic() {
    var d = loadLocal();
    if (d && d.pid === state.pid) {
      state.diagnosticAnswers = d.diagnosticAnswers || {};
      var max = SessionData.diagnostic.length - 1;
      var idx = d.diagnosticIndex || 0;
      state.diagnosticIndex = Math.min(Math.max(0, idx), max);
    }
  }

  async function tryResume() {
    var params = new URLSearchParams(location.search);
    var urlCode = params.get('c') || params.get('code');
    var codeFailed = false;

    // (١) كود في الرابط → نلاقي المشارك في Firebase (يدعم أي جهاز)
    if (urlCode && window.ResultCodes && window.ResultCodes.isValid(urlCode)) {
      var code = window.ResultCodes.format(urlCode);
      try {
        var p = await SessionManager.findParticipantByCode(code);
        if (p) {
          state.pid = p.id; state.name = p.name; state.code = code;
          await loadAllResponses();
          restoreLocalDiagnostic();   // لو نفس الجهاز، نرجّع تقدّم التشخيص قبل ما نحفظ فوقه
          saveLocal();
          return { resumed: true, codeFailed: false };
        }
        codeFailed = true;
      } catch (e) { codeFailed = true; }
    }

    // (٢) المحلّية → نتأكد إن المشارك لسه موجود (مش اتمسح في reset)
    var local = loadLocal();
    if (local && local.pid) {
      try {
        var still = await SessionManager.getParticipant(local.pid);
        if (still) {
          state.pid = local.pid; state.name = local.name; state.code = local.code;
          // نرجّع تقدّم التشخيص المحفوظ محليًا
          state.diagnosticAnswers = local.diagnosticAnswers || {};
          var maxQ = SessionData.diagnostic.length - 1;
          state.diagnosticIndex = Math.min(Math.max(0, local.diagnosticIndex || 0), maxQ);
          if (state.code) putCodeInUrl(state.code);
          await loadAllResponses();
          return { resumed: true, codeFailed: false };
        }
        localStorage.removeItem(SAVE_KEY);  // اتمسح في reset
      } catch (e) {}
    }

    return { resumed: false, codeFailed: codeFailed };
  }

  /* ---------------- التسجيل ---------------- */
  function bindRegistration() {
    var btn = document.getElementById('registerBtn');
    var consent = document.getElementById('consentChk');
    var input = document.getElementById('aliasInput');
    if (!btn) return;

    function refresh() {
      btn.disabled = !(input.value.trim().length >= 2 && consent.checked);
    }
    input.addEventListener('input', refresh);
    consent.addEventListener('change', refresh);
    refresh();

    btn.addEventListener('click', doRegister);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !btn.disabled) doRegister(); });

    // مدخل العائدين بالكود
    var codeBtn = document.getElementById('codeOpenBtn');
    var codeInput = document.getElementById('codeInput');
    if (codeInput) {
      codeInput.addEventListener('input', function (e) {
        var v = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
        if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4, 8);
        e.target.value = v;
      });
    }
    if (codeBtn) {
      codeBtn.addEventListener('click', function () {
        var c = (codeInput.value || '').trim();
        if (window.ResultCodes && window.ResultCodes.isValid(c)) {
          location.href = location.pathname + '?c=' + encodeURIComponent(window.ResultCodes.format(c));
        } else {
          showToast('الكود مش صحيح', 'error');
        }
      });
    }
  }

  async function doRegister() {
    var input = document.getElementById('aliasInput');
    var name = input.value.trim();
    if (name.length < 2) return;

    var btn = document.getElementById('registerBtn');
    btn.disabled = true; btn.textContent = 'بنسجّلك…';

    try {
      var code = window.ResultCodes ? window.ResultCodes.randomCode() : null;
      var pid = await SessionManager.registerParticipant(name, code);
      state.pid = pid; state.name = name; state.code = code; state.responses = {};
      state.diagnosticAnswers = {}; state.diagnosticIndex = 0;
      putCodeInUrl(code);
      saveLocal();
      enterSession();
    } catch (e) {
      console.error(e);
      showToast('حصل خطأ في التسجيل، جرّب تاني', 'error');
      btn.disabled = false; btn.textContent = 'ابدأ';
    }
  }

  function showRegistration(codeFailed) {
    document.getElementById('registrationScreen').classList.remove('hidden');
    document.getElementById('dynamicScreen').classList.add('hidden');
    if (codeFailed) showToast('الكود مش موجود — سجّل من جديد', 'error');
  }

  /* ---------------- دخول الجلسة ---------------- */
  function enterSession() {
    document.getElementById('registrationScreen').classList.add('hidden');
    document.getElementById('dynamicScreen').classList.remove('hidden');
    document.getElementById('welcomeName').textContent = state.name || '';

    // عرض شريط الكود/الاستئناف
    var rc = document.getElementById('resumeCode');
    if (rc && state.code) rc.textContent = state.code;

    // heartbeat
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(function () {
      if (state.pid) SessionManager.updateParticipantStatus(state.pid, {}).catch(function () {});
    }, 30000);

    SessionManager.onSessionChange(handleSessionChange);
  }

  function handleSessionChange(session) {
    state.currentPhase = session.currentPhase;
    if (state.pid) SessionManager.updateParticipantStatus(state.pid, { currentPhase: session.currentPhase });
    renderPhase(session.currentPhase);
  }

  async function loadAllResponses() {
    if (!state.pid) return;
    try { state.responses = await SessionManager.getAllResponses(state.pid); }
    catch (e) { state.responses = {}; }
  }

  /* ---------------- الموجّه ---------------- */
  function renderPhase(phaseId) {
    var phase = SessionData.phases[phaseId];
    var mount = document.getElementById('pContent');
    if (!phase || phaseId === 'waiting') {
      mount.innerHTML = followScreen('🕊️', 'تم تسجيلك', 'استنى المقدّم يبدأ. خليك حاضر.');
      return;
    }

    var ix = phase.interaction;
    if (!ix) {
      // «مرآة غرفة القادة»: المشارك يفضل شايف بطاقته الشخصية على موبايله
      if (phaseId === 'p3_results') {
        var diagR = state.responses['diagnostic'];
        if (diagR && diagR.result) { renderResultCard(mount, diagR.result); return; }
      }
      mount.innerHTML = followScreen('👁️', phase.title, phase.participantPrompt || 'وجّه انتباهك للشاشة.');
      // في الإغلاق النهائي نعرض الملخّص الشخصي بدل الإشارة
      if (phaseId === 'close_ayah') renderFinalTakeaway(mount);
      return;
    }

    if (ix.type === 'single-choice')      renderSingleChoice(phase, mount);
    else if (ix.type === 'two-scales')    renderTwoScales(phase, mount);
    else if (ix.type === 'diagnostic')    renderDiagnostic(phase, mount);
    else if (ix.type === 'charter')       renderCharter(phase, mount);
    else mount.innerHTML = followScreen('👁️', phase.title, phase.participantPrompt || '');
  }

  function followScreen(ico, title, sub) {
    return '<div class="p-follow fade-in">' +
      '<div class="ico">' + ico + '</div>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p class="muted">' + esc(sub) + '</p></div>';
  }

  /* ---------------- (1) اختيار واحد — lastwell ---------------- */
  function renderSingleChoice(phase, mount) {
    var ix = phase.interaction;
    var saved = state.responses[ix.saveKey];
    var chosen = saved ? saved.choice : null;

    var html = '<div class="p-card fade-in"><div class="p-q-text">' + esc(phase.headline) + '</div>';
    if (chosen) html += '<div class="saved-pill">✅ تم الحفظ — تقدر تغيّر</div>';
    html += '<div class="choice-list">';
    ix.options.forEach(function (o) {
      html += '<button class="choice' + (chosen === o.id ? ' active' : '') + '" data-id="' + o.id + '">' + esc(o.label) + '</button>';
    });
    html += '</div></div>';
    mount.innerHTML = html;

    mount.querySelectorAll('.choice').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        mount.querySelectorAll('.choice').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        saveSimple(ix.saveKey, { choice: id });
      });
    });
  }

  /* ---------------- (2) مقياسين — curve_self ---------------- */
  function renderTwoScales(phase, mount) {
    var ix = phase.interaction;
    var saved = state.responses[ix.saveKey] || {};
    var valA = saved[ix.scaleA.key] || null;
    var valB = saved[ix.scaleB.key] || null;

    function scaleHtml(s, val) {
      var dots = '';
      for (var i = 1; i <= 10; i++) {
        dots += '<div class="scale-dot' + (val === i ? ' active' : '') + '" data-scale="' + s.key + '" data-val="' + i + '">' + i + '</div>';
      }
      return '<div class="scale-row"><div class="scale-head"><b>' + esc(s.label) + '</b></div>' +
        '<div class="muted" style="font-size:.82rem;margin-bottom:8px;">' + esc(s.sub) + '</div>' +
        '<div class="scale-track">' + dots + '</div>' +
        '<div class="scale-ends"><span>' + esc(s.min) + '</span><span>' + esc(s.max) + '</span></div></div>';
    }

    var html = '<div class="p-card fade-in"><div class="p-q-text">' + esc(phase.headline) + '</div>';
    if (valA && valB) html += '<div class="saved-pill">✅ تم الحفظ — تقدر تعدّل</div>';
    html += scaleHtml(ix.scaleA, valA) + scaleHtml(ix.scaleB, valB) + '</div>';
    mount.innerHTML = html;

    var cur = {}; cur[ix.scaleA.key] = valA; cur[ix.scaleB.key] = valB;

    mount.querySelectorAll('.scale-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        var key = dot.getAttribute('data-scale');
        var v = parseInt(dot.getAttribute('data-val'), 10);
        cur[key] = v;
        mount.querySelectorAll('.scale-dot[data-scale="' + key + '"]').forEach(function (d) { d.classList.remove('active'); });
        dot.classList.add('active');
        if (cur[ix.scaleA.key] && cur[ix.scaleB.key]) {
          var payload = {}; payload[ix.scaleA.key] = cur[ix.scaleA.key]; payload[ix.scaleB.key] = cur[ix.scaleB.key];
          saveSimple(ix.saveKey, payload, true);
        }
      });
    });
  }

  /* ---------------- (3) التشخيص الـ12 ---------------- */
  function renderDiagnostic(phase, mount) {
    var ix = phase.interaction;
    var saved = state.responses[ix.saveKey];

    // لو خلّص قبل كده → اعرض البطاقة
    if (saved && saved.result) { renderResultCard(mount, saved.result); return; }

    var q = SessionData.diagnostic[state.diagnosticIndex];
    var total = SessionData.diagnostic.length;
    var idx = state.diagnosticIndex;

    var html = '<div class="p-card fade-in">';
    html += '<div class="p-q-counter">سؤال ' + (idx + 1) + ' من ' + total + '</div>';
    html += '<div class="progress-bar mb-2"><div class="progress-fill" style="width:' + ((idx) / total * 100) + '%"></div></div>';
    html += '<div class="p-q-text">' + esc(q.text) + '</div>';

    var ans = state.diagnosticAnswers[q.id];

    if (q.kind === 'scale') {
      var dots = '';
      for (var i = 1; i <= 10; i++) dots += '<div class="scale-dot' + (ans === i ? ' active' : '') + '" data-val="' + i + '">' + i + '</div>';
      html += '<div class="scale-track">' + dots + '</div>';
      html += '<div class="scale-ends"><span>' + esc(q.minLabel) + '</span><span>' + esc(q.maxLabel) + '</span></div>';
    } else if (q.kind === 'choice') {
      html += '<div class="choice-list">';
      q.options.forEach(function (o) {
        html += '<button class="choice' + (ans === o.id ? ' active' : '') + '" data-id="' + o.id + '">' + esc(o.label) + '</button>';
      });
      html += '</div>';
    } else if (q.kind === 'open') {
      html += '<textarea class="input" id="openAns" rows="4" placeholder="' + esc(q.placeholder) + '">' + esc(ans || '') + '</textarea>';
    }

    html += '<div class="flex justify-between mt-3">';
    html += idx > 0 ? '<button class="btn btn-ghost btn-sm" id="prevQ">السابق</button>' : '<span></span>';
    var lastQ = (idx === total - 1);
    html += '<button class="btn btn-gold btn-sm" id="nextQ">' + (lastQ ? 'اعرض نتيجتي' : 'التالي') + '</button>';
    html += '</div></div>';
    mount.innerHTML = html;

    // ربط
    mount.querySelectorAll('.scale-dot').forEach(function (d) {
      d.addEventListener('click', function () {
        state.diagnosticAnswers[q.id] = parseInt(d.getAttribute('data-val'), 10);
        mount.querySelectorAll('.scale-dot').forEach(function (x) { x.classList.remove('active'); });
        d.classList.add('active');
        saveLocal();   // حفظ التقدّم محليًا أول بأول
      });
    });
    mount.querySelectorAll('.choice').forEach(function (b) {
      b.addEventListener('click', function () {
        state.diagnosticAnswers[q.id] = b.getAttribute('data-id');
        mount.querySelectorAll('.choice').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        saveLocal();   // حفظ التقدّم محليًا أول بأول
      });
    });
    var openEl = document.getElementById('openAns');
    if (openEl) {
      openEl.addEventListener('input', function () {
        state.diagnosticAnswers[q.id] = openEl.value;
        saveLocal();
      });
    }

    var prev = document.getElementById('prevQ');
    if (prev) prev.addEventListener('click', function () {
      state.diagnosticIndex--; saveLocal(); renderDiagnostic(phase, mount);
    });

    document.getElementById('nextQ').addEventListener('click', function () {
      if (q.kind === 'open') {
        var t = document.getElementById('openAns').value.trim();
        state.diagnosticAnswers[q.id] = t;  // اختياري
      } else if (state.diagnosticAnswers[q.id] === undefined) {
        showToast('اختار إجابة الأول', 'error'); return;
      }
      if (lastQ) finishDiagnostic(ix, mount);
      else { state.diagnosticIndex++; saveLocal(); renderDiagnostic(phase, mount); }
    });
  }

  async function finishDiagnostic(ix, mount) {
    var result = SessionData.scoreDiagnostic(state.diagnosticAnswers);
    var payload = {
      answers: state.diagnosticAnswers,
      result: {
        type: result.type, typeConfidence: result.typeConfidence,
        spectrum: result.spectrum, erodedLevel: result.erodedLevel,
        gap: result.gap, reflection: result.reflection
      }
    };
    state.responses[ix.saveKey] = payload;
    saveLocal();
    try {
      await SessionManager.saveResponse(state.pid, ix.saveKey, payload);
      await SessionManager.updateParticipantStatus(state.pid, { answeredDiagnostic: true });
    } catch (e) { showToast('النتيجة محفوظة محليًا (مشكلة اتصال)', 'error'); }
    renderResultCard(mount, payload.result);
  }

  function renderResultCard(mount, r) {
    var t = SessionData.types[r.type];
    var s = SessionData.spectrum[r.spectrum];
    var l = SessionData.levels[r.erodedLevel];

    var html = '<div class="p-card result-card fade-in">';
    html += '<div class="muted">أقرب نمط ليك دلوقتي</div>';
    html += '<div class="result-type" style="color:' + t.color + '">' + esc(t.ar) + '</div>';
    html += '<div class="en">' + esc(t.en) + '</div>';

    html += '<div class="result-rows">';
    html += '<div class="result-row"><span class="rk">النوع</span><span class="rv">' + esc(t.ar) + ' <small>' + esc(t.en) + '</small></span></div>';
    html += '<div class="result-row"><span class="rk">موقعك على الطيف</span><span class="rv">' + esc(s.ar) + ' <small>' + esc(s.en) + '</small></span></div>';
    html += '<div class="result-row"><span class="rk">أكتر مستوى متآكل</span><span class="rv">' + esc(l.ar) + ' <small>' + esc(l.en) + '</small></span></div>';
    html += '</div>';

    html += '<div class="mirror-note">' + esc(t.mirror) + '</div>';
    html += '</div>';
    mount.innerHTML = html;
  }

  /* ---------------- (4) الميثاق ---------------- */
  function renderCharter(phase, mount) {
    var ix = phase.interaction;
    var saved = state.responses[ix.saveKey] || {};

    var html = '<div class="p-card fade-in"><div class="p-q-text">' + esc(phase.headline) + '</div>';
    html += '<p class="muted mb-2">' + esc(phase.sub) + '</p>';
    if (saved.touched) html += '<div class="saved-pill">✅ ميثاقك محفوظ</div>';
    ix.fields.forEach(function (f) {
      html += '<div class="field"><label>' + esc(f.label) + '</label>' +
        '<textarea class="input" data-key="' + f.key + '" rows="2">' + esc(saved[f.key] || '') + '</textarea></div>';
    });
    html += '<button class="btn btn-gold btn-block mt-1" id="saveCharter">احفظ لنفسي</button></div>';
    mount.innerHTML = html;

    document.getElementById('saveCharter').addEventListener('click', async function () {
      var payload = {};
      mount.querySelectorAll('textarea[data-key]').forEach(function (t) { payload[t.getAttribute('data-key')] = t.value.trim(); });
      if (!payload.touched && !payload.discovered && !payload.question) { showToast('اكتب حاجة لنفسك الأول', 'error'); return; }
      state.responses[ix.saveKey] = payload;
      try { await SessionManager.saveResponse(state.pid, ix.saveKey, payload); showToast('✅ اتحفظ — ده ليك إنت'); }
      catch (e) { showToast('اتحفظ محليًا', 'error'); }
    });
  }

  /* ---------------- الملخّص النهائي (close_ayah) ---------------- */
  function renderFinalTakeaway(mount) {
    var diag = state.responses['diagnostic'];
    var html = '<div class="p-card fade-in text-center">';
    html += '<h2 class="gold-text" style="font-size:1.5rem">شكرًا لصدقك مع نفسك</h2>';

    if (diag && diag.result) {
      var t = SessionData.types[diag.result.type];
      html += '<div class="mt-2 muted">نمطك</div><div class="result-type" style="color:' + t.color + ';font-size:1.5rem">' + esc(t.ar) + '</div>';
    }
    if (state.code) {
      html += '<div class="mt-3 muted">كودك — مفتاحك لو حبيت ترجع:</div>';
      html += '<div class="mt-1"><span class="code-chip">' + esc(state.code) + '</span></div>';
    }
    html += '<p class="muted mt-3" style="font-size:.85rem">احتفظ بالرابط ده — بيفتح من أي جهاز.</p>';
    html += '</div>';
    mount.innerHTML = html;
  }

  /* ---------------- حفظ مبسّط ---------------- */
  async function saveSimple(key, payload, silent) {
    state.responses[key] = payload;
    try {
      await SessionManager.saveResponse(state.pid, key, payload);
      if (!silent) showToast('✅ تم الحفظ');
      else showToast('✅ اتحفظ');
    } catch (e) { showToast('خطأ في الحفظ', 'error'); }
  }

  /* ---------------- أدوات ---------------- */
  function createStars(n) {
    var c = document.getElementById('starsBackground'); if (!c) return;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('div'); var r = Math.random();
      s.className = 'star ' + (r < 0.6 ? 'star-small' : r < 0.9 ? 'star-medium' : 'star-large');
      s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 4 + 's';
      c.appendChild(s);
    }
  }
  var toastTimer = null;
  function showToast(msg, type) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  bootstrap();
})();
