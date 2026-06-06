/* ============================================================================
   display.js  —  منطق شاشة العرض (البروجكتور)  ·  النسخة السينمائية
   ----------------------------------------------------------------------------
   • مفيش تحكّم بشري عليها. بتتبع المقدّم لحظيًا عبر onSessionChange بس.
   • خطوط ضخمة، عناصر كبيرة، حركة مدروسة — مناسبة للمشاهدة من بُعد.
   • المبدأ الحاكم: الشاشة "مساعِدة مش بديلة". كل مرحلة = إشارة واحدة قوية
     (عنوان كبير + بصرية واحدة تتنفّس). المقدّم هو صاحب الكلام، مش الشاشة.
     عشان كده النصوص قليلة عمدًا — البصرية بتكبّر اللحظة، مش بتزاحم المقدّم.
   • التجميعات الحية (بولة الغرفة / سحابة النقاط / توزيع الأنواع) بتتحسب من
     ردود المشاركين المجمّعة — بدون أي اسم، بدون أي إجابة فردية.

   ملاحظة على آلية التحديث: ردود lastwell و curve_self بتتكتب في الـ subcollection
   من غير ما تلمس مستند المشارك، فمستمع المشاركين مش بيتنبّه ليها. عشان كده
   بنعمل poll كل 4 ثوانٍ في مراحل التجميع — بالظبط زي ما بتعمل لوحة المقدّم.

   ── ملاحظة على الترقية البصرية ──────────────────────────────────────────
   كل أسماء الدوال والـIDs اللي بتستهلكها المُحدّثات (barsBox / typedistBox /
   cloudCanvas / cloudCount / diagCount / diagTotal) زي ما هي. اللي اتغيّر هو
   "شكل" كل مرحلة بس: SVG أغنى، أيقونات خطّية، عمق، إضاءة، وحركة دخول مُنسّقة.
   ========================================================================== */
