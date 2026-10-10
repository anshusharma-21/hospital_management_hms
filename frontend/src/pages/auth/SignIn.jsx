import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HospitalVisionLogo } from '../../components/common/HospitalVisionLogo';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  HeartPulse,
  ArrowLeft,
  Info,
  CheckCircle2,
  Stethoscope,
  UserCheck,
  Pill,
  FlaskConical,
  CreditCard,
  Zap,
  Check
} from 'lucide-react';

import { isValidEmail } from '../../utils/validation';

export const SignIn = () => {
  const [searchParams] = useSearchParams();
  const isTrial = searchParams.get('trial') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Demo accounts for instant evaluation
  // Demo accounts connected to real hospital staff in DB
  const demoAccounts = [
    {
      role: 'Hospital Admin',
      email: 'happysingh@gmail.com',
      password: 'happysingh',
      icon: Building2,
      tag: 'Full Management (Happy Singh)',
      color: 'bg-teal-50 border-teal-200 text-teal-800 hover:border-teal-400'
    },
    {
      role: 'Doctor (EMR)',
      email: 'pallavi@gmail.com',
      password: 'pallavimain',
      icon: Stethoscope,
      tag: 'Clinical Encounters (Dr. Pallavi)',
      color: 'bg-sky-50 border-sky-200 text-sky-800 hover:border-sky-400'
    },
    {
      role: 'Reception / OPD',
      email: 'rani@gmail.com',
      password: 'ranimain',
      icon: UserCheck,
      tag: 'Token & Booking (Rani Kumari)',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:border-indigo-400'
    },
    {
      role: 'Inpatient Nurse',
      email: 'priya@gmail.com',
      password: 'priyamain',
      icon: HeartPulse,
      tag: 'MAR & Vitals (Priya Yadav)',
      color: 'bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400'
    },
    {
      role: 'Cashier / Billing',
      email: 'kamal@gmail.com',
      password: 'kamalmain',
      icon: CreditCard,
      tag: 'Invoices & TPA (Kamal Kumar)',
      color: 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400'
    },
    {
      role: 'Pharmacist',
      email: 'muskan@gmail.com',
      password: 'muskanmain',
      icon: Pill,
      tag: 'Inventory & POS (Muskan Mehta)',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400'
    },
    {
      role: 'Lab Technologist',
      email: 'jk@gmail.com',
      password: 'jkmain',
      icon: FlaskConical,
      tag: 'Pathology Reports (JK)',
      color: 'bg-purple-50 border-purple-200 text-purple-800 hover:border-purple-400'
    },
    {
      role: 'Super Admin',
      email: 'ajay@gmail.com',
      password: 'ajay321',
      icon: ShieldCheck,
      tag: 'SaaS Platform Owner (Ajay)',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:border-cyan-400'
    }
  ];

  // Auto-fill trial credentials on first load if trial query param is present
  useEffect(() => {
    if (isTrial && !email) {
      const defaultDemo = demoAccounts[0];
      setEmail(defaultDemo.email);
      setPassword(defaultDemo.password);
      setSelectedDemoRole(defaultDemo.role);
    }
  }, [isTrial]);

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemoRole(acc.role);
    setErrorMessage('');
    // Direct 1-click login into role dashboard
    executeLogin(acc.email, acc.password);
  };

  const executeLogin = async (loginEmail, loginPassword) => {
    setErrorMessage('');
    setLoading(true);

    const result = await login(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (result.success) {
      addToast({
        title: 'Authentication Successful',
        message: `Welcome, ${result.user.name} (${result.user.role})`,
        type: 'success'
      });

      const role = result.user.role;
      if (role === 'super_admin' || role === 'saas_admin') navigate('/saas/dashboard');
      else if (role === 'doctor') navigate('/clinical/dashboard');
      else if (role === 'nurse') navigate('/nursing/dashboard');
      else if (role === 'receptionist') navigate('/front-desk/dashboard');
      else if (role === 'billing_cashier') navigate('/billing/dashboard');
      else if (role === 'pharmacist') navigate('/pharmacy/dashboard');
      else if (role === 'lab_tech') navigate('/diagnostics/lab');
      else if (role === 'radiologist') navigate('/diagnostics/radiology');
      else if (role === 'hospital_admin' || role === 'org_admin') navigate('/hospital/dashboard');
      else navigate('/front-desk/dashboard');
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      addToast({
        title: 'Sign In Failed',
        message: result.error,
        type: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your work email address');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid work email address (e.g. name@hospital.com)');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password');
      return;
    }
    executeLogin(email, password);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: PROPER 50/50 SPLIT SCREEN (DARK CLINICAL PERSONAS & DEMO ACCOUNTS)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-1/2 bg-gradient-to-br from-[#0c2338] via-[#091d30] to-[#071726] text-white p-5 sm:p-7 lg:p-8 xl:p-10 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 min-h-full">
        {/* Ambient Lights & Medical Dot Grid */}
        <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute inset-0 medical-dot-grid opacity-15 pointer-events-none" />

        {/* Top Header Strip */}
        <div className="relative z-10 flex items-center justify-between pb-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <HospitalVisionLogo size="md" variant="dark" badge="Cloud OS" />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-all bg-white/[0.08] hover:bg-white/[0.14] px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Platform Overview</span>
          </Link>
        </div>

        {/* Central Personas Showcase (Clean, Simple, 8 Role Cards with 1-Click Fill) */}
        <div className="relative z-10 my-auto py-3 space-y-3.5 max-w-xl w-full">
          
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <Zap className="w-3.5 h-3.5 text-teal-300" />
              <span>Instant Demo Accounts (1-Click Pre-fill)</span>
            </div>

            <span className="text-[10px] font-mono font-bold text-teal-200 bg-white/[0.08] px-2.5 py-1 rounded-full border border-white/10">
              1-Click Auto-Fill (DB Accounts)
            </span>
          </div>

          <div className="space-y-1 text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Clinical &amp; Administrative Personas
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Click any role below to pre-populate credentials into the workspace sign-in portal on the right.
            </p>
          </div>

          {/* The 8 Demo Roles with Their Distinct Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            {demoAccounts.map((acc) => {
              const IconComponent = acc.icon;
              const isSelected = selectedDemoRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`p-2.5 rounded-xl text-left transition-all border flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-teal-400 border-teal-400 shadow-md scale-[1.01]'
                      : 'hover:scale-[1.005]'
                  } ${acc.color}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/95 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">
                        {acc.role}
                      </div>
                      <div className="text-[10px] opacity-75 truncate">{acc.tag}</div>
                      <div className="text-[9px] font-mono opacity-80 truncate mt-0.5">{acc.email}</div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                    isSelected ? 'bg-teal-800 text-white' : 'bg-white/85 text-slate-800 border border-slate-200/50'
                  }`}>
                    {isSelected ? 'Loaded' : '1-Click'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Multi-Tenant Role-Based Access Control (RBAC)</span>
            </span>
            <span className="text-[10px] font-mono text-teal-300 font-bold hidden sm:inline">
              8 Live Sandbox Profiles
            </span>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-medium">Enterprise Cloud Node Active</span>
          </div>
          <span className="text-[11px] font-mono text-teal-400 font-bold">HIPAA &amp; ABDM Ready</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: CLEAN WHITE LOGIN PORTAL (MAIL & PASSWORD)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 bg-white min-h-full flex flex-col justify-between p-5 sm:p-7 lg:p-8 xl:p-12 relative overflow-y-auto">
        
        {/* Top Header / Status Strip */}
        <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">
              System Gateway: <strong className="text-teal-800">Live &amp; Encrypted</strong>
            </span>
          </div>

          <Link
            to="/patient-portal/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-900 transition-all bg-teal-50 hover:bg-teal-100/70 px-3.5 py-1.5 rounded-full border border-teal-200 shadow-2xs"
          >
            <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
            <span>Patient Portal Login →</span>
          </Link>
        </div>

        {/* Central Authentication Card: SIMPLE & FOCUSED ON EMAIL & PASSWORD */}
        <div className="max-w-md w-full mx-auto my-auto py-2 relative z-10 text-left">
          
          {/* Form Header */}
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-md shadow-teal-700/20 mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Hospital Workspace Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Enter authorized personnel credentials to access your clinical or administrative terminal.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Work Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@lifelinehospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-medium shadow-2xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono font-medium shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Remember this terminal session</span>
              </label>

              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>SSL Encrypted</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 hover:from-teal-800 hover:to-cyan-900 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Secure Workspace...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Hospital Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Notice for Patients */}
          <div className="mt-5 pt-3.5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Looking for your personal medical records, prescriptions, or bills?
            </p>
            <Link
              to="/patient-portal/login"
              className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
            >
              <span>Access Patient Self-Service Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Compliance Strip */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 relative z-10 font-medium">
          <div>Hospital Vision Cloud OS • Production Release</div>
          <div className="flex items-center gap-3 text-slate-600">
            <span>HIPAA Compliant</span>
            <span>•</span>
            <span>NABH / ABDM Ready</span>
            <span>•</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-900 animate-fade-in-up">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Staff Credential Recovery</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Hospital user authentication is governed by your organization's Hospital Administrator. For security integrity, please contact your internal IT Department or Hospital Director to reset your credentials.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
              <strong className="text-teal-800 block mb-1">Demo Environment Notice:</strong>
              Use the instant demo buttons on the left panel to access any role immediately with default credentials (<span className="font-mono font-bold text-slate-900">Password123!</span>).
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
