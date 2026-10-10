import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Activity,
  BedDouble,
  Pill,
  FlaskConical,
  Scan,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  AlertOctagon,
  Sparkles,
  Inbox,
  History,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Briefcase,
  UserCog,
  X
} from 'lucide-react';
import { HospitalVisionLogo } from '../common/HospitalVisionLogo';

export const Sidebar = ({ isOpenMobile = false, onCloseMobile }) => {
  const { role, isPatient } = useAuth();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-teal-600 text-white font-bold shadow-sm shadow-teal-600/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  // Role-adapted Navigation Menus
  const renderNavItems = () => {
    switch (role) {
      case 'receptionist':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Front Desk Ops</p>
              <NavLink to="/front-desk/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Reception Dashboard</span>
              </NavLink>
              <NavLink to="/patients/search" className={navClass}>
                <Users className="w-4 h-4" />
                <span>Patient Search & List</span>
              </NavLink>
              <NavLink to="/patients/register" className={navClass}>
                <UserPlus className="w-4 h-4" />
                <span>Patient Registration</span>
              </NavLink>
              <NavLink to="/appointments/calendar" className={navClass}>
                <Calendar className="w-4 h-4" />
                <span>Appointment Calendar</span>
              </NavLink>
              <NavLink to="/appointments/book" className={navClass}>
                <Clock className="w-4 h-4" />
                <span>Book Appointment</span>
              </NavLink>
              <NavLink to="/front-desk/queue" className={navClass}>
                <Users className="w-4 h-4" />
                <span>OPD Token Queue</span>
              </NavLink>
            </div>
          </>
        );

      case 'doctor':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical EMR</p>
              <NavLink to="/clinical/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Doctor Dashboard</span>
              </NavLink>
              <NavLink to="/clinical/queue" className={navClass}>
                <Clock className="w-4 h-4" />
                <span>Today's Consultation Queue</span>
              </NavLink>
              <NavLink to="/clinical/consultation" className={navClass}>
                <Stethoscope className="w-4 h-4" />
                <span>Clinical Consultation</span>
              </NavLink>
              <NavLink to="/clinical/prescriptions" className={navClass}>
                <FileText className="w-4 h-4" />
                <span>e-Prescriptions</span>
              </NavLink>
              <NavLink to="/clinical/lab-orders" className={navClass}>
                <FlaskConical className="w-4 h-4" />
                <span>Diagnostic Requisitions</span>
              </NavLink>
              <NavLink to="/clinical/ipd-rounds" className={navClass}>
                <BedDouble className="w-4 h-4" />
                <span>Admitted Inpatients</span>
              </NavLink>
            </div>
          </>
        );

      case 'nurse':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nursing Station</p>
              <NavLink to="/nursing/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Nursing Dashboard</span>
              </NavLink>
              <NavLink to="/ipd/bed-board" className={navClass}>
                <BedDouble className="w-4 h-4" />
                <span>Wards & Bed Board</span>
              </NavLink>
              <NavLink to="/nursing/chart" className={navClass}>
                <Activity className="w-4 h-4" />
                <span>MAR & Nursing Chart</span>
              </NavLink>
              <NavLink to="/nursing/icu" className={navClass}>
                <Activity className="w-4 h-4" />
                <span>ICU High-Acuity Unit</span>
              </NavLink>
              <NavLink to="/ipd/emergency" className={navClass}>
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>Emergency Triage Bay</span>
              </NavLink>
            </div>
          </>
        );

      case 'billing_cashier':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue & Cashier</p>
              <NavLink to="/billing/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Billing Dashboard</span>
              </NavLink>
              <NavLink to="/billing/invoices" className={navClass}>
                <CreditCard className="w-4 h-4" />
                <span>Invoices & Billing</span>
              </NavLink>
              <NavLink to="/billing/collect" className={navClass}>
                <CreditCard className="w-4 h-4" />
                <span>Payment Collection</span>
              </NavLink>
              <NavLink to="/billing/refunds" className={navClass}>
                <History className="w-4 h-4" />
                <span>Refunds & Adjustments</span>
              </NavLink>
              <NavLink to="/billing/insurance" className={navClass}>
                <ShieldCheck className="w-4 h-4" />
                <span>Insurance & TPA Workbench</span>
              </NavLink>
              <NavLink to="/ipd/discharge" className={navClass}>
                <FileCheck className="w-4 h-4" />
                <span>Discharge Clearance</span>
              </NavLink>
            </div>
          </>
        );

      case 'pharmacist':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pharmacy & POS</p>
              <NavLink to="/pharmacy/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Pharmacy Dashboard</span>
              </NavLink>
              <NavLink to="/pharmacy/pos" className={navClass}>
                <Pill className="w-4 h-4" />
                <span>Prescription POS & Dispense</span>
              </NavLink>
              <NavLink to="/pharmacy/inventory" className={navClass}>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Medicine Master & Batches</span>
              </NavLink>
              <NavLink to="/pharmacy/low-stock" className={navClass}>
                <AlertOctagon className="w-4 h-4 text-amber-500" />
                <span>Low Stock & Expiry Alerts</span>
              </NavLink>
            </div>
          </>
        );

      case 'lab_tech':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnostic Lab</p>
              <NavLink to="/diagnostics/lab" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Lab Dashboard & Orders</span>
              </NavLink>
              <NavLink to="/diagnostics/lab/sample-collection" className={navClass}>
                <FlaskConical className="w-4 h-4" />
                <span>Sample Collection & Barcodes</span>
              </NavLink>
              <NavLink to="/diagnostics/lab/workbench" className={navClass}>
                <CheckCircle className="w-4 h-4" />
                <span>Workbench & Verification</span>
              </NavLink>
            </div>
          </>
        );

      case 'radiologist':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical Imaging</p>
              <NavLink to="/diagnostics/radiology" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Radiology Worklist</span>
              </NavLink>
              <NavLink to="/diagnostics/radiology/reporting" className={navClass}>
                <Scan className="w-4 h-4" />
                <span>Radiologist Reporting</span>
              </NavLink>
            </div>
          </>
        );

      case 'branch_admin':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Administration</p>
              <NavLink to="/hospital/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Branch Dashboard</span>
              </NavLink>
              <NavLink to="/hospital/users" className={navClass}>
                <Users className="w-4 h-4" />
                <span>Branch Staff</span>
              </NavLink>
              <NavLink to="/ipd/bed-board" className={navClass}>
                <BedDouble className="w-4 h-4" />
                <span>Beds & Rooms</span>
              </NavLink>
              <NavLink to="/hospital/approvals" className={navClass}>
                <Inbox className="w-4 h-4" />
                <span>Approvals Inbox</span>
              </NavLink>
              <NavLink to="/hospital/reports" className={navClass}>
                <TrendingUp className="w-4 h-4" />
                <span>Branch Reports</span>
              </NavLink>
              <NavLink to="/hospital/audit-logs" className={navClass}>
                <History className="w-4 h-4" />
                <span>Audit Trail Logs</span>
              </NavLink>
            </div>
          </>
        );

      case 'hospital_admin':
      case 'org_admin':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Administration</p>
              <NavLink to="/hospital/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Hospital Dashboard</span>
              </NavLink>
              <NavLink to="/hospital/branches" className={navClass}>
                <Building className="w-4 h-4" />
                <span>Branch Management</span>
              </NavLink>
              <NavLink to="/hospital/departments" className={navClass}>
                <Building className="w-4 h-4" />
                <span>Department Master</span>
              </NavLink>
              <NavLink to="/hospital/users" className={navClass}>
                <Users className="w-4 h-4" />
                <span>Staff & User Directory</span>
              </NavLink>
              <NavLink to="/hospital/roles" className={navClass}>
                <ShieldCheck className="w-4 h-4" />
                <span>Roles & Permissions</span>
              </NavLink>
              <NavLink to="/ipd/bed-board" className={navClass}>
                <BedDouble className="w-4 h-4" />
                <span>Beds & Room Tariffs</span>
              </NavLink>
              <NavLink to="/hospital/approvals" className={navClass}>
                <Inbox className="w-4 h-4" />
                <span>Approvals Inbox</span>
              </NavLink>
              <NavLink to="/hospital/reports" className={navClass}>
                <TrendingUp className="w-4 h-4" />
                <span>Hospital Reports & Census</span>
              </NavLink>
              <NavLink to="/hospital/audit-logs" className={navClass}>
                <History className="w-4 h-4" />
                <span>Audit Trail Logs</span>
              </NavLink>
            </div>
          </>
        );

      case 'super_admin':
      case 'saas_admin':
        return (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">SaaS Platform Governance</p>
              <NavLink to="/saas/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>SaaS Executive Dashboard</span>
              </NavLink>
              <NavLink to="/saas/tenants" className={navClass}>
                <Building className="w-4 h-4" />
                <span>Hospital Tenants</span>
              </NavLink>
              <NavLink to="/saas/onboarding" className={navClass}>
                <Sparkles className="w-4 h-4" />
                <span>Tenant Onboarding Wizard</span>
              </NavLink>
              <NavLink to="/saas/subscriptions" className={navClass}>
                <CreditCard className="w-4 h-4" />
                <span>Subscription Plans</span>
              </NavLink>
              <NavLink to="/saas/feature-flags" className={navClass}>
                <Settings className="w-4 h-4" />
                <span>Tenant Feature Flags</span>
              </NavLink>
              <NavLink to="/saas/crm" className={navClass}>
                <Briefcase className="w-4 h-4" />
                <span>CRM & Corporate Accounts</span>
              </NavLink>
              <NavLink to="/saas/profile" className={navClass}>
                <UserCog className="w-4 h-4" />
                <span>Admin Profile & Security</span>
              </NavLink>
              <NavLink to="/saas/audit-logs" className={navClass}>
                <History className="w-4 h-4" />
                <span>Platform Security Audit</span>
              </NavLink>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Responsive Docked on Desktop + Off-Canvas Drawer on Mobile */}
      <aside
        className={`bg-white border-r border-slate-200/90 flex flex-col justify-between p-3.5 select-none overflow-y-auto shrink-0 z-50 md:z-auto
          md:sticky md:top-16 md:w-64 md:h-[calc(100vh-4rem)] md:translate-x-0
          fixed top-0 bottom-0 left-0 w-72 h-full shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header: Logo and Close Button */}
        <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <HospitalVisionLogo size="sm" variant="light" badge="Menu" />
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div onClick={onCloseMobile}>
            {renderNavItems()}
          </div>

          {/* Cross-Link to Patient Self-Service Portal */}
          <div className="pt-3 border-t border-slate-100" onClick={onCloseMobile}>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Direct Access</p>
            <NavLink to="/patient-portal/dashboard" className={navClass}>
              <Users className="w-4 h-4 text-teal-700" />
              <span>Patient Portal PWA</span>
            </NavLink>
          </div>
        </div>

        {/* Footer Info Box */}
        <div className="pt-3 border-t border-slate-100 px-2 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>Healthcare Platform</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Operational
            </span>
          </div>
          <p className="truncate text-slate-400 text-[10px]">Hospital Vision Multi-Tenant</p>
        </div>
      </aside>
    </>
  );
};
