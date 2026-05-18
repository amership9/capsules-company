// app.jsx — root: state, routing, tweaks, mounts everything.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FFC72C",
  "density": "comfy",
  "layoutVariant": "split",
  "showPresence": true
}/*EDITMODE-END*/;

function timeAgoTs(iso) { return new Date(iso || Date.now()).getTime(); }

function buildInitialProposals() {
  // Banque Misr — full structured proposal
  const bm = { ...BANQUE_MISR, updatedAtTs: Date.now() - 1000 * 60 * 12, updatedAt: '12 min ago' };
  // Others — flesh out to compute totals at runtime
  const fill = MORE_PROPOSALS.map((p, i) => ({
    ...p,
    summary: '',
    deliverables: [],
    timeline: '',
    items: [{ id: 'i'+i, name: p.title, description: '', quantity: 1, unitPrice: p.totalValue || 0 }],
    vatEnabled: false, vatPercentage: 14,
    discount: { enabled: false, label: '', amount: 0 },
    paymentTerms: '50% upfront, 50% on completion.',
    paymentMethods: 'Bank transfer or instalments on request.',
    ctaTitle: 'Ready to start?',
    ctaSubtitle: 'Reply or call +20 120 359 9998.',
    preparedBy: p.createdByName,
    updatedAtTs: timeAgoTs(p.dateIssued) + (i * 60 * 1000),
  }));
  return [bm, ...fill];
}

