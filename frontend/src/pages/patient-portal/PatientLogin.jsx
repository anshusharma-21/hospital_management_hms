import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  HeartPulse,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HospitalVisionLogo } from '../../components/common/HospitalVisionLogo';

export const PatientLogin = () => {
  const { patientLogin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your registered mobile number');
      return;
    }
    const enteredOtp = otp.trim() || (import.meta.env.DEV ? '1234' : '');
    if (!enteredOtp) {
      setError('Please enter your OTP verification code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await patientLogin(phone.trim(), enteredOtp);
      if (res.success) {
        addToast({
          title: 'Identity Verified',
          message: `Welcome back, ${res.patient.fullName}!`,
          type: 'success'
        });
        navigate('/patient-portal/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please verify your mobile number.');
      }
    } catch (err) {
      setError('Unable to authenticate at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full medical-light-canvas relative flex flex-col justify-between items-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans antialiased text-slate-800 select-none">
      {/* Radiant Healthcare Environment Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Soft Cyan & Indigo Lighting Glows */}
        <div className="absolute -top-36 right-1/3 w-[700px] h-[450px] bg-cyan-400/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-28 w-[550px] h-[500px] bg-teal-400/15 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 left-1/4 w-[650px] h-[450px] bg-sky-400/12 rounded-full blur-[140px]" />

        {/* Faint Medical Dot Matrix Texture */}
        <div className="absolute inset-0 medical-dot-grid opacity-60" />

        {/* Concentric Telemetry Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full border border-teal-600/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full border border-cyan-600/5 pointer-events-none" />

        {/* Ambient EKG Waveform */}
        <div className="absolute top-20 inset-x-0 h-24 opacity-[0.07] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path
              d="M0,50 L200,50 L220,15 L235,85 L250,20 L265,65 L280,50 L650,50 L670,10 L685,90 L700,25 L715,70 L730,50 L1200,50"
              fill="none"
              stroke="#0284c7"
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
          badge="Patient Care"
        />

        <Link
          to="/signin"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-2xs backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-teal-600" />
          <span>Staff Portal</span>
        </Link>
      </header>

      {/* Central Integrated Authentication Focal Unit */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        {/* Main Elevated Pure White Medical Card */}
        <div
          className="relative rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 p-8 sm:p-9 transition-all duration-300"
          style={{
            boxShadow:
              '0 20px 50px -12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)'
          }}
        >
          {/* Top Medical Accent Line */}
          <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 rounded-b-full" />

          {/* Heading Section */}
          <div className="text-center space-y-2 mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-teal-700 text-white shadow-lg shadow-teal-700/20 ring-4 ring-cyan-50 mb-2">
              <HeartPulse className="w-7 h-7 drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Patient Health Portal
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Securely access your consultations, prescriptions, lab results, and appointments
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Patient Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="patient-phone"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Registered Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="patient-phone"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-sans font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Enter the mobile number provided during hospital registration
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="patient-otp"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  OTP Verification Code
                </label>
                {import.meta.env.DEV && (
                  <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 font-semibold">
                    Default OTP: 1234
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="patient-otp"
                  type="password"
                  maxLength={6}
                  placeholder="Enter 4-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono tracking-widest font-semibold"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-teal-700 hover:from-cyan-700 hover:to-teal-800 active:scale-[0.98] transition-all duration-200 shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Access Patient Portal'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Privacy & Emergency Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-1 rounded-full border border-teal-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Encrypted Patient Data Protection</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
              In case of medical emergencies, please contact emergency response or visit the nearest casualty bay immediately.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 py-2 border-t border-slate-200/80">
        <div className="flex items-center gap-4">
          <span className="text-slate-700 font-semibold">Hospital Vision Patient Care</span>
          <span>•</span>
          <span>ABDM Compliant</span>
          <span>•</span>
          <span>End-to-End Encrypted</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer">Patient Rights</span>
          <span>•</span>
          <span className="hover:text-slate-800 cursor-pointer">Privacy Notice</span>
          <span>•</span>
          <span className="hover:text-slate-800 cursor-pointer">Helpdesk</span>
        </div>
      </footer>
    </div>
  );
};
