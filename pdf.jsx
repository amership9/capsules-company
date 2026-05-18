// pdf.jsx — Multi-page A4 PDF preview. Editorial, premium, locked to brand.
// Pages are stacked vertically with realistic A4 dimensions and page breaks visible.
// No transitions on content updates (per brief).

const A4_W = 794;  // ~210mm at 96dpi
const A4_H = 1123; // ~297mm at 96dpi

// ─── Page wrapper ───────────────────────────────────────────────────────────
function PDFPage({ children, dir = 'ltr', pageNum, totalPages, showFooter = true, showHeader = true, brand, features, lang, isCover = false, isDraft = false }) {
  return (
    <div className="pdf-page mx-auto relative no-anim pdf" dir={dir}
         style={{ width: A4_W, minHeight: A4_H }}>
      {/* Draft watermark */}
      {isDraft && features?.draftWatermark && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
          <span className="font-display font-extrabold tracking-[0.25em]"
                style={{ color: 'rgba(10,10,10,0.05)', fontSize: 200, transform: 'rotate(-28deg)' }}>
            DRAFT
          </span>
        </div>
      )}
      <div className="relative h-full" style={{ zIndex: 2 }}>
        {children}
      </div>
      {/* Footer */}
      {showFooter && !isCover && (
        <div className="absolute bottom-0 left-0 right-0 px-[56px] pb-[28px] flex items-end justify-between text-[9.5px] text-ui-text-mid">
          <div className="flex items-center gap-2">
            <BrandMark size={14} />
            <span className="font-semibold text-brand-black">{brand?.companyName?.toUpperCase()}</span>
            <span className="mx-1">·</span>
            <span>{brand?.footerContact}</span>
          </div>
          {features?.pageNumbers && (
            <div className="font-mono">{L[lang].page} {pageNum} / {totalPages}</div>
          )}
        </div>
      )}
      {showFooter && features?.confidentialityFooter && !isCover && (
        <div className="absolute bottom-[12px] left-0 right-0 px-[56px] text-[8px] text-ui-text-light text-center tracking-wider">
          {L[lang].confidential}
        </div>
      )}
    </div>
  );
}

// ─── PAGE 1: COVER ──────────────────────────────────────────────────────────
function CoverPage({ proposal, brand, features, lang }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = L[lang];
  const heroTitle = proposal.title || 'Untitled Proposal';
  // Pick a hero word for italic accent — the first noun-like word
  const heroWords = heroTitle.split(' ');
  const italicWord = heroWords[heroWords.length - 1];
  const restWords = heroWords.slice(0, -1).join(' ');

  return (
    <PDFPage isCover showFooter={false} dir={dir} brand={brand} features={features} lang={lang} isDraft={proposal.status === 'draft'}>
      <div className="h-full flex flex-col" style={{ minHeight: A4_H }}>
        {/* Top: logo + yellow bar */}
        <div className="pt-[56px] px-[56px]">
          <BrandWordmark />
          <div className="yellow-bar mt-6" style={{ width: '40%' }} />
        </div>

        {/* Section label */}
        <div className="px-[56px] mt-[100px]">
          <span className="pill pill-yellow font-display tracking-[0.18em]" style={{ fontSize: 11, padding: '6px 12px' }}>
            {t.proposalFor}
          </span>
          <div className="mt-3 font-display font-extrabold text-[28px] leading-tight">
            {proposal.client?.name || '—'}
          </div>
          {proposal.client?.contact && (
            <div className="text-[13.5px] text-ui-text-mid mt-1">
              {proposal.client.contact}{proposal.client.title ? ` · ${proposal.client.title}` : ''}
            </div>
          )}
        </div>

        {/* Hero title — massive */}
        <div className="px-[56px] mt-[64px] flex-1">
          <h1 className="font-display font-extrabold text-brand-black leading-[0.95] tracking-[-0.02em]"
              style={{ fontSize: 64, textWrap: 'balance' }}>
            {restWords && (<span>{restWords} </span>)}
            <span className="pdf-italic font-normal" style={{ color: '#0A0A0A' }}>{italicWord}</span>
            <span className="text-brand-yellow">.</span>
          </h1>
          {proposal.subtitle && (
            <div className="mt-6 text-[18px] text-ui-text-mid font-medium" style={{ maxWidth: '70%' }}>
              {proposal.subtitle}
            </div>
          )}
        </div>

        {/* Bottom meta block */}
        <div className="px-[56px] pb-[56px]">
          <div className="yellow-bar mb-6" style={{ width: '20%' }} />
          <div className="grid grid-cols-3 gap-8">
            <MetaCol label={t.proposalNumber} value={proposal.number} mono />
            <MetaCol label={t.dateIssued} value={fmtDate(proposal.dateIssued, lang)} mono />
            <MetaCol label={t.validUntil} value={fmtDate(proposal.validUntil, lang)} mono />
          </div>
          <div className="mt-7 flex items-end justify-between">
            <div>
              <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">{t.preparedBy}</div>
              <div className="font-display font-bold text-[14px] mt-1">{proposal.preparedBy}</div>
            </div>
            <div className="text-right">
              <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">{brand.companyName}</div>
              <div className="text-[12px] text-ui-text-mid mt-1">{brand.tagline}</div>
            </div>
          </div>
        </div>
      </div>
    </PDFPage>
  );
}

