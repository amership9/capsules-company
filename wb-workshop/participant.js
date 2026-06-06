/* ============================================================================
   participant.js  —  منطق شاشة المشارك (الموبايل)
   ----------------------------------------------------------------------------
   • تسجيل باسم وهمي + موافقة سرّية.
   • طبقة الحفظ بالكود (إجبارية): كود دائم يُكتب في الرابط + localStorage +
     مستند المشارك، فالمشارك يرجع لنفس مكانه من أي جهاز.
   • بيتبع المقدّم لحظيًا: كل مرحلة يا تفاعل يا «إشارة» مصغّرة على الموبايل.

   ── الإضافات الجديدة (٣ طلبات) ───────────────────────────────────────────
   (١) «رحلتي»: زرار ثابت فوق + زرار في الإغلاق، بيفتح طبقة فيها كل اللي
       عمله المشارك خلال الرحلة (آخر مرة بخير، نقطته، تشخيصه، ميثاقه، كوده).
       بتتبني من state.responses المحفوظة محليًا — صفر قراءات زيادة من
       الفايرستور، فآمنة تمامًا على الباقة المجانية. ومفيش قواعد أمان جديدة
       لازم تتنشر — بنقرا نفس الـ subcollection اللي بنكتب فيه أصلًا.

   (٢) دعوة الكورس (CTA): بتظهر في الإغلاق وجوّه «رحلتي» — بعد اللحظة
       الوجدانية، مش وسطها. الرابط بييجي من SessionData.courseUrl لو موجود،
       وإلا الافتراضي تحت.

   (٣) كروت الإشارة: بدل «وجّه انتباهك للشاشة» في سلايدات العرض، المشارك بيشوف
       خلاصة بنيوية مصغّرة معنونة «إشارة — الكلام مع المقدّم».

   ── الترقية: التقرير الشخصي العميق ───────────────────────────────────────
   نتيجة التشخيص بقت تقرير بطبقات (buildDiagnosticReportHTML) بيُستخدم في
   مكانين بنفس الشكل: البطاقة الحيّة بعد التشخيص + قسم «تشخيصك» في «رحلتي».
   بيسطّح بيانات كانت بتتحسب وتتضيّع: درجات المستويات الثلاثة، درجة الثقة،
   ويضيف: منحناك الشخصي (الفجوة بين نجاحك وعافيتك)، القراءة السردية، المحور
   وراء النمط، أول خطوة، طريقك الأقرب، وانعكاسك (q12) بترجعلك بحنان.
   العمق هنا مطلوب — التقرير خاص وعلى الموبايل، فمش بيزاحم المقدّم بالعكس.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- إعدادات قابلة للتعديل ---------------- */
  // المراحل اللي بتفضل «صمت» على الموبايل (الكلام والبصرية على الشاشة بس).
  // ممكن كمان تحطّ mobileSilent:true على المرحلة نفسها في session-data.js.
  var SILENT_PHASES = { open_hook: 1, p4_shadow: 1 };

  // رابط الرحلة الكاملة (البيع). الأفضل تنقله لـ SessionData.courseUrl لاحقًا.
  var DEFAULT_COURSE_URL = 'https://mahmoudfouad25.github.io/fouad-perspective/reignite/';
  function courseUrl() {
    return (window.SessionData && SessionData.courseUrl) || DEFAULT_COURSE_URL;
  }

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
    bindJourney();

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
      // الإغلاق النهائي: الملخّص الشخصي + دعوة الكورس
      if (phaseId === 'close_ayah') { renderFinalTakeaway(mount); return; }

      // «مرآة غرفة القادة»: المشارك يفضل شايف بطاقته الشخصية على موبايله
      if (phaseId === 'p3_results') {
        var diagR = state.responses['diagnostic'];
        if (diagR && diagR.result) { renderResultCard(mount, diagR.result); return; }
        mount.innerHTML = followScreen('🪞', phase.title,
          'لو خلّصت التشخيص، بطاقتك ظهرت قبل كده — تقدر ترجعلها من «رحلتي» فوق. غير كده، وجّه انتباهك للشاشة.');
        return;
      }

      // لحظات الصمت المتعمّدة → الكلام والبصرية على الشاشة بس
      if (isSilent(phaseId, phase)) {
        mount.innerHTML = followScreen('🤍', phase.title, phase.participantPrompt || 'خليك مع الشاشة، في صمت.');
        return;
      }

      // باقي سلايدات العرض → كارت «إشارة» مصغّر (مساعِد مش بديل)
      renderMirror(phase, mount);
      return;
    }

    if (ix.type === 'single-choice')      renderSingleChoice(phase, mount);
    else if (ix.type === 'two-scales')    renderTwoScales(phase, mount);
    else if (ix.type === 'diagnostic')    renderDiagnostic(phase, mount);
    else if (ix.type === 'charter')       renderCharter(phase, mount);
    else mount.innerHTML = followScreen('👁️', phase.title, phase.participantPrompt || '');
  }

  function isSilent(pid, phase) {
    return (phase && phase.mobileSilent === true) || !!SILENT_PHASES[pid];
  }

  function followScreen(ico, title, sub) {
    return '<div class="p-follow fade-in">' +
      '<div class="ico">' + ico + '</div>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p class="muted">' + esc(sub) + '</p></div>';
  }

  /* ========================================================================
     (٣) كروت الإشارة — خلاصة بنيوية مصغّرة لكل سلايد عرض
     بتقرا من نفس مصدر الحقيقة (SessionData) فمفيش تكرار للمحتوى.
     ====================================================================== */
  function renderMirror(phase, mount) {
    mount.innerHTML =
      '<div class="p-card mirror-card fade-in">' +
        '<div class="mirror-kicker">' + esc(phase.block || phase.title || '') + '</div>' +
        '<div class="mirror-headline">' + esc(phase.headline || phase.title) + '</div>' +
        (phase.sub ? '<p class="mirror-sub">' + esc(phase.sub) + '</p>' : '') +
        mirrorInner(phase) +
        '<p class="mirror-foot">📡 إشارة الشاشة — الكلام مع المقدّم. الكارت ده ليك تقراه أو تصوّره.</p>' +
      '</div>';
  }

  function mirrorInner(phase) {
    var T = SessionData.terms, TY = SessionData.types;
    switch (phase.kind) {
      case 'visual-contrast': {
        var L = phase.left || {}, R = phase.right || {};
        return twoCol(L.tag, L.en, L.note, R.tag, R.en, R.note, true);
      }
      case 'visual-mirror-arrow': {
        var M = phase.mirror || {}, A = phase.arrow || {};
        return twoCol(M.tag, M.en, M.note, A.tag, A.en, A.note, true);
      }
      case 'visual-doors': {
        var dA = phase.doorA || {}, dB = phase.doorB || {};
        return twoCol(dA.tag, '', dA.note, dB.tag, '', dB.note, false);
      }
      case 'visual-levels': {
        return miniList(['energy', 'relationship', 'meaning'].map(function (k, i) {
          return (i + 1) + '.  ' + T[k].ar + ' · ' + T[k].en;
        }));
      }
      case 'visual-types': {
        return ['burned', 'starved', 'repressed'].map(function (k) {
          var t = TY[k];
          return '<div class="mirror-row" style="border-color:' + t.color + '40">' +
            '<div class="mr-name" style="color:' + t.color + '">' + esc(t.ar) +
              ' <small class="en">' + esc(t.en) + '</small></div>' +
            '<div class="mr-note">' + esc(t.essence) + '</div></div>';
        }).join('');
      }
      case 'visual-immunity': {
        var ex = phase.example || {};
        return miniList([ex.stated, ex.hidden, ex.assumption]);
      }
      case 'visual-layers': {
        var inner = miniList([
          'الجذر · ' + T.hiddenCommitment.ar,
          'الشرارة · ' + T.trigger.ar,
          'السطح · ' + T.filters.ar
        ]);
        if (phase.filters && phase.filters.length) {
          inner += '<div class="mirror-chips">' +
            phase.filters.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') +
            '</div>';
        }
        return inner;
      }
      case 'visual-axes': {
        return ['cohesion', 'vitality', 'belonging'].map(function (k) {
          var ax = SessionData.axes[k] || {};
          return '<div class="mirror-row">' +
            '<div class="mr-name gold-text">' + esc(T[k].ar) + ' <small class="en">' + esc(T[k].en) + '</small></div>' +
            '<div class="mr-note">' + esc(ax.question || '') + '</div></div>';
        }).join('');
      }
      case 'visual-iceberg': {
        return miniList([
          'الظاهر — المحور اللي بتقود بيه',
          'المدفون — بيشوّه المحور الرئيسي من تحت'
        ]);
      }
      case 'visual-paths': {
        return '<div class="mirror-chips paths">' +
          (phase.paths || []).map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') +
          '</div>';
      }
      // المنحني والخطّاف: العنوان + الـsub كفاية (مفيش تفاصيل زيادة)
      case 'visual-curve':
      case 'visual-curve-bend':
      case 'statement-hero':
      default:
        return '';
    }
  }

  function twoCol(t1, e1, n1, t2, e2, n2, contrast) {
    return '<div class="mirror-two' + (contrast ? ' contrast' : '') + '">' +
      '<div class="m2-side">' +
        '<div class="m2-tag gold-text">' + esc(t1) + '</div>' +
        (e1 ? '<div class="en m2-en">' + esc(e1) + '</div>' : '') +
        '<div class="m2-note">' + esc(n1) + '</div></div>' +
      '<div class="m2-side">' +
        '<div class="m2-tag' + (contrast ? '' : ' gold-text') + '"' + (contrast ? ' style="color:#ff8f8c"' : '') + '>' + esc(t2) + '</div>' +
        (e2 ? '<div class="en m2-en">' + esc(e2) + '</div>' : '') +
        '<div class="m2-note">' + esc(n2) + '</div></div>' +
      '</div>';
  }

  function miniList(items) {
    return '<div class="mirror-list">' +
      items.filter(Boolean).map(function (x) { return '<div class="ml-item">' + esc(x) + '</div>'; }).join('') +
      '</div>';
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
        typeTally: result.typeTally,
        spectrum: result.spectrum, erodedLevel: result.erodedLevel,
        levelScores: result.levelScores,
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

  /* ========================================================================
     التقرير الشخصي العميق — مصدر واحد يخدم البطاقة الحيّة و«رحلتي»
     ====================================================================== */

  // تفسير الفجوة بين النجاح والعافية (نقطة المشارك من curve_self)
  function gapInterpret(s, w) {
    var gap = s - w;
    var label = gap > 0 ? 'الفجوة = ' + gap + ' درجات'
              : gap < 0 ? 'العافية أعلى بـ ' + (-gap) + ' درجات'
              : 'متطابقين تمامًا';
    var note = gap >= 4 ? 'فجوة كبيرة — نجاحك سابق عافيتك بمسافة. ده أعلى صوت تحذير، وأهدأ ما يكون.'
             : gap >= 2 ? 'فجوة متوسطة — بدأت تبين، ودلوقتي أرخص وقت تتعامل معاها.'
             : gap <= -1 ? 'رصيد داخلي قوي — عافيتك أعلى من نجاحك الظاهر. ابنِ عليه.'
             : 'اتزان نادر — نجاحك وعافيتك قريّبين، حافظ عليه بوعي.';
    return { label: label, note: note };
  }

  // منحناك الشخصي: عمودان (نجاح/عافية) + قراءة الفجوة — تجسيد «الاحتراق مسافة»
  function personalGapHTML(s, w) {
    var gi = gapInterpret(s, w);
    return '<div class="gap-viz">' +
      gapBar('النجاح الظاهر', s, 'gold') +
      gapBar('العافية الداخلية', w, 'sky') +
      '<div class="gap-meta"><span class="gap-num">' + esc(gi.label) + '</span>' +
        '<span class="gap-note">' + esc(gi.note) + '</span></div>' +
    '</div>';
  }
  function gapBar(label, v, cls) {
    var pct = Math.max(0, Math.min(100, Math.round(Number(v) / 10 * 100)));
    return '<div class="gap-row"><div class="gap-h"><span>' + esc(label) + '</span>' +
      '<b>' + esc(v) + '/10</b></div>' +
      '<div class="gap-track"><div class="gap-fill ' + cls + '" style="width:' + pct + '%"></div></div></div>';
  }

  // بروفايل المستويات الثلاثة — يسطّح levelScores، ويعلّم الأكثر تآكلًا
  function levelsProfileHTML(scores, eroded) {
    var L = SessionData.levels;
    var order = ['energy', 'relationship', 'meaning'];
    var html = '<div class="lvl-profile">';
    order.forEach(function (k) {
      if (!scores || scores[k] == null) return;
      var pct = Math.max(6, Math.min(100, Math.round(Number(scores[k]) / 10 * 100)));
      var isEroded = (k === eroded);
      html += '<div class="lvl-row' + (isEroded ? ' eroded' : '') + '">' +
        '<div class="lvl-h"><span>' + esc(L[k].ar) + ' <small class="en">' + esc(L[k].en) + '</small></span>' +
          (isEroded ? '<span class="lvl-tag">الأكثر تآكلًا</span>' : '') + '</div>' +
        '<div class="lvl-track"><div class="lvl-fill' + (isEroded ? ' is-eroded' : '') + '" style="width:' + pct + '%"></div></div>' +
      '</div>';
    });
    return html + '</div>';
  }

  function confidenceNote(conf) {
    if (conf === 'مبدئية') return 'إجاباتك توزّعت على أكتر من نمط — يعني فيك أكتر من طبقة شغّالة، وده طبيعي جدًا. خد النتيجة كبداية حوار مع نفسك، مش ختام.';
    if (conf === 'متوسطة') return 'نمطك واضح، ومعاه لمسة من نمط تاني — طبيعي إن الإنسان يبقى فيه أكتر من طبقة في وقت واحد.';
    return 'إجاباتك متّسقة حوالين نمط واحد — الصورة واضحة بدرجة كبيرة.';
  }

  function reportSection(kicker, inner) {
    return '<div class="report-sec"><div class="report-kicker sm">' + esc(kicker) + '</div>' + inner + '</div>';
  }

  // القلب: يبني تقرير التشخيص الكامل. curve اختياري (لو موجود يرسم المنحنى الشخصي).
  function buildDiagnosticReportHTML(r, curve) {
    if (!r) return '';
    var t = SessionData.types[r.type] || {};
    var rd = SessionData.buildReading(r);
    var html = '';

    // رأس البطاقة
    html += '<div class="report-head">' +
      '<div class="report-kicker">أقرب نمط ليك دلوقتي</div>' +
      '<div class="report-type" style="color:' + t.color + '">' + esc(t.ar) + '</div>' +
      '<div class="en">' + esc(t.en) + '</div>' +
      (r.typeConfidence ? '<span class="conf-chip">دقة الصورة: ' + esc(r.typeConfidence) + '</span>' : '') +
      (t.essence ? '<p class="report-essence">' + esc(t.essence) + '</p>' : '') +
    '</div>';

    // منحناك الشخصي (لو عندنا نقطته من curve_self)
    if (curve && curve.success && curve.wellbeing) {
      html += reportSection('منحناك إنت — الفجوة بين خطين',
        personalGapHTML(curve.success, curve.wellbeing));
    }

    // قراءة في حالتك (نوع + طيف + مستوى، فقرة متصلة)
    if (rd.paragraph) {
      html += reportSection('قراءة في حالتك',
        '<p class="reading-p">' + esc(rd.paragraph) + '</p>');
    }

    // بروفايل المستويات الثلاثة
    if (r.levelScores) {
      var lv = SessionData.levels[r.erodedLevel] || {};
      html += reportSection('بروفايل المستويات الثلاثة',
        levelsProfileHTML(r.levelScores, r.erodedLevel) +
        (lv.note ? '<p class="sec-note">' + esc(lv.note) + '</p>' : ''));
    }

    // المحور وراء النمط + أول خطوة
    if (rd.axisLine || rd.firstStep) {
      var inner = '';
      if (rd.axisLine) inner += '<p class="reading-p">' + esc(rd.axisLine) + '</p>';
      if (rd.firstStep) inner += '<div class="step-line"><span class="step-k">أول خطوة</span>' + esc(rd.firstStep) + '</div>';
      html += reportSection('المحور اللي ورا النمط', inner);
    }

    // طريقك الأقرب
    if (rd.paths && rd.paths.length) {
      html += reportSection('طريقك الأقرب',
        '<p class="sec-note">من طرق محور ' + esc(rd.axis.ar || '') + ' — دي أقرب الطرق لمكان فجوتك:</p>' +
        '<div class="mirror-chips">' +
          rd.paths.map(function (p) { return '<span>' + esc(p.name) + '</span>'; }).join('') +
        '</div>');
    }

    // ملاحظة الثقة
    if (r.typeConfidence) {
      html += '<p class="conf-note">' + esc(confidenceNote(r.typeConfidence)) + '</p>';
    }

    // انعكاسك (q12) — بترجعلك بحنان
    if (r.reflection) {
      html += reportSection('اللي قلته لحياتك الداخلية',
        '<div class="reflect-quote">«' + esc(r.reflection) + '»</div>' +
        '<p class="sec-note">الكلمة دي ليك إنت. خدها معاك.</p>');
    }

    return html;
  }

  function renderResultCard(mount, r) {
    var curve = state.responses['curve_self'];
    mount.innerHTML = '<div class="p-card result-card fade-in">' +
      buildDiagnosticReportHTML(r, curve) +
      '<p class="muted" style="font-size:.8rem;margin-top:14px;text-align:center;">تقدر ترجع لبطاقتك دي في أي وقت من «رحلتي» فوق.</p>' +
    '</div>';
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
      html += '<div class="mt-2 muted">نمطك</div>' +
        '<div class="result-type" style="color:' + t.color + ';font-size:1.5rem">' + esc(t.ar) + '</div>' +
        (t.essence ? '<p class="muted" style="font-size:.92rem;max-width:34ch;margin:6px auto 0;line-height:1.7;">' + esc(t.essence) + '</p>' : '');
    }

    html += '<button class="btn btn-gold btn-block btn-large mt-3" id="openJourneyBtn">📋 شوف تقريرك الكامل</button>';

    if (state.code) {
      html += '<div class="mt-3 muted">كودك — مفتاحك لو حبيت ترجع:</div>';
      html += '<div class="mt-1"><span class="code-chip">' + esc(state.code) + '</span></div>';
    }
    html += '<p class="muted mt-2" style="font-size:.85rem">احتفظ بالرابط ده — بيفتح من أي جهاز.</p>';

    if (courseUrl()) {
      html += '<div class="divider"></div>';
      html += '<p class="muted" style="font-size:.88rem;">النهارده كانت لمحة. لو حابب تكمّل التشخيص والطريق بعمق:</p>';
      html += '<a class="btn btn-outline btn-block mt-1" href="' + esc(courseUrl()) + '" target="_blank" rel="noopener">تعرف أكتر على الرحلة الكاملة ↗</a>';
    }

    html += '</div>';
    mount.innerHTML = html;

    var b = document.getElementById('openJourneyBtn');
    if (b) b.addEventListener('click', openJourney);
  }

  /* ========================================================================
     (١) رحلتي — الطبقة المنبثقة (بتتبني من state.responses، صفر قراءات زيادة)
     ====================================================================== */
  function bindJourney() {
    var btn = document.getElementById('journeyBtn');
    if (btn) btn.addEventListener('click', openJourney);

    var close = document.getElementById('summaryClose');
    if (close) close.addEventListener('click', closeJourney);

    var ov = document.getElementById('summaryOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) closeJourney(); });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeJourney(); });
  }

  function openJourney() {
    var body = document.getElementById('summaryBody');
    if (body) body.innerHTML = buildJourneyHTML();
    var ov = document.getElementById('summaryOverlay');
    if (ov) ov.classList.remove('hidden');
  }
  function closeJourney() {
    var ov = document.getElementById('summaryOverlay');
    if (ov) ov.classList.add('hidden');
  }

  function hasAnyResponse(r) {
    return !!(r && (
      (r.lastwell && r.lastwell.choice) ||
      (r.curve_self && r.curve_self.success && r.curve_self.wellbeing) ||
      (r.diagnostic && r.diagnostic.result) ||
      (r.charter && (r.charter.touched || r.charter.discovered || r.charter.question))
    ));
  }

  function jrSection(title, innerHTML) {
    return '<div class="jr-section"><div class="jr-title">' + esc(title) + '</div>' +
      '<div class="jr-body">' + innerHTML + '</div></div>';
  }

  function buildJourneyHTML() {
    var r = state.responses || {};
    var html = '';

    html += '<div class="jr-head">' +
      '<h2 class="gold-text">رحلتك — زي ما عشتها</h2>' +
      '<p class="muted">ده اللي اشتغلت عليه مع نفسك النهارده. محدّش شافه باسمك.</p></div>';

    // آخر مرة بخير
    if (r.lastwell && r.lastwell.choice) {
      var opt = SessionData.lastwellOptions.filter(function (o) { return o.id === r.lastwell.choice; })[0];
      html += jrSection('آخر مرة حسّيت إنك بخير من جوّه',
        '<div class="jr-line"><b>' + esc(opt ? opt.label : '—') + '</b></div>');
    }

    // نقطة المنحني
    if (r.curve_self && r.curve_self.success && r.curve_self.wellbeing) {
      var s = r.curve_self.success, w = r.curve_self.wellbeing;
      html += jrSection('نقطتك على المنحني', personalGapHTML(s, w));
    }

    // التشخيص — التقرير الكامل (من غير المنحنى، لأنه ظهر فوق في قسم النقطة)
    if (r.diagnostic && r.diagnostic.result) {
      html += jrSection('تشخيصك الكامل', buildDiagnosticReportHTML(r.diagnostic.result, null));
    }

    // الميثاق
    if (r.charter && (r.charter.touched || r.charter.discovered || r.charter.question)) {
      var c = r.charter, cb = '';
      if (c.touched)    cb += '<div class="jr-line"><span class="jr-k">أكتر لحظة لمستك:</span><br>' + esc(c.touched) + '</div>';
      if (c.discovered) cb += '<div class="jr-line"><span class="jr-k">اكتشفت إنه بيشتغل جوّاك:</span><br>' + esc(c.discovered) + '</div>';
      if (c.question)   cb += '<div class="jr-line"><span class="jr-k">السؤال اللي ماشي بيه:</span><br>' + esc(c.question) + '</div>';
      html += jrSection('ميثاقك الذاتي', cb);
    }

    // لو لسه في الأول
    if (!hasAnyResponse(r)) {
      html += '<div class="jr-section"><div class="jr-body"><p class="muted">لسه الرحلة في أولها — كل ما تجاوب على موبايلك، هتلاقيه هنا.</p></div></div>';
    }

    // الكود
    if (state.code) {
      html += '<div class="jr-section jr-code"><div class="jr-title">كودك — مفتاحك للرجوع</div>' +
        '<div class="code-chip">' + esc(state.code) + '</div>' +
        '<p class="muted" style="font-size:.8rem;margin-top:8px;">افتح الرابط من أي جهاز وهتلاقي رحلتك زي ما هي.</p></div>';
    }

    // دعوة الكورس (٢)
    if (courseUrl()) {
      html += '<div class="jr-cta">' +
        '<div class="jr-cta-title">الرحلة الكاملة</div>' +
        '<p class="muted" style="font-size:.88rem;">النهارده كانت لمحة. لو حابب تكمّل بعمق — اعرف أكتر عن الرحلة الكاملة.</p>' +
        '<a class="btn btn-gold btn-block mt-1" href="' + esc(courseUrl()) + '" target="_blank" rel="noopener">تعرف أكتر ↗</a>' +
        '</div>';
    }

    return html;
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
