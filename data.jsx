// data.jsx — mock data: templates, users, proposals, brand settings.
// All values are kept in this single source of truth so the Editor can mutate
// proposals through React context and the Library reflects changes immediately.

// ─── Templates (13) ───────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'kids',
    name: 'Kids Program',
    audience: 'Ages 6–12',
    icon: 'baby',
    curriculum: 'Pearson Discovery Island',
    levels: 6,
    sessionLen: '1.5 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 24,
    blurb: 'Building confident young communicators through play-based, CEFR A1→B1 progression.',
    defaultTitle: 'Kids English Program — Pearson Discovery Island',
    defaultSummary: 'A six-level immersive English journey for young learners aged 6 to 12, anchored in the Pearson Discovery Island curriculum and aligned to CEFR A1 through B1. Sessions are play-based, story-rich, and led by certified instructors.',
    defaultItems: [
      { name: 'Discovery Island — Level 1', desc: '24 sessions · 1.5 hrs · 2×/week', qty: 1, price: 4800 },
      { name: 'Placement test & course materials', desc: 'Pearson workbook + activity kit', qty: 1, price: 450 },
    ],
  },
  {
    id: 'teens',
    name: 'Teens Program',
    audience: 'Ages 13–17',
    icon: 'graduation',
    curriculum: 'Cambridge Evolve',
    levels: 6,
    sessionLen: '2 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 20,
    blurb: 'Academic English and exam readiness built on Cambridge Evolve. CEFR A2→C1.',
    defaultTitle: 'Teens English Program — Cambridge Evolve',
    defaultSummary: 'A six-level academic English program tailored for ages 13 to 17 using Cambridge Evolve. Builds fluency, writing, and exam-ready skills.',
    defaultItems: [
      { name: 'Cambridge Evolve — Level', desc: '20 sessions · 2 hrs · 2×/week', qty: 1, price: 6200 },
      { name: 'Course materials', desc: 'Cambridge student book + workbook', qty: 1, price: 550 },
    ],
  },
  {
    id: 'business',
    name: 'Business English',
    audience: 'Professionals',
    icon: 'briefcase',
    curriculum: 'Pearson Market Leader',
    levels: 6,
    sessionLen: '2.5 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 8,
    blurb: 'Workplace fluency for professionals — meetings, negotiation, presentations.',
    defaultTitle: 'Business English — Pearson Market Leader',
    defaultSummary: 'An intensive workplace-English program developed around Pearson Market Leader, focused on the language of meetings, negotiation, client communication, and persuasive presentation.',
    defaultItems: [
      { name: 'Market Leader — Level', desc: '8 sessions · 2.5 hrs · 2×/week', qty: 1, price: 5800 },
      { name: 'Placement test', desc: 'CEFR diagnostic', qty: 1, price: 250 },
    ],
  },
  {
    id: 'speaking',
    name: 'Speaking Course',
    audience: 'Adults',
    icon: 'mic',
    curriculum: 'In-house speaking syllabus',
    levels: 3,
    sessionLen: '2 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 12,
    blurb: 'Pure spoken fluency — pronunciation, rhythm, and confident delivery.',
    defaultTitle: 'Speaking Confidence Course',
    defaultSummary: 'A three-level speaking program that prioritises real-world fluency over grammar drills. Each session is 70% mouth-time.',
    defaultItems: [
      { name: 'Speaking Course — Level', desc: '12 sessions · 2 hrs · 2×/week', qty: 1, price: 4500 },
    ],
  },
  {
    id: 'conversation',
    name: 'Conversation Club',
    audience: 'Adults',
    icon: 'message',
    curriculum: "Cambridge Let's Talk",
    levels: 3,
    sessionLen: '2 hrs',
    sessionsPerWk: 1,
    sessionsPerLevel: 10,
    blurb: 'Weekly themed conversation built on Cambridge Let\u2019s Talk.',
    defaultTitle: 'Conversation Club — Cambridge Let’s Talk',
    defaultSummary: 'A weekly conversation club for adults using Cambridge Let’s Talk. Small-group sessions with rotating themes — current affairs, culture, work.',
    defaultItems: [
      { name: 'Conversation Club — Term', desc: '10 sessions · 2 hrs · 1×/week', qty: 1, price: 3200 },
    ],
  },
  {
    id: 'esp-specialized',
    name: 'ESP — Specialized',
    audience: 'Industry professionals',
    icon: 'tag',
    curriculum: 'Oxford English for Careers',
    levels: 2,
    sessionLen: '2 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 12,
    blurb: 'English for medicine, law, finance, engineering, IT.',
    defaultTitle: 'ESP — English for Specific Purposes',
    defaultSummary: 'Oxford English for Careers, customised to your industry vocabulary and tasks. Medical, legal, financial, engineering, IT tracks available.',
    defaultItems: [
      { name: 'ESP track — Specialization', desc: '12 sessions · 2 hrs · 2×/week', qty: 1, price: 5400 },
    ],
  },
  {
    id: 'esp-interviews',
    name: 'ESP — Interviews',
    audience: 'Job seekers',
    icon: 'sparkle',
    curriculum: 'In-house interview prep',
    levels: 1,
    sessionLen: '2 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 8,
    blurb: 'Crack the interview in English — structure, language, presence.',
    defaultTitle: 'ESP — Interview Mastery',
    defaultSummary: 'Eight focused sessions on interview English: structure, STAR storytelling, salary negotiation, executive presence.',
    defaultItems: [
      { name: 'Interview Mastery', desc: '8 sessions · 2 hrs · 2×/week', qty: 1, price: 3600 },
      { name: 'Mock interview + recorded feedback', desc: '90 minutes', qty: 2, price: 600 },
    ],
  },
  {
    id: 'esp-managers',
    name: 'English for Managers',
    audience: 'Mid–senior managers',
    icon: 'crown',
    curriculum: 'Oxford English for Careers — Management',
    levels: 2,
    sessionLen: '2.5 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 10,
    blurb: 'Lead in English — board meetings, performance reviews, client presentations.',
    defaultTitle: 'English for Managers',
    defaultSummary: 'A focused program for managers who already speak English but need to lead in it. Board language, performance reviews, client presentations.',
    defaultItems: [
      { name: 'English for Managers — Level', desc: '10 sessions · 2.5 hrs · 2×/week', qty: 1, price: 7200 },
    ],
  },
  {
    id: 'private-1.5',
    name: 'Private System 1.5',
    audience: 'Individual learners',
    icon: 'user',
    curriculum: 'Tailored',
    levels: null,
    sessionLen: '1.5 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 16,
    blurb: '1-on-1 instruction, 1.5-hour sessions, fully tailored.',
    defaultTitle: 'Private System 1.5 — One-on-One',
    defaultSummary: 'Custom 1-on-1 instruction in 1.5-hour sessions. Curriculum is built around the learner\u2019s goal — exam, fluency, business, travel.',
    defaultItems: [
      { name: 'Private 1.5 — Package', desc: '16 sessions · 1.5 hrs', qty: 1, price: 8800 },
    ],
  },
  {
    id: 'private-2',
    name: 'Private System 2',
    audience: 'Individual learners',
    icon: 'user',
    curriculum: 'Tailored',
    levels: null,
    sessionLen: '2 hrs',
    sessionsPerWk: 2,
    sessionsPerLevel: 16,
    blurb: '1-on-1 deep-immersion in 2-hour sessions.',
    defaultTitle: 'Private System 2 — Deep Immersion',
    defaultSummary: '1-on-1 instruction in 2-hour deep-immersion sessions. Best for accelerated, high-stakes goals.',
    defaultItems: [
      { name: 'Private 2 — Package', desc: '16 sessions · 2 hrs', qty: 1, price: 11200 },
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Training',
    audience: 'Companies & teams',
    icon: 'building',
    curriculum: 'Custom — Pearson / Cambridge / Oxford blends',
    levels: null,
    sessionLen: 'Custom',
    sessionsPerWk: 'Custom',
    sessionsPerLevel: 'Custom',
    blurb: 'On-site or hybrid programs for corporate teams of 8–50.',
    defaultTitle: 'Corporate English Training',
    defaultSummary: 'A fully customised corporate program delivered on-site, at our centres, or hybrid. Includes diagnostic, group cohorts, progress reports for HR, and outcome assessment.',
    defaultItems: [
      { name: 'Corporate cohort — Per participant', desc: 'Custom program', qty: 12, price: 6250 },
      { name: 'Placement testing', desc: 'CEFR diagnostic per participant', qty: 12, price: 250 },
    ],
  },
  {
    id: 'ielts',
    name: 'IELTS Preparation',
    audience: 'University & travel applicants',
    icon: 'award',
    curriculum: 'Cambridge IELTS official + in-house',
    levels: 1,
    sessionLen: '2.5 hrs',
    sessionsPerWk: 3,
    sessionsPerLevel: 24,
    blurb: 'Target 7.0+ in 10 weeks — Cambridge IELTS materials.',
    defaultTitle: 'IELTS Preparation — Target 7.0+',
    defaultSummary: 'A 10-week intensive IELTS prep program targeting Band 7.0+. Cambridge IELTS official materials plus in-house drill banks for the four skills.',
    defaultItems: [
      { name: 'IELTS Preparation', desc: '24 sessions · 2.5 hrs · 3×/week', qty: 1, price: 9800 },
      { name: 'Full mock test + scored feedback', desc: '2.75 hours, examiner-marked', qty: 2, price: 800 },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Proposal',
    audience: 'Anyone — blank slate',
    icon: 'edit',
    curriculum: '—',
    levels: null,
    sessionLen: '—',
    sessionsPerWk: '—',
    sessionsPerLevel: '—',
    blurb: 'Start from a blank canvas. Build any combination of programs.',
    defaultTitle: '',
    defaultSummary: '',
    defaultItems: [
      { name: '', desc: '', qty: 1, price: 0 },
    ],
  },
];

// ─── Users / team ─────────────────────────────────────────────────────────────
const USERS = [
  { uid: 'u1', name: 'Abdullah Amer', initials: 'AA', email: 'abdullah@englishcapsules.com', role: 'admin', status: 'active', lastActive: '2 min ago', color: '#FFC72C' },
  { uid: 'u2', name: 'Mariam El-Sayed', initials: 'ME', email: 'mariam.elsayed@englishcapsules.com', role: 'sales', status: 'active', lastActive: 'Just now', color: '#E0A91A' },
  { uid: 'u3', name: 'Omar Hassan', initials: 'OH', email: 'omar.hassan@englishcapsules.com', role: 'sales', status: 'active', lastActive: '18 min ago', color: '#2D8659' },
  { uid: 'u4', name: 'Nour Khaled', initials: 'NK', email: 'nour.khaled@englishcapsules.com', role: 'sales', status: 'active', lastActive: '1 hr ago', color: '#4F46E5' },
  { uid: 'u5', name: 'Yasmin Fahmy', initials: 'YF', email: 'yasmin.fahmy@englishcapsules.com', role: 'sales', status: 'pending', lastActive: '—', color: '#9B9B95' },
  { uid: 'u6', name: 'Hossam Refaat', initials: 'HR', email: 'hossam.refaat@englishcapsules.com', role: 'viewer', status: 'active', lastActive: '3 hrs ago', color: '#6B6B6B' },
  { uid: 'u7', name: 'Sara Ibrahim', initials: 'SI', email: 'sara.ibrahim@englishcapsules.com', role: 'sales', status: 'deactivated', lastActive: '6 days ago', color: '#C0392B' },
];

// ─── Brand settings ───────────────────────────────────────────────────────────
const BRAND = {
  companyName: 'English Capsules Academy',
  tagline: 'Speak English. Confidently.',
  primaryColor: '#FFC72C',
  signatoryName: 'Abdullah Amer',
  signatoryTitle: 'Founder & CEO',
  footerContact: 'hello@englishcapsules.com  ·  +20 120 359 9998',
  phone: '+20 120 359 9998',
  email: 'hello@englishcapsules.com',
  website: 'englishcapsules.com',
  locations: ['Dokki', 'Nasr City', '6th October', 'Maadi'],
  partners: ['Banque Misr', 'Carrefour', 'Misr Insurance', 'Sabbour Consulting', 'Cook Door'],
  certifications: ['Pearson Authorized Partner', 'Cambridge Approved Centre', 'Oxford English for Careers'],
};

const DEFAULTS = {
  currency: 'EGP',
  vatPercentage: 14,
  validityDays: 14,
  numberPrefix: 'EC',
  language: 'en',
};

const FEATURES = {
  bilingualOutput: true,
  vatCalculation: true,
  discountLine: true,
  multiCurrency: true,
  autoProposalNumber: true,
  qrCode: false,
  customCoverImage: true,
  draftWatermark: true,
  rfqMode: false,
  eSignaturePlaceholder: true,
  pageNumbers: true,
  confidentialityFooter: true,
};

// ─── Banque Misr demo proposal + extras ──────────────────────────────────────
const today = new Date();
const fmtISO = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const BANQUE_MISR = {
  id: 'p-001',
  number: 'EC-2026-0042',
  templateId: 'business',
  status: 'draft',
  language: 'en',
  createdBy: 'u2', createdByName: 'Mariam El-Sayed',
  assignedTo: 'u2',
  createdAt: '2026-05-18T09:12:00Z',
  updatedAt: '2026-05-18T11:04:00Z',
  client: {
    name: 'Banque Misr',
    contact: 'Yasmine Abdel-Rahman',
    title: 'HR Director, Learning & Development',
    email: 'y.abdelrahman@banquemisr.com',
    phone: '+20 2 2391 5555',
    country: 'Egypt',
    vatNumber: '200-432-871',
  },
  title: 'Business English for Branch Managers',
  subtitle: 'A program designed for Banque Misr',
  dateIssued: fmtISO(today),
  validUntil: fmtISO(addDays(today, 14)),
  preparedBy: 'Mariam El-Sayed · English Capsules Academy',
  summary: 'A bespoke Business English program for 12 Banque Misr branch managers, built on the Pearson Market Leader curriculum and aligned to CEFR B1+ → C1. The cohort meets twice weekly for 2.5-hour sessions over an 8-session level, delivered on-site at the Banque Misr training centre or at our Dokki flagship.',
  deliverables: [
    'CEFR diagnostic and placement test for each of the 12 participants.',
    'Eight 2.5-hour live instructor-led sessions on the Pearson Market Leader curriculum.',
    'Industry-specific case studies — banking, credit, client advisory, regulatory English.',
    'Mid-program and end-program speaking assessments with recorded feedback.',
    'Branded English Capsules certificate of completion for every participant.',
    'Confidential HR progress report with cohort-level and individual outcomes.',
  ],
  timeline: 'Kick-off within 10 business days of signed agreement. Program duration: 4 weeks (2 sessions per week × 2.5 hours).',
  currency: 'EGP',
  items: [
    { id: 'i1', name: 'Business English — Pearson Market Leader', description: '8 sessions × 2.5 hrs · Corporate group rate, 12 participants', quantity: 1, unitPrice: 75000 },
    { id: 'i2', name: 'CEFR placement test', description: 'Per participant — 60 min adaptive diagnostic', quantity: 12, unitPrice: 250 },
    { id: 'i3', name: 'Custom banking case-study pack', description: 'Industry-specific materials, branded for Banque Misr', quantity: 1, unitPrice: 4500 },
  ],
  vatEnabled: true,
  vatPercentage: 14,
  discount: { enabled: true, label: 'Strategic partner discount', amount: 6500 },
  paymentTerms: '50% upfront upon signed agreement, 50% on program completion.',
  paymentMethods: 'Bank transfer (EGP account), corporate cheque, or instalment plan available upon request.',
  ctaTitle: 'Ready to start?',
  ctaSubtitle: 'Reply to this proposal or call us on +20 120 359 9998 to lock in the May cohort.',
};

// Extra mocked proposals across team
const MORE_PROPOSALS = [
  { id: 'p-002', number: 'EC-2026-0041', templateId: 'corporate', status: 'sent', language: 'en',
    createdBy: 'u3', createdByName: 'Omar Hassan', client: { name: 'Carrefour Egypt', contact: 'Ahmed Saber', title: 'Talent Development Lead' },
    title: 'Customer-Facing English for Store Supervisors', currency: 'EGP', totalValue: 192500,
    dateIssued: fmtISO(addDays(today, -3)), validUntil: fmtISO(addDays(today, 11)), updatedAt: '5 hrs ago' },
  { id: 'p-003', number: 'EC-2026-0040', templateId: 'ielts', status: 'won', language: 'en',
    createdBy: 'u2', createdByName: 'Mariam El-Sayed', client: { name: 'Sabbour Consulting', contact: 'Engineer Karim Saad', title: 'Project Director' },
    title: 'IELTS Prep — 6 Engineers Going to Riyadh', currency: 'USD', totalValue: 4900,
    dateIssued: fmtISO(addDays(today, -9)), validUntil: fmtISO(addDays(today, 5)), updatedAt: 'Yesterday' },
  { id: 'p-004', number: 'EC-2026-0039', templateId: 'esp-managers', status: 'sent', language: 'ar',
    createdBy: 'u4', createdByName: 'Nour Khaled', client: { name: 'Misr Insurance', contact: 'د. هبة الشاذلي', title: 'مدير التدريب' },
    title: 'برنامج اللغة الإنجليزية للقيادات الوسطى', currency: 'EGP', totalValue: 144000,
    dateIssued: fmtISO(addDays(today, -6)), validUntil: fmtISO(addDays(today, 8)), updatedAt: '2 days ago' },
  { id: 'p-005', number: 'EC-2026-0038', templateId: 'business', status: 'won', language: 'en',
    createdBy: 'u3', createdByName: 'Omar Hassan', client: { name: 'Cook Door', contact: 'Tarek Mostafa', title: 'COO' },
    title: 'Business English — Operations Team (Cohort B)', currency: 'EGP', totalValue: 87200,
    dateIssued: fmtISO(addDays(today, -14)), validUntil: fmtISO(addDays(today, 0)), updatedAt: '4 days ago' },
  { id: 'p-006', number: 'EC-2026-0037', templateId: 'teens', status: 'lost', language: 'en',
    createdBy: 'u4', createdByName: 'Nour Khaled', client: { name: 'British International School Cairo', contact: 'Mrs. Linda Hartwell', title: 'Head of Languages' },
    title: 'Teens Cambridge Evolve — Year 9 Top Set', currency: 'EGP', totalValue: 132000,
    dateIssued: fmtISO(addDays(today, -22)), validUntil: fmtISO(addDays(today, -8)), updatedAt: 'Last week' },
  { id: 'p-007', number: 'EC-2026-0036', templateId: 'kids', status: 'draft', language: 'en',
    createdBy: 'u2', createdByName: 'Mariam El-Sayed', client: { name: 'Maadi Family Group', contact: 'Mrs. Heba Tarek', title: 'Parent — group of 8' },
    title: 'Kids Discovery Island — Summer Cohort', currency: 'EGP', totalValue: 38400,
    dateIssued: fmtISO(addDays(today, -1)), validUntil: fmtISO(addDays(today, 13)), updatedAt: '3 hrs ago' },
  { id: 'p-008', number: 'EC-2026-0035', templateId: 'private-2', status: 'won', language: 'en',
    createdBy: 'u2', createdByName: 'Mariam El-Sayed', client: { name: 'Khaled Mansour', contact: '—', title: 'Individual learner' },
    title: 'Private 2 — Executive Fluency Track', currency: 'EGP', totalValue: 22400,
    dateIssued: fmtISO(addDays(today, -18)), validUntil: fmtISO(addDays(today, -4)), updatedAt: '1 week ago' },
  { id: 'p-009', number: 'EC-2026-0034', templateId: 'ielts', status: 'sent', language: 'en',
    createdBy: 'u3', createdByName: 'Omar Hassan', client: { name: 'Mostafa Adel', contact: '—', title: 'University applicant' },
    title: 'IELTS — Target Band 7.5 (Bocconi MSc)', currency: 'EUR', totalValue: 480,
    dateIssued: fmtISO(addDays(today, -5)), validUntil: fmtISO(addDays(today, 9)), updatedAt: '6 hrs ago' },
  { id: 'p-010', number: 'EC-2026-0033', templateId: 'speaking', status: 'draft', language: 'en',
    createdBy: 'u4', createdByName: 'Nour Khaled', client: { name: 'Nestlé Egypt', contact: 'Hala Rashed', title: 'L&D Manager' },
    title: 'Speaking Confidence — Marketing Team (Cohort 2)', currency: 'EGP', totalValue: 76500,
    dateIssued: fmtISO(addDays(today, 0)), validUntil: fmtISO(addDays(today, 14)), updatedAt: 'Just now' },
  { id: 'p-011', number: 'EC-2026-0032', templateId: 'esp-specialized', status: 'sent', language: 'en',
    createdBy: 'u2', createdByName: 'Mariam El-Sayed', client: { name: 'El Salam International Hospital', contact: 'Dr. Heba Salem', title: 'Director of Nursing' },
    title: 'ESP — Medical English for Senior Nurses', currency: 'EGP', totalValue: 108000,
    dateIssued: fmtISO(addDays(today, -7)), validUntil: fmtISO(addDays(today, 7)), updatedAt: '2 days ago' },
];

// Currency formatting
const CURRENCIES = {
  EGP: { symbol: 'EGP', locale: 'en-EG' },
  USD: { symbol: 'USD', locale: 'en-US' },
  EUR: { symbol: 'EUR', locale: 'en-EU' },
  SAR: { symbol: 'SAR', locale: 'en-SA' },
  AED: { symbol: 'AED', locale: 'en-AE' },
};

function fmtMoney(amount, currency = 'EGP') {
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${currency} ${formatted}`;
}

function fmtDate(iso, lang = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  if (lang === 'ar') {
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcTotals(proposal) {
  const subtotal = (proposal.items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const discountAmt = proposal.discount?.enabled ? (Number(proposal.discount.amount) || 0) : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const vatAmt = proposal.vatEnabled ? afterDiscount * (Number(proposal.vatPercentage || 0) / 100) : 0;
  const total = afterDiscount + vatAmt;
  return { subtotal, discountAmt, afterDiscount, vatAmt, total };
}

// Localized labels (used sparingly on PDF, app stays EN)
const L = {
  en: {
    proposalFor: 'PROPOSAL FOR', preparedFor: 'Prepared for', preparedBy: 'Prepared by',
    proposalNumber: 'PROPOSAL NO.', dateIssued: 'DATE ISSUED', validUntil: 'VALID UNTIL',
    executiveSummary: 'EXECUTIVE SUMMARY', whatYouGet: 'WHAT YOU GET', timeline: 'TIMELINE',
    investment: 'INVESTMENT', item: 'Item', qty: 'Qty', unit: 'Unit', amount: 'Amount',
    subtotal: 'Subtotal', discount: 'Discount', vat: 'VAT', total: 'Total',
    paymentTerms: 'PAYMENT TERMS', paymentMethods: 'PAYMENT METHODS',
    nextStep: 'NEXT STEP', signature: 'AGREEMENT & SIGNATURE',
    confidential: 'CONFIDENTIAL — FOR INTENDED RECIPIENT ONLY',
    page: 'Page', of: 'of',
  },
  ar: {
    proposalFor: 'عرض مقدم إلى', preparedFor: 'مقدم إلى', preparedBy: 'مقدم من',
    proposalNumber: 'رقم العرض', dateIssued: 'تاريخ الإصدار', validUntil: 'صالح حتى',
    executiveSummary: 'الملخص التنفيذي', whatYouGet: 'ما ستحصل عليه', timeline: 'الجدول الزمني',
    investment: 'الاستثمار', item: 'البند', qty: 'الكمية', unit: 'سعر الوحدة', amount: 'الإجمالي',
    subtotal: 'المجموع الفرعي', discount: 'الخصم', vat: 'ضريبة القيمة المضافة', total: 'الإجمالي',
    paymentTerms: 'شروط الدفع', paymentMethods: 'طرق الدفع',
    nextStep: 'الخطوة التالية', signature: 'الاتفاقية والتوقيع',
    confidential: 'سري — للمستلم المقصود فقط',
    page: 'صفحة', of: 'من',
  },
};

Object.assign(window, {
  TEMPLATES, USERS, BRAND, DEFAULTS, FEATURES, BANQUE_MISR, MORE_PROPOSALS,
  CURRENCIES, fmtMoney, fmtDate, calcTotals, L,
});
