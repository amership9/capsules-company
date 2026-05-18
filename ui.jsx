// ui.jsx — shared primitives: Avatar, RoleBadge, StatusBadge, TopNav, EmptyState, Toast,
// keyboard handler, and a tiny toast system. All match the editorial brand.

function Avatar({ user, size = 28, ring = false }) {
  if (!user) return null;
  const s = { width: size, height: size };
  return (
    <div
      className={`inline-flex items-center justify-center rounded-sm font-display font-bold ${ring ? 'ring-2 ring-brand-cream' : ''}`}
      style={{ ...s, background: user.color || '#0A0A0A', color: '#0A0A0A', fontSize: Math.max(10, size * 0.42) }}
      title={user.name}
    >
      {user.initials || user.name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    admin: { bg: '#0A0A0A', fg: '#FFC72C', label: 'Admin' },
    sales: { bg: '#FFC72C', fg: '#0A0A0A', label: 'Sales' },
    viewer: { bg: '#F2F1EB', fg: '#0A0A0A', label: 'Viewer', border: '1px solid #E5E5E0' },
  };
  const c = map[role] || map.viewer;
  return (
    <span className="pill" style={{ background: c.bg, color: c.fg, border: c.border }}>{c.label}</span>
  );
}

function StatusBadge({ status, onClick }) {
  const cls = `pill pill-${status}` + (onClick ? ' cursor-default hover:opacity-90' : '');
  const label = { draft: 'Draft', sent: 'Sent', won: 'Won', lost: 'Lost' }[status] || status;
  if (!onClick) return <span className={cls}>{label}</span>;
  return <button type="button" className={cls} onClick={onClick}>{label}</button>;
}

function StatusBadgeMenu({ status, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" className={`pill pill-${status}`} style={{ paddingRight: 6 }} onClick={() => setOpen(v => !v)}>
        {{draft:'Draft',sent:'Sent',won:'Won',lost:'Lost'}[status]}
        <Icon name="chevron-down" size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-ui-border shadow-lg z-30 min-w-[120px] fade-in" style={{ borderRadius: 2 }}>
          {['draft','sent','won','lost'].map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-brand-cream flex items-center gap-2 text-[12px]"
              onClick={() => { onChange(s); setOpen(false); }}
            >
              <span className={`pill pill-${s}`}>{{draft:'Draft',sent:'Sent',won:'Won',lost:'Lost'}[s]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Save indicator
function SaveIndicator({ state, lastEditor, lastEditedAgo }) {
  // states: 'idle' | 'saving' | 'synced' | 'offline'
  const map = {
    saving: { dot: '#FFC72C', label: 'Saving…', pulse: true },
    synced: { dot: '#2D8659', label: 'Synced', pulse: false },
    offline: { dot: '#C0392B', label: 'Offline · queued', pulse: false },
    idle: { dot: '#9B9B95', label: 'Synced', pulse: false },
  };
  const c = map[state] || map.synced;
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-ui-text-mid select-none">
      <span className="relative inline-flex" style={{ width: 8, height: 8 }}>
        <span className="absolute inset-0 rounded-full" style={{ background: c.dot }} />
        {c.pulse && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: c.dot, opacity: .6 }} />}
      </span>
      <span className="font-medium tracking-tight">{c.label}</span>
      {lastEditor && (
        <span className="text-ui-text-light hidden md:inline">· Edited by {lastEditor} {lastEditedAgo}</span>
      )}
    </div>
  );
}

// User menu dropdown (top right of nav)
function UserMenu({ user, onSignOut, onNav, otherUsers, onSwitchUser }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)} className="flex items-center gap-2 px-1.5 py-1 hover:bg-brand-cream-deep rounded-sm">
        <Avatar user={user} size={28} />
        <span className="hidden md:flex items-center gap-1 text-[12.5px] font-semibold">{user.name.split(' ')[0]}<Icon name="chevron-down" size={12} /></span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-ui-border shadow-xl w-72 z-30 fade-in" style={{ borderRadius: 2 }}>
          <div className="p-3 border-b border-ui-border flex items-center gap-3">
            <Avatar user={user} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{user.name}</div>
              <div className="text-[11.5px] text-ui-text-mid truncate">{user.email}</div>
              <div className="mt-1.5"><RoleBadge role={user.role} /></div>
            </div>
          </div>
          <div className="py-1">
            <MenuItem icon="user" label="My Settings" onClick={() => { setOpen(false); onNav('/settings'); }} />
            {user.role === 'admin' && <MenuItem icon="users" label="Team Management" onClick={() => { setOpen(false); onNav('/team'); }} />}
            <MenuItem icon="kbd" label="Keyboard shortcuts" hint="⌘ K" onClick={() => { setOpen(false); }} />
          </div>
          {otherUsers && (
            <div className="border-t border-ui-border py-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ui-text-light">Switch user (demo)</div>
              {otherUsers.map(u => (
                <button key={u.uid} type="button"
                  className="w-full text-left px-3 py-1.5 hover:bg-brand-cream flex items-center gap-2.5 text-[12px]"
                  onClick={() => { setOpen(false); onSwitchUser(u.uid); }}>
                  <Avatar user={u} size={22} />
                  <span className="flex-1 truncate">{u.name}</span>
                  <RoleBadge role={u.role} />
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-ui-border py-1">
            <MenuItem icon="log-out" label="Sign out" onClick={() => { setOpen(false); onSignOut(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, hint, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-brand-cream flex items-center gap-2.5 text-[12.5px]">
      <Icon name={icon} size={14} />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-ui-text-light font-mono">{hint}</span>}
    </button>
  );
}

// Top navigation
function TopNav({ user, route, onNav, onSignOut, presence, onSwitchUser, otherUsers }) {
  const navItems = [
    { id: '/', label: 'Dashboard', icon: 'home' },
    { id: '/library', label: 'Library', icon: 'library' },
    { id: '/settings', label: 'Settings', icon: 'settings' },
  ];
  if (user?.role === 'admin') navItems.push({ id: '/team', label: 'Team', icon: 'users' });

  return (
    <header className="sticky top-0 z-20 bg-brand-cream/95 backdrop-blur border-b border-ui-border">
      <div className="max-w-[1600px] mx-auto px-6 h-[60px] flex items-center gap-8">
        <button type="button" onClick={() => onNav('/')} className="flex items-center gap-2.5 group">
          <BrandMark size={32} />
          <div className="flex flex-col leading-tight">
            <span className="font-display font-extrabold text-[13.5px] tracking-tight">PROPOSAL STUDIO</span>
            <span className="text-[10px] text-ui-text-mid -mt-0.5">English Capsules Academy</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const active = route === item.id || (item.id === '/' && route === '/') || (item.id !== '/' && route.startsWith(item.id));
            return (
              <button key={item.id} type="button" onClick={() => onNav(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[12.5px] font-semibold transition-colors ${active ? 'bg-brand-black text-white' : 'text-brand-black hover:bg-brand-cream-deep'}`}>
                <Icon name={item.icon} size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {presence && presence.length > 0 && (
          <div className="hidden md:flex items-center gap-1 mr-1">
            <span className="text-[10.5px] uppercase tracking-wider text-ui-text-mid font-semibold mr-2">Online</span>
            <div className="flex -space-x-1.5">
              {presence.slice(0, 4).map(u => <Avatar key={u.uid} user={u} size={22} ring />)}
            </div>
          </div>
        )}

        <button type="button" onClick={() => onNav('/editor/new')} className="btn btn-primary">
          <Icon name="plus" size={14} />
          New Proposal
        </button>

        <UserMenu user={user} onSignOut={onSignOut} onNav={onNav} otherUsers={otherUsers} onSwitchUser={onSwitchUser} />
      </div>
    </header>
  );
}

// Brand mark — yellow square with stylized E + bar
function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="English Capsules">
      <rect x="0" y="0" width="40" height="40" fill="#0A0A0A" rx="2" />
      <rect x="6" y="10" width="20" height="3" fill="#FFC72C" />
      <rect x="6" y="18" width="14" height="3" fill="#FFC72C" />
      <rect x="6" y="26" width="20" height="3" fill="#FFC72C" />
      <rect x="32" y="6" width="3" height="28" fill="#FFC72C" />
    </svg>
  );
}

function BrandWordmark({ tone = 'black' }) {
  // small lockup version: yellow square then word
  return (
    <div className="inline-flex items-center gap-2.5">
      <BrandMark size={28} />
      <div className={`font-display font-extrabold text-[15px] tracking-tight ${tone === 'white' ? 'text-white' : 'text-brand-black'}`}>
        ENGLISH<span className="text-brand-yellow">.</span>CAPSULES
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ icon = 'file', title, body, action }) {
  return (
    <div className="text-center py-16 px-6 flex flex-col items-center">
      <div className="w-12 h-12 bg-brand-cream-deep rounded-sm flex items-center justify-center mb-4">
        <Icon name={icon} size={20} />
      </div>
      <div className="font-display font-bold text-[16px]">{title}</div>
      {body && <div className="text-[13px] text-ui-text-mid mt-1 max-w-xs">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Toast system (very simple)
const ToastCtx = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(curr => [...curr, { id, ...t }]);
    setTimeout(() => setToasts(curr => curr.filter(x => x.id !== id)), t.duration || 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto bg-brand-black text-white px-4 py-2.5 rounded-sm flex items-center gap-2.5 shadow-xl fade-in min-w-[280px] max-w-[420px]`}>
            <Icon name={t.icon || 'check-circle'} size={16} className={t.tone === 'danger' ? 'text-ui-danger' : 'text-brand-yellow'} />
            <span className="text-[12.5px] font-medium flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return React.useContext(ToastCtx); }

// Section header (form side)
function FormSection({ title, num, children, action }) {
  return (
    <section className="form-section border-b border-ui-border last:border-0 px-5 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] text-brand-yellow-dark font-semibold tracking-wider">{String(num).padStart(2,'0')}</span>
          <h3 className="font-display font-bold text-[13px] tracking-wide uppercase">{title}</h3>
        </div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, hint, children, full }) {
  return (
    <label className={`block ${full ? '' : ''}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ui-text-mid mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ui-text-light mt-1">{hint}</span>}
    </label>
  );
}

function Toggle({ value, onChange, label, hint }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="w-full flex items-start gap-3 text-left py-1.5 group">
      <span className={`relative inline-flex shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors ${value ? 'bg-brand-black' : 'bg-ui-border'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${value ? 'left-[18px] bg-brand-yellow' : 'left-0.5 bg-white'}`} />
      </span>
      <span className="flex-1">
        <span className="block text-[12.5px] font-semibold">{label}</span>
        {hint && <span className="block text-[11px] text-ui-text-mid leading-snug">{hint}</span>}
      </span>
    </button>
  );
}

Object.assign(window, {
  Avatar, RoleBadge, StatusBadge, StatusBadgeMenu, SaveIndicator,
  UserMenu, TopNav, BrandMark, BrandWordmark, EmptyState,
  ToastProvider, useToast, FormSection, Field, Toggle,
});
