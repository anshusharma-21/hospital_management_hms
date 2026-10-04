import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Building,
  Sparkles,
  Smartphone,
  Pill,
  FlaskConical,
  Scan,
  CreditCard
} from 'lucide-react';

export const SignIn = () => {
  const [email, setEmail] = useState('reception@lifelinehospital.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const { login, switchRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
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
      addToast({
        title: 'Sign In Failed',
        message: result.error,
        type: 'error'
      });
    }
  };

  const handleInstantPersona = async (targetRole) => {
    setLoading(true);
    const result = await switchRole(targetRole);
    setLoading(false);

    if (result?.success) {
      const displayName = result.user?.name || result.patient?.fullName || 'Staff User';
      addToast({
        title: 'Welcome to Hospital Vision',
        message: `Signed in as ${displayName}`,
        type: 'success'
      });

      if (targetRole === 'super_admin' || targetRole === 'saas_admin') navigate('/saas/dashboard');
      else if (targetRole === 'doctor') navigate('/clinical/dashboard');
      else if (targetRole === 'nurse') navigate('/nursing/dashboard');
      else if (targetRole === 'receptionist') navigate('/front-desk/dashboard');
      else if (targetRole === 'billing_cashier') navigate('/billing/dashboard');
      else if (targetRole === 'pharmacist') navigate('/pharmacy/dashboard');
      else if (targetRole === 'lab_tech') navigate('/diagnostics/lab');
      else if (targetRole === 'radiologist') navigate('/diagnostics/radiology');
      else if (targetRole === 'hospital_admin') navigate('/hospital/dashboard');
      else if (targetRole === 'patient') navigate('/patient-portal/dashboard');
    } else {
      addToast({
        title: 'Sign In Failed',
        message: result?.error || 'Unable to authenticate persona',
        type: 'error'
      });
    }
  };

  const personas = [
    {
      role: 'receptionist',
      title: 'Receptionist',
      desc: 'Front Desk, Registration, Queue',
      icon: UserCheck,
      badge: 'Front Desk',
      color: 'text-teal-700 bg-teal-50/50 hover:bg-teal-50 border-slate-200 hover:border-teal-400'
    },
    {
      role: 'doctor',
      title: 'Doctor / EMR',
      desc: 'Queue, Clinical Notes, Rx & Orders',
      icon: Stethoscope,
      badge: 'Clinician',
      color: 'text-teal-800 bg-teal-50/40 hover:bg-teal-50 border-slate-200 hover:border-teal-400'
    },
    {
      role: 'nurse',
      title: 'Staff Nurse',
      desc: 'Bed Board, MAR, Vitals & ICU',
      icon: Activity,
      badge: 'Inpatient',
      color: 'text-rose-700 bg-rose-50/30 hover:bg-rose-50 border-slate-200 hover:border-rose-400'
    },
    {
      role: 'billing_cashier',
      title: 'Billing Cashier',
      desc: 'Invoices, Receipts, Dues & TPA',
      icon: CreditCard,
      badge: 'Finance',
      color: 'text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50 border-slate-200 hover:border-emerald-400'
    },
    {
      role: 'pharmacist',
      title: 'Hospital Pharmacist',
      desc: 'POS, Dispensing, Batches & Stock',
      icon: Pill,
      badge: 'Pharmacy',
      color: 'text-amber-700 bg-amber-50/30 hover:bg-amber-50 border-slate-200 hover:border-amber-400'
    },
    {
      role: 'lab_tech',
      title: 'Pathology & Lab Tech',
      desc: 'Sample Collection, Analyzer & Results',
      icon: FlaskConical,
      badge: 'Diagnostics',
      color: 'text-orange-700 bg-orange-50/30 hover:bg-orange-50 border-slate-200 hover:border-orange-400'
    },
    {
      role: 'radiologist',
      title: 'Radiologist / Imaging',
      desc: 'X-Ray, CT, MRI Worklist & Reports',
      icon: Scan,
      badge: 'Imaging',
      color: 'text-violet-700 bg-violet-50/30 hover:bg-violet-50 border-slate-200 hover:border-violet-400'
    },
    {
      role: 'hospital_admin',
      title: 'Hospital Admin (COO)',
      desc: 'Operations, Branches & Staff Master',
      icon: Building,
      badge: 'Operations',
      color: 'text-blue-700 bg-blue-50/30 hover:bg-blue-50 border-slate-200 hover:border-blue-400'
    },
    {
      role: 'super_admin',
      title: 'SaaS Platform Admin',
      desc: 'Tenants, Subscriptions, Telemetry',
      icon: ShieldAlert,
      badge: 'Platform',
      color: 'text-purple-700 bg-purple-50/30 hover:bg-purple-50 border-slate-200 hover:border-purple-400'
    },
    {
      role: 'patient',
      title: 'Patient Portal (OTP)',
      desc: 'Self-Service Rx, Lab & Appointments',
      icon: Smartphone,
      badge: 'Patient PWA',
      color: 'text-cyan-700 bg-cyan-50/30 hover:bg-cyan-50 border-slate-200 hover:border-cyan-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Hospital<span className="text-teal-600">Vision</span> SaaS
        </h2>
        <p className="text-xs text-slate-500">
          Unified Multi-Tenant Healthcare Operating System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl lg:max-w-2xl space-y-6">
        {/* Sign In Card */}
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Staff Email Address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. reception@lifelinehospital.com"
                required
              />

              <Input
                label="Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Sign In to Hospital Workspace
            </Button>
          </form>

          {/* Patient Self-Service Portal Link */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/patient-portal/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Are you a Patient? Access Patient Portal (OTP) →</span>
            </Link>
          </div>
        </div>

        {/* 1-Click Persona Demonstration Panel with ALL Roles */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>1-Click Hospital Persona Switcher</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                  All {personas.length} Roles Active
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click any role persona to instantly test connected workflows without typing credentials:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {personas.map((p) => {
              const IconComp = p.icon;
              return (
                <button
                  key={p.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleInstantPersona(p.role)}
                  className={`p-3 rounded-2xl border text-left transition-all group flex items-start gap-3 ${p.color}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {p.title}
                      </p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200/60 text-slate-500 shrink-0">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {p.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

