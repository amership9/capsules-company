// editor.jsx — Editor screen: form (left, 40%) + scrollable A4 PDF preview (right, 60%).
// Auto-save indicator simulates debounced Firestore writes.
// Layout variant configurable via Tweaks.

function Editor({ proposal, onChange, brand, features, user, onNav, onChangeStatus, otherUsers, lang, setLang, layoutVariant = 'split', density, accent, presence }) {
  const [saveState, setSaveState] = React.useState('synced');
  const [zoom, setZoom] = React.useState(0.78);
  const toast = useToast();
  const saveTimer = React.useRef(null);
  const dirty = React.useRef(false);

  // Debounced "save" simulation
  function patch(part) {
    onChange(part);
    dirty.current = true;
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveState('synced');
      dirty.current = false;
    }, 800);
  }

  const totals = calcTotals(proposal);

  // Layout
  const showSidebySide = layoutVariant !== 'stacked';
  const formFirst = layoutVariant !== 'preview-left';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Editor toolbar */}
      <div className="border-b border-ui-border bg-brand-cream/95 px-6 py-2.5 flex items-center gap-4 sticky top-[60px] z-10">
        <button type="button" onClick={() => onNav('/')} className="btn btn-quiet btn-sm">
          <Icon name="chevron-left" size={14} /> Back
        </button>
        <div className="h-5 w-px bg-ui-border" />
        <div className="flex items-baseline gap-3 min-w-0 flex-1">
          <span className="pdf-mono text-[11px] font-semibold text-brand-yellow-dark">{proposal.number}</span>
          <input
            type="text"
            value={proposal.title}
            onChange={e => patch({ title: e.target.value })}
            className="font-display font-bold text-[15px] bg-transparent border-0 outline-none px-0 py-0 flex-1 min-w-0 focus:bg-white focus:px-1.5"
            style={{ borderRadius: 2 }}
          />
          <StatusBadgeMenu status={proposal.status} onChange={(s) => { patch({ status: s }); toast({ message: `Status changed to ${s}`, icon: 'flag' }); }} />
        </div>

        <SaveIndicator state={saveState} lastEditor={user.name.split(' ')[0]} lastEditedAgo="just now" />

        <div className="h-5 w-px bg-ui-border" />

        {/* Language toggle */}
        <button
          type="button"
          onClick={() => { const next = lang === 'en' ? 'ar' : 'en'; setLang(next); toast({ message: `Preview switched to ${next === 'ar' ? 'العربية' : 'English'}`, icon: 'globe' }); }}
          className="btn btn-ghost btn-sm"
          title="Toggle preview language"
        >
          <Icon name="globe" size={13} />
          {lang === 'en' ? 'EN' : 'AR'} <span className="text-ui-text-light">→</span> {lang === 'en' ? 'AR' : 'EN'}
        </button>

        {/* Presence on this proposal */}
        {presence && presence.length > 1 && (
          <div className="flex items-center -space-x-1.5">
            {presence.slice(0, 3).map(u => <Avatar key={u.uid} user={u} size={22} ring />)}
          </div>
        )}

        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { toast({ message: 'Proposal duplicated' }); }}>
          <Icon name="copy" size={13} /> Duplicate
        </button>
        <button type="button" className="btn btn-dark btn-sm" onClick={() => { toast({ message: 'PDF generated — downloading…', icon: 'download' }); }}>
          <Icon name="download" size={13} /> Save & Download PDF
        </button>
      </div>

      {/* Body */}
      <div className={`flex-1 min-h-0 overflow-hidden ${showSidebySide ? 'flex' : ''}`}>
        {showSidebySide ? (
          <>
            {formFirst ? (
              <>
                <FormPane proposal={proposal} patch={patch} features={features} totals={totals} />
                <PreviewPane proposal={proposal} brand={brand} features={features} lang={lang} zoom={zoom} setZoom={setZoom} />
              </>
            ) : (
              <>
                <PreviewPane proposal={proposal} brand={brand} features={features} lang={lang} zoom={zoom} setZoom={setZoom} />
                <FormPane proposal={proposal} patch={patch} features={features} totals={totals} />
              </>
            )}
          </>
        ) : (
          <div className="w-full overflow-auto nice-scroll">
            <div className="max-w-[920px] mx-auto p-6">
              <FormPaneInner proposal={proposal} patch={patch} features={features} totals={totals} />
            </div>
            <div className="bg-brand-cream-deep border-t border-ui-border">
              <PreviewPaneInner proposal={proposal} brand={brand} features={features} lang={lang} zoom={zoom} setZoom={setZoom} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORM PANE ──────────────────────────────────────────────────────────────
function FormPane({ proposal, patch, features, totals }) {
  return (
    <div className="bg-white border-r border-ui-border overflow-y-auto nice-scroll" style={{ width: '40%', minWidth: 480 }}>
      <FormPaneInner proposal={proposal} patch={patch} features={features} totals={totals} />
    </div>
  );
}

function FormPaneInner({ proposal, patch, features, totals }) {
  return (
    <div>
      {/* Section 1: Client */}
      <FormSection title="Client" num={1}>
        <Field label="Client / Company name">
          <input className="ec-input" value={proposal.client.name} onChange={e => patch({ client: { ...proposal.client, name: e.target.value } })} placeholder="e.g. Banque Misr" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person">
            <input className="ec-input" value={proposal.client.contact} onChange={e => patch({ client: { ...proposal.client, contact: e.target.value } })} placeholder="Full name" />
          </Field>
          <Field label="Title / Role">
            <input className="ec-input" value={proposal.client.title} onChange={e => patch({ client: { ...proposal.client, title: e.target.value } })} placeholder="e.g. HR Director" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input className="ec-input" value={proposal.client.email} onChange={e => patch({ client: { ...proposal.client, email: e.target.value } })} placeholder="name@company.com" />
          </Field>
          <Field label="Phone">
            <input className="ec-input" value={proposal.client.phone} onChange={e => patch({ client: { ...proposal.client, phone: e.target.value } })} placeholder="+20 …" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <input className="ec-input" value={proposal.client.country} onChange={e => patch({ client: { ...proposal.client, country: e.target.value } })} />
          </Field>
          <Field label="VAT / Tax number (optional)">
            <input className="ec-input" value={proposal.client.vatNumber || ''} onChange={e => patch({ client: { ...proposal.client, vatNumber: e.target.value } })} />
          </Field>
        </div>
      </FormSection>

      {/* Section 2: Proposal */}
      <FormSection title="Proposal" num={2}>
        <Field label="Proposal title">
          <input className="ec-input" value={proposal.title} onChange={e => patch({ title: e.target.value })} />
        </Field>
        <Field label="Subtitle (one-line pitch)">
          <input className="ec-input" value={proposal.subtitle || ''} onChange={e => patch({ subtitle: e.target.value })} placeholder="A program designed for…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date issued">
            <input type="date" className="ec-input" value={proposal.dateIssued} onChange={e => patch({ dateIssued: e.target.value })} />
          </Field>
          <Field label="Valid until">
            <input type="date" className="ec-input" value={proposal.validUntil} onChange={e => patch({ validUntil: e.target.value })} />
          </Field>
        </div>
        <Field label="Prepared by">
          <input className="ec-input" value={proposal.preparedBy} onChange={e => patch({ preparedBy: e.target.value })} />
        </Field>
      </FormSection>

      {/* Section 3: Summary */}
      <FormSection title="Executive summary" num={3}>
        <Field label="Summary" hint="2–4 sentences. Plain language. Mention the curriculum, the cohort, and the outcome.">
          <textarea className="ec-input" rows={6} value={proposal.summary} onChange={e => patch({ summary: e.target.value })} />
        </Field>
      </FormSection>

      {/* Section 4: Deliverables */}
      <FormSection title="What you get" num={4} action={
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => patch({ deliverables: [...(proposal.deliverables || []), ''] })}>
          <Icon name="plus" size={12} /> Add
        </button>
      }>
        <div className="space-y-2">
          {(proposal.deliverables || []).map((d, i) => (
            <div key={i} className="flex items-start gap-2 group">
              <span className="pdf-mono text-[11px] text-brand-yellow-dark font-semibold pt-2.5 shrink-0" style={{ width: 22 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <textarea
                className="ec-input"
                rows={2}
                value={d}
                onChange={e => {
                  const next = [...proposal.deliverables];
                  next[i] = e.target.value;
                  patch({ deliverables: next });
                }}
              />
              <button type="button"
                className="btn btn-quiet btn-icon shrink-0 opacity-40 hover:opacity-100 mt-1"
                onClick={() => patch({ deliverables: proposal.deliverables.filter((_, j) => j !== i) })}
                title="Remove">
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Section 5: Timeline */}
      <FormSection title="Timeline" num={5}>
        <Field label="Timeline statement">
          <textarea className="ec-input" rows={3} value={proposal.timeline} onChange={e => patch({ timeline: e.target.value })} />
        </Field>
      </FormSection>

      {/* Section 6: Investment */}
      <FormSection title="Investment" num={6} action={
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => patch({ items: [...(proposal.items || []), { id: 'i' + Date.now(), name: '', description: '', quantity: 1, unitPrice: 0 }] })}>
          <Icon name="plus" size={12} /> Add line
        </button>
      }>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Currency">
            <select className="ec-input" value={proposal.currency} onChange={e => patch({ currency: e.target.value })}>
              {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="VAT %">
            <div className="flex items-center gap-2">
              <input type="number" className="ec-input" value={proposal.vatPercentage} disabled={!proposal.vatEnabled} onChange={e => patch({ vatPercentage: Number(e.target.value) })} />
              <Toggle value={proposal.vatEnabled} onChange={v => patch({ vatEnabled: v })} label="" />
            </div>
          </Field>
        </div>

        {/* Line items */}
        <div className="space-y-3 mt-1">
          {(proposal.items || []).map((item, i) => (
            <LineItemRow
              key={item.id || i}
              item={item}
              currency={proposal.currency}
              onChange={(patched) => {
                const next = [...proposal.items];
                next[i] = { ...item, ...patched };
                patch({ items: next });
              }}
              onRemove={() => patch({ items: proposal.items.filter((_, j) => j !== i) })}
              onMove={(dir) => {
                const next = [...proposal.items];
                const j = i + dir;
                if (j < 0 || j >= next.length) return;
                [next[i], next[j]] = [next[j], next[i]];
                patch({ items: next });
              }}
              isFirst={i === 0}
              isLast={i === (proposal.items?.length || 0) - 1}
            />
          ))}
        </div>

        {/* Discount toggle */}
        <div className="border border-ui-border p-3" style={{ borderRadius: 2 }}>
          <Toggle
            value={proposal.discount?.enabled}
            onChange={v => patch({ discount: { ...proposal.discount, enabled: v } })}
            label="Apply discount line"
            hint="Subtracted before VAT"
          />
          {proposal.discount?.enabled && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Discount label">
                <input className="ec-input" value={proposal.discount.label} onChange={e => patch({ discount: { ...proposal.discount, label: e.target.value } })} />
              </Field>
              <Field label={`Amount (${proposal.currency})`}>
                <input type="number" className="ec-input" value={proposal.discount.amount} onChange={e => patch({ discount: { ...proposal.discount, amount: Number(e.target.value) } })} />
              </Field>
            </div>
          )}
        </div>

        {/* Live totals chip */}
        <div className="bg-brand-cream-deep p-4 -mx-1" style={{ borderRadius: 2 }}>
          <div className="grid grid-cols-2 gap-y-1.5 text-[12.5px]">
            <div className="text-ui-text-mid">Subtotal</div>
            <div className="text-right pdf-mono font-semibold">{fmtMoney(totals.subtotal, proposal.currency)}</div>
            {proposal.discount?.enabled && totals.discountAmt > 0 && (
              <>
                <div className="text-brand-yellow-dark">{proposal.discount.label || 'Discount'}</div>
                <div className="text-right pdf-mono font-semibold text-brand-yellow-dark">− {fmtMoney(totals.discountAmt, proposal.currency)}</div>
              </>
            )}
            {proposal.vatEnabled && (
              <>
                <div className="text-ui-text-mid">VAT ({proposal.vatPercentage}%)</div>
                <div className="text-right pdf-mono font-semibold">{fmtMoney(totals.vatAmt, proposal.currency)}</div>
              </>
            )}
            <div className="col-span-2 h-px bg-brand-black my-1.5" />
            <div className="font-display font-extrabold text-[14px]">Total</div>
            <div className="text-right pdf-mono font-extrabold text-[16px]">{fmtMoney(totals.total, proposal.currency)}</div>
          </div>
        </div>
      </FormSection>

      {/* Section 7: Payment */}
      <FormSection title="Payment & terms" num={7}>
        <Field label="Payment terms">
          <textarea className="ec-input" rows={2} value={proposal.paymentTerms} onChange={e => patch({ paymentTerms: e.target.value })} />
        </Field>
        <Field label="Payment methods">
          <textarea className="ec-input" rows={2} value={proposal.paymentMethods} onChange={e => patch({ paymentMethods: e.target.value })} />
        </Field>
      </FormSection>

      {/* Section 8: CTA */}
      <FormSection title="Next step (CTA)" num={8}>
        <Field label="CTA title">
          <input className="ec-input" value={proposal.ctaTitle} onChange={e => patch({ ctaTitle: e.target.value })} />
        </Field>
        <Field label="CTA subtitle">
          <textarea className="ec-input" rows={2} value={proposal.ctaSubtitle} onChange={e => patch({ ctaSubtitle: e.target.value })} />
        </Field>
      </FormSection>

      <div className="px-5 py-8 text-center">
        <div className="text-[10.5px] uppercase tracking-wider text-ui-text-light font-semibold">End of proposal</div>
        <div className="text-[11px] text-ui-text-light mt-1">All changes auto-save to the team workspace.</div>
      </div>
    </div>
  );
}

function LineItemRow({ item, currency, onChange, onRemove, onMove, isFirst, isLast }) {
  const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  return (
    <div className="border border-ui-border p-3 group" style={{ borderRadius: 2 }}>
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1.5 opacity-40 group-hover:opacity-100">
          <button type="button" className="hover:bg-brand-cream rounded-sm p-0.5" disabled={isFirst} onClick={() => onMove(-1)}><Icon name="chevron-down" size={11} className="rotate-180" /></button>
          <button type="button" className="hover:bg-brand-cream rounded-sm p-0.5" disabled={isLast} onClick={() => onMove(1)}><Icon name="chevron-down" size={11} /></button>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <input className="ec-input font-semibold" placeholder="Item name" value={item.name} onChange={e => onChange({ name: e.target.value })} />
          <input className="ec-input" placeholder="Description (optional)" value={item.description} onChange={e => onChange({ description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ui-text-mid font-semibold mb-1">Qty</div>
              <input type="number" className="ec-input" value={item.quantity} onChange={e => onChange({ quantity: Number(e.target.value) })} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ui-text-mid font-semibold mb-1">Unit price ({currency})</div>
              <input type="number" className="ec-input" value={item.unitPrice} onChange={e => onChange({ unitPrice: Number(e.target.value) })} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ui-text-mid font-semibold mb-1">Amount</div>
              <div className="ec-input pdf-mono font-semibold bg-brand-cream-deep" style={{ cursor: 'default' }}>{fmtMoney(amount, currency)}</div>
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-quiet btn-icon shrink-0 opacity-40 group-hover:opacity-100" onClick={onRemove} title="Remove">
          <Icon name="trash" size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── PREVIEW PANE ───────────────────────────────────────────────────────────
function PreviewPane({ proposal, brand, features, lang, zoom, setZoom }) {
  return (
    <div className="bg-brand-cream-deep flex-1 overflow-auto nice-scroll relative">
      <PreviewPaneInner proposal={proposal} brand={brand} features={features} lang={lang} zoom={zoom} setZoom={setZoom} />
    </div>
  );
}

function PreviewPaneInner({ proposal, brand, features, lang, zoom, setZoom }) {
  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="sticky top-3 z-10 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-brand-black text-white px-1.5 py-1.5 inline-flex items-center gap-1 shadow-lg" style={{ borderRadius: 2 }}>
          <button type="button" className="hover:bg-white/10 rounded-sm w-7 h-7 flex items-center justify-center" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}>
            <Icon name="minus" size={14} />
          </button>
          <span className="text-[11.5px] font-mono w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <button type="button" className="hover:bg-white/10 rounded-sm w-7 h-7 flex items-center justify-center" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}>
            <Icon name="plus" size={14} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button type="button" className="hover:bg-white/10 rounded-sm px-2 h-7 text-[11px] font-semibold" onClick={() => setZoom(0.78)}>Fit</button>
        </div>
      </div>
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: A4_W, margin: '0 auto', paddingBottom: 100 * zoom }}>
        <FullPDFPreview proposal={proposal} brand={brand} features={features} lang={lang} />
      </div>
    </div>
  );
}

Object.assign(window, { Editor, FormPane, FormPaneInner, PreviewPane, PreviewPaneInner, LineItemRow });
