// icons.jsx — inline SVG components, lucide-style 1.5px stroke, black
// All icons share the same props: size, className. They inherit currentColor.

const _i = (size, children) => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
  strokeLinecap: 'round', strokeLinejoin: 'round',
});

function Icon({ name, size = 16, className = '', strokeWidth }) {
  const base = _i(size);
  if (strokeWidth) base.strokeWidth = strokeWidth;
  const p = (d) => <path d={d} />;
  const c = (cx, cy, r) => <circle cx={cx} cy={cy} r={r} />;
  const r = (x, y, w, h, rx) => <rect x={x} y={y} width={w} height={h} rx={rx} />;
  const l = (x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} />;

  const body = (() => {
    switch (name) {
      case 'plus': return <>{l(12,5,12,19)}{l(5,12,19,12)}</>;
      case 'minus': return l(5,12,19,12);
      case 'x': return <>{l(18,6,6,18)}{l(6,6,18,18)}</>;
      case 'check': return p('M20 6L9 17l-5-5');
      case 'chevron-down': return p('M6 9l6 6 6-6');
      case 'chevron-right': return p('M9 6l6 6-6 6');
      case 'chevron-left': return p('M15 6l-6 6 6 6');
      case 'arrow-right': return <>{l(5,12,19,12)}{p('M13 6l6 6-6 6')}</>;
      case 'arrow-up-right': return <>{p('M7 17L17 7')}{p('M8 7h9v9')}</>;
      case 'search': return <>{c(11,11,7)}{l(21,21,16.65,16.65)}</>;
      case 'filter': return p('M3 6h18M6 12h12M10 18h4');
      case 'sort': return <>{p('M3 6h13M3 12h9M3 18h5')}{p('M17 14l3 3 3-3M20 6v11')}</>;
      case 'file': return <>{p('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z')}{p('M14 2v6h6')}</>;
      case 'file-text': return <>{p('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z')}{p('M14 2v6h6')}{l(8,13,16,13)}{l(8,17,13,17)}</>;
      case 'download': return <>{p('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4')}{p('M7 10l5 5 5-5')}{l(12,15,12,3)}</>;
      case 'upload': return <>{p('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4')}{p('M17 8l-5-5-5 5')}{l(12,3,12,15)}</>;
      case 'copy': return <>{r(9,9,13,13,2)}{p('M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1')}</>;
      case 'trash': return <>{p('M3 6h18')}{p('M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6')}{p('M10 11v6')}{p('M14 11v6')}{p('M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2')}</>;
      case 'edit': return <>{p('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7')}{p('M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z')}</>;
      case 'settings': return <>{c(12,12,3)}{p('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z')}</>;
      case 'users': return <>{p('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2')}{c(9,7,4)}{p('M23 21v-2a4 4 0 0 0-3-3.87')}{p('M16 3.13a4 4 0 0 1 0 7.75')}</>;
      case 'user': return <>{p('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2')}{c(12,7,4)}</>;
      case 'log-out': return <>{p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4')}{p('M16 17l5-5-5-5')}{l(21,12,9,12)}</>;
      case 'log-in': return <>{p('M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4')}{p('M10 17l5-5-5-5')}{l(15,12,3,12)}</>;
      case 'home': return <>{p('M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-5h-2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z')}</>;
      case 'library': return <>{p('M16 6l3 12')}{p('M14 6h2v12h-2z')}{p('M9 6h3v12H9z')}{p('M4 6h3v12H4z')}</>;
      case 'globe': return <>{c(12,12,10)}{p('M2 12h20')}{p('M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z')}</>;
      case 'check-circle': return <>{p('M22 11.08V12a10 10 0 1 1-5.93-9.14')}{p('M22 4L12 14.01l-3-3')}</>;
      case 'circle': return c(12,12,10);
      case 'dot': return c(12,12,3);
      case 'cloud': return p('M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z');
      case 'cloud-off': return <>{p('M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3')}{l(1,1,23,23)}</>;
      case 'wifi': return <>{p('M5 12a14 14 0 0 1 14 0')}{p('M8.5 15.5a8 8 0 0 1 7 0')}{c(12,19,1)}</>;
      case 'send': return <>{l(22,2,11,13)}{p('M22 2l-7 20-4-9-9-4z')}</>;
      case 'eye': return <>{p('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z')}{c(12,12,3)}</>;
      case 'grip': return <>{c(9,5,1)}{c(15,5,1)}{c(9,12,1)}{c(15,12,1)}{c(9,19,1)}{c(15,19,1)}</>;
      case 'more': return <>{c(12,12,1)}{c(19,12,1)}{c(5,12,1)}</>;
      case 'sparkle': return p('M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z');
      case 'briefcase': return <>{r(2,7,20,14,2)}{p('M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16')}</>;
      case 'graduation': return <>{p('M22 10v6')}{p('M2 10l10-5 10 5-10 5z')}{p('M6 12v5c0 1 3 3 6 3s6-2 6-3v-5')}</>;
      case 'baby': return <>{c(12,12,10)}{c(9,10,.6)}{c(15,10,.6)}{p('M9 15c.83 1 1.83 1.5 3 1.5s2.17-.5 3-1.5')}</>;
      case 'mic': return <>{r(9,2,6,12,3)}{p('M19 10a7 7 0 0 1-14 0')}{l(12,19,12,22)}</>;
      case 'message': return p('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
      case 'building': return <>{r(4,2,16,20,1)}{p('M9 22v-4h6v4')}{l(8,6,8,6.01)}{l(16,6,16,6.01)}{l(12,6,12,6.01)}{l(8,10,8,10.01)}{l(16,10,16,10.01)}{l(12,10,12,10.01)}{l(8,14,8,14.01)}{l(16,14,16,14.01)}{l(12,14,12,14.01)}</>;
      case 'school': return <>{p('M22 9L12 3 2 9l10 6 10-6z')}{p('M6 11v6c0 1 3 3 6 3s6-2 6-3v-6')}</>;
      case 'crown': return p('M2 4l4 12h12l4-12-6 4-4-8-4 8z');
      case 'award': return <>{c(12,8,7)}{p('M8.21 13.89L7 23l5-3 5 3-1.21-9.12')}</>;
      case 'globe2': return <>{c(12,12,10)}{p('M2 12h20')}{p('M12 2v20')}</>;
      case 'palette': return <>{c(13.5,6.5,.5)}{c(17.5,10.5,.5)}{c(8.5,7.5,.5)}{c(6.5,12.5,.5)}{p('M12 22a10 10 0 1 1 0-20 8 8 0 0 1 8 8h-3a2 2 0 0 0 0 4 2 2 0 0 1 0 4h-1a4 4 0 0 0-4 4z')}</>;
      case 'menu': return <>{l(3,6,21,6)}{l(3,12,21,12)}{l(3,18,21,18)}</>;
      case 'panel': return <>{r(3,3,18,18,1)}{l(9,3,9,21)}</>;
      case 'panel-r': return <>{r(3,3,18,18,1)}{l(15,3,15,21)}</>;
      case 'panel-b': return <>{r(3,3,18,18,1)}{l(3,15,21,15)}</>;
      case 'kbd': return <>{r(2,4,20,16,2)}{l(6,8,6.01,8)}{l(10,8,10.01,8)}{l(14,8,14.01,8)}{l(18,8,18.01,8)}{l(6,12,6.01,12)}{l(10,12,14,12)}{l(18,12,18.01,12)}{l(7,16,17,16)}</>;
      case 'clock': return <>{c(12,12,10)}{p('M12 6v6l4 2')}</>;
      case 'calendar': return <>{r(3,4,18,18,2)}{l(16,2,16,6)}{l(8,2,8,6)}{l(3,10,21,10)}</>;
      case 'percent': return <>{l(19,5,5,19)}{c(6.5,6.5,2.5)}{c(17.5,17.5,2.5)}</>;
      case 'tag': return <>{p('M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z')}{l(7,7,7.01,7)}</>;
      case 'shield': return p('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
      case 'lock': return <>{r(3,11,18,11,2)}{p('M7 11V7a5 5 0 0 1 10 0v4')}</>;
      case 'star': return p('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z');
      case 'flag': return <>{p('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z')}{l(4,22,4,15)}</>;
      case 'rss': return <>{p('M4 11a9 9 0 0 1 9 9')}{p('M4 4a16 16 0 0 1 16 16')}{c(5,19,1)}</>;
      case 'logo-ec': return <>
        <rect x="2" y="2" width="20" height="20" rx="2" fill="#0A0A0A" stroke="none" />
        <path d="M8 9h6M8 12h4M8 15h6" stroke="#FFC72C" strokeWidth="1.6" />
      </>;
      default: return c(12,12,10);
    }
  })();

  return <svg {...base} className={className} aria-hidden="true">{body}</svg>;
}

window.Icon = Icon;