function App() {
  // ─── Auth state ─────────
  const [currentUid, setCurrentUid] = React.useState(null);
  const [allUsers, setAllUsers] = React.useState(USERS);
  const currentUser = allUsers.find(u => u.uid === currentUid);

  // ─── Brand + settings ───
  const [brand, setBrand] = React.useState(BRAND);
  const [features, setFeatures] = React.useState(FEATURES);
  const [defaults, setDefaults] = React.useState(DEFAULTS);
  const [lang, setLang] = React.useState('en'); // preview language (PDF)

  // ─── Proposals ──────────
  const [proposals, setProposals] = React.useState(buildInitialProposals);

  // ─── Routing ────────────
  const [route, setRoute] = React.useState('/');

  function onNav(to) { setRoute(to); window.scrollTo(0, 0); }

  function onLogin(uid) {
    setCurrentUid(uid);
    setRoute('/');
  }
  function onSignOut() {
    setCurrentUid(null);
    setRoute('/');
  }

  // Tweaks
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply density class to body
  React.useEffect(() => {
    document.body.classList.toggle('density-compact', t.density === 'compact');
    document.body.classList.toggle('density-comfy', t.density === 'comfy');
  }, [t.density]);

  // Apply accent override
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-yellow', t.accent || '#FFC72C');
    // Override Tailwind class instances via a runtime sheet
    let style = document.getElementById('__accent-override');
    if (!style) {
      style = document.createElement('style');
      style.id = '__accent-override';
      document.head.appendChild(style);
    }
    style.textContent = `
      .bg-brand-yellow, .pill-yellow { background-color: ${t.accent} !important; }
      .text-brand-yellow { color: ${t.accent} !important; }
      .border-brand-yellow { border-color: ${t.accent} !important; }
      .yellow-bar { background-color: ${t.accent} !important; }
      .btn-primary { background-color: ${t.accent} !important; border-color: ${t.accent} !important; }
    `;
  }, [t.accent]);

  function onUseTemplate(tplId) {
    const tpl = TEMPLATES.find(x => x.id === tplId);
    if (!tpl) return;
    const today = new Date();
    const validUntil = new Date(); validUntil.setDate(today.getDate() + defaults.validityDays);
    const num = `${defaults.numberPrefix}-${today.getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
    const newP = {
      id: 'p-' + Date.now(),
      number: num,
      templateId: tplId,
      status: 'draft',
      language: 'en',
      createdBy: currentUser.uid,
      createdByName: currentUser.name,
      assignedTo: currentUser.uid,
      createdAt: today.toISOString(),
      updatedAt: 'Just now',
      updatedAtTs: Date.now(),
      client: { name: '', contact: '', title: '', email: '', phone: '', country: 'Egypt', vatNumber: '' },
      title: tpl.defaultTitle,
      subtitle: '',
      dateIssued: today.toISOString().slice(0,10),
      validUntil: validUntil.toISOString().slice(0,10),
      preparedBy: currentUser.name + ' · English Capsules Academy',
      summary: tpl.defaultSummary,
      deliverables: tpl.defaultItems ? tpl.defaultItems.map(i => `${i.name}${i.desc ? ' — ' + i.desc : ''}`) : [],
      timeline: 'Kick-off within 10 business days of signed agreement.',
      currency: defaults.currency,
      items: tpl.defaultItems.map((it, i) => ({ id: 'i'+Date.now()+i, name: it.name, description: it.desc, quantity: it.qty, unitPrice: it.price })),
      vatEnabled: features.vatCalculation,
      vatPercentage: defaults.vatPercentage,
      discount: { enabled: false, label: 'Discount', amount: 0 },
      paymentTerms: '50% upfront upon signed agreement, 50% on program completion.',
      paymentMethods: 'Bank transfer, corporate cheque, or instalment plan available on request.',
      ctaTitle: 'Ready to start?',
      ctaSubtitle: `Reply to this proposal or call us on ${brand.phone} to lock in your start date.`,
    };
    setProposals([newP, ...proposals]);
    setRoute('/editor/' + newP.id);
  }

  function getProposal(id) {
    if (id === 'new') return null;
    return proposals.find(p => p.id === id);
  }

  function patchProposal(id, patch) {
    setProposals(curr => curr.map(p => p.id === id ? { ...p, ...patch, updatedAtTs: Date.now(), updatedAt: 'Just now' } : p));
  }

  function changeStatus(id, status) { patchProposal(id, { status }); }

  function deleteProposal(id) {
    setProposals(curr => curr.filter(p => p.id !== id));
  }

  // Fake presence: 2 other users 'on' the editor of Banque Misr
  const presence = allUsers.filter(u => u.status === 'active' && u.uid !== currentUid).slice(0, 3);

  if (!currentUser) return <ToastProvider><Login onLogin={onLogin} users={allUsers} /></ToastProvider>;

  // Determine view
  let view = null;
  if (route === '/') {
    view = <Dashboard user={currentUser} proposals={proposals} onNav={onNav} onUseTemplate={onUseTemplate} allUsers={allUsers} />;
  } else if (route === '/library') {
    view = <Library user={currentUser} proposals={proposals} onNav={onNav} allUsers={allUsers} onStatusChange={changeStatus} onDelete={deleteProposal} />;
  } else if (route === '/settings') {
    view = <Settings user={currentUser} brand={brand} setBrand={setBrand} features={features} setFeatures={setFeatures} defaults={defaults} setDefaults={setDefaults} />;
  } else if (route === '/team') {
    view = currentUser.role === 'admin'
      ? <Team user={currentUser} users={allUsers} setUsers={setAllUsers} />
      : <PermissionDenied onNav={onNav} />;
  } else if (route.startsWith('/editor/')) {
    const id = route.slice('/editor/'.length);
    const proposal = getProposal(id);
    if (!proposal) {
      // New blank — quick prompt
      view = <NewProposalPrompt onNav={onNav} onUseTemplate={onUseTemplate} />;
    } else {
      view = (
        <Editor
          proposal={proposal}
          onChange={(patch) => patchProposal(proposal.id, patch)}
          brand={brand}
          features={features}
          user={currentUser}
          onNav={onNav}
          otherUsers={allUsers.filter(u => u.uid !== currentUid)}
          lang={lang}
          setLang={setLang}
          layoutVariant={t.layoutVariant}
          density={t.density}
          accent={t.accent}
          presence={t.showPresence ? [currentUser, ...presence.slice(0, 1)] : []}
        />
      );
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-cream">
        <TopNav
          user={currentUser}
          route={route}
          onNav={onNav}
          onSignOut={onSignOut}
          presence={t.showPresence ? presence : []}
          otherUsers={allUsers.filter(u => u.uid !== currentUid && u.status === 'active')}
          onSwitchUser={(uid) => { setCurrentUid(uid); onNav('/'); }}
        />
        {view}

        <TweaksPanel>
          <TweakSection label="Visual direction" />
          <TweakColor
            label="Yellow accent"
            value={t.accent}
            options={['#FFC72C', '#E0A91A', '#FFD75C', '#F2B807']}
            onChange={(v) => setTweak('accent', v)}
          />
          <TweakRadio
            label="Density"
            value={t.density}
            options={['comfy', 'compact']}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakSection label="Editor layout" />
          <TweakSelect
            label="Layout variant"
            value={t.layoutVariant}
            options={[
              { value: 'split', label: 'Form left · Preview right (default)' },
              { value: 'preview-left', label: 'Preview left · Form right' },
              { value: 'stacked', label: 'Stacked (form on top)' },
            ]}
            onChange={(v) => setTweak('layoutVariant', v)}
          />
          <TweakSection label="Demo features" />
          <TweakToggle
            label="Show team presence"
            value={t.showPresence}
            onChange={(v) => setTweak('showPresence', v)}
          />
        </TweaksPanel>
      </div>
    </ToastProvider>
  );
}

function NewProposalPrompt({ onNav, onUseTemplate }) {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <span className="pill pill-yellow font-display tracking-[0.2em]" style={{ fontSize: 10.5 }}>NEW</span>
      <h1 className="mt-3 font-display font-extrabold text-[40px] leading-none tracking-tight">Pick a starting point.</h1>
      <p className="text-[14px] text-ui-text-mid mt-2">Every template is pre-loaded with curriculum, session structure and indicative pricing. You can edit anything.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
        {TEMPLATES.map(t => <TemplateCard key={t.id} tpl={t} onUse={() => onUseTemplate(t.id)} />)}
      </div>
    </div>
  );
}

function PermissionDenied({ onNav }) {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <Icon name="lock" size={32} />
      <h2 className="font-display font-extrabold text-[24px] mt-4">Admin access required</h2>
      <p className="text-[13px] text-ui-text-mid mt-2">Ask your admin to grant team management access.</p>
      <button type="button" className="btn btn-dark mt-4" onClick={() => onNav('/')}><Icon name="home" size={13} /> Back to dashboard</button>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
