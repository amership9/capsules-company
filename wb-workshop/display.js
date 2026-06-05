/* ============================================================================
   display.js  —  منطق شاشة العرض (البروجكتور)
   ----------------------------------------------------------------------------
   • مفيش تحكّم بشري عليها. بتتبع المقدّم لحظيًا عبر onSessionChange بس.
   • خطوط ضخمة، عناصر كبيرة، مناسبة للمشاهدة من بُعد.
   • المبدأ الحاكم: الشاشة "مساعِدة مش بديلة". كل مرحلة = إشارة واحدة قوية
     (عنوان كبير + بصرية بسيطة). المقدّم هو صاحب الكلام، مش الشاشة.
   • التجميعات الحية (بولة الغرفة / سحابة النقاط / توزيع الأنواع) بتتحسب من
     ردود المشاركين المجمّعة — بدون أي اسم، بدون أي إجابة فردية.

   ملاحظة على آلية التحديث: ردود lastwell و curve_self بتتكتب في الـ subcollection
   من غير ما تلمس مستند المشارك، فمستمع المشاركين مش بيتنبّه ليها. عشان كده
   بنعمل poll كل 4 ثوانٍ في مراحل التجميع — بالظبط زي ما بتعمل لوحة المقدّم.
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
    createStars(150);
    enableFullscreenOnClick();

    if (window.Chart) {
      Chart.defaults.font.family = 'Tajawal, sans-serif';
      Chart.defaults.color = '#8993b3';
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

  /* ---------------- لبنات نصية ---------------- */
  function kicker(t)   { return t ? '<div class="display-kicker">' + esc(t) + '</div>' : ''; }
  function headline(t) { return '<h1 class="display-headline gold-text fade-in">' + esc(t) + '</h1>'; }
  function sub(t)      { return t ? '<p class="display-sub fade-in d1">' + esc(t) + '</p>' : ''; }

  /* ---------------- waiting ---------------- */
  function renderWaiting(ph) {
    var stage = document.getElementById('stage');
    var n = currentParticipants.length;
    var join = n
      ? '<p class="display-sub fade-in d2">انضمّ <b class="gold-text">' + n + '</b> ' + (n === 1 ? 'مشارك' : 'مشاركين') + '</p>'
      : '<p class="display-sub fade-in d2">افتحوا الرابط على موبايلاتكم… مستنيينكم.</p>';
    stage.innerHTML =
      '<div class="text-center">' +
        '<div class="badge fade-in">Executive Master Camp</div>' +
        '<h1 class="display-hero gold-text fade-in d1" style="margin-top:18px;">' + esc(ph.title || 'العافية') + '</h1>' +
        '<div class="en fade-in d1" style="font-size:1.6rem;">' + esc(ph.titleEn || 'Inner Wellbeing') + '</div>' +
        (ph.subtitle ? '<p class="display-sub fade-in d2">' + esc(ph.subtitle) + '</p>' : '') +
        join +
      '</div>';
  }

  /* ---------------- statement-hero (الخطّاف) ---------------- */
  function heroScaffold(ph) {
    return '<div class="text-center">' +
      kicker(ph.title) +
      '<h1 class="display-hero gold-text fade-in">' + esc(ph.headline || ph.title) + '</h1>' +
      sub(ph.sub) +
      '</div>';
  }

  /* ---------------- المنحني (SVG) ---------------- */
  function curveScaffold(ph, bend) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="viz fade-in d1">' + buildCurveSVG(bend) + '</div>' +
      sub(ph.sub) +
      '</div>';
  }

  function buildCurveSVG(bend) {
    var id = ++svgSeq;
    var gGold = 'gradGold' + id, gSky = 'gradSky' + id, gGap = 'gradGap' + id;

    var successPath = bend
      ? 'M70,360 C260,330 460,170 600,118 C712,80 782,150 860,300'
      : 'M70,360 C260,330 470,180 860,80';
    var wellPath = 'M70,374 C260,358 470,322 860,300';
    var gapFill = bend
      ? 'M430,214 C520,166 575,140 600,118 C660,92 720,118 762,182 L762,300 C700,312 520,320 430,330 Z'
      : 'M430,206 C600,150 720,110 860,80 L860,300 C720,308 600,318 430,330 Z';

    return '' +
    '<svg viewBox="0 0 920 440" xmlns="http://www.w3.org/2000/svg" role="img">' +
      '<defs>' +
        '<linearGradient id="' + gGold + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#b8893a"/><stop offset="1" stop-color="#f6dca0"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gSky + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#3f6e8e"/><stop offset="1" stop-color="#6db5e8"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gGap + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#e8c069" stop-opacity="0.30"/>' +
          '<stop offset="1" stop-color="#e8c069" stop-opacity="0.02"/>' +
        '</linearGradient>' +
      '</defs>' +
      // خط الأرض
      '<line x1="70" y1="392" x2="860" y2="392" stroke="rgba(255,255,255,0.10)" stroke-width="1.5"/>' +
      // الفجوة المظللة
      '<path d="' + gapFill + '" fill="url(#' + gGap + ')"/>' +
      // خط العافية
      '<path d="' + wellPath + '" fill="none" stroke="url(#' + gSky + ')" stroke-width="5" stroke-linecap="round"/>' +
      // خط النجاح
      '<path d="' + successPath + '" fill="none" stroke="url(#' + gGold + ')" stroke-width="6" stroke-linecap="round"/>' +
      // تسميات
      '<text x="858" y="' + (bend ? 318 : 64) + '" text-anchor="end" fill="#f6dca0" font-size="22" font-weight="800" font-family="Tajawal">النجاح الظاهر</text>' +
      '<text x="858" y="' + (bend ? 340 : 86) + '" text-anchor="end" fill="#b8893a" font-size="14" font-style="italic" font-family="Cormorant Garamond,serif">Visible Success</text>' +
      '<text x="858" y="288" text-anchor="end" fill="#6db5e8" font-size="22" font-weight="800" font-family="Tajawal">العافية الداخلية</text>' +
      '<text x="858" y="310" text-anchor="end" fill="#3f6e8e" font-size="14" font-style="italic" font-family="Cormorant Garamond,serif">Inner Wellbeing</text>' +
    '</svg>';
  }

  /* ---------------- الإرهاق ≠ الاحتراق ---------------- */
  function contrastScaffold(ph) {
    var L = ph.left || {}, R = ph.right || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="contrast-grid fade-in d1">' +
        '<div class="contrast-side mirror">' +
          '<div class="tag gold-text">' + esc(L.tag) + '</div>' +
          '<span class="en-label en">' + esc(L.en) + '</span>' +
          '<p class="soft">' + esc(L.note) + '</p>' +
        '</div>' +
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
      rows += '<div class="level-item fade-in d' + (i + 1) + '">' +
        '<div class="ln">' + (i + 1) + '</div>' +
        '<div class="lh"><h3>' + esc(t.ar) + ' <small class="en">' + esc(t.en) + '</small></h3></div>' +
        '</div>';
    });
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="levels-stack">' + rows + '</div></div>';
  }

  /* ---------------- الأنواع الثلاثة ---------------- */
  function typesScaffold(ph) {
    var T = SessionData.types;
    var order = ['burned', 'starved', 'repressed'];
    var cards = '';
    order.forEach(function (k, i) {
      var t = T[k];
      cards += '<div class="type-card t-' + k + ' fade-in d' + (i + 1) + '">' +
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
      '<div class="immunity-grid fade-in d1">' +
        '<div class="imm-box">' + esc(ex.stated) + '</div>' +
        '<div class="imm-box hidden-c">' + esc(ex.hidden) + '</div>' +
        '<div class="imm-box assump">' + esc(ex.assumption) + '</div>' +
      '</div></div>';
  }

  /* ---------------- التريجر والفلاتر (layers) ---------------- */
  function layersScaffold(ph) {
    var T = SessionData.terms;
    var filters = (ph.filters || []).map(function (f) { return '<span>• ' + esc(f) + '</span>'; }).join('');
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="layers-stack fade-in d1">' +
        '<div class="layer-box root"><div class="lt">الجذر · ساكن</div><div class="lm">' + esc(T.hiddenCommitment.ar) + ' <small class="en">' + esc(T.hiddenCommitment.en) + '</small></div></div>' +
        '<div class="layer-box spark"><div class="lt">الشرارة · لما حد يلمس الجذر</div><div class="lm">' + esc(T.trigger.ar) + ' <small class="en">' + esc(T.trigger.en) + '</small></div></div>' +
        '<div class="layer-box surface"><div class="lt">السطح · بتشتعل</div><div class="lm">' + esc(T.filters.ar) + ' <small class="en">' + esc(T.filters.en) + '</small></div>' +
          '<div class="filters-list">' + filters + '</div></div>' +
      '</div></div>';
  }

  /* ---------------- النقد: مرآة ≠ سهم ---------------- */
  function mirrorArrowScaffold(ph) {
    var M = ph.mirror || {}, A = ph.arrow || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="contrast-grid fade-in d1">' +
        '<div class="contrast-side mirror">' +
          '<div class="tag gold-text">' + esc(M.tag) + '</div>' +
          '<span class="en-label en">' + esc(M.en) + '</span>' +
          '<p class="soft">' + esc(M.note) + '</p>' +
        '</div>' +
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
    var qs = { cohesion: 'هل أنا بخير وآمن؟', vitality: 'هل أنا حيّ فعلًا؟', belonging: 'هل ليّ مكان بين الناس؟' };
    var cards = '';
    order.forEach(function (k, i) {
      var t = T[k];
      cards += '<div class="axis-card fade-in d' + (i + 1) + '">' +
        '<h3 class="gold-text">' + esc(t.ar) + '</h3>' +
        '<div class="aen en">' + esc(t.en) + '</div>' +
        '<div class="aq">' + esc(qs[k]) + '</div>' +
        '</div>';
    });
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="axes-grid">' + cards + '</div></div>';
  }

  /* ---------------- الجبل الجليدي ---------------- */
  function icebergScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="iceberg fade-in d1">' +
        '<div class="above">المحور الظاهر — اللي بتقود بيه</div>' +
        '<div class="water">' +
          '<div class="below">المحور المدفون — بيشوّه الرئيسي من تحت</div>' +
        '</div>' +
      '</div>' + sub(ph.sub) + '</div>';
  }

  /* ---------------- لمحة الطريق ---------------- */
  function pathsScaffold(ph) {
    var chips = (ph.paths || []).map(function (p, i) {
      return '<div class="path-chip fade-in d' + ((i % 5) + 1) + '">' + esc(p) + '</div>';
    }).join('');
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="paths-grid">' + chips + '</div></div>';
  }

  /* ---------------- الميثاق (شاشة صمت) ---------------- */
  function charterScaffold(ph) {
    return '<div class="text-center">' +
      kicker(ph.title) +
      '<h1 class="display-headline gold-text fade-in">' + esc(ph.headline) + '</h1>' +
      '<p class="display-sub fade-in d1">مساحة صمت — كل واحد بيكتب لنفسه على موبايله.</p>' +
      '</div>';
  }

  /* ---------------- البابان ---------------- */
  function doorsScaffold(ph) {
    var A = ph.doorA || {}, B = ph.doorB || {};
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="doors-grid fade-in d1">' +
        '<div class="door"><div class="dt">' + esc(A.tag) + '</div><div class="dn">' + esc(A.note) + '</div></div>' +
        '<div class="door"><div class="dt">' + esc(B.tag) + '</div><div class="dn">' + esc(B.note) + '</div></div>' +
      '</div></div>';
  }

  /* ---------------- الآية ---------------- */
  function ayahScaffold(ph) {
    return '<div class="text-center w-full ayah-box">' +
      '<div class="ayah ayah-font fade-in">﴿ ' + esc(ph.ayah) + ' ﴾</div>' +
      '<p class="display-sub fade-in d2" style="margin-top:30px;">' + esc(ph.headline) + '</p>' +
      '</div>';
  }

  /* ========================================================================
     مراحل التجميع الحيّ — scaffold + تحديث بدون إعادة بناء (عشان مفيش رفرفة)
     ====================================================================== */

  function barsScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="typedist" id="barsBox" style="margin-top:32px;"><p class="muted">في انتظار الإجابات…</p></div>' +
      '</div>';
  }

  function cloudScaffold(ph) {
    var title = ph.cloudTitle || 'غرفة القادة';
    var note = ph.note ? '<p class="display-sub fade-in d2" style="max-width:40ch;">' + esc(ph.note) + '</p>' : '';
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) +
      '<div class="muted mt-1" style="font-size:1.1rem;">' + esc(title) + ' · <span id="cloudCount">0</span> نقطة</div>' +
      '<div class="chart-wrap tall fade-in d1"><canvas id="cloudCanvas"></canvas></div>' +
      '<div class="cloud-legend">' +
        '<span>🟡 فجوة بسيطة</span><span>🟠 فجوة متوسطة</span><span>🔴 فجوة كبيرة</span><span>🔵 العافية أعلى</span>' +
      '</div>' + note + '</div>';
  }

  function diagnosticScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) + sub(ph.sub) +
      '<div class="display-hero gold-text fade-in d1" style="margin-top:20px;">' +
        '<span id="diagCount">0</span>' +
        '<span style="font-size:.45em;color:var(--text-muted);font-weight:600;"> / <span id="diagTotal">0</span> خلّصوا</span>' +
      '</div></div>';
  }

  function typedistScaffold(ph) {
    return '<div class="text-center w-full">' +
      kicker(ph.title) + headline(ph.headline) + sub(ph.sub) +
      '<div class="typedist" id="typedistBox"><p class="muted">لسه محدّش خلّص التشخيص.</p></div>' +
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
        '<div class="td-track"><div class="td-fill" style="width:' + pct + '%;background:linear-gradient(90deg,var(--gold-dark),var(--gold-light))"></div></div></div>';
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
        pointBorderColor: 'rgba(255,255,255,0.25)',
        pointRadius: 9, pointHoverRadius: 10
      }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 500 },
        scales: {
          x: {
            min: 0, max: 10,
            title: { display: true, text: 'النجاح الظاهر ←', color: '#f6dca0', font: { size: 15, weight: '700' } },
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { stepSize: 2 }
          },
          y: {
            min: 0, max: 10,
            title: { display: true, text: 'العافية الداخلية ↑', color: '#6db5e8', font: { size: 15, weight: '700' } },
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { stepSize: 2 }
          }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
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
