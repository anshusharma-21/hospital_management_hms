import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Calendar,
  Activity,
  Pill,
  FlaskConical,
  Scan,
  CreditCard,
  FileCheck,
  FolderLock,
  MessageSquareQuote,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Heart,
  ChevronRight,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HospitalVisionLogo } from '../common/HospitalVisionLogo';

const NAV_ITEMS = [
  { path: '/patient-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patient-portal/profile', label: 'My Profile', icon: User },
  { path: '/patient-portal/appointments', label: 'My Appointments', icon: Calendar },
  { path: '/patient-portal/medical-history', label: 'Medical History', icon: Activity },
  { path: '/patient-portal/prescriptions', label: 'Prescriptions', icon: Pill },
  { path: '/patient-portal/lab-reports', label: 'Lab Reports', icon: FlaskConical },
  { path: '/patient-portal/radiology-reports', label: 'Radiology Reports', icon: Scan },
  { path: '/patient-portal/bills', label: 'Bills & Payments', icon: CreditCard },
  { path: '/patient-portal/discharge-summaries', label: 'Discharge Summaries', icon: FileCheck },
  { path: '/patient-portal/documents', label: 'My Documents', icon: FolderLock },
  { path: '/patient-portal/feedback', label: 'Feedback & Support', icon: MessageSquareQuote },
];

export const PatientLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const patientName = user?.patientData?.fullName || user?.name || 'Patient';
  const uhid = user?.patientData?.uhid || 'HV-PATIENT';
  const initials = patientName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  const handleLogout = () => {
    logout();
    addToast('You have been securely signed out of the Patient Portal.', 'info');
    navigate('/patient-portal/login');
  };

  // Find current nav title
  const currentItem = NAV_ITEMS.find(item => location.pathname === item.path) ||
    NAV_ITEMS.find(item => location.pathname.startsWith(item.path));
  const currentTitle = currentItem ? currentItem.label : 'Patient Portal';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-teal-900 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-1 text-teal-200 hover:text-white hover:bg-teal-800 rounded-lg focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <HospitalVisionLogo size="sm" variant="dark" badge="Portal" />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-700 border border-teal-500 flex items-center justify-center text-xs font-bold text-teal-100">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-teal-300 hover:text-rose-300 hover:bg-teal-800 rounded-lg"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <HospitalVisionLogo size="md" variant="dark" badge="Portal" subtitle="Patient Health Platform" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Scoped Card in Sidebar */}
        <div className="mx-4 my-3 p-3.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold text-base shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm truncate" title={patientName}>
                {patientName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-400/20">
                  {uhid}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  • Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Health Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/patient-portal/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/30 translate-x-1'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-200" />}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer / Patient Helpline & Sign Out */}
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
          <div className="bg-teal-950/60 border border-teal-800/40 rounded-xl p-2.5 flex items-center justify-between text-xs text-teal-200">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <div>
                <p className="text-[10px] text-teal-300/80 leading-tight">Emergency Helpline</p>
                <p className="font-bold text-white text-xs">+91 1800-200-4488</p>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">24x7</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <NavLink
              to="/patient-portal/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-2 py-1 font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Account Profile</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
              title="Securely log out of Patient Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dedicated Patient Portal Top Header */}
        <header className="hidden lg:flex bg-white border-b border-slate-200/80 px-8 py-4 items-center justify-between shadow-xs shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Patient Portal</span>
              <span>/</span>
              <span className="text-teal-700 font-semibold">{currentTitle}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patient Encrypted Vault</span>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <NavLink
                to="/patient-portal/profile"
                className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-slate-100 rounded-full transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors leading-tight">
                    {patientName}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 leading-tight">
                    UHID: {uhid}
                  </p>
                </div>
              </NavLink>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Sign out of Patient Portal"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
