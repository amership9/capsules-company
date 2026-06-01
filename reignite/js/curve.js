/* ============================================================================
   Reignite — منحني الاحتراق
   curve.js — راسم المنحني (SVG)

   renderCurve(opts) → نص SVG كامل
   opts:
     gap        : 0–100 (حجم الفجوة) — بيتحكم في بُعد خط الحيوية عن النجاح
     stageIdx   : 0–4 (موقع "إنت هنا")
     stages     : أسماء المراحل الخمسة (اختياري)
     vitA, vitC : إدراك القيادة/الموظفين (0–100) — لشريط الفجوة الإدراكية (اختياري)
     compact    : true لإصدار أصغر
============================================================================ */

const STAGE_LABELS = ['التطابق', 'التباعد المبكر', 'الفجوة الصامتة', 'الانكشاف', 'المفترق'];

export function renderCurve(opts = {}) {
  const gap = Math.max(0, Math.min(100, opts.gap ?? 40));
  const stageIdx = Math.max(0, Math.min(4, opts.stageIdx ?? 2));
  const stages = opts.stages || STAGE_LABELS;

  const W = 760, H = 380;
  const padL = 40, padR = 40, padT = 30, padB = 60;
  const x0 = padL, x1 = W - padR, y0 = H - padB, y1 = padT;
  const span = x1 - x0;

  // خط النجاح: منحنى S صاعد (نقاط ثابتة)
  const successPts = [
    [0, 0.18], [0.18, 0.30], [0.36, 0.50], [0.55, 0.68], [0.74, 0.80], [0.90, 0.88], [1, 0.92]
  ];
  // خط الحيوية: يبدأ ملاصق ثم يتباعد بمقدار الفجوة في النصف الأخير
  const vitDrop = gap / 100; // 0..1
  const vitalityPts = [
    [0, 0.20], [0.18, 0.32], [0.36, 0.46],
    [0.55, 0.46 - 0.10 * vitDrop],
    [0.74, 0.44 - 0.22 * vitDrop],
    [0.90, 0.42 - 0.30 * vitDrop],
    [1, 0.40 - 0.34 * vitDrop]
  ];

  const sx = (t) => x0 + t * span;
  const sy = (v) => y0 - v * (y0 - y1);

  const toPath = (pts) => {
    let d = `M ${sx(pts[0][0]).toFixed(1)} ${sy(pts[0][1]).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const cx = (sx(p0[0]) + sx(p1[0])) / 2;
      d += ` Q ${cx.toFixed(1)} ${sy(p0[1]).toFixed(1)} ${sx(p1[0]).toFixed(1)} ${sy(p1[1]).toFixed(1)}`;
    }
    return d;
  };

  const successPath = toPath(successPts);
  const vitalityPath = toPath(vitalityPts);

  // مساحة الفجوة (بين الخطين)
  const gapAreaPts = successPts.map(p => [sx(p[0]), sy(p[1])])
    .concat([...vitalityPts].reverse().map(p => [sx(p[0]), sy(p[1])]));
  const gapArea = 'M ' + gapAreaPts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z';

  // علامة "إنت هنا" — على موقع المرحلة
  const stageT = [0.12, 0.30, 0.55, 0.80, 0.95][stageIdx];
  // نقطة على خط الحيوية عند هذا الموقع (تقريب خطّي)
  const vitYAt = (t) => {
    for (let i = 1; i < vitalityPts.length; i++) {
      if (t <= vitalityPts[i][0]) {
        const a = vitalityPts[i - 1], b = vitalityPts[i];
        const r = (t - a[0]) / (b[0] - a[0] || 1);
        return a[1] + r * (b[1] - a[1]);
      }
    }
    return vitalityPts[vitalityPts.length - 1][1];
  };
  const markX = sx(stageT), markY = sy(vitYAt(stageT));

  // ألوان الفجوة حسب حجمها
  const gapColor = gap <= 30 ? '#7FB3D5' : gap <= 60 ? '#E0A458' : '#E8623D';

  // تسميات المراحل أسفل المحور
  const labelTs = [0.09, 0.30, 0.55, 0.80, 0.95];
  const stageLabels = stages.map((s, i) =>
    `<text x="${sx(labelTs[i]).toFixed(1)}" y="${(y0 + 22).toFixed(1)}" text-anchor="middle"
      font-size="11" fill="${i === stageIdx ? '#D4AF37' : '#8aa0c0'}"
      font-weight="${i === stageIdx ? '700' : '400'}">${s}</text>`
  ).join('');

  // شريط الفجوة الإدراكية
  let perceptionBar = '';
  if (opts.vitA != null && opts.vitC != null) {
    const by = H - 12, ax = x0 + (opts.vitA / 100) * span, cx = x0 + (opts.vitC / 100) * span;
    perceptionBar = `
      <line x1="${x0}" y1="${by}" x2="${x1}" y2="${by}" stroke="#1c2c4a" stroke-width="2"/>
      <circle cx="${ax.toFixed(1)}" cy="${by}" r="5" fill="#D4AF37"/>
      <circle cx="${cx.toFixed(1)}" cy="${by}" r="5" fill="#7FB3D5"/>
      <text x="${ax.toFixed(1)}" y="${by - 8}" text-anchor="middle" font-size="9" fill="#D4AF37">القيادة</text>
      <text x="${cx.toFixed(1)}" y="${by - 8}" text-anchor="middle" font-size="9" fill="#7FB3D5">الموظفين</text>`;
  }

  return `
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family="Tajawal, sans-serif">
  <defs>
    <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gapColor}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${gapColor}" stop-opacity="0.06"/>
    </linearGradient>
  </defs>
  <!-- محاور خفيفة -->
  <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#1c2c4a" stroke-width="1"/>
  <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#1c2c4a" stroke-width="1"/>
  <!-- مساحة الفجوة -->
  <path d="${gapArea}" fill="url(#gapGrad)"/>
  <!-- خط النجاح -->
  <path d="${successPath}" fill="none" stroke="#D4AF37" stroke-width="3.5" stroke-linecap="round"/>
  <text x="${sx(1)}" y="${sy(0.92) - 10}" text-anchor="end" font-size="11" fill="#D4AF37" font-weight="700">النجاح الظاهر</text>
  <!-- خط الحيوية -->
  <path d="${vitalityPath}" fill="none" stroke="${gapColor}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${gap > 30 ? '0' : '0'}"/>
  <text x="${sx(1)}" y="${sy(vitalityPts[vitalityPts.length-1][1]) + 18}" text-anchor="end" font-size="11" fill="${gapColor}" font-weight="700">الحيوية الداخلية</text>
  <!-- علامة إنت هنا -->
  <circle cx="${markX.toFixed(1)}" cy="${markY.toFixed(1)}" r="7" fill="#fff" stroke="${gapColor}" stroke-width="3"/>
  <circle cx="${markX.toFixed(1)}" cy="${markY.toFixed(1)}" r="13" fill="none" stroke="${gapColor}" stroke-width="1.5" opacity="0.5"/>
  <text x="${markX.toFixed(1)}" y="${(markY - 22).toFixed(1)}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">إنت هنا</text>
  ${stageLabels}
  ${perceptionBar}
</svg>`;
}
