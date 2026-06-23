/* ============================================================================
   Reignite — التربة
   soil-visuals.js — المحرّك البصري (SVG/HTML خالص، بلا اعتماديات)

   النجمة: renderSoilTriangle — مثلث بثلاث ركايز (T أعلى، H يمين-أسفل، N يسار-أسفل).
   الشكل بيتشوّه حسب الركيزة المتجوّعة:
     - مجوّعة: ضلع الحيوية (H) منكمش والتماسك (T) ممدود.
     - مكبوتة: رأس الانتماء (N) منهار.
     - محترقة: المثلث كله صغير (تربة منهَكة).
============================================================================ */

const PV = {
  T: { name: 'التماسك', q: 'أرضية صلبة',   color: '#7FB3D5', angle: -90 },
  H: { name: 'الحيوية', q: 'نار تتجدّد',    color: '#D4AF37', angle: 30  },
  N: { name: 'الانتماء', q: 'علاقة وتقدير', color: '#7FC4A0', angle: 150 }
};
const _rad = (d) => (d * Math.PI) / 180;
const _clamp = (v) => Math.max(0, Math.min(100, v ?? 0));

/* ---------- مثلث التربة ---------- */
export function renderSoilTriangle(pillars = {}, opts = {}) {
  const W = 380, H = 360, cx = W / 2, cy = 190, R = 112;
  const keys = ['T', 'H', 'N'];
  const v = (k) => _clamp(pillars[k]);

  const ptX = (k, r) => cx + r * Math.cos(_rad(PV[k].angle));
  const ptY = (k, r) => cy + r * Math.sin(_rad(PV[k].angle));

  // حلقات الشبكة (25/50/75/100)
  const rings = [25, 50, 75, 100].map(L => {
    const r = (L / 100) * R;
    const pts = keys.map(k => `${ptX(k, r).toFixed(1)},${ptY(k, r).toFixed(1)}`).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#1c3056" stroke-width="${L === 100 ? 1.4 : 0.8}"/>`;
  }).join('');

  // محاور من المركز للرؤوس
  const axes = keys.map(k =>
    `<line x1="${cx}" y1="${cy}" x2="${ptX(k, R).toFixed(1)}" y2="${ptY(k, R).toFixed(1)}" stroke="#1c3056" stroke-width="0.8"/>`
  ).join('');

  // مضلّع البيانات
  const dataPts = keys.map(k => {
    const r = (v(k) / 100) * R;
    return [ptX(k, r), ptY(k, r)];
  });
  const dataPoly = dataPts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  // لون التعبئة حسب الصحة العامة
  const vals = keys.map(v).filter(x => x != null);
  const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const fill = mean >= 66 ? '#7FC4A0' : mean >= 45 ? '#D4AF37' : '#E8623D';

  // نقاط الرؤوس + التسميات
  const dots = keys.map(k => {
    const r = (v(k) / 100) * R;
    return `<circle cx="${ptX(k, r).toFixed(1)}" cy="${ptY(k, r).toFixed(1)}" r="5.5" fill="${PV[k].color}" stroke="#060f24" stroke-width="2"/>`;
  }).join('');

  const labelT = `
    <text x="${cx}" y="${(cy - R - 22).toFixed(1)}" text-anchor="middle" font-size="14" fill="${PV.T.color}" font-weight="700">${PV.T.name}</text>
    <text x="${cx}" y="${(cy - R - 6).toFixed(1)}" text-anchor="middle" font-size="13" fill="#f4f7fb" font-weight="700">${v('T')}</text>`;
  const labelH = `
    <text x="${(ptX('H', R) + 12).toFixed(1)}" y="${(ptY('H', R) + 10).toFixed(1)}" text-anchor="start" font-size="14" fill="${PV.H.color}" font-weight="700">${PV.H.name}</text>
    <text x="${(ptX('H', R) + 12).toFixed(1)}" y="${(ptY('H', R) + 28).toFixed(1)}" text-anchor="start" font-size="13" fill="#f4f7fb" font-weight="700">${v('H')}</text>`;
  const labelN = `
    <text x="${(ptX('N', R) - 12).toFixed(1)}" y="${(ptY('N', R) + 10).toFixed(1)}" text-anchor="end" font-size="14" fill="${PV.N.color}" font-weight="700">${PV.N.name}</text>
    <text x="${(ptX('N', R) - 12).toFixed(1)}" y="${(ptY('N', R) + 28).toFixed(1)}" text-anchor="end" font-size="13" fill="#f4f7fb" font-weight="700">${v('N')}</text>`;

  return `
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Tajawal, sans-serif">
  <defs>
    <radialGradient id="soilFill" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${fill}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${fill}" stop-opacity="0.10"/>
    </radialGradient>
  </defs>
  ${rings}
  ${axes}
  <polygon points="${dataPoly}" fill="url(#soilFill)" stroke="${fill}" stroke-width="2.5" stroke-linejoin="round"/>
  ${dots}
  ${labelT}${labelH}${labelN}
</svg>
${opts.caption ? `<div class="soil-tri-cap">${opts.caption}</div>` : ''}
<div class="soil-legend">
  <span><i style="background:#7FB3D5"></i> التماسك — ${PV.T.q}</span>
  <span><i style="background:#D4AF37"></i> الحيوية — ${PV.H.q}</span>
  <span><i style="background:#7FC4A0"></i> الانتماء — ${PV.N.q}</span>
</div>`;
}

