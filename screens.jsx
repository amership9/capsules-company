// screens.jsx — Login, Dashboard, Library, Settings, Team

// ─── LOGIN ──────────────────────────────────────────────────────────────────
function Login({ onLogin, users }) {
  const [email, setEmail] = React.useState('mariam.elsayed@englishcapsules.com');
  const [pwd, setPwd] = React.useState('••••••••••');
  const [demoOpen, setDemoOpen] = React.useState(false);

  function submit(e) {
    e?.preventDefault();
    const u = users.find(x => x.email === email) || users[1];
    onLogin(u.uid);
  }

  return (
    <div className="min-h-screen bg-brand-cream grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-black text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div className="font-display font-extrabold text-[16px] tracking-tight">
            ENGLISH<span className="text-brand-yellow">.</span>CAPSULES
          </div>
        </div>

        <div className="relative z-10">
          <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 11 }}>
            PROPOSAL STUDIO · INTERNAL
          </span>
          <h1 className="mt-6 font-display font-extrabold text-[64px] leading-[0.95] tracking-[-0.02em]" style={{ textWrap: 'balance' }}>
            Build a proposal in <span className="pdf-italic font-normal">five</span> minutes<span className="text-brand-yellow">.</span>
          </h1>
          <p className="mt-6 text-[16px] text-white/70 max-w-md leading-relaxed">
            The fastest way for the English Capsules sales team to send corporate-grade proposals to Banque Misr, Carrefour, Sabbour — and every learner who walks through the door.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            <LoginStat value="100k+" label="Students" />
            <LoginStat value="4" label="Centres" />
            <LoginStat value="13" label="Templates" />
          </div>
        </div>

        <div className="text-[11px] text-white/40 tracking-wider uppercase">
          Dokki · Nasr City · 6 October · Maadi
        </div>

        {/* Decorative yellow bar */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-yellow" />
      </div>

      {/* Right — login form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><BrandWordmark /></div>

          <h2 className="font-display font-extrabold text-[28px] tracking-tight">Welcome back<span className="text-brand-yellow">.</span></h2>
          <p className="text-[13.5px] text-ui-text-mid mt-2">Sign in to the proposal studio.</p>

          <button type="button" onClick={submit} className="mt-8 w-full bg-white border border-brand-black hover:bg-brand-cream-deep h-11 flex items-center justify-center gap-3 font-semibold text-[13.5px]" style={{ borderRadius: 2 }}>
            <GoogleG />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-ui-border" />
            <span className="text-[10.5px] uppercase tracking-wider text-ui-text-light font-semibold">or email</span>
            <div className="flex-1 h-px bg-ui-border" />
          </div>

          <div className="space-y-3">
            <Field label="Work email">
              <input className="ec-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@englishcapsules.com" />
            </Field>
            <Field label="Password">
              <input type="password" className="ec-input" value={pwd} onChange={e => setPwd(e.target.value)} />
            </Field>
          </div>

          <button type="submit" className="mt-5 btn btn-primary w-full justify-center h-11">
            Sign in <Icon name="arrow-right" size={14} />
          </button>

          <div className="mt-4 flex items-center justify-between text-[12px]">
            <button type="button" className="text-ui-text-mid hover:text-brand-black">Forgot password?</button>
            <button type="button" onClick={() => setDemoOpen(v => !v)} className="text-brand-yellow-dark font-semibold hover:underline">
              Demo: switch user
            </button>
          </div>

          {demoOpen && (
            <div className="mt-3 border border-ui-border bg-white p-2" style={{ borderRadius: 2 }}>
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-ui-text-light font-semibold">Sign in as</div>
              {users.filter(u => u.status === 'active').map(u => (
                <button key={u.uid} type="button" onClick={() => onLogin(u.uid)} className="w-full flex items-center gap-2.5 px-2 py-1.5 hover:bg-brand-cream text-left">
                  <Avatar user={u} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate">{u.name}</div>
                    <div className="text-[10.5px] text-ui-text-mid truncate">{u.email}</div>
                  </div>
                  <RoleBadge role={u.role} />
                </button>
              ))}
            </div>
          )}

          <div className="mt-12 text-[10.5px] text-ui-text-light text-center">
            By signing in you agree to the internal use policy.
            <br />Need access? Ask your admin to invite you.
          </div>
        </form>
      </div>
    </div>
  );
}

function LoginStat({ value, label }) {
  return (
    <div>
      <div className="font-display font-extrabold text-[28px] leading-none text-brand-yellow">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mt-1.5">{label}</div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.63z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.95v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ user, proposals, onNav, onUseTemplate, allUsers }) {
  const recent = [...proposals].sort((a, b) => (b.updatedAtTs || 0) - (a.updatedAtTs || 0)).slice(0, 5);
  const myProposals = proposals.filter(p => p.createdBy === user.uid);
  const myWon = myProposals.filter(p => p.status === 'won').length;
  const myThisMonth = myProposals.length;
  const teamPipelineValue = proposals.filter(p => p.status === 'sent').reduce((s, p) => s + (p.totalValue || calcTotals(p).total || 0), 0);

  const popularTemplates = ['business', 'corporate', 'ielts'];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 pb-20">
      {/* Hero */}
      <div className="border-b border-brand-black pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-end">
          <div>
            <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 11 }}>
              GOOD MORNING · {user.name.split(' ')[0].toUpperCase()}
            </span>
            <h1 className="mt-4 font-display font-extrabold text-[56px] leading-[0.95] tracking-[-0.02em]" style={{ textWrap: 'balance' }}>
              Build a proposal in <span className="pdf-italic font-normal">five</span> minutes<span className="text-brand-yellow">.</span>
            </h1>
            <p className="mt-5 text-[15px] text-ui-text-mid max-w-xl leading-relaxed">
              Pick a template below, fill in client details, and download a branded PDF the same minute. Everything you save here is shared with the team in real time.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => onNav('/editor/new')} className="btn btn-primary">
                <Icon name="plus" size={14} /> New blank proposal
              </button>
              <button type="button" onClick={() => onNav('/library')} className="btn btn-ghost">
                <Icon name="library" size={14} /> Open library
              </button>
            </div>
          </div>

          {/* My stats card */}
          <div className="grid grid-cols-3 gap-0 border border-brand-black bg-white" style={{ borderRadius: 2 }}>
            <StatCard value={myThisMonth} label="My proposals" sub="this month" />
            <StatCard value={myWon} label="Won deals" sub="this month" accent />
            <StatCard value={fmtMoney(teamPipelineValue / 1000, '').trim() + 'k'} label="Team pipeline" sub={`across ${proposals.filter(p=>p.status==='sent').length} sent`} />
          </div>
        </div>
      </div>

      {/* Template gallery */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 10.5 }}>TEMPLATES</span>
            <h2 className="mt-2 font-display font-extrabold text-[28px] tracking-tight">Start from a proven template.</h2>
            <p className="text-[13px] text-ui-text-mid mt-1">All thirteen flagship programs, pre-loaded with curriculum, sessions and pricing.</p>
          </div>
          <button type="button" className="btn btn-quiet btn-sm"><Icon name="filter" size={13} /> Filter</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((t, i) => {
            const popular = popularTemplates.includes(t.id);
            return <TemplateCard key={t.id} tpl={t} popular={popular} onUse={() => onUseTemplate(t.id)} />;
          })}
        </div>
      </section>

      {/* Recent proposals */}
      <section className="mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 10.5 }}>RECENT</span>
            <h2 className="mt-2 font-display font-extrabold text-[28px] tracking-tight">What the team is working on.</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNav('/library')}>
            View all <Icon name="arrow-right" size={13} />
          </button>
        </div>

        <div className="border border-ui-border bg-white" style={{ borderRadius: 2 }}>
          {recent.map((p, i) => (
            <RecentRow key={p.id} p={p} allUsers={allUsers} onClick={() => onNav('/editor/' + p.id)} isLast={i === recent.length - 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, sub, accent }) {
  return (
    <div className={`p-5 border-r last:border-r-0 border-brand-black ${accent ? 'bg-brand-yellow' : 'bg-white'}`}>
      <div className="font-display font-extrabold text-[36px] leading-none tracking-tight">{value}</div>
      <div className="font-display font-bold text-[11px] uppercase tracking-wider mt-3">{label}</div>
      <div className="text-[10.5px] text-ui-text-mid mt-0.5">{sub}</div>
    </div>
  );
}

function TemplateCard({ tpl, popular, onUse }) {
  return (
    <button type="button" onClick={onUse}
      className="group text-left bg-white border border-ui-border hover:border-brand-black p-4 transition-all flex flex-col gap-3 relative"
      style={{ borderRadius: 2, minHeight: 168 }}>
      {popular && (
        <span className="absolute top-3 right-3 pill pill-yellow" style={{ fontSize: 9 }}>POPULAR</span>
      )}
      <div className="w-10 h-10 bg-brand-black text-brand-yellow flex items-center justify-center group-hover:bg-brand-yellow group-hover:text-brand-black transition-colors" style={{ borderRadius: 2 }}>
        <Icon name={tpl.icon} size={20} strokeWidth={1.6} />
      </div>
      <div className="flex-1">
        <div className="font-display font-bold text-[14px] leading-tight">{tpl.name}</div>
        <div className="text-[11px] text-ui-text-mid mt-0.5">{tpl.audience}</div>
        <div className="text-[11.5px] text-brand-black/80 mt-2 leading-snug clamp-2">{tpl.blurb}</div>
      </div>
      <div className="flex items-center justify-between text-[10.5px] text-ui-text-mid pt-2 border-t border-ui-border">
        <span className="font-semibold uppercase tracking-wider">{tpl.curriculum}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-brand-black font-semibold">
          Use <Icon name="arrow-right" size={11} />
        </span>
      </div>
    </button>
  );
}

function RecentRow({ p, allUsers, onClick, isLast }) {
  const author = allUsers.find(u => u.uid === p.createdBy);
  const tpl = TEMPLATES.find(t => t.id === p.templateId);
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left flex items-center gap-4 px-4 py-3.5 hover:bg-brand-cream group ${isLast ? '' : 'border-b border-ui-border'}`}>
      <div className="w-9 h-9 bg-brand-cream-deep flex items-center justify-center shrink-0" style={{ borderRadius: 2 }}>
        <Icon name={tpl?.icon || 'file'} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="font-display font-bold text-[13px] truncate">{p.title}</div>
          <StatusBadge status={p.status} />
        </div>
        <div className="text-[11.5px] text-ui-text-mid truncate">
          <span className="pdf-mono font-semibold">{p.number}</span> · {p.client.name} · {tpl?.name}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-[11.5px] text-ui-text-mid shrink-0">
        <Avatar user={author} size={20} />
        <span className="font-medium">{author?.name?.split(' ')[0]}</span>
        <span className="text-ui-text-light">·</span>
        <span>{p.updatedAt}</span>
      </div>
      <div className="pdf-mono font-bold text-[13px] shrink-0 w-28 text-right">
        {fmtMoney(p.totalValue || calcTotals(p).total || 0, p.currency)}
      </div>
      <Icon name="chevron-right" size={14} className="text-ui-text-light group-hover:text-brand-black" />
    </button>
  );
}

// ─── LIBRARY ────────────────────────────────────────────────────────────────
function Library({ user, proposals, onNav, allUsers, onStatusChange, onDelete }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [assigneeFilter, setAssigneeFilter] = React.useState('all'); // all|mine|<uid>
  const [sortBy, setSortBy] = React.useState('updated');
  const isAdmin = user.role === 'admin';

  const filtered = React.useMemo(() => {
    let list = proposals.slice();
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (assigneeFilter === 'mine') list = list.filter(p => p.createdBy === user.uid);
    else if (assigneeFilter !== 'all') list = list.filter(p => p.createdBy === assigneeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.title + ' ' + p.client.name + ' ' + p.number).toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === 'value') return (b.totalValue || calcTotals(b).total) - (a.totalValue || calcTotals(a).total);
      if (sortBy === 'client') return a.client.name.localeCompare(b.client.name);
      return (b.updatedAtTs || 0) - (a.updatedAtTs || 0);
    });
    return list;
  }, [proposals, search, statusFilter, assigneeFilter, sortBy, user.uid]);

  const counts = {
    all: proposals.length,
    draft: proposals.filter(p => p.status === 'draft').length,
    sent: proposals.filter(p => p.status === 'sent').length,
    won: proposals.filter(p => p.status === 'won').length,
    lost: proposals.filter(p => p.status === 'lost').length,
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between border-b border-brand-black pb-6">
        <div>
          <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 10.5 }}>LIBRARY</span>
          <h1 className="mt-3 font-display font-extrabold text-[40px] leading-none tracking-tight">All proposals</h1>
          <p className="text-[13px] text-ui-text-mid mt-2">{proposals.length} across the team · synced in real time</p>
        </div>
        <button type="button" onClick={() => onNav('/editor/new')} className="btn btn-primary"><Icon name="plus" size={14} /> New proposal</button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mt-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All' }, { id: 'draft', label: 'Drafts' },
          { id: 'sent', label: 'Sent' }, { id: 'won', label: 'Won' }, { id: 'lost', label: 'Lost' },
        ].map(tab => (
          <button key={tab.id} type="button" onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-sm text-[12.5px] font-semibold flex items-center gap-2 ${statusFilter === tab.id ? 'bg-brand-black text-white' : 'text-brand-black hover:bg-brand-cream-deep'}`}>
            {tab.label}
            <span className={`pdf-mono text-[10.5px] ${statusFilter === tab.id ? 'text-brand-yellow' : 'text-ui-text-light'}`}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-mid" />
          <input className="ec-input pl-9" placeholder="Search by client, title, number…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="ec-input" style={{ width: 'auto' }} value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
          <option value="all">All team</option>
          <option value="mine">Mine only</option>
          {isAdmin && allUsers.filter(u => u.status === 'active' && u.role !== 'viewer').map(u => (
            <option key={u.uid} value={u.uid}>{u.name}</option>
          ))}
        </select>

        <select className="ec-input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="updated">Sort: Last updated</option>
          <option value="value">Sort: Total value</option>
          <option value="client">Sort: Client A→Z</option>
        </select>

        <div className="flex-1" />
        <button type="button" className="btn btn-quiet btn-sm"><Icon name="download" size={13} /> Export CSV</button>
      </div>

      {/* Table */}
      <div className="mt-4 border border-ui-border bg-white overflow-hidden" style={{ borderRadius: 2 }}>
        <div className="grid grid-cols-[110px_60px_1fr_140px_140px_120px_100px_44px] gap-3 px-4 py-2.5 bg-brand-cream-deep border-b border-ui-border text-[10.5px] uppercase tracking-wider font-semibold text-ui-text-mid">
          <div>Number</div>
          <div>Status</div>
          <div>Client · Title</div>
          <div>Created by</div>
          <div>Date issued</div>
          <div className="text-right">Total</div>
          <div className="text-right">Updated</div>
          <div></div>
        </div>
        {filtered.length === 0 && (
          <EmptyState icon="search" title="No proposals match these filters" body="Try clearing the search or changing the status tab." />
        )}
        {filtered.map((p, i) => (
          <LibraryRow key={p.id} p={p} allUsers={allUsers} onClick={() => onNav('/editor/' + p.id)} canEdit={isAdmin || p.createdBy === user.uid} onStatusChange={onStatusChange} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function LibraryRow({ p, allUsers, onClick, canEdit, onStatusChange, onDelete }) {
  const author = allUsers.find(u => u.uid === p.createdBy);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const fn = (e) => { if (!ref.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [menuOpen]);

  return (
    <div className="grid grid-cols-[110px_60px_1fr_140px_140px_120px_100px_44px] gap-3 px-4 py-3 items-center border-b border-ui-border last:border-0 hover:bg-brand-cream cursor-default group">
      <div className="pdf-mono text-[12px] font-semibold">{p.number}</div>
      <div><StatusBadgeMenu status={p.status} onChange={(s) => onStatusChange(p.id, s)} /></div>
      <button type="button" onClick={onClick} className="text-left min-w-0">
        <div className="text-[12.5px] font-display font-bold truncate group-hover:underline decoration-brand-yellow decoration-2 underline-offset-2">{p.title}</div>
        <div className="text-[11px] text-ui-text-mid truncate">{p.client.name} · {p.client.contact}</div>
      </button>
      <div className="flex items-center gap-2 text-[12px] min-w-0">
        <Avatar user={author} size={20} />
        <span className="truncate font-medium">{author?.name?.split(' ')[0]} {author?.name?.split(' ')[1]?.[0]}.</span>
      </div>
      <div className="text-[12px] font-medium">{fmtDate(p.dateIssued, 'en')}</div>
      <div className="text-right pdf-mono text-[12.5px] font-bold">{fmtMoney(p.totalValue || calcTotals(p).total || 0, p.currency)}</div>
      <div className="text-right text-[11.5px] text-ui-text-mid">{p.updatedAt}</div>
      <div className="relative" ref={ref}>
        <button type="button" className="btn btn-quiet btn-icon" onClick={() => setMenuOpen(v => !v)}>
          <Icon name="more" size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-ui-border shadow-lg z-20 w-44" style={{ borderRadius: 2 }}>
            <MenuItem icon="edit" label={canEdit ? 'Open' : 'View'} onClick={() => { setMenuOpen(false); onClick(); }} />
            <MenuItem icon="copy" label="Duplicate" onClick={() => setMenuOpen(false)} />
            <MenuItem icon="download" label="Download PDF" onClick={() => setMenuOpen(false)} />
            {canEdit && <div className="border-t border-ui-border my-1" />}
            {canEdit && <MenuItem icon="trash" label="Delete" onClick={() => { setMenuOpen(false); onDelete(p.id); }} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS ───────────────────────────────────────────────────────────────
function Settings({ user, brand, setBrand, features, setFeatures, defaults, setDefaults }) {
  const [tab, setTab] = React.useState('profile');
  const isAdmin = user.role === 'admin';
  const toast = useToast();

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: 'user' },
    { id: 'brand', label: 'Brand', icon: 'palette', admin: true },
    { id: 'defaults', label: 'Defaults', icon: 'settings', admin: true },
    { id: 'features', label: 'Feature toggles', icon: 'flag', admin: true },
  ].filter(t => !t.admin || isAdmin);

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <div className="border-b border-brand-black pb-5">
        <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 10.5 }}>SETTINGS</span>
        <h1 className="mt-3 font-display font-extrabold text-[36px] leading-none tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-8 mt-8">
        <nav className="flex flex-col gap-0.5">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold ${tab === t.id ? 'bg-brand-black text-white' : 'hover:bg-brand-cream-deep'}`}
              style={{ borderRadius: 2 }}>
              <Icon name={t.icon} size={14} />{t.label}
            </button>
          ))}
        </nav>

        <div className="bg-white border border-ui-border p-6" style={{ borderRadius: 2 }}>
          {tab === 'profile' && <ProfileTab user={user} toast={toast} />}
          {tab === 'brand' && <BrandTab brand={brand} setBrand={setBrand} toast={toast} />}
          {tab === 'defaults' && <DefaultsTab defaults={defaults} setDefaults={setDefaults} toast={toast} />}
          {tab === 'features' && <FeaturesTab features={features} setFeatures={setFeatures} toast={toast} />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, toast }) {
  return (
    <div className="space-y-5">
      <h2 className="font-display font-extrabold text-[20px]">My profile</h2>
      <div className="flex items-center gap-4">
        <Avatar user={user} size={64} />
        <div>
          <div className="font-display font-bold text-[15px]">{user.name}</div>
          <div className="text-[12px] text-ui-text-mid">{user.email}</div>
          <button type="button" className="text-[11.5px] mt-1 font-semibold text-brand-yellow-dark hover:underline">Change avatar</button>
        </div>
      </div>
      <Field label="Display name"><input className="ec-input" defaultValue={user.name} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Default language">
          <select className="ec-input"><option>English</option><option>العربية</option></select>
        </Field>
        <Field label="Default currency">
          <select className="ec-input">{Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}</select>
        </Field>
      </div>
      <Field label="Change password"><input type="password" className="ec-input" placeholder="New password" /></Field>
      <button type="button" className="btn btn-dark" onClick={() => toast({ message: 'Profile saved' })}>Save changes</button>
    </div>
  );
}

function BrandTab({ brand, setBrand, toast }) {
  return (
    <div className="space-y-5">
      <h2 className="font-display font-extrabold text-[20px]">Brand</h2>
      <p className="text-[12.5px] text-ui-text-mid -mt-2">Applied to every PDF and to the app header.</p>

      {/* Logo */}
      <Field label="Logo">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-black flex items-center justify-center" style={{ borderRadius: 2 }}>
            <BrandMark size={36} />
          </div>
          <div>
            <button type="button" className="btn btn-ghost btn-sm"><Icon name="upload" size={13} /> Upload new logo</button>
            <div className="text-[10.5px] text-ui-text-light mt-1">PNG / SVG · 2 MB max · transparent background</div>
          </div>
        </div>
      </Field>

      <Field label="Company name"><input className="ec-input" value={brand.companyName} onChange={e => setBrand({ ...brand, companyName: e.target.value })} /></Field>
      <Field label="Tagline"><input className="ec-input" value={brand.tagline} onChange={e => setBrand({ ...brand, tagline: e.target.value })} /></Field>
      <Field label="Primary accent">
        <div className="flex items-center gap-2">
          {['#FFC72C', '#E0A91A', '#FFD75C', '#FFE183'].map(c => (
            <button key={c} type="button" onClick={() => setBrand({ ...brand, primaryColor: c })}
              className={`w-9 h-9 flex items-center justify-center ${brand.primaryColor === c ? 'ring-2 ring-brand-black ring-offset-2' : ''}`}
              style={{ background: c, borderRadius: 2 }}>
              {brand.primaryColor === c && <Icon name="check" size={14} />}
            </button>
          ))}
          <span className="ml-2 text-[12px] text-ui-text-mid">English Capsules yellow is locked.</span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Signatory name"><input className="ec-input" value={brand.signatoryName} onChange={e => setBrand({ ...brand, signatoryName: e.target.value })} /></Field>
        <Field label="Signatory title"><input className="ec-input" value={brand.signatoryTitle} onChange={e => setBrand({ ...brand, signatoryTitle: e.target.value })} /></Field>
      </div>
      <Field label="Footer contact line"><input className="ec-input" value={brand.footerContact} onChange={e => setBrand({ ...brand, footerContact: e.target.value })} /></Field>

      <button type="button" className="btn btn-dark" onClick={() => toast({ message: 'Brand settings updated for the whole team' })}>Save brand settings</button>
    </div>
  );
}

function DefaultsTab({ defaults, setDefaults, toast }) {
  return (
    <div className="space-y-5">
      <h2 className="font-display font-extrabold text-[20px]">Defaults</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Default currency"><select className="ec-input" value={defaults.currency} onChange={e => setDefaults({...defaults, currency: e.target.value})}>{Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Default VAT %"><input type="number" className="ec-input" value={defaults.vatPercentage} onChange={e => setDefaults({...defaults, vatPercentage: Number(e.target.value)})} /></Field>
        <Field label="Default validity (days)"><input type="number" className="ec-input" value={defaults.validityDays} onChange={e => setDefaults({...defaults, validityDays: Number(e.target.value)})} /></Field>
        <Field label="Proposal number prefix"><input className="ec-input" value={defaults.numberPrefix} onChange={e => setDefaults({...defaults, numberPrefix: e.target.value})} /></Field>
      </div>
      <button type="button" className="btn btn-dark" onClick={() => toast({ message: 'Defaults updated' })}>Save defaults</button>
    </div>
  );
}

function FeaturesTab({ features, setFeatures, toast }) {
  const list = [
    { id: 'bilingualOutput', label: 'Bilingual output (EN/AR)', hint: 'Show the language toggle on the editor.' },
    { id: 'vatCalculation', label: 'VAT calculation', hint: 'Allow VAT to be added to investments.' },
    { id: 'discountLine', label: 'Discount line', hint: 'Optional discount before VAT.' },
    { id: 'multiCurrency', label: 'Multi-currency', hint: 'EGP, USD, EUR, SAR, AED.' },
    { id: 'autoProposalNumber', label: 'Auto-numbering', hint: 'Generate EC-2026-NNNN automatically.' },
    { id: 'qrCode', label: 'QR code on cover', hint: 'For mobile review of contract.' },
    { id: 'customCoverImage', label: 'Custom cover image', hint: 'Upload imagery for the cover page.' },
    { id: 'draftWatermark', label: 'Draft watermark', hint: 'Overlay "DRAFT" on PDFs not yet sent.' },
    { id: 'rfqMode', label: 'RFQ mode', hint: 'Hide pricing; show "On request" instead.' },
    { id: 'eSignaturePlaceholder', label: 'E-signature placeholder', hint: 'Show signature box on final page.' },
    { id: 'pageNumbers', label: 'Page numbers', hint: 'Footer page count.' },
    { id: 'confidentialityFooter', label: 'Confidentiality footer', hint: 'Show "Confidential" line on every page.' },
  ];
  return (
    <div className="space-y-2">
      <h2 className="font-display font-extrabold text-[20px]">Feature toggles</h2>
      <p className="text-[12.5px] text-ui-text-mid mb-3">Turn capabilities on or off for the whole team.</p>
      <div className="divide-y divide-ui-border border-t border-b border-ui-border">
        {list.map(f => (
          <div key={f.id} className="py-3">
            <Toggle value={features[f.id]} onChange={(v) => { setFeatures({ ...features, [f.id]: v }); toast({ message: `${f.label}: ${v ? 'on' : 'off'}` }); }} label={f.label} hint={f.hint} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEAM MANAGEMENT ────────────────────────────────────────────────────────
function Team({ user, users, setUsers }) {
  const toast = useToast();
  const [inviting, setInviting] = React.useState(false);

  function patchUser(uid, p) {
    setUsers(users.map(u => u.uid === uid ? { ...u, ...p } : u));
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between border-b border-brand-black pb-6">
        <div>
          <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 10.5 }}>TEAM · ADMIN</span>
          <h1 className="mt-3 font-display font-extrabold text-[36px] leading-none tracking-tight">Team management</h1>
          <p className="text-[13px] text-ui-text-mid mt-2">{users.length} users · {users.filter(u => u.status==='active').length} active</p>
        </div>
        <button type="button" onClick={() => setInviting(true)} className="btn btn-primary"><Icon name="plus" size={14} /> Invite user</button>
      </div>

      <div className="mt-6 border border-ui-border bg-white" style={{ borderRadius: 2 }}>
        <div className="grid grid-cols-[1fr_180px_120px_120px_44px] gap-3 px-4 py-2.5 bg-brand-cream-deep border-b border-ui-border text-[10.5px] uppercase tracking-wider font-semibold text-ui-text-mid">
          <div>Member</div><div>Role</div><div>Status</div><div>Last active</div><div></div>
        </div>
        {users.map(u => (
          <div key={u.uid} className="grid grid-cols-[1fr_180px_120px_120px_44px] gap-3 px-4 py-3 items-center border-b border-ui-border last:border-0 hover:bg-brand-cream">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar user={u} size={32} />
              <div className="min-w-0">
                <div className="font-display font-bold text-[13px] truncate">{u.name}{u.uid === user.uid && <span className="ml-2 text-[10px] text-ui-text-light font-mono">YOU</span>}</div>
                <div className="text-[11.5px] text-ui-text-mid truncate">{u.email}</div>
              </div>
            </div>
            <select className="ec-input" value={u.role} disabled={u.uid === user.uid} onChange={e => { patchUser(u.uid, { role: e.target.value }); toast({ message: `${u.name} → ${e.target.value}` }); }}>
              <option value="admin">Admin</option>
              <option value="sales">Sales</option>
              <option value="viewer">Viewer</option>
            </select>
            <div>
              {u.status === 'active' && <span className="pill" style={{ background: '#E8F3EC', color: '#2D8659' }}>● Active</span>}
              {u.status === 'pending' && <span className="pill" style={{ background: '#FFF7DD', color: '#E0A91A' }}>● Pending</span>}
              {u.status === 'deactivated' && <span className="pill" style={{ background: '#F2F1EB', color: '#9B9B95' }}>● Deactivated</span>}
            </div>
            <div className="text-[11.5px] text-ui-text-mid">{u.lastActive}</div>
            <div>
              <button type="button" className="btn btn-quiet btn-icon"><Icon name="more" size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {inviting && <InviteDialog onClose={() => setInviting(false)} onInvite={(email, role) => { setUsers([...users, { uid: 'u'+Date.now(), name: email.split('@')[0], initials: email.slice(0,2).toUpperCase(), email, role, status: 'pending', lastActive: '—', color: '#9B9B95' }]); setInviting(false); toast({ message: `Invitation sent to ${email}` }); }} />}
    </div>
  );
}

function InviteDialog({ onClose, onInvite }) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('sales');
  return (
    <div className="fixed inset-0 bg-brand-black/40 z-40 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white w-full max-w-md p-6" style={{ borderRadius: 2 }} onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-extrabold text-[20px]">Invite a teammate</h3>
        <p className="text-[12.5px] text-ui-text-mid mt-1">They'll get an email to sign in. Their access starts as <em>pending</em> until you approve.</p>
        <div className="mt-5 space-y-3">
          <Field label="Work email"><input className="ec-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@englishcapsules.com" /></Field>
          <Field label="Role">
            <select className="ec-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="admin">Admin — full access</option>
              <option value="sales">Sales — create their own proposals</option>
              <option value="viewer">Viewer — read-only</option>
            </select>
          </Field>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => email && onInvite(email, role)}><Icon name="send" size={13} /> Send invite</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Login, Dashboard, Library, Settings, Team });
