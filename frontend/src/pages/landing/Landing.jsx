import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HospitalVisionLogo } from '../../components/common/HospitalVisionLogo';
import { PLAN_TIERS_LIST } from '../../constants/subscriptionPlans';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Bed,
  Pill,
  FlaskConical,
  Users,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  Zap,
  Layers,
  Check,
  ArrowUp,
  UserCheck,
  HelpCircle,
  Server,
  FileCheck,
  DollarSign,
  Menu,
  X,
  CreditCard,
  Workflow,
  Network,
  HeartPulse,
  BarChart3,
  UserPlus,
  Clock,
  Eye,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  GitBranch
} from 'lucide-react';

// Smooth Progressive Scroll Entrance Component
const ScrollRevealSection = ({ children, className = '', id = undefined }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = React.useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const el = domRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <section
      id={id}
      ref={domRef}
      className={`transition-all duration-700 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 filter-none'
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </section>
  );
};

// Custom Futuristic Dynamic Launch Arrow (Dual-layer glowing capsule with angled launch vector)
const CreativeLaunchArrow = ({ className = "w-3.5 h-3.5", glow = false }) => (
  <span className="relative inline-flex items-center justify-center shrink-0">
    {glow && (
      <span className="absolute -inset-1 rounded-full bg-cyan-300/40 blur-xs animate-pulse opacity-80" />
    )}
    <span className={`relative inline-flex items-center justify-center w-6 h-6 rounded-lg ${glow ? 'bg-gradient-to-tr from-teal-400 to-cyan-300 text-teal-950 font-black shadow-xs' : 'bg-teal-100 text-teal-800'} group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300`}>
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </span>
  </span>
);

// Custom High-Tech Fast Forward Chevron with dynamic trail
const CreativeFastArrow = ({ className = "w-3.5 h-3.5" }) => (
  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-all duration-200 shrink-0 font-bold text-xs">
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10h11m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

export const Landing = () => {
  const navigate = useNavigate();

  // Navigation Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Branch Switcher Simulation in Hero Command Center
  const [activeBranch, setActiveBranch] = useState('MAIN');

  // Command Center Interactive Module Tab
  const [commandTab, setCommandTab] = useState('queue');

  // Platform Modules Active Category Filter
  const [activeModuleCat, setActiveModuleCat] = useState('all');

  // Interactive Patient Journey State (Step-by-step Progressive Reveal)
  const [unlockedJourneySteps, setUnlockedJourneySteps] = useState(1);
  const [activeJourneyIndex, setActiveJourneyIndex] = useState(0);

  // Pricing Billing Cycle Toggle (monthly vs annual)
  const [billingCycle, setBillingCycle] = useState('annual');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Continuously Rotating Headline Terms
  const rotatingTerms = [
    'Modern Hospitals',
    'Clinical Networks',
    'Specialty Clinics',
    'Healthcare Centers',
    'Multi-Branch Campuses'
  ];
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [rotatingVisible, setRotatingVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotatingVisible(false);
      setTimeout(() => {
        setRotatingIndex((prev) => (prev + 1) % rotatingTerms.length);
        setRotatingVisible(true);
      }, 260);
    }, 2800);
    return () => clearInterval(timer);
  }, [rotatingTerms.length]);

  // Scroll to Top Handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 8 Authentic Hospital Steps with Live Operational Metadata
  const patientJourneySteps = [
    {
      step: '01',
      number: 1,
      title: 'Registration',
      dept: 'Front Desk & Kiosk',
      icon: UserPlus,
      role: 'Receptionist',
      headline: 'Instant Identity & Sub-Second UHID Creation',
      description: 'Walk-in patients are checked in under 15 seconds. The system performs instant duplicate search across phone and name, generates an encrypted Universal Hospital Identifier (UHID), and prints a barcoded queue token slip.',
      actionNote: 'Token #T-101 printed • Routed to Nursing Station for Triage'
    },
    {
      step: '02',
      number: 2,
      title: 'Vitals & Triage',
      dept: 'Nursing Station',
      icon: HeartPulse,
      role: 'Staff Nurse',
      headline: 'Bedside Vital Signs & Automated Clinical Risk Scoring',
      description: 'Triage nurse captures Blood Pressure, Pulse, SpO2, Temperature, and Pain Scale directly on a bedside workstation. Clinical abnormal values trigger automated color flags and push directly to the doctor\'s active queue.',
      actionNote: 'Vitals Logged: BP 138/88, SpO2 99% • Added to Dr. Arun Active Queue'
    },
    {
      step: '03',
      number: 3,
      title: 'Consultation',
      dept: 'Doctor Outpatient Cabin',
      icon: Stethoscope,
      role: 'Consultant Physician',
      headline: 'Structured SOAP EHR & Closed-Loop e-Prescriptions',
      description: 'The physician reviews the patient\'s longitudinal timeline and drug allergies, types structured SOAP encounter notes, chooses ICD-10 diagnostic codes, and issues electronic prescriptions and lab orders with zero handwriting ambiguity.',
      actionNote: 'SOAP Notes Saved • e-Rx & CPOE Diagnostic Orders Transmitted'
    },
    {
      step: '04',
      number: 4,
      title: 'Lab Diagnostics',
      dept: 'Pathology & Radiology',
      icon: FlaskConical,
      role: 'Lab Technician & Radiologist',
      headline: 'Barcode Accessioning & Direct Analyzer Integration',
      description: 'Specimen tubes are accessioned with automated barcode verification. Bidirectional analyzer interfaces push biochemical results directly to the patient chart, with abnormal alerts flagged for pathologist sign-off.',
      actionNote: 'Sample BAR-99021 Verified • Serum Troponin-I Signed Off'
    },
    {
      step: '05',
      number: 5,
      title: 'Pharmacy Dispense',
      dept: 'Pharmacy POS Counter',
      icon: Pill,
      role: 'Hospital Pharmacist',
      headline: 'Barcode e-Prescription Dispensing & Expiry Validation',
      description: 'Doctor\'s prescription appears immediately at the pharmacy POS. Pharmacist scans medicine batch barcodes for automated lot/expiry verification, dispensing instructions are printed, and stock automatically decrements.',
      actionNote: '2 Medications Dispensed • Batch & Lot Deducted from Scoped Stock'
    },
    {
      step: '06',
      number: 6,
      title: 'Inpatient Care',
      dept: 'IPD Ward, OT & ICU',
      icon: Bed,
      role: 'Ward Care Team & Incharge',
      headline: 'Dynamic Bed Census & Medication Administration (MAR)',
      description: 'If admission is required, the dynamic bed census places the patient into General Ward, Private Deluxe, or ICU. Nurses administer medications using timed MAR schedules and doctors log inpatient ward rounds.',
      actionNote: 'Bed B-101 Allocated • MAR Chart Active with Due Alerts'
    },
    {
      step: '07',
      number: 7,
      title: 'Hospital Billing',
      dept: 'Cashier & Invoicing Counter',
      icon: CreditCard,
      role: 'Billing Officer & Cashier',
      headline: 'Automated Real-Time Consolidated Patient Ledger',
      description: 'Every clinical encounter, bed day, pathology test, and pharmacy medication automatically flows into a unified master ledger. Cashiers accept split payments (Cash, UPI, Card, TPA Insurance) with zero revenue leakage.',
      actionNote: 'Invoice #INV-2026-0412 Cleared: ₹3,720.00 • Receipt Issued'
    },
    {
      step: '08',
      number: 8,
      title: 'Patient Portal',
      dept: 'Mobile & WhatsApp Portal',
      icon: Smartphone,
      role: 'Patient & Family',
      headline: 'Paperless Reports, Invoices & Discharge Summaries',
      description: 'Discharged patients securely access their complete healthcare record from home using mobile OTP authentication. They can view doctor advice, download digitally signed PDF lab reports, and review receipts anytime.',
      actionNote: 'Discharge Summary & Verified Reports Downloaded via OTP'
    }
  ];

  const handleJourneyStepClick = (index) => {
    if (index + 1 > unlockedJourneySteps) {
      setUnlockedJourneySteps(index + 1);
    }
    setActiveJourneyIndex(index);
  };

  // Platform Module Categories
  const moduleCategories = [
    { id: 'all', label: 'All Modules' },
    { id: 'patient', label: 'Patient Ops' },
    { id: 'clinical', label: 'Clinical EMR' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'finance', label: 'Billing' },
    { id: 'admin', label: 'Governance' }
  ];

  const platformModules = [
    {
      category: 'patient',
      categoryLabel: 'Patient Operations',
      title: 'Master Patient Index & Front Desk',
      desc: 'Longitudinal identity management eliminating duplicate charts across outpatient, inpatient, and emergency entrances.',
      submodules: [
        'UHID Generation & Identity Verification',
        'Patient Search & Comprehensive Profile',
        'Appointment Scheduling & Calendar',
        'Real-Time Token Queue Display Board',
        'Emergency Fast-Track Triage Check-in'
      ]
    },
    {
      category: 'clinical',
      categoryLabel: 'Clinical EMR',
      title: 'Doctor EMR & Inpatient Management',
      desc: 'Physician consultation documentation, nursing station charts, surgical scheduling, and high-acuity ICU monitoring.',
      submodules: [
        'Outpatient SOAP Consultation Encounters',
        'ICD-10 Diagnostic Coding & e-Prescriptions',
        'Inpatient (IPD) Dynamic Bed Census Board',
        'Nursing Medication Administration (MAR)',
        'Operating Theatre (OT) Scheduling',
        'ICU High-Acuity Telemetry Worksheets'
      ]
    },
    {
      category: 'diagnostics',
      categoryLabel: 'Diagnostics',
      title: 'Laboratory & Radiology Workbenches',
      desc: 'End-to-end diagnostic workflow spanning sample accessioning, biochemical testing, abnormal flags, and imaging.',
      submodules: [
        'Specimen Barcode Labeling & Collection',
        'Laboratory Technician Workbench',
        'Automated Abnormal Value Highlighting',
        'Radiology Modality Worklist (X-Ray, CT, USG)',
        'Consultant Pathologist & Radiologist Sign-Off'
      ]
    },
    {
      category: 'pharmacy',
      categoryLabel: 'Pharmacy POS',
      title: 'Pharmacy POS & Inventory Control',
      desc: 'Prescription-driven point-of-sale integrated directly with batch-level inventory tracking and expiry monitoring.',
      submodules: [
        'Direct e-Prescription Fulfillment',
        'Point-of-Sale (POS) Fast Dispensing',
        'Batch, Lot & Expiry Date Management',
        'Automated Reorder Threshold Alerts',
        'Multi-Branch Medicine Stock Transfers'
      ]
    },
    {
      category: 'finance',
      categoryLabel: 'Billing & TPA',
      title: 'Consolidated Revenue Cycle',
      desc: 'Point-of-care charge capture uniting bed charges, consultations, diagnostics, and medications on a single ledger.',
      submodules: [
        'Consolidated Patient Master Invoicing',
        'Cashier Multi-Mode Split Payments (Cash, UPI, Card)',
        'TPA & Health Insurance Claim Processing',
        'Refund Approvals & Ledger Adjustments',
        'Daily Departmental Revenue Audits'
      ]
    },
    {
      category: 'admin',
      categoryLabel: 'Governance',
      title: 'Hospital Governance & Security',
      desc: 'Institutional administration with multi-branch isolation, departmental hierarchies, staff provisioning, and audit logs.',
      submodules: [
        'Multi-Branch Configuration & Scoping',
        'Departmental Hierarchy & Staff Rostering',
        'Role-Based Access Control (RBAC) Policies',
        'Comprehensive Immutable Audit Logs',
        'Executive Operational & Financial Analytics'
      ]
    }
  ];

  const filteredModules = activeModuleCat === 'all'
    ? platformModules
    : platformModules.filter(m => m.category === activeModuleCat);

  const plans = PLAN_TIERS_LIST;

  // FAQs
  const faqs = [
    {
      q: 'How does the 30-Day Free Trial work?',
      a: 'Clicking "Get Free Trial" takes you directly to the instant trial sign-in console. You can immediately launch the full clinical and administrative suite—including Doctor EMR, Inpatient Bed Census, Pharmacy POS, Laboratory Pathology, and Billing—pre-seeded with realistic hospital simulation records without needing credit cards or complex installations.'
    },
    {
      q: 'Does Hospital Vision support multi-branch hospital networks?',
      a: 'Yes. Hospital Vision was built from inception with native multi-branch support. Organizations can manage multiple campuses, satellite clinics, and diagnostic centers under a single tenant. Main hospital executives can monitor consolidated operational metrics while branch staff are strictly scoped to their respective facility.'
    },
    {
      q: 'How is patient data isolated and secured?',
      a: 'Hospital Vision implements database-level tenant isolation, where all queries, patient records, and transactions are strictly scoped by tenant identifier. Fine-grained role-based access control (RBAC) ensures clinical staff only see records relevant to their duties, and immutable audit logs capture every record modification.'
    },
    {
      q: 'Do patients have their own portal to access lab reports and bills?',
      a: 'Yes. Hospital Vision includes a dedicated, password-less Patient Self-Service Portal. Patients securely sign in using their registered mobile phone number and OTP to view their consultation history, download verified lab and radiology reports, pay bills, and access discharge summaries.'
    },
    {
      q: 'Can clinical staff use Hospital Vision on tablets during ward rounds?',
      a: 'Yes. The entire platform is built with a responsive interface optimized for desktop workstations, clinical COW (Computer-on-Wheels) carts, bedside tablets, and mobile devices, allowing doctors and nurses to chart in real time right at the bedside.'
    },
    {
      q: 'How does automated billing integration prevent missed charges?',
      a: 'Billing is fully connected. When a nurse charts a bed day, a doctor orders an investigation, or a pharmacist dispenses medication, the corresponding charges automatically flow into the patient\'s centralized master invoice, eliminating missed charges and manual data entry.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-500/20 selection:text-teal-900 overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER: LARGER LOGO (NO CLOUD OS BADGE), HOVER BOX NAV LINKS
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-2xs transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo: Bigger, No Cloud OS Badge */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-teal-900/25 ring-1 ring-white/30 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
              Hospital<span className="text-teal-700">Vision</span>
            </span>
          </Link>

          {/* Desktop Navigation Links — More Spaced, Subtle Box & Color on Hover */}
          <nav className="hidden lg:flex items-center gap-9 text-xs font-bold text-slate-600">
            {[
              { label: 'Console', href: '#platform' },
              { label: 'Modules', href: '#modules' },
              { label: 'Workflow', href: '#journey' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'FAQ', href: '#faq' }
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-teal-800 hover:bg-teal-50/90 border border-transparent hover:border-teal-200/80 hover:shadow-2xs transition-all duration-200 active:scale-95"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action CTA: ONLY Get Free Trial */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/signin?trial=true"
              className="text-xs font-black text-white bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 px-4 py-2 rounded-xl shadow-md shadow-teal-700/20 active:scale-95 transition-all flex items-center gap-2 group ring-1 ring-white/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Get Free Trial</span>
              <CreativeLaunchArrow glow={true} className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 shadow-xl">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 py-1">Console</a>
              <a href="#modules" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 py-1">Modules</a>
              <a href="#journey" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 py-1">Workflow</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 py-1">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 py-1">FAQ</a>
            </nav>

            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/signin?trial=true"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-xs font-extrabold text-white bg-gradient-to-r from-teal-600 to-cyan-700 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <span>Get Free Trial</span>
                <CreativeLaunchArrow glow={true} className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION:
             - LEFT: CONCISE, PUNCHY COPY WITH CONTINUOUSLY ROTATING HEADLINE WORDS
             - RIGHT: HIGH-QUALITY CLINICAL DOCTOR (INTERACTIVE HOVER LIFT/ZOOM)
             - BOTTOM: 4 PASTEL/LIGHT COLOR FEATURE CARDS WITH ELEVATED HOVER
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 sm:pt-14 pb-12 sm:pb-16 overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-slate-50/40 border-b border-slate-200/80">
        {/* Suitable, Calming Healthcare Ambient Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Soft Luminous Medical Glow Behind Text */}
          <div className="absolute -top-24 -left-20 w-[650px] h-[500px] bg-gradient-to-br from-teal-100/35 via-cyan-50/25 to-transparent rounded-full blur-3xl" />
          
          {/* Subtle Ambient Sky-Blue Aura Behind Doctor */}
          <div className="absolute top-10 right-0 w-[550px] h-[500px] bg-gradient-to-bl from-sky-100/35 via-teal-50/20 to-transparent rounded-full blur-3xl" />
          
          {/* Soft Central Radial Fill */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-teal-50/20 via-sky-50/25 to-transparent rounded-full blur-3xl opacity-70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ⭐ LEFT SIDE: CLEAN, CONCISE COPY WITH CONTINUOUSLY ROTATING HEADLINE */}
            <div className="lg:col-span-7 space-y-4 text-left">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/90 text-teal-900 text-xs font-bold tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Healthcare Cloud OS</span>
              </div>

              {/* Main Headline with Continuously Cycling Words */}
              <h1 className="tracking-tight text-left">
                <span className="block text-2xl sm:text-4xl xl:text-[42px] font-black text-slate-900 leading-tight">
                  The Operating System for
                </span>
                <span
                  className={`block text-3xl sm:text-5xl xl:text-6xl font-black bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent transition-all duration-300 transform mt-1.5 ${
                    rotatingVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                  }`}
                >
                  {rotatingTerms[rotatingIndex]}
                </span>
              </h1>

              {/* Short, Crisp Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
                One real-time cloud terminal connecting Outpatient EMR, Inpatient Bed Census, Pharmacy POS, Diagnostics, and Automated Consolidated Billing.
              </p>

              {/* Action Buttons: ONLY Get Free Trial & Explore Console */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/signin?trial=true"
                  className="px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 shadow-md shadow-teal-700/25 active:scale-95 transition-all flex items-center gap-2 group ring-1 ring-white/30 cursor-pointer"
                >
                  <span>Get Free Trial</span>
                  <CreativeLaunchArrow glow={true} className="w-3.5 h-3.5" />
                </Link>

                <a
                  href="#platform"
                  className="px-5 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Console</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </a>
              </div>

              {/* Key Guarantees Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Multi-Branch Ready
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" /> UHID &lt; 0.2s
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> HIPAA &amp; NABH Ready
                </span>
              </div>
            </div>

            {/* ⭐ RIGHT SIDE: SEAMLESS CLINICAL DOCTOR (INTERACTIVE HOVER EFFECT) */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end group cursor-pointer">
              <div className="relative w-full max-w-md sm:max-w-lg transition-all duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1.5 group-hover:drop-shadow-xl">
                <img
                  src="/hero-doctor-portrait.jpg"
                  alt="Modern Hospital Clinical Leadership"
                  className="w-full h-auto object-cover select-none pointer-events-none transition-all duration-500 group-hover:brightness-[1.03]"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, black 16%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 16%)'
                  }}
                />
              </div>
            </div>

          </div>

          {/* ⭐ 4 FEATURE HIGHLIGHT CARDS (DIFFERENT LIGHT PASTEL COLORS + HOVER EFFECTS) */}
          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box 1: Soft Sky-Blue Pastel */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50/40 to-white border border-sky-200/80 hover:border-sky-400 shadow-2xs hover:shadow-lg hover:shadow-sky-100/80 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5 group cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-950 group-hover:text-sky-700 transition-colors">24/7 Live Triage</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Round the clock emergency triage &amp; queue</div>
              </div>
            </div>

            {/* Box 2: Soft Mint / Emerald Pastel */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-lg hover:shadow-emerald-100/80 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5 group cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-teal-950 group-hover:text-teal-700 transition-colors">Expert Doctor EMR</div>
                <div className="text-[11px] text-slate-600 mt-0.5">SOAP notes, ICD-10 &amp; e-prescriptions</div>
              </div>
            </div>

            {/* Box 3: Soft Lavender / Indigo Pastel */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50/40 to-white border border-indigo-200/80 hover:border-indigo-400 shadow-2xs hover:shadow-lg hover:shadow-indigo-100/80 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5 group cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-950 group-hover:text-indigo-700 transition-colors">Live Bed Census</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Inpatient wards, ICU telemetry &amp; MAR</div>
              </div>
            </div>

            {/* Box 4: Soft Amber / Orange Pastel */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/40 to-white border border-amber-200/80 hover:border-amber-400 shadow-2xs hover:shadow-lg hover:shadow-amber-100/80 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5 group cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950 group-hover:text-amber-700 transition-colors">Automated Billing</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Zero leakage point-of-care master invoice</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. HOW IT WORKS: FROM SUBSCRIPTION TO COMPLETE HOSPITAL OPERATIONS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>How It Works</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              From Subscription to <span className="text-teal-700">Complete Hospital Operations</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Get started in simple steps and transform your hospital into a connected, efficient healthcare center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative max-w-6xl mx-auto items-start">
            {[
              {
                num: '1',
                title: 'Subscribe Plan',
                desc: 'Choose an operational plan suited for your hospital scale and department size.',
                icon: CreditCard,
                color: 'bg-cyan-50 border-cyan-500 text-cyan-700'
              },
              {
                num: '2',
                title: 'Tenant Created',
                desc: 'Your isolated hospital database workspace is set up and configured in seconds.',
                icon: Building2,
                color: 'bg-teal-50 border-teal-500 text-teal-700'
              },
              {
                num: '3',
                title: 'Configure Masters',
                desc: 'Set up departments, ward beds, tariff rate cards, and clinical masters.',
                icon: Layers,
                color: 'bg-indigo-50 border-indigo-500 text-indigo-700'
              },
              {
                num: '4',
                title: 'Onboard Staff',
                desc: 'Add doctors, nurses, pharmacists, and front desk receptionists with scoped access.',
                icon: Users,
                color: 'bg-blue-50 border-blue-500 text-blue-700'
              },
              {
                num: '5',
                title: 'Start Operations',
                desc: 'Manage clinical encounters, patient records, and billing all in one place.',
                icon: CheckCircle2,
                color: 'bg-emerald-50 border-emerald-500 text-emerald-700'
              }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex flex-col items-center text-center group p-3 rounded-2xl hover:bg-slate-50 transition-all">
                  <div className={`w-14 h-14 rounded-full border-2 ${s.color} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300 relative`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-3 group-hover:text-teal-700 transition-colors">
                    {s.num}. {s.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. LIVE COMMAND CENTER SIMULATOR (COMFORTABLE GAP)
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection id="platform" className="py-12 sm:py-16 bg-slate-50/60 border-t border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="text-center max-w-3xl mx-auto mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Activity className="w-3 h-3 text-teal-600" />
              <span>Real-Time Clinical Workspace</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hospital Vision <span className="text-teal-700">Command Console</span>
            </h2>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Interact with live simulated data across departments and switch between multi-branch scopes.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 overflow-hidden">
            {/* Title Bar */}
            <div className="bg-slate-100/90 px-3.5 py-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-3.5 w-px bg-slate-300 hidden sm:block" />
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  <span>Command Console • Live Simulation</span>
                </div>
              </div>

              {/* Multi-Branch Switcher */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[10px] hidden md:inline font-semibold">Branch Scope:</span>
                <div className="flex bg-slate-200/70 rounded-md p-0.5 border border-slate-300/80">
                  <button
                    onClick={() => setActiveBranch('MAIN')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      activeBranch === 'MAIN'
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Main Tertiary Tower (MAIN)
                  </button>
                  <button
                    onClick={() => setActiveBranch('NC-02')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      activeBranch === 'NC-02'
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    North Satellite Clinic (NC-02)
                  </button>
                </div>
                <span className="flex items-center gap-1 text-emerald-800 font-mono text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
                </span>
              </div>
            </div>

            {/* 4 Live Operational Gauges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[10px] font-bold mb-0.5">
                  <span>IPD Inpatient Census</span>
                  <Bed className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {activeBranch === 'MAIN' ? '78 / 100 Beds' : '18 / 25 Beds'}
                </div>
                <div className="text-[10px] text-teal-700 mt-0.5 flex items-center gap-1 font-mono font-semibold">
                  <span>{activeBranch === 'MAIN' ? '78% Occupancy' : '72% Occupancy'}</span>
                  <span className="text-slate-400">• 4 ICU Critical</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[10px] font-bold mb-0.5">
                  <span>OPD Live Queue</span>
                  <Users className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {activeBranch === 'MAIN' ? '24 Waiting' : '9 Waiting'}
                </div>
                <div className="text-[10px] text-cyan-700 mt-0.5 flex items-center gap-1 font-mono font-semibold">
                  <span>Avg Consult: 14 min</span>
                  <span className="text-slate-400">• 6 Active Doctors</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[10px] font-bold mb-0.5">
                  <span>Diagnostic TAT</span>
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {activeBranch === 'MAIN' ? '18 Samples' : '6 Samples'}
                </div>
                <div className="text-[10px] text-indigo-700 mt-0.5 flex items-center gap-1 font-mono font-semibold">
                  <span>4 STAT Emergencies</span>
                  <span className="text-slate-400">• 38 min Avg TAT</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[10px] font-bold mb-0.5">
                  <span>Daily Ledger &amp; Invoices</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {activeBranch === 'MAIN' ? '96.4% Reconciled' : '98.1% Reconciled'}
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5 flex items-center gap-1 font-mono font-semibold">
                  <span>Zero Bill Leakage</span>
                  <span className="text-slate-400">• Auto-Consolidated</span>
                </div>
              </div>
            </div>

            {/* Interactive Module Tab Strip */}
            <div className="flex overflow-x-auto gap-1.5 pb-1.5 mb-2.5 border-b border-slate-200 text-xs font-bold scrollbar-none">
              <button
                onClick={() => setCommandTab('queue')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  commandTab === 'queue'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Front Desk Queue</span>
              </button>
              <button
                onClick={() => setCommandTab('emr')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  commandTab === 'emr'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor EMR</span>
              </button>
              <button
                onClick={() => setCommandTab('ipd')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  commandTab === 'ipd'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bed className="w-3.5 h-3.5" />
                <span>IPD Bed Census</span>
              </button>
              <button
                onClick={() => setCommandTab('lab')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  commandTab === 'lab'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Lab Workbench</span>
              </button>
              <button
                onClick={() => setCommandTab('billing')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  commandTab === 'billing'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Billing &amp; Invoicing</span>
              </button>
            </div>

            {/* Tab 1: FRONT DESK & LIVE QUEUE */}
            {commandTab === 'queue' && (
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                <div className="lg:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-600" />
                      <span>Live Outpatient Queue Board</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Branch: {activeBranch}</span>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {[
                      { token: 'T-101', patient: 'Rajesh Verma (48M)', uhid: 'HV-2026-0891', dept: 'Cardiology (Dr. Arun)', status: 'With Doctor', badge: 'bg-emerald-50 text-emerald-800' },
                      { token: 'T-102', patient: 'Ananya Deshmukh (32F)', uhid: 'HV-2026-0904', dept: 'Internal Med (Dr. Meera)', status: 'In Vitals Triage', badge: 'bg-amber-50 text-amber-800' },
                      { token: 'T-103', patient: 'Karan Malhotra (55M)', uhid: 'HV-2026-0912', dept: 'Orthopedics (Dr. Kapoor)', status: 'Waiting in Lobby', badge: 'bg-sky-50 text-sky-800' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">
                            {item.token}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{item.patient}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{item.uhid} • {item.dept}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.badge}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Longitudinal UHID Record
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-xs">Rajesh Verma (48M)</div>
                    <div className="text-[9px] text-slate-500 font-mono">UHID: HV-2026-0891 • Blood: O+</div>
                    <div className="text-[9px] text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-semibold">
                      Allergy: Penicillin Derivative
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: DOCTOR CONSULTATION EMR */}
            {commandTab === 'emr' && (
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                <div className="lg:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>SOAP Consultation Notes (Dr. Arun Joshi)</span>
                    </span>
                    <span className="text-[9px] text-emerald-800 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="font-bold text-teal-800 block text-[10px]">Subjective / Complaints:</span>
                      <p className="text-slate-600 text-[11px]">Exertional chest discomfort for 4 days, mild dyspnea upon climbing stairs.</p>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="font-bold text-cyan-800 block text-[10px]">Objective / Vitals:</span>
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] mt-0.5 font-mono">
                        <div className="bg-slate-50 p-1 rounded border border-slate-200"><span className="text-slate-500 block text-[9px]">BP</span>138/88</div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200"><span className="text-slate-500 block text-[9px]">Pulse</span>76 bpm</div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200"><span className="text-slate-500 block text-[9px]">SpO2</span>99%</div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200"><span className="text-slate-500 block text-[9px]">Temp</span>98.4°F</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 uppercase text-[10px] flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-teal-600" /> e-Prescription
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[10px]">
                    <div className="font-bold text-slate-900">Tab. Amlodipine 5mg</div>
                    <div className="text-slate-500 font-mono">1 Tab • OD Morning • 30 Days</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[10px]">
                    <div className="font-bold text-slate-900">Tab. Atorvastatin 10mg</div>
                    <div className="text-slate-500 font-mono">1 Tab • Bedtime • 30 Days</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: INPATIENT (IPD) BED BOARD */}
            {commandTab === 'ipd' && (
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-teal-600" />
                    <span>Live Ward Bed Census</span>
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                    <span className="text-rose-800">Occupied</span> • <span className="text-emerald-800">Available</span> • <span className="text-indigo-800">ICU</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
                  {[
                    { bed: 'B-101', type: 'Ward', status: 'Occupied', p: 'R. Sharma (52M)', c: 'border-rose-200 bg-rose-50 text-rose-900' },
                    { bed: 'B-102', type: 'Ward', status: 'Available', p: 'Ready for Admit', c: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
                    { bed: 'ICU-01', type: 'ICU', status: 'Critical', p: 'V. Mehta (68M)', c: 'border-indigo-200 bg-indigo-50 text-indigo-900' },
                    { bed: 'ICU-02', type: 'ICU', status: 'Available', p: 'Ventilator Ready', c: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
                    { bed: 'DLX-201', type: 'Deluxe', status: 'Occupied', p: 'A. Singhania', c: 'border-rose-200 bg-rose-50 text-rose-900' },
                    { bed: 'OT-01', type: 'OT', status: 'In Surgery', p: 'Cardiac Bypass', c: 'border-purple-200 bg-purple-50 text-purple-900' }
                  ].map((b, idx) => (
                    <div key={idx} className={`p-2 rounded-lg border text-xs flex flex-col justify-between ${b.c}`}>
                      <div className="flex justify-between font-bold text-[10px] text-slate-900">
                        <span>{b.bed}</span>
                        <span className="text-[8px] uppercase">{b.type}</span>
                      </div>
                      <div className="text-[9px] font-semibold truncate mt-0.5">{b.p}</div>
                      <div className="text-[8px] opacity-80">{b.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: DIAGNOSTIC LAB WORKBENCH */}
            {commandTab === 'lab' && (
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    <span>Pathology Analyzer Worklist</span>
                  </span>
                  <span className="text-[9px] text-teal-800 font-mono font-bold bg-teal-50 px-1.5 py-0.5 rounded">Interface Online</span>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {[
                    { code: 'BAR-99021', test: 'Cardiac Troponin-I', p: 'Rajesh Verma (UHID: HV-2026-0891)', res: '0.04 ng/mL', flag: 'Normal', fc: 'text-emerald-800 bg-emerald-50' },
                    { code: 'BAR-99022', test: 'Serum Potassium (K+)', p: 'V. Mehta (ICU-01)', res: '5.8 mEq/L', flag: 'High Alert', fc: 'text-rose-800 bg-rose-50 border border-rose-200' },
                    { code: 'BAR-99023', test: 'Complete Blood Count (CBC)', p: 'Ananya Deshmukh', res: 'Hb 12.8 g/dL', flag: 'Normal', fc: 'text-emerald-800 bg-emerald-50' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-teal-700 font-bold text-[10px]">{item.code}</span>
                          <span className="font-bold text-slate-900 text-xs">{item.test}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">{item.p}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-xs">{item.res}</div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${item.fc}`}>{item.flag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: CONSOLIDATED INVOICING & POS */}
            {commandTab === 'billing' && (
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                <div className="lg:col-span-2 p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between border-b pb-1 font-bold text-slate-900 text-xs">
                    <span>Invoice #INV-2026-0412 (Rajesh Verma)</span>
                    <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px]">Payment Cleared</span>
                  </div>
                  <div className="space-y-0.5 text-[10px] text-slate-600">
                    <div className="flex justify-between"><span>Cardiology OPD Consultation</span><span className="font-mono font-bold text-slate-900">₹800.00</span></div>
                    <div className="flex justify-between"><span>12-Lead Electrocardiogram (ECG)</span><span className="font-mono font-bold text-slate-900">₹450.00</span></div>
                    <div className="flex justify-between"><span>Serum Troponin &amp; Lipid Panel</span><span className="font-mono font-bold text-slate-900">₹1,850.00</span></div>
                    <div className="flex justify-between"><span>Pharmacy POS Dispensation</span><span className="font-mono font-bold text-slate-900">₹620.00</span></div>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-bold text-slate-900 text-xs">
                    <span>Total Amount</span>
                    <span className="font-mono text-teal-800">₹3,720.00</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Today Collections</span>
                  <div className="text-lg font-black text-slate-900 font-mono">₹2,48,500</div>
                  <p className="text-[9px] text-emerald-700 font-semibold">100% Reconciled Across All Counters</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          4. THE PATIENT JOURNEY (INTERACTIVE PROGRESSIVE REVEAL FLOW)
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection id="journey" className="py-12 sm:py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
              <Workflow className="w-3.5 h-3.5 text-teal-600" />
              <span>The Patient Journey</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              From Registration to <span className="text-teal-700">Lasting Care</span>
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
              Every step connected through a single Universal Hospital Identifier (UHID). Click any step or advance to reveal each stage progressively.
            </p>
          </div>

          {/* Stepper Container: Progressive Reveal of Steps */}
          <div className="max-w-6xl mx-auto mb-8">
            {/* Desktop Stepper Bar */}
            <div className="hidden lg:flex items-center justify-between gap-1">
              {patientJourneySteps.map((step, idx) => {
                const Icon = step.icon;
                const isUnlocked = idx < unlockedJourneySteps;
                const isActive = idx === activeJourneyIndex;
                const isNext = idx === unlockedJourneySteps;

                return (
                  <React.Fragment key={step.step}>
                    <button
                      type="button"
                      onClick={() => handleJourneyStepClick(idx)}
                      className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-all duration-300"
                    >
                      {/* Step Circle with Dynamic States */}
                      <div className="relative">
                        {isActive && (
                          <span className="absolute -inset-1.5 rounded-full bg-teal-400/40 blur-xs animate-ping opacity-60" />
                        )}
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive
                              ? 'bg-gradient-to-tr from-teal-700 to-cyan-600 text-white ring-4 ring-teal-200 shadow-lg shadow-teal-900/20 scale-110'
                              : isUnlocked
                              ? 'bg-white border-2 border-teal-600 text-teal-700 shadow-2xs hover:bg-teal-50 hover:scale-105 group-hover:border-teal-700'
                              : isNext
                              ? 'bg-slate-50 border-2 border-dashed border-teal-400 text-teal-600/80 shadow-2xs hover:bg-teal-50/70 hover:scale-105 animate-pulse'
                              : 'bg-slate-50/60 border-2 border-dashed border-slate-300 text-slate-400 opacity-60 hover:opacity-90'
                          }`}
                        >
                          <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                        </div>
                      </div>

                      {/* Step Title Label */}
                      <div className="mt-3 text-center">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                          isActive
                            ? 'text-teal-800 font-extrabold'
                            : isUnlocked
                            ? 'text-teal-700'
                            : 'text-slate-400'
                        }`}>
                          Step {step.step}
                        </span>
                        <span className={`text-xs font-bold block mt-0.5 whitespace-nowrap transition-colors ${
                          isActive
                            ? 'text-teal-950 underline decoration-teal-500 decoration-2 underline-offset-4'
                            : isUnlocked
                            ? 'text-slate-900 group-hover:text-teal-800'
                            : 'text-slate-400'
                        }`}>
                          {isUnlocked ? step.title : isNext ? 'Click to Reveal' : 'Locked'}
                        </span>
                      </div>
                    </button>

                    {/* Connecting Connector Line Between Steps */}
                    {idx < patientJourneySteps.length - 1 && (
                      <div className="flex-1 flex items-center justify-center -mt-8 px-1">
                        <div className={`w-full h-0.5 relative flex items-center justify-end transition-colors duration-300 ${
                          idx + 1 < unlockedJourneySteps
                            ? 'border-t-2 border-teal-500'
                            : 'border-t-2 border-dashed border-slate-300'
                        }`}>
                          <svg
                            className={`w-3 h-3 absolute -right-1 transition-colors duration-300 ${
                              idx + 1 < unlockedJourneySteps ? 'text-teal-600' : 'text-slate-300'
                            }`}
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile / Tablet Horizontal Stepper Ribbon */}
            <div className="lg:hidden flex overflow-x-auto gap-3 pb-3 scrollbar-none items-center">
              {patientJourneySteps.map((step, idx) => {
                const Icon = step.icon;
                const isUnlocked = idx < unlockedJourneySteps;
                const isActive = idx === activeJourneyIndex;

                return (
                  <button
                    key={step.step}
                    type="button"
                    onClick={() => handleJourneyStepClick(idx)}
                    className={`shrink-0 p-3 rounded-2xl border text-center transition-all flex flex-col items-center min-w-[110px] cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white border-teal-800 shadow-md scale-102'
                        : isUnlocked
                        ? 'bg-white text-slate-800 border-teal-300 hover:bg-teal-50/50'
                        : 'bg-slate-50 text-slate-400 border-dashed border-slate-300 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${
                      isActive ? 'bg-white/20 text-white' : isUnlocked ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">
                      Step {step.step}
                    </span>
                    <span className="text-xs font-bold block truncate max-w-[100px]">
                      {isUnlocked ? step.title : 'Reveal'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          BUILT FOR EVERY ROLE (MATCHED 1:1 TO REFERENCE IMAGE 3)
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection className="py-12 sm:py-16 bg-gradient-to-b from-white via-slate-50/30 to-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Column: Title Block (1:1 with Reference Image 3) */}
            <div className="lg:col-span-3 text-left space-y-2.5">
              <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider block">
                ROLE-BASED ACCESS
              </span>
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Built for Every Role
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                One platform. The right experience for every team member.
              </p>
            </div>

            {/* Right Column: 4 Clean Avatar Cards Side-by-Side (1:1 with Reference Image 3) */}
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              {[
                {
                  role: 'Hospital Admin',
                  desc: 'Manage the entire hospital — departments, operations, reports and more.',
                  avatar: '/role-admin.jpg',
                  ringColor: 'ring-pink-100 bg-pink-50/60'
                },
                {
                  role: 'Doctor',
                  desc: 'Access patient records, clinics, prescriptions and schedules.',
                  avatar: '/role-doctor.jpg',
                  ringColor: 'ring-blue-100 bg-blue-50/60'
                },
                {
                  role: 'Nurse',
                  desc: 'Manage assigned patients, vitals, medications and care tasks.',
                  avatar: '/role-nurse.jpg',
                  ringColor: 'ring-cyan-100 bg-cyan-50/60'
                },
                {
                  role: 'Receptionist',
                  desc: 'Handle registration, appointments, admissions and billing.',
                  avatar: '/role-receptionist.jpg',
                  ringColor: 'ring-purple-100 bg-purple-50/60'
                }
              ].map((r, idx) => (
                <Link
                  key={idx}
                  to="/signin?trial=true"
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer text-left"
                >
                  <div className="space-y-3">
                    {/* Centered Circular Portrait with Soft Aura Halo */}
                    <div className="flex justify-center">
                      <div className={`w-16 h-16 rounded-full p-1 ring-4 ${r.ringColor} shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                        <img
                          src={r.avatar}
                          alt={r.role}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Role Title & Description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {r.role}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Right Circular Teal Arrow Button */}
                  <div className="pt-4 flex justify-end">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:translate-x-0.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          5. PLATFORM MODULES (INTERACTIVE UNIFIED ECOSYSTEM)
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection id="modules" className="py-12 sm:py-16 bg-white border-t border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Full Hospital Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Enterprise Hospital <span className="text-teal-700">Modules</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Role-scoped clinical and administrative modules connected to a unified patient identity bus.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
              {moduleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveModuleCat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeModuleCat === cat.id
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Hospital Data Highway Ribbon */}
          <div className="mb-8 p-3 rounded-2xl bg-gradient-to-r from-teal-50 via-cyan-50/50 to-sky-50 border border-teal-200/80 flex flex-wrap items-center justify-between gap-3 text-xs max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
              <span className="font-bold text-teal-950">Universal UHID Data Highway:</span>
              <span className="text-slate-600 hidden md:inline">Every record flows in real-time across all 8 modules without duplicate data entry.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-teal-800 font-semibold bg-white px-2.5 py-1 rounded-lg border border-teal-200">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Zero Siloed Departments</span>
            </div>
          </div>

          {/* Connected Grid of Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {filteredModules.map((m, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/90 hover:border-teal-400 shadow-2xs hover:shadow-lg hover:shadow-teal-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wide">
                      {m.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Sync
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {m.desc}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-200/80 pt-3">
                    {m.submodules.map((sub, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Integrated with UHID
                  </span>
                  <Link
                    to="/signin?trial=true"
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 group/link"
                  >
                    <span>Explore in Trial</span>
                    <CreativeFastArrow className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          7. MULTI-BRANCH SCALABILITY (INTUITIVE CAMPUS COMMAND & ISOLATION)
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection id="architecture" className="py-12 sm:py-16 bg-slate-50/70 border-t border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
              <Network className="w-3.5 h-3.5 text-teal-600" />
              <span>Multi-Branch Scalability</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              One Organization, <span className="text-teal-700">Multiple Branch Campuses</span>
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mx-auto">
              Manage your main hospital, satellite daycare clinics, and regional diagnostic labs under one central system with shared patient history and branch-isolated inventory.
            </p>
          </div>

          {/* Main Visual: 3-Campus Connected Architecture (Compact & Crystal Clear) */}
          <div className="max-w-5xl mx-auto mb-8 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
              
              {/* Left Card: Main Tertiary Tower */}
              <div className="lg:col-span-3 p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                    CAMPUS-01 (HQ)
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Main Tertiary Tower</h4>
                  <p className="text-[11px] text-slate-500">High-acuity inpatient surgical hub</p>
                </div>
                <div className="space-y-1.5 text-xs border-t border-teal-100 pt-2 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Inpatient Beds:</span>
                    <span className="font-bold text-slate-900">180 Beds</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ICU Units:</span>
                    <span className="font-bold text-slate-900">8 Critical</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>OT Suites:</span>
                    <span className="font-bold text-slate-900">4 Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Telemetry Linked</span>
                </div>
              </div>

              {/* Connector 1 (Desktop) */}
              <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center text-center">
                <span className="text-[9px] font-mono font-bold text-teal-600 uppercase tracking-wider mb-1">Sync</span>
                <div className="w-full border-t-2 border-dashed border-teal-300 relative">
                  <span className="w-2 h-2 rounded-full bg-teal-500 absolute -top-1 left-1/2 -translate-x-1/2 animate-ping" />
                </div>
              </div>

              {/* Center Card: Hospital Vision Cloud Core */}
              <div className="lg:col-span-3 p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-white text-left space-y-3 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-teal-900/80 text-teal-300 flex items-center justify-center border border-teal-700/50">
                    <Network className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Core Active
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Hospital Vision Cloud Core</h4>
                  <p className="text-[11px] text-teal-200/80">Unified Master Patient Index & Isolation</p>
                </div>
                <div className="space-y-1.5 text-xs border-t border-slate-800 pt-2 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Cross-Branch Universal UHID</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Database Multi-Tenant Isolation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Consolidated Financial Ledger</span>
                  </div>
                </div>
                <div className="text-[10px] text-teal-300/80 font-mono pt-1">
                  Single Source of Truth
                </div>
              </div>

              {/* Connector 2 (Desktop) */}
              <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center text-center">
                <span className="text-[9px] font-mono font-bold text-teal-600 uppercase tracking-wider mb-1">Sync</span>
                <div className="w-full border-t-2 border-dashed border-teal-300 relative">
                  <span className="w-2 h-2 rounded-full bg-teal-500 absolute -top-1 left-1/2 -translate-x-1/2 animate-ping" />
                </div>
              </div>

              {/* Right Card: North Satellite Clinic */}
              <div className="lg:col-span-3 p-5 rounded-2xl bg-cyan-50/50 border border-cyan-200/80 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-800 bg-white px-2 py-0.5 rounded border border-cyan-200">
                    BRANCH-02 (NC-02)
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">North Satellite Clinic</h4>
                  <p className="text-[11px] text-slate-500">Daycare OPD, triage & dispensary</p>
                </div>
                <div className="space-y-1.5 text-xs border-t border-cyan-100 pt-2 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Daycare Beds:</span>
                    <span className="font-bold text-slate-900">25 Beds</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>OPD Doctors:</span>
                    <span className="font-bold text-slate-900">4 Active</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Local Pharmacy:</span>
                    <span className="font-bold text-slate-900">Dedicated POS</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-700 font-bold pt-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Scoped Perimeter Active</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3 Executive Architecture Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-left space-y-2 hover:border-teal-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Strict Perimeter Scoping</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Satellite clinics and pharmacy stock operate within strict physical boundaries. Staff can only access patient queues and inventory authorized for their specific facility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-left space-y-2 hover:border-cyan-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unified Patient Index (MPI)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A patient registered at the main campus retains their single Universal Hospital Identifier (UHID) at any satellite clinic. Medical histories and past prescriptions synchronize instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-left space-y-2 hover:border-indigo-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Consolidated Executive KPIs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hospital executives monitor total group bed occupancy, OPD queue wait times, pharmacy dispensing, and financial collections aggregated across all branches in a single bird's-eye view.
              </p>
            </div>
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          8. TRANSPARENT PRICING
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection id="pricing" className="py-7 sm:py-9 bg-slate-50/70 border-t border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <DollarSign className="w-3 h-3 text-teal-600" />
              <span>Transparent Licensing</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Plans Built for Your <span className="text-teal-700">Hospital Capacity</span>
            </h2>

            {/* Monthly vs Annual Toggle */}
            <div className="mt-3 inline-flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {plans.map((p) => {
              const isPopular = p.isPopular;
              const numericPrice = p.priceAmount;
              const displayedPrice = billingCycle === 'annual'
                ? `₹${Math.round(numericPrice * 0.8).toLocaleString('en-IN')}`
                : p.price;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-white border-2 border-teal-600 shadow-xl shadow-teal-900/10 scale-102 z-10'
                      : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
                      Popular for Hospitals
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isPopular ? 'text-teal-900 bg-teal-100 border-teal-300 font-extrabold' : 'text-teal-800 bg-teal-50 border-teal-200'
                      }`}>
                        {p.badge}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-bold">{p.beds}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900">{p.displayName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{p.subTitle}</p>

                    <div className="my-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{displayedPrice}</span>
                        <span className="text-xs text-slate-500 font-semibold">{p.period}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        Includes {p.branches} • {p.users}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700 font-medium">
                      {p.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Link
                      to="/signin?trial=true"
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center block transition-all shadow-xs flex items-center justify-center gap-2 group cursor-pointer ${
                        isPopular
                          ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>Start 30-Day Free Trial</span>
                      <CreativeLaunchArrow glow={isPopular} className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Trust Assurance Strip */}
          <div className="mt-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Check className="w-3.5 h-3.5 text-teal-600" /> 30-Day Free Trial on All Plans
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> HIPAA &amp; NABH Certified
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-teal-600" /> Multi-Tenant Data Isolation
            </span>
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          9. FREQUENTLY ASKED QUESTIONS (FAQ)
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection id="faq" className="py-7 sm:py-9 bg-white border-t border-slate-200/90">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <HelpCircle className="w-3 h-3 text-teal-600" />
              <span>Questions &amp; Answers</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked <span className="text-teal-700">Questions</span>
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          10. FINAL BOTTOM CTA BANNER
      ───────────────────────────────────────────────────────────── */}
      <ScrollRevealSection className="py-8 sm:py-10 bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-center relative overflow-hidden text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-200 border border-white/20 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 text-teal-300" />
            <span>Ready for Immediate Deployment</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Ready to Modernize Your Hospital Operations?
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed font-medium">
            Experience unified patient charting, automated department workflows, and consolidated revenue tracking. Start your 30-day free trial today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Link
              to="/signin?trial=true"
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-teal-950 bg-white hover:bg-slate-100 shadow-xl active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Start 30-Day Free Trial (Open Login)</span>
              <CreativeLaunchArrow glow={false} className="w-3.5 h-3.5 text-teal-900" />
            </Link>

            <Link
              to="/signin"
              className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all"
            >
              Staff Sign In
            </Link>
          </div>
        </div>
      </ScrollRevealSection>

      {/* ─────────────────────────────────────────────────────────────
          11. BACK TO TOP (CLEAN FULL-WIDTH SINGLE LINE ABOVE FOOTER)
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          11. BACK TO TOP (CLEAN, SUBTLE FULL-WIDTH BAR)
      ───────────────────────────────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border-t border-slate-800 text-slate-400 hover:text-teal-300 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer group"
      >
        <ArrowUp className="w-3.5 h-3.5 text-teal-400 group-hover:-translate-y-0.5 transition-transform" />
        <span>Back to Top</span>
      </button>

      {/* ─────────────────────────────────────────────────────────────
          12. CLEAN, MODERN SAAS FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Column 1 & 2: Brand & Overview */}
            <div className="lg:col-span-2 space-y-3 text-left">
              <HospitalVisionLogo size="md" variant="dark" badge="Cloud OS" />
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Cloud-native hospital management SaaS connecting OPD, IPD, Diagnostics, Pharmacy, and Billing into a single unified patient record.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Compliant
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Lock className="w-3.5 h-3.5" /> NABH Standards
                </span>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-2.5 text-left">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#platform" className="hover:text-teal-300 transition-colors">Platform Overview</a></li>
                <li><a href="#journey" className="hover:text-teal-300 transition-colors">Patient Care Flow</a></li>
                <li><a href="#pricing" className="hover:text-teal-300 transition-colors">Pricing Plans</a></li>
                <li><a href="#faq" className="hover:text-teal-300 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Solutions */}
            <div className="space-y-2.5 text-left">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#pricing" className="hover:text-teal-300 transition-colors">Clinics &amp; Nursing Homes</a></li>
                <li><a href="#pricing" className="hover:text-teal-300 transition-colors">Multi-Specialty Hospitals</a></li>
                <li><a href="#pricing" className="hover:text-teal-300 transition-colors">Hospital Chains &amp; Groups</a></li>
                <li><Link to="/patient-portal/login" className="hover:text-teal-300 transition-colors">Patient Self-Service</Link></li>
              </ul>
            </div>

            {/* Column 4: Access & Portals */}
            <div className="space-y-2.5 text-left">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Access</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/signin?trial=true" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">Start 30-Day Free Trial</Link></li>
                <li><Link to="/signin" className="hover:text-teal-300 transition-colors">Staff Console Login</Link></li>
                <li><Link to="/patient-portal/login" className="hover:text-teal-300 transition-colors">Patient Portal</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              &copy; 2026 Hospital Vision SaaS Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-medium">
              <a href="#pricing" className="hover:text-teal-300 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#pricing" className="hover:text-teal-300 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#pricing" className="hover:text-teal-300 transition-colors">Security &amp; Compliance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