function MetaCol({ label, value, mono }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">{label}</div>
      <div className={`mt-1 text-[14px] font-bold ${mono ? 'pdf-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

// ─── PAGE 2: EXECUTIVE SUMMARY + TIMELINE ───────────────────────────────────
function SummaryPage({ proposal, brand, features, lang, pageNum, totalPages }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = L[lang];
  return (
    <PDFPage dir={dir} brand={brand} features={features} lang={lang} pageNum={pageNum} totalPages={totalPages} isDraft={proposal.status==='draft'}>
      <ContentHeader brand={brand} proposal={proposal} lang={lang} />

      <div className="px-[56px] mt-10">
        <SectionLabel>{t.executiveSummary}</SectionLabel>
        <p className="mt-4 text-[14px] leading-[1.7] text-brand-black" style={{ textWrap: 'pretty' }}>
          {proposal.summary || <span className="text-ui-text-light italic">[Executive summary will appear here]</span>}
        </p>
      </div>

      <div className="px-[56px] mt-12">
        <SectionLabel>{t.timeline}</SectionLabel>
        <p className="mt-4 text-[14px] leading-[1.7] text-brand-black" style={{ textWrap: 'pretty' }}>
          {proposal.timeline || <span className="text-ui-text-light italic">[Timeline will appear here]</span>}
        </p>
      </div>

      {/* Stat row — partners, locations */}
      <div className="px-[56px] mt-14">
        <div className="grid grid-cols-3 gap-6 border-t border-b border-brand-black py-6">
          <StatBlock value="100,000+" label="Students trained since 2015" />
          <StatBlock value="4" label="Centres across Cairo & Giza" />
          <StatBlock value="60+" label="Certified instructors" />
        </div>
      </div>

      {/* Partners strip */}
      <div className="px-[56px] mt-8">
        <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold mb-3">Trusted by corporate partners across Egypt</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-display font-bold text-[13px] text-brand-black">
          {brand.partners.map(p => <span key={p}>{p}</span>)}
        </div>
      </div>
    </PDFPage>
  );
}

function StatBlock({ value, label }) {
  return (
    <div>
      <div className="font-display font-extrabold text-[32px] leading-none">{value}</div>
      <div className="text-[10.5px] uppercase tracking-wider text-ui-text-mid font-semibold mt-2">{label}</div>
    </div>
  );
}

// ─── PAGE 3: WHAT YOU GET ────────────────────────────────────────────────────
function DeliverablesPage({ proposal, brand, features, lang, pageNum, totalPages }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = L[lang];
  return (
    <PDFPage dir={dir} brand={brand} features={features} lang={lang} pageNum={pageNum} totalPages={totalPages} isDraft={proposal.status==='draft'}>
      <ContentHeader brand={brand} proposal={proposal} lang={lang} />

      <div className="px-[56px] mt-10">
        <SectionLabel>{t.whatYouGet}</SectionLabel>
        <div className="mt-2 font-display font-extrabold text-[36px] leading-[1.05] tracking-tight" style={{ maxWidth: '85%', textWrap: 'balance' }}>
          A program built around your team — not the other way around.
        </div>
      </div>

      <div className="px-[56px] mt-8">
        <ul className="divide-y divide-ui-border border-t border-b border-ui-border">
          {(proposal.deliverables || []).map((d, i) => (
            <li key={i} className="py-5 flex items-baseline gap-5">
              <span className="pdf-mono font-semibold text-brand-yellow-dark text-[18px] shrink-0" style={{ width: 36 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[14px] leading-[1.6] text-brand-black flex-1" style={{ textWrap: 'pretty' }}>{d}</span>
            </li>
          ))}
          {(!proposal.deliverables || proposal.deliverables.length === 0) && (
            <li className="py-5 text-ui-text-light italic">[Deliverables will appear here]</li>
          )}
        </ul>
      </div>

      {/* Why us */}
      <div className="px-[56px] mt-10">
        <div className="bg-brand-cream-deep p-6" style={{ borderRadius: 2 }}>
          <SectionLabel small>Why English Capsules</SectionLabel>
          <div className="grid grid-cols-2 gap-5 mt-4">
            {brand.certifications.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-brand-yellow" />
                <span className="text-[12.5px] leading-[1.5] font-semibold">{c}</span>
              </div>
            ))}
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-brand-yellow" />
              <span className="text-[12.5px] leading-[1.5] font-semibold">Founded 2015 · 100k+ alumni</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-brand-yellow" />
              <span className="text-[12.5px] leading-[1.5] font-semibold">On-site or in-centre delivery</span>
            </div>
          </div>
        </div>
      </div>
    </PDFPage>
  );
}

// ─── PAGE 4: INVESTMENT ─────────────────────────────────────────────────────
function InvestmentPage({ proposal, brand, features, lang, pageNum, totalPages }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = L[lang];
  const totals = calcTotals(proposal);
  const cur = proposal.currency || 'EGP';

  return (
    <PDFPage dir={dir} brand={brand} features={features} lang={lang} pageNum={pageNum} totalPages={totalPages} isDraft={proposal.status==='draft'}>
      <ContentHeader brand={brand} proposal={proposal} lang={lang} />

      <div className="px-[56px] mt-10">
        <SectionLabel>{t.investment}</SectionLabel>
        <div className="mt-2 flex items-end justify-between">
          <div className="font-display font-extrabold text-[36px] leading-[1.05] tracking-tight" style={{ maxWidth: '60%' }}>
            A fair, transparent investment.
          </div>
          <div className="text-right">
            <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">Currency</div>
            <div className="pdf-mono font-bold text-[16px] mt-1">{cur}</div>
          </div>
        </div>
      </div>

      <div className="px-[56px] mt-8">
        <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-brand-black text-white">
              <th className="text-left py-3 px-4 font-display font-bold text-[11px] uppercase tracking-wider">{t.item}</th>
              <th className="text-right py-3 px-3 font-display font-bold text-[11px] uppercase tracking-wider" style={{ width: 56 }}>{t.qty}</th>
              <th className="text-right py-3 px-3 font-display font-bold text-[11px] uppercase tracking-wider" style={{ width: 120 }}>{t.unit}</th>
              <th className="text-right py-3 px-4 font-display font-bold text-[11px] uppercase tracking-wider" style={{ width: 140 }}>{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {(proposal.items || []).map((item, i) => (
              <tr key={item.id || i} className="border-b border-ui-border">
                <td className="py-4 px-4 align-top">
                  <div className="font-semibold text-brand-black">{item.name || <span className="text-ui-text-light italic">[Item]</span>}</div>
                  {item.description && <div className="text-[11.5px] text-ui-text-mid mt-1 leading-snug" style={{ textWrap: 'pretty' }}>{item.description}</div>}
                </td>
                <td className="py-4 px-3 align-top text-right pdf-mono font-medium">{item.quantity}</td>
                <td className="py-4 px-3 align-top text-right pdf-mono font-medium">{fmtMoney(item.unitPrice, cur)}</td>
                <td className="py-4 px-4 align-top text-right pdf-mono font-bold">{fmtMoney((Number(item.quantity)||0) * (Number(item.unitPrice)||0), cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 ml-auto" style={{ width: 360 }}>
          <TotalRow label={t.subtotal} value={fmtMoney(totals.subtotal, cur)} />
          {proposal.discount?.enabled && totals.discountAmt > 0 && (
            <TotalRow
              label={proposal.discount.label || t.discount}
              value={`− ${fmtMoney(totals.discountAmt, cur)}`}
              yellow
            />
          )}
          {features?.vatCalculation && proposal.vatEnabled && (
            <TotalRow label={`${t.vat} (${proposal.vatPercentage}%)`} value={fmtMoney(totals.vatAmt, cur)} />
          )}
          <div className="mt-2 border-t-[2px] border-brand-black pt-3 flex items-baseline justify-between">
            <span className="font-display font-extrabold text-[14px] uppercase tracking-wider">{t.total}</span>
            <span className="pdf-mono font-bold text-[22px]">{fmtMoney(totals.total, cur)}</span>
          </div>
        </div>
      </div>

      {/* Payment terms */}
      <div className="px-[56px] mt-12 grid grid-cols-2 gap-8">
        <div>
          <SectionLabel small>{t.paymentTerms}</SectionLabel>
          <p className="mt-3 text-[13px] leading-[1.65] text-brand-black" style={{ textWrap: 'pretty' }}>
            {proposal.paymentTerms || <span className="text-ui-text-light italic">[Payment terms]</span>}
          </p>
        </div>
        <div>
          <SectionLabel small>{t.paymentMethods}</SectionLabel>
          <p className="mt-3 text-[13px] leading-[1.65] text-brand-black" style={{ textWrap: 'pretty' }}>
            {proposal.paymentMethods || <span className="text-ui-text-light italic">[Payment methods]</span>}
          </p>
        </div>
      </div>
    </PDFPage>
  );
}

function TotalRow({ label, value, yellow }) {
  return (
    <div className={`flex items-baseline justify-between py-1.5 ${yellow ? 'text-brand-yellow-dark' : 'text-brand-black'}`}>
      <span className="text-[12px] font-medium">{label}</span>
      <span className="pdf-mono text-[13px] font-semibold">{value}</span>
    </div>
  );
}

// ─── PAGE 5: NEXT STEP + SIGNATURE ──────────────────────────────────────────
function CtaPage({ proposal, brand, features, lang, pageNum, totalPages }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = L[lang];
  return (
    <PDFPage dir={dir} brand={brand} features={features} lang={lang} pageNum={pageNum} totalPages={totalPages} isDraft={proposal.status==='draft'}>
      <ContentHeader brand={brand} proposal={proposal} lang={lang} />

      {/* Black CTA card with yellow vertical bar */}
      <div className="px-[56px] mt-12">
        <div className="bg-brand-black text-white relative overflow-hidden" style={{ borderRadius: 2 }}>
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-yellow" />
          <div className="p-10 pl-12">
            <span className="text-[10px] uppercase tracking-[0.25em] text-brand-yellow font-bold">{t.nextStep}</span>
            <div className="font-display font-extrabold text-[44px] leading-[1.0] tracking-tight mt-3" style={{ textWrap: 'balance' }}>
              {proposal.ctaTitle || 'Ready to start?'}
            </div>
            <div className="text-[15px] text-white/80 mt-4 leading-relaxed" style={{ maxWidth: '85%', textWrap: 'pretty' }}>
              {proposal.ctaSubtitle || 'Reply to this proposal or call us on +20 120 359 9998.'}
            </div>
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-[12px]">
              <CtaItem icon="mic" label="Call" value={brand.phone} />
              <CtaItem icon="send" label="Email" value={brand.email} />
              <CtaItem icon="globe" label="Web" value={brand.website} />
            </div>
          </div>
        </div>
      </div>

      {/* Signature block */}
      {features?.eSignaturePlaceholder && (
        <div className="px-[56px] mt-14">
          <SectionLabel>{t.signature}</SectionLabel>
          <div className="grid grid-cols-2 gap-10 mt-6">
            <SignBox title="For the Client" subtitle={proposal.client?.name} contact={proposal.client?.contact} />
            <SignBox title="For English Capsules Academy" subtitle={brand.signatoryName} contact={brand.signatoryTitle} />
          </div>
        </div>
      )}

      {/* Locations strip */}
      <div className="px-[56px] mt-12">
        <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold mb-3">Our Centres</div>
        <div className="grid grid-cols-4 gap-4">
          {brand.locations.map(loc => (
            <div key={loc} className="border-t border-brand-black pt-2">
              <div className="font-display font-bold text-[14px]">{loc}</div>
              <div className="text-[10.5px] text-ui-text-mid mt-0.5">Cairo · Giza</div>
            </div>
          ))}
        </div>
      </div>
    </PDFPage>
  );
}

function CtaItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-7 h-7 rounded-sm bg-brand-yellow text-brand-black flex items-center justify-center">
        <Icon name={icon} size={13} />
      </span>
      <div>
        <div className="text-[9.5px] uppercase tracking-wider text-white/60 font-semibold">{label}</div>
        <div className="text-[12px] font-semibold">{value}</div>
      </div>
    </div>
  );
}

function SignBox({ title, subtitle, contact }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">{title}</div>
      <div className="mt-3 border-b-2 border-brand-black" style={{ height: 60 }} />
      <div className="mt-2 font-display font-bold text-[13px]">{subtitle || '—'}</div>
      <div className="text-[11px] text-ui-text-mid">{contact}</div>
      <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">Date</div>
      <div className="mt-3 border-b-2 border-brand-black" style={{ height: 28, width: '60%' }} />
    </div>
  );
}

// ─── Reusable bits ──────────────────────────────────────────────────────────
function ContentHeader({ brand, proposal, lang }) {
  return (
    <div className="px-[56px] pt-[48px]">
      <div className="flex items-start justify-between">
        <BrandWordmark />
        <div className="text-right">
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-ui-text-mid font-semibold">{L[lang].proposalNumber}</div>
          <div className="pdf-mono font-bold text-[14px] mt-1">{proposal.number}</div>
        </div>
      </div>
      <div className="yellow-bar mt-5" style={{ width: '40%' }} />
    </div>
  );
}

function SectionLabel({ children, small }) {
  return (
    <span className="pill pill-yellow inline-block font-display tracking-[0.18em]"
          style={{ fontSize: small ? 9.5 : 10.5, padding: small ? '4px 8px' : '5px 11px' }}>
      {children}
    </span>
  );
}

// ─── Full PDF preview composer ──────────────────────────────────────────────
function FullPDFPreview({ proposal, brand, features, lang = 'en' }) {
  const totalPages = 5; // cover + summary + deliverables + investment + cta
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <CoverPage proposal={proposal} brand={brand} features={features} lang={lang} />
      <SummaryPage proposal={proposal} brand={brand} features={features} lang={lang} pageNum={2} totalPages={totalPages} />
      <DeliverablesPage proposal={proposal} brand={brand} features={features} lang={lang} pageNum={3} totalPages={totalPages} />
      <InvestmentPage proposal={proposal} brand={brand} features={features} lang={lang} pageNum={4} totalPages={totalPages} />
      <CtaPage proposal={proposal} brand={brand} features={features} lang={lang} pageNum={5} totalPages={totalPages} />
    </div>
  );
}

Object.assign(window, {
  PDFPage, CoverPage, SummaryPage, DeliverablesPage, InvestmentPage, CtaPage,
  FullPDFPreview, A4_W, A4_H,
});
