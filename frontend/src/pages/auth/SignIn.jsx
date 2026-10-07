import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HospitalVisionLogo } from '../../components/common/HospitalVisionLogo';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle
} from 'lucide-react';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      addToast({
        title: 'Welcome to Hospital Vision',
        message: `Signed in as ${result.user.name} (${result.user.role})`,
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
      else if (role === 'hospital_admin') navigate('/hospital/dashboard');
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

  return (
    <div className="min-h-screen w-full medical-light-canvas relative flex flex-col justify-between items-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans antialiased text-slate-800 select-none">
      {/* Radiant Medical Environment Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Ambient Cyan & Sky Lighting Auras */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-teal-400/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-28 w-[500px] h-[500px] bg-sky-400/15 rounded-full blur-[150px]" />
        <div className="absolute -bottom-28 right-1/4 w-[650px] h-[450px] bg-cyan-400/12 rounded-full blur-[140px]" />

        {/* Faint Medical Dot Matrix Texture */}
        <div className="absolute inset-0 medical-dot-grid opacity-60" />

        {/* Subtle Concentric Telemetry Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-teal-600/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1250px] h-[1250px] rounded-full border border-sky-600/5 pointer-events-none" />

        {/* Subtle Ambient Heartbeat Pulse Wave */}
        <div className="absolute bottom-12 inset-x-0 h-20 opacity-[0.08] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path
              d="M0,50 L300,50 L320,20 L335,80 L350,10 L365,70 L380,50 L700,50 L720,15 L735,85 L750,20 L765,65 L780,50 L1200,50"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* Top Header Branding Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2">
        <HospitalVisionLogo
          size="md"
          variant="light"
          badge="Enterprise"
        />

        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 text-emerald-800 font-semibold shadow-2xs backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Clinical Core: Online
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 font-medium shadow-2xs backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            256-bit AES
          </span>
        </div>
      </header>

      {/* Central Integrated Authentication Focal Unit */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        {/* Main Elevated Pure White Medical Console Card */}
        <div
          className="relative rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 p-8 sm:p-9 transition-all duration-300"
          style={{
            boxShadow:
              '0 20px 50px -12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)'
          }}
        >
          {/* Top Medical Gradient Accent Line */}
          <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 rounded-b-full" />

          {/* Heading Section */}
          <div className="text-center space-y-2 mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-700 to-cyan-600 text-white shadow-lg shadow-teal-700/20 ring-4 ring-teal-50 mb-2">
              <KeyRound className="w-6 h-6 drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Staff Portal Access
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Authorized clinical, administrative, and operations personnel authentication
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Real Staff Authentication Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="staff-email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Staff Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@hospitalvision.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-sans font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="staff-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <span className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 cursor-pointer">
                  Forgot credentials?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="staff-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-white"
                />
                <span className="font-medium">Keep session active</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                Dual-Branch Isolation
              </span>
            </div>

            {/* Premium CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 active:scale-[0.98] transition-all duration-200 shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating Credentials...' : 'Sign In to Staff Console'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Dedicated Gateway to Patient Portal */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Are you a patient looking for medical records?
            </p>
            <Link
              to="/patient-portal/login"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors group"
            >
              <span>Access Patient Self-Service Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Governance & Compliance Strip */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 py-2 border-t border-slate-200/80">
        <div className="flex items-center gap-4">
          <span className="text-slate-700 font-semibold">Hospital Vision OS v2.4</span>
          <span>•</span>
          <span>Multi-Tenant Architecture</span>
          <span>•</span>
          <span>HIPAA / ABDM Ready</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer">Security Policy</span>
          <span>•</span>
          <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
          <span>•</span>
          <span className="hover:text-slate-800 cursor-pointer">Support Desk</span>
        </div>
      </footer>
    </div>
  );
};