/* ---------- أعمدة الركايز (عرض مدمج) ---------- */
export function renderPillarBars(pillars = {}) {
  const rows = [['T', 'التماسك'], ['H', 'الحيوية'], ['N', 'الانتماء']];
  const color = (k) => PV[k].color;
  return `<div class="bars">` + rows.map(([k, n]) => {
    const val = pillars[k];
    return `<div class="bar-row">
      <span class="tiny">${n}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${val ?? 0}%;background:${color(k)}"></div></div>
      <span class="tiny">${val ?? '—'}</span>
    </div>`;
  }).join('') + `</div>`;
}

/* ---------- الكروسووك (تأكيد/تعارض/ميل) ---------- */
export function renderCrosswalk(cw = {}, burnoutType = null) {
  const typeName = { M: 'محترقة', G: 'مجوّعة', K: 'مكبوتة' };
  const verdict = cw.verdict || 'soft';
  const glyph = verdict === 'confirm' ? '✓' : verdict === 'conflict' ? '⚠' : '≈';
  const burnLbl = burnoutType ? typeName[burnoutType] : '— لسه محتاج دفعة الاحتراق —';
  const soilLbl = cw.soilLean ? typeName[cw.soilLean] : 'غير حاسمة';
  return `
  <div class="crosswalk ${verdict}">
    <div class="cw-row">
      <div class="cw-chip"><span class="lbl">نوع الأعراض (الاحتراق)</span><span class="val">${burnLbl}</span></div>
      <div class="cw-link ${verdict}">${glyph}</div>
      <div class="cw-chip"><span class="lbl">بصمة التربة (الأنظمة)</span><span class="val">${soilLbl}</span></div>
    </div>
    <div class="cw-text">${cw.text || ''}</div>
  </div>`;
}

/* ---------- ترمومتر البقاء ---------- */
export function renderThermometer(retention, band) {
  if (retention == null) return `<div class="tiny muted">— مفيش بيانات كافية للترمومتر —</div>`;
  const bandClass = band === 'مستقر' ? 'stable' : band === 'مهتزّ' ? 'shaky' : 'bleed';
  return `
  <div class="therm-wrap">
    <div class="therm-track"><div class="therm-marker" style="right:${retention}%"></div></div>
    <div class="therm-scale"><span>نزيف محتمل</span><span>مهتزّ</span><span>مستقر</span></div>
    <div><span class="therm-band ${bandClass}">${band} · ${retention}</span></div>
  </div>`;
}

/* لون خلية حسب الدرجة (للتوطين بالقسم) */
export function heatClass(v) {
  if (v == null) return '';
  return v >= 66 ? 'heat-hi' : v >= 45 ? 'heat-mid' : 'heat-lo';
}
