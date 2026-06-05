/* ============================================================================
   admin.js  —  منطق لوحة المقدّم
   ----------------------------------------------------------------------------
   المقدّم هو العقل المركزي. من هنا بيتنقّل بين المراحل، يشغّل المؤقّت، يشوف
   كام واحد جاوب (نِسَب مجمّعة بس — مفيش إجابة فردية باسم)، ويعيد ضبط الجلسة.
   كل التغييرات بتتكتب في Firebase، فالشاشة والموبايلات بيلتقطوها لحظيًا.
   ========================================================================== */
(function () {
  'use strict';

  var currentSession = null;
  var currentParticipants = [];
  var timerInterval = null;
  var localTimerSeconds = 0;
  var pollTimer = null;
  var refreshing = false, refreshQueued = false;

  var PART_TITLES = {
    0: '⏳ قبل البداية',
    1: '✦ الافتتاح',
    2: '① المنحني',
    3: '② ليه الفجوة بتفضل',
    4: '③ شخّص نفسك',
    5: '④ الطبقة الأعمق',
    6: '✦ الإغلاق'
  };

  /* ---------------- إقلاع ---------------- */
  function bootstrap() {
    if (window.firebaseReady) init();
    else document.addEventListener('firebaseReady', init);
  }

  async function init() {
    createStars(80);
    try { await SessionManager.ensureSession(); }
    catch (e) { console.error('[admin] ensureSession:', e); }

    buildPhaseList();
    bindTimerControls();
    bindNav();
    document.getElementById('resetBtn').addEventListener('click', doReset);

    SessionManager.onSessionChange(handleSessionChange);
    SessionManager.onParticipantsChange(handleParticipantsChange);
  }

  /* ---------------- مستمعو Firebase ---------------- */
  function handleSessionChange(session) {
    currentSession = session;
    highlightPhase(session.currentPhase);
    updateHeader(session.currentPhase);
    syncTimer(session);
    renderPhaseControls(session.currentPhase);
    managePoll(session.currentPhase);
  }

  function handleParticipantsChange(list) {
    currentParticipants = list;
    renderParticipants();
    refreshCounts();
  }

  /* ---------------- الشريط الجانبي ---------------- */
  function buildPhaseList() {
    var list = document.getElementById('phaseList');
    var html = '';
    var lastPart = null;
    SessionData.phaseOrder.forEach(function (pid) {
      var ph = SessionData.phases[pid];
      if (!ph) return;
      if (ph.part !== lastPart) {
        html += '<div class="phase-group-title">' + esc(PART_TITLES[ph.part] || '') + '</div>';
        lastPart = ph.part;
      }
      html += '<div class="phase-item" data-pid="' + pid + '">' + esc(ph.title) + '</div>';
    });
    list.innerHTML = html;
    list.querySelectorAll('.phase-item').forEach(function (it) {
      it.addEventListener('click', function () { goToPhase(it.getAttribute('data-pid')); });
    });
  }

  function highlightPhase(pid) {
    document.querySelectorAll('.phase-item').forEach(function (it) {
      var on = it.getAttribute('data-pid') === pid;
      it.classList.toggle('active', on);
      if (on) it.scrollIntoView({ block: 'nearest' });
    });
  }

  function updateHeader(pid) {
    var ph = SessionData.phases[pid] || {};
    document.getElementById('nowPhase').textContent = ph.title || '—';
    document.getElementById('nowBlock').textContent = ph.block || (pid === 'waiting' ? 'قبل البداية' : '');
  }

  function goToPhase(pid) {
    SessionManager.setPhase(pid).catch(function (e) { console.error(e); showToast('تعذّر الانتقال', 'error'); });
  }

  /* ---------------- التنقّل أمام/خلف ---------------- */
  function bindNav() {
    document.getElementById('prevBtn').addEventListener('click', function () { step(-1); });
    document.getElementById('nextBtn').addEventListener('click', function () { step(1); });
  }
  function step(dir) {
    var cur = currentSession ? currentSession.currentPhase : 'waiting';
    var i = SessionData.phaseOrder.indexOf(cur);
    if (i < 0) i = 0;
    var n = Math.max(0, Math.min(SessionData.phaseOrder.length - 1, i + dir));
    goToPhase(SessionData.phaseOrder[n]);
  }

  /* ---------------- المؤقّت ---------------- */
  function bindTimerControls() {
    document.querySelectorAll('#timerPresets [data-min]').forEach(function (b) {
      b.addEventListener('click', function () {
        var sec = parseInt(b.getAttribute('data-min'), 10) * 60;
        SessionManager.startTimer(sec);   // يضبط ويشغّل فورًا
      });
    });
    document.getElementById('startPauseBtn').addEventListener('click', toggleTimer);
    document.getElementById('resetTimerBtn').addEventListener('click', function () {
      SessionManager.setTimer(0);
    });
  }

  function toggleTimer() {
    if (!currentSession) return;
    if (currentSession.timerRunning) {
      // إيقاف مؤقّت: نكتب المتبقّي عشان الاستئناف يكمّل من نفس النقطة
      SessionManager.setTimer(localTimerSeconds);
    } else {
      if ((currentSession.timerSeconds || 0) <= 0) { showToast('اختار مدّة الأول', 'error'); return; }
      SessionManager.startTimer();        // يكمّل من المتبقّي
    }
  }

  function syncTimer(session) {
    var btn = document.getElementById('startPauseBtn');
    if (session.timerRunning && session.timerSeconds > 0) {
      var elapsed = session.timerStartedAt ? Math.floor((Date.now() - session.timerStartedAt) / 1000) : 0;
      localTimerSeconds = Math.max(0, session.timerSeconds - elapsed);
      startLocalTimer();
      if (btn) btn.textContent = 'إيقاف';
    } else if (session.timerSeconds > 0) {
      localTimerSeconds = session.timerSeconds;
      updateTimerDisplay(); stopLocalTimer();
      if (btn) btn.textContent = 'تشغيل';
    } else {
      localTimerSeconds = 0;
      updateTimerDisplay(); stopLocalTimer();
      if (btn) btn.textContent = 'تشغيل';
    }
  }

  function startLocalTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(function () {
      if (localTimerSeconds > 0) { localTimerSeconds--; updateTimerDisplay(); }
      else { stopLocalTimer(); }   // وصل صفر — نسيب 00:00 ظاهرة
    }, 1000);
  }
  function stopLocalTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

  function updateTimerDisplay() {
    var el = document.getElementById('timerDisplay'); if (!el) return;
    el.textContent = pad(Math.floor(localTimerSeconds / 60)) + ':' + pad(localTimerSeconds % 60);
    el.classList.remove('warning', 'danger');
    if (localTimerSeconds <= 30 && localTimerSeconds > 0) el.classList.add('danger');
    else if (localTimerSeconds <= 60 && localTimerSeconds > 0) el.classList.add('warning');
  }

  /* ---------------- تحكّمات المرحلة ---------------- */
  function renderPhaseControls(pid) {
    var ph = SessionData.phases[pid] || {};
    var box = document.getElementById('phaseControls');
    var html = '<div class="card ctrl-card"><h3>' + esc(ph.title || '') + '</h3>';

    if (ph.headline) html += '<p class="soft mb-1" style="font-size:1.05rem;">' + esc(ph.headline) + '</p>';
    if (ph.participantPrompt) html += '<p class="muted" style="font-size:.85rem;">📱 على الموبايل: ' + esc(ph.participantPrompt) + '</p>';

    var ix = ph.interaction;
    if (ix) {
      html += '<div class="divider"></div>';
      html += '<div class="stat-row">' +
        '<div class="stat-pill"><div class="label">جاوبوا</div><div class="stat-big gold-text" id="answeredCount">0</div></div>' +
        '<div class="stat-pill"><div class="label">الحاضرين</div><div class="stat-big" id="totalCount">' + currentParticipants.length + '</div></div>' +
        '</div>';
      html += '<div id="ctrlDist"></div>';
      html += '<p class="muted" style="font-size:.8rem;margin-top:10px;">النتيجة المجمّعة بتظهر على شاشة العرض لوحدها — إنت اتكلّم، الشاشة بتساعد.</p>';
    } else {
      html += '<p class="muted" style="font-size:.85rem;margin-top:8px;">مرحلة عرض. الشاشة الكبيرة بتعرض الإشارة، وإنت صاحب الكلام.</p>';
    }
    html += '</div>';
    box.innerHTML = html;
    refreshCounts();
  }

  /* ---------------- العدّادات المجمّعة ---------------- */
  function managePoll(pid) {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    var ph = pid ? SessionData.phases[pid] : null;
    if (ph && ph.interaction) {
      pollTimer = setInterval(refreshCounts, 4000);
      refreshCounts();
    }
  }

  async function fetchAggregates() {
    var agg = {
      total: currentParticipants.length,
      answered: { lastwell: 0, curve_self: 0, diagnostic: 0, charter: 0 },
      lastwell: {},
      types: { burned: 0, starved: 0, repressed: 0 }
    };
    for (var i = 0; i < currentParticipants.length; i++) {
      var p = currentParticipants[i];
      var r;
      try { r = await SessionManager.getAllResponses(p.id); } catch (e) { r = {}; }
      if (r.lastwell && r.lastwell.choice) {
        agg.answered.lastwell++;
        agg.lastwell[r.lastwell.choice] = (agg.lastwell[r.lastwell.choice] || 0) + 1;
      }
      if (r.curve_self && r.curve_self.success && r.curve_self.wellbeing) agg.answered.curve_self++;
      if (r.diagnostic && r.diagnostic.result) {
        agg.answered.diagnostic++;
        var t = r.diagnostic.result.type;
        if (agg.types[t] != null) agg.types[t]++;
      }
      if (r.charter && (r.charter.touched || r.charter.discovered || r.charter.question)) agg.answered.charter++;
    }
    return agg;
  }

  async function refreshCounts() {
    var pid = currentSession ? currentSession.currentPhase : null;
    var ph = pid ? SessionData.phases[pid] : null;
    if (!ph || !ph.interaction) return;
    if (refreshing) { refreshQueued = true; return; }
    refreshing = true;
    var agg;
    try { agg = await fetchAggregates(); } finally { refreshing = false; }

    var key = ph.interaction.type === 'single-choice' ? 'lastwell'
            : ph.interaction.type === 'two-scales'    ? 'curve_self'
            : ph.interaction.type === 'diagnostic'    ? 'diagnostic'
            : 'charter';

    var ac = document.getElementById('answeredCount');
    var tc = document.getElementById('totalCount');
    if (ac) ac.textContent = agg.answered[key] || 0;
    if (tc) tc.textContent = agg.total;

    var dist = document.getElementById('ctrlDist');
    if (dist) {
      if (ph.interaction.type === 'single-choice') dist.innerHTML = lastwellBars(agg);
      else if (ph.interaction.type === 'diagnostic') dist.innerHTML = typeBars(agg);
      else dist.innerHTML = '';
    }

    if (refreshQueued) { refreshQueued = false; refreshCounts(); }
  }

  function lastwellBars(agg) {
    var opts = SessionData.lastwellOptions;
    var total = 0; opts.forEach(function (o) { total += agg.lastwell[o.id] || 0; });
    var h = '<div class="mt-2">';
    opts.forEach(function (o) {
      var n = agg.lastwell[o.id] || 0;
      var pct = total ? Math.round(n / total * 100) : 0;
      h += '<div class="bar-mini"><span class="bm-label">' + esc(o.label) + '</span>' +
           '<span class="bm-track"><span class="bm-fill" style="width:' + pct + '%"></span></span>' +
           '<span class="bm-num">' + n + '</span></div>';
    });
    return h + '</div>';
  }

  function typeBars(agg) {
    var T = SessionData.types;
    var total = agg.types.burned + agg.types.starved + agg.types.repressed;
    var h = '<div class="mt-2">';
    ['burned', 'starved', 'repressed'].forEach(function (k) {
      var n = agg.types[k];
      var pct = total ? Math.round(n / total * 100) : 0;
      h += '<div class="bar-mini"><span class="bm-label">' + esc(T[k].ar) + '</span>' +
           '<span class="bm-track"><span class="bm-fill" style="width:' + pct + '%;background:' + T[k].color + '"></span></span>' +
           '<span class="bm-num">' + n + '</span></div>';
    });
    return h + '</div>';
  }

  /* ---------------- شبكة المشاركين ---------------- */
  function renderParticipants() {
    var grid = document.getElementById('participantsGrid');
    var cnt = document.getElementById('participantCount');
    cnt.textContent = '(' + currentParticipants.length + ')';
    if (!currentParticipants.length) {
      grid.innerHTML = '<p class="muted" style="font-size:.85rem;">لسه محدّش دخل.</p>';
      return;
    }
    var now = Date.now();
    grid.innerHTML = currentParticipants.map(function (p) {
      var seen = (p.lastSeen && p.lastSeen.toMillis) ? p.lastSeen.toMillis() : 0;
      var diff = now - seen;
      var cls = (seen && diff < 35000) ? 'online' : (seen && diff < 125000) ? 'idle' : '';
      return '<div class="participant-card"><span class="dot-status ' + cls + '"></span>' +
             '<span class="pname">' + esc(p.name || '—') + '</span></div>';
    }).join('');
  }

  /* ---------------- إعادة الضبط ---------------- */
  function doReset() {
    if (!confirm('متأكد؟ ده هيمسح كل المشاركين وإجاباتهم ويبدأ الجلسة من جديد. مفيش رجوع.')) return;
    var btn = document.getElementById('resetBtn');
    btn.disabled = true; btn.textContent = 'بنمسح…';
    SessionManager.resetSession()
      .then(function () { showToast('✅ تمّت إعادة الضبط'); })
      .catch(function (e) { console.error(e); showToast('خطأ في إعادة الضبط', 'error'); })
      .then(function () { btn.disabled = false; btn.textContent = 'إعادة ضبط الجلسة'; });
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
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  bootstrap();
})();