(function () {
  'use strict';

  var currentSession    = null;
  var currentPhaseId    = null;
  var currentParticipants = [];
  var currentAgg        = null;

  var timerInterval     = null;
  var localTimerSeconds = 0;

  var pollTimer         = null;
  var refreshing        = false, refreshQueued = false;

  var cloudChart        = null;
  var cloudPhase        = null;
  var svgSeq            = 0;   // عشان IDs الـ gradients ما تتعارضش

  var AGG_KINDS = {
    'interaction-bars': 1, 'interaction-cloud': 1, 'interaction-diagnostic': 1,
    'visual-typedist': 1, 'visual-shadow-cloud': 1
  };

  /* ---------------- إقلاع ---------------- */
  function bootstrap() {
    if (window.firebaseReady) init();
    else document.addEventListener('firebaseReady', init);
  }

  function init() {
    createStars(160);
    enableFullscreenOnClick();

    if (window.Chart) {
      Chart.defaults.font.family = 'Tajawal, sans-serif';
      Chart.defaults.color = '#9aa4c4';
    }

    SessionManager.onSessionChange(handleSessionChange);
    SessionManager.onParticipantsChange(handleParticipantsChange);
  }

  /* ---------------- ملء الشاشة عند أول نقرة ---------------- */
  function enableFullscreenOnClick() {
    document.addEventListener('click', function () {
      try {
        if (document.fullscreenEnabled && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function () {});
        }
      } catch (e) {}
    }, { once: true });
  }

  /* ---------------- مستمعو Firebase ---------------- */
  function handleSessionChange(session) {
    currentSession = session;
    currentPhaseId = session.currentPhase;
    syncTimer(session);
    renderPhase(session.currentPhase);
    managePoll(session.currentPhase);
  }

  function handleParticipantsChange(list) {
    currentParticipants = list;
    var ph = SessionData.phases[currentPhaseId];
    if (!ph) return;
    if (currentPhaseId === 'waiting') renderWaiting(ph);
    else if (AGG_KINDS[ph.kind]) refreshAggregates();
  }

  /* ---------------- المؤقّت (استقبال فقط) ---------------- */
  function syncTimer(session) {
    if (session.timerRunning && session.timerSeconds > 0) {
      var elapsed = session.timerStartedAt ? Math.floor((Date.now() - session.timerStartedAt) / 1000) : 0;
      localTimerSeconds = Math.max(0, session.timerSeconds - elapsed);
      startLocalTimer();
      showTimer();
    } else if (session.timerSeconds > 0) {
      localTimerSeconds = session.timerSeconds;
      updateTimerDisplay(); stopLocalTimer(); showTimer();
    } else {
      hideTimer(); stopLocalTimer();
    }
  }
  function startLocalTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(function () {
      if (localTimerSeconds > 0) { localTimerSeconds--; updateTimerDisplay(); }
      else stopLocalTimer();
    }, 1000);
  }
  function stopLocalTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
  function showTimer() { var el = document.getElementById('displayTimer'); if (el) el.classList.remove('hidden'); }
  function hideTimer() { var el = document.getElementById('displayTimer'); if (el) el.classList.add('hidden'); }
  function updateTimerDisplay() {
    var el = document.getElementById('displayTimer'); if (!el) return;
    el.textContent = pad(Math.floor(localTimerSeconds / 60)) + ':' + pad(localTimerSeconds % 60);
    el.classList.remove('warning', 'danger');
    if (localTimerSeconds <= 30 && localTimerSeconds > 0) el.classList.add('danger');
    else if (localTimerSeconds <= 60 && localTimerSeconds > 0) el.classList.add('warning');
  }

  /* ========================================================================
     الموجّه — كل kind له شكل عرض
     ====================================================================== */
  function renderPhase(phaseId) {
    destroyCharts();
    var stage = document.getElementById('stage');
    var ph = SessionData.phases[phaseId];

    if (!ph || phaseId === 'waiting') { renderWaiting(ph || SessionData.phases.waiting); return; }

    switch (ph.kind) {
      case 'statement-hero':       stage.innerHTML = heroScaffold(ph); break;
      case 'interaction-bars':     stage.innerHTML = barsScaffold(ph);  refreshAggregates(); break;
      case 'visual-curve':         stage.innerHTML = curveScaffold(ph, false); break;
      case 'visual-contrast':      stage.innerHTML = contrastScaffold(ph); break;
      case 'visual-levels':        stage.innerHTML = levelsScaffold(ph); break;
      case 'visual-curve-bend':    stage.innerHTML = curveScaffold(ph, true); break;
      case 'interaction-cloud':    stage.innerHTML = cloudScaffold(ph); refreshAggregates(); break;
      case 'visual-types':         stage.innerHTML = typesScaffold(ph); break;
      case 'visual-immunity':      stage.innerHTML = immunityScaffold(ph); break;
      case 'visual-layers':        stage.innerHTML = layersScaffold(ph); break;
      case 'visual-mirror-arrow':  stage.innerHTML = mirrorArrowScaffold(ph); break;
      case 'interaction-diagnostic': stage.innerHTML = diagnosticScaffold(ph); refreshAggregates(); break;
      case 'visual-typedist':      stage.innerHTML = typedistScaffold(ph); refreshAggregates(); break;
      case 'visual-axes':          stage.innerHTML = axesScaffold(ph); break;
      case 'visual-iceberg':       stage.innerHTML = icebergScaffold(ph); break;
      case 'visual-shadow-cloud':  stage.innerHTML = cloudScaffold(ph); refreshAggregates(); break;
      case 'visual-paths':         stage.innerHTML = pathsScaffold(ph); break;
      case 'interaction-charter':  stage.innerHTML = charterScaffold(ph); break;
      case 'visual-doors':         stage.innerHTML = doorsScaffold(ph); break;
      case 'visual-ayah':          stage.innerHTML = ayahScaffold(ph); break;
      default:                     stage.innerHTML = heroScaffold(ph);
    }
  }

  function destroyCharts() {
    if (cloudChart) { try { cloudChart.destroy(); } catch (e) {} cloudChart = null; cloudPhase = null; }
  }

  /* ---------------- أيقونات خطّية (currentColor) ---------------- */
  function icon(name, size) {
    var s = size || 30;
    var open = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
    var body = '';
    switch (name) {
      case 'flame':   body = '<path d="M12 3c2.5 3.6 4.6 5.3 4.6 8.6a4.6 4.6 0 1 1-9.2 0c0-1.4.6-2.5 1.5-3.4C10 9.6 11.4 6 12 3Z"/>'; break;
      case 'ember':   body = '<path d="M12 8c1.4 1.8 2.4 2.8 2.4 4.5a2.4 2.4 0 1 1-4.8 0c0-.8.4-1.4.9-1.9"/><path d="M5 20h14" stroke-dasharray="2 3"/>'; break;
      case 'mask':    body = '<path d="M6 5h12v5a6 6 0 0 1-12 0Z"/><path d="M9.2 9.2c.6.6 1.4.6 2 0M12.8 9.2c.6.6 1.4.6 2 0"/>'; break;
      case 'shield':  body = '<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6Z"/>'; break;
      case 'pulse':   body = '<path d="M3 12h4l2-6 4 12 2-6h6"/>'; break;
      case 'belong':  body = '<circle cx="9" cy="10" r="3.2"/><circle cx="15" cy="10" r="3.2"/><path d="M4 19a5 5 0 0 1 10 0M10 19a5 5 0 0 1 10 0"/>'; break;
      case 'door':    body = '<rect x="6" y="3" width="12" height="18" rx="1.5"/><circle cx="14.5" cy="12" r="1"/>'; break;
      default:        body = '<circle cx="12" cy="12" r="8"/>';
    }
    return open + body + '</svg>';
  }

  /* ---------------- لبنات نصية ---------------- */
  function kicker(t)  { return t ? '<div class="display-kicker fade-in">' + esc(t) + '</div>' : ''; }
  function headline(t){
    return '<div class="rise-in d1"><h1 class="display-headline gold-shimmer">' + esc(t) + '</h1></div>';
  }
  function hero(t)    {
    return '<div class="rise-in d1"><h1 class="display-hero gold-shimmer">' + esc(t) + '</h1></div>';
  }
  function sub(t)     { return t ? '<p class="display-sub fade-up d3">' + esc(t) + '</p>' : ''; }

  /* ---------------- waiting ---------------- */
  function renderWaiting(ph) {
    var stage = document.getElementById('stage');
    var n = currentParticipants.length;
    var join = n
      ? '<p class="display-sub fade-up d3">انضمّ <b class="gold-text">' + n + '</b> ' + (n === 1 ? 'مشارك' : 'مشاركين') + '</p>'
      : '<p class="display-sub fade-up d3">افتحوا الرابط على موبايلاتكم… مستنيينكم.</p>';
    stage.innerHTML =
      '<div class="text-center">' +
        '<div class="badge fade-in">Executive Master Camp</div>' +
        '<div class="rise-in d1"><h1 class="display-hero gold-shimmer" style="margin-top:22px;">' + esc(ph.title || 'العافية') + '</h1></div>' +
        '<div class="en fade-up d2" style="font-size:1.8rem;">' + esc(ph.titleEn || 'Inner Wellbeing') + '</div>' +
        (ph.subtitle ? '<p class="display-sub fade-up d3">' + esc(ph.subtitle) + '</p>' : '') +
        join +
      '</div>';
  }

  /* ---------------- statement-hero (الخطّاف) ---------------- */
  function heroScaffold(ph) {
    return '<div class="text-center">' +
      kicker(ph.title) +
      hero(ph.headline || ph.title) +
      sub(ph.sub) +
      '</div>';
  }

  /* ---------------- المنحني (SVG) ---------------- */
  function curveScaffold(ph, bend) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="viz rise-in d2">' + buildCurveSVG(bend) + '</div>' +
      sub(ph.sub) +
      '</div>';
  }

  function buildCurveSVG(bend) {
    var id = ++svgSeq;
    var gGold = 'gg' + id, gSky = 'gs' + id, gGap = 'gp' + id, glow = 'gl' + id;

    var success = bend
      ? 'M80,358 C280,330 460,150 600,120 C730,96 820,182 880,300'
      : 'M80,360 C300,330 520,162 880,92';
    var well = bend
      ? 'M80,352 C260,338 420,250 560,256 C700,262 800,302 880,346'
      : 'M80,374 C300,362 520,320 880,300';
    var gap = bend
      ? 'M80,358 C280,330 460,150 600,120 C730,96 820,182 880,300 L880,346 C800,302 700,262 560,256 C420,250 260,338 80,352 Z'
      : 'M80,360 C300,330 520,162 880,92 L880,300 C520,320 300,362 80,374 Z';

    var sLabelY = bend ? 286 : 70;
    var sEnY    = bend ? 306 : 90;
    var wLabelY = bend ? 360 : 296;
    var wEnY    = bend ? 380 : 316;

    var grid = '';
    [120, 200, 280, 360].forEach(function (y) {
      grid += '<line x1="80" y1="' + y + '" x2="880" y2="' + y + '" stroke="rgba(255,255,255,0.045)" stroke-width="1"/>';
    });

    return '' +
    '<svg viewBox="0 0 960 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="منحنى النجاح مقابل العافية">' +
      '<defs>' +
        '<linearGradient id="' + gGold + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#b8893a"/><stop offset="0.6" stop-color="#e8c069"/><stop offset="1" stop-color="#f8e3ab"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gSky + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#3f6e8e"/><stop offset="1" stop-color="#6db5e8"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gGap + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#e8c069" stop-opacity="0.34"/>' +
          '<stop offset="1" stop-color="#e8c069" stop-opacity="0.02"/>' +
        '</linearGradient>' +
        '<filter id="' + glow + '" x="-20%" y="-40%" width="140%" height="180%">' +
          '<feGaussianBlur stdDeviation="5" result="b"/>' +
          '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
      '</defs>' +
      grid +
      // خط الأرض
      '<line x1="80" y1="400" x2="880" y2="400" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>' +
      // الفجوة المظللة
      '<path d="' + gap + '" fill="url(#' + gGap + ')" class="fill-soft"/>' +
      // خط العافية
      '<path d="' + well + '" fill="none" stroke="url(#' + gSky + ')" stroke-width="5" stroke-linecap="round" filter="url(#' + glow + ')" class="draw-path delay"/>' +
      // خط النجاح
      '<path d="' + success + '" fill="none" stroke="url(#' + gGold + ')" stroke-width="6.5" stroke-linecap="round" filter="url(#' + glow + ')" class="draw-path"/>' +
      // نقاط النهاية
      '<circle cx="880" cy="' + (bend ? 300 : 92) + '" r="7" fill="#f8e3ab" class="fill-soft"/>' +
      '<circle cx="880" cy="' + (bend ? 346 : 300) + '" r="6" fill="#9fd2f5" class="fill-soft"/>' +
      // تسميات
      '<text x="868" y="' + sLabelY + '" text-anchor="end" fill="#f6dca0" font-size="23" font-weight="800" font-family="Tajawal" class="label-pop l1">النجاح الظاهر</text>' +
      '<text x="868" y="' + sEnY + '" text-anchor="end" fill="#b8893a" font-size="15" font-style="italic" font-family="Cormorant Garamond,serif" class="label-pop l1">Visible Success</text>' +
      '<text x="868" y="' + wLabelY + '" text-anchor="end" fill="#6db5e8" font-size="23" font-weight="800" font-family="Tajawal" class="label-pop l2">العافية الداخلية</text>' +
      '<text x="868" y="' + wEnY + '" text-anchor="end" fill="#3f6e8e" font-size="15" font-style="italic" font-family="Cormorant Garamond,serif" class="label-pop l2">Inner Wellbeing</text>' +
      // محور الزمن
      '<text x="480" y="432" text-anchor="middle" fill="#838eb3" font-size="15" font-family="Tajawal" class="fill-soft">الزمن · المسيرة ←</text>' +
    '</svg>';
  }

  /* ---------------- الإرهاق ≠ الاحتراق ---------------- */
  function contrastScaffold(ph) {
    var L = ph.left || {}, R = ph.right || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="contrast-grid rise-in d2">' +
        '<div class="contrast-side mirror">' +
          '<div class="tag gold-text">' + esc(L.tag) + '</div>' +
          '<span class="en-label en">' + esc(L.en) + '</span>' +
          '<p class="soft">' + esc(L.note) + '</p>' +
        '</div>' +
        '<div class="vs-emblem">vs</div>' +
        '<div class="contrast-side arrow">' +
          '<div class="tag" style="color:#ff8f8c">' + esc(R.tag) + '</div>' +
          '<span class="en-label en">' + esc(R.en) + '</span>' +
          '<p class="soft">' + esc(R.note) + '</p>' +
        '</div>' +
      '</div></div>';
  }

  /* ---------------- المستويات الثلاثة ---------------- */
  function levelsScaffold(ph) {
    var T = SessionData.terms;
    var order = ['energy', 'relationship', 'meaning'];
    var rows = '';
    order.forEach(function (k, i) {
      var t = T[k];
      rows += '<div class="level-item rise-in d' + (i + 1) + '">' +
        '<div class="ln">' + (i + 1) + '</div>' +
        '<div class="lh"><h3 class="gold-text">' + esc(t.ar) + ' <small class="en">' + esc(t.en) + '</small></h3></div>' +
        '</div>';
    });
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="levels-stack">' + rows + '</div></div>';
  }

  /* ---------------- الأنواع الثلاثة ---------------- */
  function typesScaffold(ph) {
    var T = SessionData.types;
    var glyphs = { burned: 'flame', starved: 'ember', repressed: 'mask' };
    var order = ['burned', 'starved', 'repressed'];
    var cards = '';
    order.forEach(function (k, i) {
      var t = T[k];
      cards += '<div class="type-card t-' + k + ' rise-in d' + (i + 1) + '">' +
        '<div class="glyph">' + icon(glyphs[k], 30) + '</div>' +
        '<h3 style="color:' + t.color + '">' + esc(t.ar) + '</h3>' +
        '<div class="ten en">' + esc(t.en) + '</div>' +
        '<div class="ess">' + esc(t.essence) + '</div>' +
        '<div class="threeam">' + esc(t.threeAm) + '</div>' +
        '</div>';
    });
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) + sub(ph.sub) +
      '<div class="types-grid">' + cards + '</div></div>';
  }

  /* ---------------- الالتزام المخفي (immunity) ---------------- */
  function immunityScaffold(ph) {
    var ex = ph.example || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="immunity-grid">' +
        '<div class="imm-box rise-in d1">' + esc(ex.stated) + '</div>' +
        '<div class="imm-box hidden-c rise-in d2">' + esc(ex.hidden) + '</div>' +
        '<div class="imm-box assump rise-in d3">' + esc(ex.assumption) + '</div>' +
      '</div></div>';
  }

  /* ---------------- التريجر والفلاتر (layers) ---------------- */
  function layersScaffold(ph) {
    var T = SessionData.terms;
    var filters = (ph.filters || []).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('');
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="layers-stack">' +
        '<div class="layer-box root rise-in d1"><div class="lt">الجذر · ساكن</div><div class="lm">' + esc(T.hiddenCommitment.ar) + ' <small class="en">' + esc(T.hiddenCommitment.en) + '</small></div></div>' +
        '<div class="layer-box spark rise-in d2"><div class="lt">الشرارة · لما حد يلمس الجذر</div><div class="lm">' + esc(T.trigger.ar) + ' <small class="en">' + esc(T.trigger.en) + '</small></div></div>' +
        '<div class="layer-box surface rise-in d3"><div class="lt">السطح · بتشتعل</div><div class="lm">' + esc(T.filters.ar) + ' <small class="en">' + esc(T.filters.en) + '</small></div>' +
          '<div class="filters-list">' + filters + '</div></div>' +
      '</div></div>';
  }

  /* ---------------- النقد: مرآة ≠ سهم ---------------- */
  function mirrorArrowScaffold(ph) {
    var M = ph.mirror || {}, A = ph.arrow || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="contrast-grid rise-in d2">' +
        '<div class="contrast-side mirror">' +
          '<div class="tag gold-text">' + esc(M.tag) + '</div>' +
          '<span class="en-label en">' + esc(M.en) + '</span>' +
          '<p class="soft">' + esc(M.note) + '</p>' +
        '</div>' +
        '<div class="vs-emblem">↔</div>' +
        '<div class="contrast-side arrow">' +
          '<div class="tag" style="color:#ff8f8c">' + esc(A.tag) + '</div>' +
          '<span class="en-label en">' + esc(A.en) + '</span>' +
          '<p class="soft">' + esc(A.note) + '</p>' +
        '</div>' +
      '</div></div>';
  }

  /* ---------------- المحاور الثلاثة ---------------- */
  function axesScaffold(ph) {
    var T = SessionData.terms;
    var order = ['cohesion', 'vitality', 'belonging'];
    var glyphs = { cohesion: 'shield', vitality: 'pulse', belonging: 'belong' };
    var qs = { cohesion: 'هل أنا بخير وآمن؟', vitality: 'هل أنا حيّ فعلًا؟', belonging: 'هل ليّ مكان بين الناس؟' };
    var cards = '';
    order.forEach(function (k, i) {
      var t = T[k];
      cards += '<div class="axis-card rise-in d' + (i + 1) + '">' +
        '<div class="axis-ring gold-text">' + icon(glyphs[k], 28) + '</div>' +
        '<h3 class="gold-text">' + esc(t.ar) + '</h3>' +
        '<div class="aen en">' + esc(t.en) + '</div>' +
        '<div class="aq">' + esc(qs[k]) + '</div>' +
        '</div>';
    });
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="axes-grid">' + cards + '</div></div>';
  }

  /* ---------------- الجبل الجليدي (SVG) ---------------- */
  function icebergScaffold(ph) {
    var id = ++svgSeq;
    var gTip = 'it' + id, gMass = 'im' + id;
    var svg = '' +
      '<svg viewBox="0 0 720 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="الجبل الجليدي">' +
        '<defs>' +
          '<linearGradient id="' + gTip + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#f8e3ab"/><stop offset="1" stop-color="#b8893a"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gMass + '" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#5a7fb8" stop-opacity="0.55"/>' +
            '<stop offset="1" stop-color="#2a3f6e" stop-opacity="0.15"/>' +
          '</linearGradient>' +
        '</defs>' +
        // الكتلة تحت الماء
        '<path d="M300,196 L420,196 L476,300 L406,430 L300,442 L222,330 L268,232 Z" fill="url(#' + gMass + ')" stroke="rgba(109,181,232,0.35)" stroke-width="1.5" class="fill-soft"/>' +
        // القمة فوق الماء
        '<path d="M360,70 L300,196 L420,196 Z" fill="url(#' + gTip + ')" class="rise-in d1"/>' +
        // خط الماء
        '<line x1="40" y1="196" x2="680" y2="196" stroke="#6db5e8" stroke-width="2" stroke-dasharray="7 7" opacity="0.75"/>' +
        '<text x="56" y="188" fill="#9fd2f5" font-size="14" font-family="Cormorant Garamond,serif" font-style="italic">waterline</text>' +
        // تسميات
        '<text x="360" y="140" text-anchor="middle" fill="#1a1304" font-size="16" font-weight="800" font-family="Tajawal">الظاهر</text>' +
        '<text x="349" y="320" text-anchor="middle" fill="#cfe0f5" font-size="17" font-weight="800" font-family="Tajawal">المدفون</text>' +
      '</svg>';
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="iceberg-viz rise-in d2">' + svg + '</div>' +
      (ph.sub ? '<p class="iceberg-cap fade-up d3">' + esc(ph.sub) + '</p>' : '') +
      '</div>';
  }

  /* ---------------- لمحة الطريق ---------------- */
  function pathsScaffold(ph) {
    var chips = (ph.paths || []).map(function (p, i) {
      return '<div class="path-chip rise-in d' + ((i % 5) + 1) + '">' + esc(p) + '</div>';
    }).join('');
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="paths-grid">' + chips + '</div></div>';
  }

  /* ---------------- الميثاق (شاشة صمت) ---------------- */
  function charterScaffold(ph) {
    return '<div class="text-center">' +
      kicker(ph.title) +
      '<div class="silence-mark fade-in">🤍</div>' +
      headline(ph.headline) +
      '<p class="display-sub fade-up d3">مساحة صمت — كل واحد بيكتب لنفسه على موبايله.</p>' +
      '</div>';
  }

  /* ---------------- البابان ---------------- */
  function doorsScaffold(ph) {
    var A = ph.doorA || {}, B = ph.doorB || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="doors-grid">' +
        '<div class="door rise-in d1"><div class="door-ico gold-text">' + icon('door', 34) + '</div><div class="dt">' + esc(A.tag) + '</div><div class="dn">' + esc(A.note) + '</div></div>' +
        '<div class="door rise-in d2"><div class="door-ico gold-text">' + icon('door', 34) + '</div><div class="dt">' + esc(B.tag) + '</div><div class="dn">' + esc(B.note) + '</div></div>' +
      '</div></div>';
  }

  /* ---------------- الآية ---------------- */
  function ayahScaffold(ph) {
    return '<div class="text-center w-full">' +
      '<div class="ayah-box rise-in d1">' +
        '<div class="ayah ayah-font">﴿ ' + esc(ph.ayah) + ' ﴾</div>' +
      '</div>' +
      '<p class="display-sub fade-up d3" style="margin-top:14px;">' + esc(ph.headline) + '</p>' +
      '</div>';
  }

  /* ========================================================================
     مراحل التجميع الحيّ — scaffold + تحديث بدون إعادة بناء (عشان مفيش رفرفة)
     ====================================================================== */

  function barsScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="typedist rise-in d2" id="barsBox"><p class="muted">في انتظار الإجابات…</p></div>' +
      '</div>';
  }

  function cloudScaffold(ph) {
    var title = ph.cloudTitle || 'غرفة القادة';
    var note = ph.note ? '<p class="display-sub fade-up d3" style="max-width:42ch;">' + esc(ph.note) + '</p>' : '';
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="muted mt-1 fade-in d2" style="font-size:1.15rem;">' + esc(title) + ' · <span id="cloudCount">0</span> نقطة</div>' +
      '<div class="chart-wrap tall rise-in d2"><canvas id="cloudCanvas"></canvas></div>' +
      '<div class="cloud-legend fade-up d3">' +
        '<span>🟡 فجوة بسيطة</span><span>🟠 فجوة متوسطة</span><span>🔴 فجوة كبيرة</span><span>🔵 العافية أعلى</span>' +
      '</div>' + note + '</div>';
  }

  function diagnosticScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) + sub(ph.sub) +
      '<div class="gold-shimmer bigcount rise-in d2" style="margin-top:24px;">' +
        '<span id="diagCount">0</span>' +
      '</div>' +
      '<div class="bigcount-sub fade-up d3"><span id="diagTotal">0</span> في الغرفة خلّصوا التشخيص</div>' +
      '</div>';
  }

  function typedistScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) + sub(ph.sub) +
      '<div class="typedist rise-in d2" id="typedistBox"><p class="muted">لسه محدّش خلّص التشخيص.</p></div>' +
      '</div>';
  }

  /* ---------------- إدارة الـ poll ---------------- */
  function managePoll(phaseId) {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    var ph = phaseId ? SessionData.phases[phaseId] : null;
    if (ph && AGG_KINDS[ph.kind]) {
      pollTimer = setInterval(refreshAggregates, 4000);
    }
  }

  /* ---------------- جلب التجميعات ---------------- */
  function fetchAggregates() {
    var agg = {
      total: currentParticipants.length,
      answered: { lastwell: 0, curve_self: 0, diagnostic: 0, charter: 0 },
      lastwell: {},
      points: [],
      types: { burned: 0, starved: 0, repressed: 0 }
    };
    var jobs = currentParticipants.map(function (p) {
      return SessionManager.getAllResponses(p.id).then(function (r) {
        r = r || {};
        if (r.lastwell && r.lastwell.choice) {
          agg.answered.lastwell++;
          agg.lastwell[r.lastwell.choice] = (agg.lastwell[r.lastwell.choice] || 0) + 1;
        }
        if (r.curve_self && r.curve_self.success && r.curve_self.wellbeing) {
          agg.answered.curve_self++;
          agg.points.push({ x: r.curve_self.success, y: r.curve_self.wellbeing });
        }
        if (r.diagnostic && r.diagnostic.result) {
          agg.answered.diagnostic++;
          var t = r.diagnostic.result.type;
          if (agg.types[t] != null) agg.types[t]++;
        }
        if (r.charter && (r.charter.touched || r.charter.discovered || r.charter.question)) {
          agg.answered.charter++;
        }
      }).catch(function () {});
    });
    return Promise.all(jobs).then(function () { return agg; });
  }

  function refreshAggregates() {
    var ph = SessionData.phases[currentPhaseId];
    if (!ph || !AGG_KINDS[ph.kind]) return;
    if (refreshing) { refreshQueued = true; return; }
    refreshing = true;
    fetchAggregates().then(function (agg) {
      currentAgg = agg;
      var cur = SessionData.phases[currentPhaseId];
      if (cur) {
        if (cur.kind === 'interaction-bars') updateBars(agg);
        else if (cur.kind === 'interaction-cloud' || cur.kind === 'visual-shadow-cloud') updateCloud(agg.points);
        else if (cur.kind === 'interaction-diagnostic') updateDiagCount(agg);
        else if (cur.kind === 'visual-typedist') updateTypeDist(agg);
      }
    }).then(null, function () {}).then(function () {
      refreshing = false;
      if (refreshQueued) { refreshQueued = false; refreshAggregates(); }
    });
  }

  /* ---------------- محدّثات العناصر ---------------- */
  function updateBars(agg) {
    var box = document.getElementById('barsBox'); if (!box) return;
    var opts = SessionData.lastwellOptions;
    var total = 0; opts.forEach(function (o) { total += agg.lastwell[o.id] || 0; });
    if (!total) { box.innerHTML = '<p class="muted">في انتظار الإجابات…</p>'; return; }
    var h = '';
    opts.forEach(function (o) {
      var n = agg.lastwell[o.id] || 0, pct = total ? Math.round(n / total * 100) : 0;
      h += '<div class="td-row"><div class="td-head">' +
        '<span class="name">' + esc(o.label) + '</span>' +
        '<span class="pct gold-text">' + pct + '%</span></div>' +
        '<div class="td-track"><div class="td-fill" style="width:' + pct + '%;background:linear-gradient(90deg,var(--gold-dark),var(--gold-light));box-shadow:0 0 18px rgba(232,192,105,.4)"></div></div></div>';
    });
    box.innerHTML = h;
  }

  function updateTypeDist(agg) {
    var box = document.getElementById('typedistBox'); if (!box) return;
    var T = SessionData.types;
    var order = ['burned', 'starved', 'repressed'];
    var total = agg.types.burned + agg.types.starved + agg.types.repressed;
    if (!total) { box.innerHTML = '<p class="muted">لسه محدّش خلّص التشخيص.</p>'; return; }
    var h = '';
    order.forEach(function (k) {
      var n = agg.types[k], pct = total ? Math.round(n / total * 100) : 0;
      h += '<div class="td-row"><div class="td-head">' +
        '<span class="name" style="color:' + T[k].color + '">' + esc(T[k].ar) +
          ' <small class="en" style="font-size:.7em;">' + esc(T[k].en) + '</small></span>' +
        '<span class="pct" style="color:' + T[k].color + '">' + pct + '%</span></div>' +
        '<div class="td-track"><div class="td-fill f-' + k + '" style="width:' + pct + '%"></div></div></div>';
    });
    box.innerHTML = h;
  }

  function updateDiagCount(agg) {
    var c = document.getElementById('diagCount'); var t = document.getElementById('diagTotal');
    if (c) c.textContent = agg.answered.diagnostic;
    if (t) t.textContent = agg.total;
  }

  function pointColor(p) {
    var gap = p.x - p.y;          // النجاح ناقص العافية
    if (gap >= 4)  return '#ef5350';
    if (gap >= 2)  return '#ffa726';
    if (gap <= -1) return '#6db5e8';
    return '#e8c069';
  }

  // بلَجِن صغير: يرسم "خط الاتزان" (y=x) ويظلّل منطقة الفجوة تحته بخفّة
  var balanceLine = {
    id: 'balanceLine',
    beforeDatasetsDraw: function (chart) {
      var ctx = chart.ctx, xs = chart.scales.x, ys = chart.scales.y;
      if (!xs || !ys) return;
      var x0 = xs.getPixelForValue(0), x10 = xs.getPixelForValue(10);
      var y0 = ys.getPixelForValue(0), y10 = ys.getPixelForValue(10);
      ctx.save();
      // منطقة الفجوة (النجاح > العافية) — المثلث أسفل القطر
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x10, y0); ctx.lineTo(x10, y10); ctx.closePath();
      ctx.fillStyle = 'rgba(232,192,105,0.055)';
      ctx.fill();
      // القطر (خط الاتزان)
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x10, y10);
      ctx.strokeStyle = 'rgba(109,181,232,0.45)';
      ctx.lineWidth = 2; ctx.setLineDash([7, 7]); ctx.stroke();
      ctx.restore();
    }
  };

  function updateCloud(points) {
    var canvas = document.getElementById('cloudCanvas'); if (!canvas) return;
    var cc = document.getElementById('cloudCount'); if (cc) cc.textContent = points.length;
    if (!window.Chart) return;

    var colors = points.map(pointColor);

    if (cloudChart && cloudPhase === currentPhaseId) {
      cloudChart.data.datasets[0].data = points;
      cloudChart.data.datasets[0].pointBackgroundColor = colors;
      cloudChart.update('none');
      return;
    }
    if (cloudChart) { try { cloudChart.destroy(); } catch (e) {} }
    cloudChart = new Chart(canvas, {
      type: 'scatter',
      data: { datasets: [{
        data: points,
        pointBackgroundColor: colors,
        pointBorderColor: 'rgba(255,255,255,0.30)',
        pointBorderWidth: 2,
        pointRadius: 10, pointHoverRadius: 11
      }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        layout: { padding: 6 },
        scales: {
          x: {
            min: 0, max: 10,
            title: { display: true, text: 'النجاح الظاهر ←', color: '#f6dca0', font: { size: 16, weight: '700' } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { stepSize: 2, color: '#9aa4c4' }
          },
          y: {
            min: 0, max: 10,
            title: { display: true, text: 'العافية الداخلية ↑', color: '#6db5e8', font: { size: 16, weight: '700' } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { stepSize: 2, color: '#9aa4c4' }
          }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      },
      plugins: [balanceLine]
    });
    cloudPhase = currentPhaseId;
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
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  bootstrap();
})();
