import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  KeyRound,
  ShieldCheck,
  Heart,
  ArrowRight,
  Sparkles,
  Lock,
  Hospital,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientLogin = () => {
  const { patientLogin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your registered mobile number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await patientLogin(phone.trim(), otp.trim() || '1234');
      if (res.success) {
        addToast(`Welcome back, ${res.patient.fullName}!`, 'success');
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

  const handleDemoLogin = async () => {
    setPhone('9876543210');
    setOtp('1234');
    setLoading(true);
    setError('');
    try {
      const res = await patientLogin('9876543210', '1234');
      if (res.success) {
        addToast(`Welcome, ${res.patient.fullName}!`, 'success');
        navigate('/patient-portal/dashboard');
      } else {
        setError(res.error || 'Demo login failed');
      }
    } catch (err) {
      setError('Demo login failed. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased text-slate-800">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-teal-500/20 ring-4 ring-white/10">
            HV
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Hospital Vision
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-teal-300">
          Dedicated Patient Self-Service Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sign In to Your Health Record</h3>
              <p className="text-xs text-slate-500 mt-0.5">Access visits, prescriptions, reports & bills</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patient-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter the mobile number provided during hospital registration
              </p>
            </div>

            <div>
              <label htmlFor="patient-otp" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>OTP Verification Code</span>
                <span className="text-[10px] text-teal-600 font-normal lowercase">(demo otp: 1234)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="patient-otp"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Identity...' : 'Access Patient Portal'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>One-Click Test Patient Login</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>256-bit SSL encrypted • HIPAA & NABH compliant</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-teal-200/80">
          <span>Are you a doctor or hospital staff? </span>
          <a href="/signin" className="text-white font-bold underline hover:text-teal-300">
            Staff Portal Sign In
          </a>
        </div>
      </div>
    </div>
  );
};
