import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Public Landing & Auth Pages
import { Landing } from './pages/landing/Landing';
import { SignIn } from './pages/auth/SignIn';

// Front Desk / Patient Operations
import { ReceptionDashboard } from './pages/front-desk/ReceptionDashboard';
import { PatientList } from './pages/front-desk/PatientList';
import { PatientRegistration } from './pages/front-desk/PatientRegistration';
import { PatientProfile } from './pages/front-desk/PatientProfile';
import { AppointmentCalendar } from './pages/front-desk/AppointmentCalendar';
import { AppointmentBooking } from './pages/front-desk/AppointmentBooking';
import { LiveQueueBoard } from './pages/front-desk/LiveQueueBoard';

// Clinical / Doctor EMR
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { ConsultationEncounter } from './pages/doctor/ConsultationEncounter';
import { PrescriptionList } from './pages/doctor/PrescriptionList';

// Nursing & Inpatient (IPD)
import { NursingDashboard } from './pages/nursing/NursingDashboard';
import { NursingChartMAR } from './pages/nursing/NursingChartMAR';
import { ICUDashboard } from './pages/nursing/ICUDashboard';
import { BedBoard } from './pages/ipd/BedBoard';
import { EmergencyTriage } from './pages/ipd/EmergencyTriage';
import { OTSchedule } from './pages/ipd/OTSchedule';
import { DischargeClearance } from './pages/ipd/DischargeClearance';

// Diagnostics (Lab & Radiology)
import { LabDashboard } from './pages/diagnostics/LabDashboard';
import { LabSampleCollection } from './pages/diagnostics/LabSampleCollection';
import { LabWorkbench } from './pages/diagnostics/LabWorkbench';
import { RadiologyWorklist } from './pages/diagnostics/RadiologyWorklist';
import { RadiologyReporting } from './pages/diagnostics/RadiologyReporting';

// Pharmacy
import { PharmacyDashboard } from './pages/pharmacy/PharmacyDashboard';
import { PharmacyPOS } from './pages/pharmacy/PharmacyPOS';
import { MedicineInventory } from './pages/pharmacy/MedicineInventory';

// Billing & Revenue
import { BillingDashboard } from './pages/billing/BillingDashboard';
import { InvoiceList } from './pages/billing/InvoiceList';
import { PaymentCollection } from './pages/billing/PaymentCollection';
import { RefundsAdjustments } from './pages/billing/RefundsAdjustments';
import { InsuranceWorkbench } from './pages/billing/InsuranceWorkbench';

// Hospital Admin
import { HospitalDashboard } from './pages/hospital-admin/HospitalDashboard';
import { BranchManagement } from './pages/hospital-admin/BranchManagement';
import { DepartmentManagement } from './pages/hospital-admin/DepartmentManagement';
import { UserManagement } from './pages/hospital-admin/UserManagement';
import { RolesPermissions } from './pages/hospital-admin/RolesPermissions';
import { ApprovalsInbox } from './pages/hospital-admin/ApprovalsInbox';
import { HospitalReports } from './pages/hospital-admin/HospitalReports';
import { AuditLogs } from './pages/hospital-admin/AuditLogs';

// SaaS Platform Governance
import { SaasDashboard } from './pages/saas-admin/SaasDashboard';
import { TenantList } from './pages/saas-admin/TenantList';
import { TenantOnboarding } from './pages/saas-admin/TenantOnboarding';
import { SubscriptionManagement } from './pages/saas-admin/SubscriptionManagement';
import { FeatureFlags } from './pages/saas-admin/FeatureFlags';
import { CRMCorporate } from './pages/saas-admin/CRMCorporate';
import { SaasProfile } from './pages/saas-admin/SaasProfile';

// Patient Portal Dedicated Suite
import { PatientLayout } from './components/layout/PatientLayout';
import { PatientLogin } from './pages/patient-portal/PatientLogin';
import { PatientDashboard } from './pages/patient-portal/PatientDashboard';
import { PatientProfile as PatientOwnProfile } from './pages/patient-portal/PatientProfile';
import { PatientAppointments } from './pages/patient-portal/PatientAppointments';
import { PatientMedicalHistory } from './pages/patient-portal/PatientMedicalHistory';
import { PatientPrescriptions } from './pages/patient-portal/PatientPrescriptions';
import { PatientLabReports } from './pages/patient-portal/PatientLabReports';
import { PatientRadiologyReports } from './pages/patient-portal/PatientRadiologyReports';
import { PatientBills } from './pages/patient-portal/PatientBills';
import { PatientDischargeSummaries } from './pages/patient-portal/PatientDischargeSummaries';
import { PatientDocuments } from './pages/patient-portal/PatientDocuments';
import { PatientFeedback } from './pages/patient-portal/PatientFeedback';

// Protected Route Wrapper with Role Authorization (for Staff Routes)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-teal-700 font-bold text-sm">
        Initializing Hospital Workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    const isSuperAdmin = ['super_admin', 'saas_admin'].includes(userRole);
    const hasRoleAccess = allowedRoles.includes(userRole) || isSuperAdmin;

    if (!hasRoleAccess) {
      if (userRole === 'patient') {
        return <Navigate to="/patient-portal/dashboard" replace />;
      }
      const roleHomeMap = {
        super_admin: '/saas/dashboard',
        saas_admin: '/saas/dashboard',
        hospital_admin: '/hospital/dashboard',
        org_admin: '/hospital/dashboard',
        branch_admin: '/hospital/dashboard',
        doctor: '/clinical/dashboard',
        nurse: '/nursing/dashboard',
        receptionist: '/front-desk/dashboard',
        billing_cashier: '/billing/dashboard',
        pharmacist: '/pharmacy/dashboard',
        lab_tech: '/diagnostics/lab',
        radiologist: '/diagnostics/radiology'
      };
      const fallback = roleHomeMap[userRole] || '/front-desk/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

// Dedicated Patient Portal Route Guard (Strict Patient Access Only)
const PatientProtectedRoute = ({ children }) => {
  const { user, isPatient, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-teal-800 font-semibold text-sm">
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Patient Identity...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/patient-portal/login" replace />;
  }

  // Reject staff/admin users from accidentally entering patient portal
  if (user?.role !== 'patient' && !isPatient) {
    const roleHomeMap = {
      super_admin: '/saas/dashboard',
      saas_admin: '/saas/dashboard',
      hospital_admin: '/hospital/dashboard',
      org_admin: '/hospital/dashboard',
      branch_admin: '/hospital/dashboard',
      doctor: '/clinical/dashboard',
      nurse: '/nursing/dashboard',
      receptionist: '/front-desk/dashboard',
      billing_cashier: '/billing/dashboard',
      pharmacist: '/pharmacy/dashboard',
      lab_tech: '/diagnostics/lab',
      radiologist: '/diagnostics/radiology'
    };
    const fallback = roleHomeMap[user?.role] || '/front-desk/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

// Global App Shell Layout
const Layout = ({ children }) => {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on page/route change
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/login' || location.pathname === '/patient-portal/login' || location.pathname === '/onboarding';
  const isPatientPortal = location.pathname.startsWith('/patient-portal');

  // Keyboard shortcut '/' opens global patient search ONLY on staff dashboard
  React.useEffect(() => {
    if (isPatientPortal || isLandingPage || isAuthPage) return;
    const handleKeyDown = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPatientPortal, isLandingPage, isAuthPage]);

  if (isLandingPage || isAuthPage) {
    return <main>{children}</main>;
  }

  // Dedicated Patient Portal Layout: Clean, zero staff controls, zero "search patient"
  if (isPatientPortal) {
    return <PatientLayout>{children}</PatientLayout>;
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      <Navbar 
        onOpenSearch={() => setIsSearchOpen(true)} 
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          isOpenMobile={mobileSidebarOpen} 
          onCloseMobile={() => setMobileSidebarOpen(false)} 
        />
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

const ROLES_FRONT_DESK = ['receptionist', 'hospital_admin', 'org_admin', 'branch_admin', 'doctor', 'nurse', 'billing_cashier'];
const ROLES_CLINICAL = ['doctor', 'hospital_admin', 'org_admin', 'branch_admin'];
const ROLES_NURSING_IPD = ['nurse', 'doctor', 'hospital_admin', 'org_admin', 'branch_admin', 'billing_cashier'];
const ROLES_DIAGNOSTICS = ['lab_tech', 'radiologist', 'doctor', 'hospital_admin', 'org_admin', 'branch_admin'];
const ROLES_PHARMACY = ['pharmacist', 'hospital_admin', 'org_admin', 'branch_admin'];
const ROLES_BILLING = ['billing_cashier', 'receptionist', 'hospital_admin', 'org_admin', 'branch_admin'];
const ROLES_ORG_ADMIN = ['hospital_admin', 'org_admin'];
const ROLES_HOSPITAL_ADMIN = ['hospital_admin', 'org_admin', 'branch_admin'];
const ROLES_SAAS_ADMIN = ['super_admin', 'saas_admin'];

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Landing, Auth & SaaS Trial Onboarding */}
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/login" element={<Navigate to="/signin" replace />} />
              <Route path="/onboarding" element={<TenantOnboarding />} />

              {/* Front Desk / Patient Operations */}
              <Route path="/front-desk/dashboard" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><ReceptionDashboard /></ProtectedRoute>} />
              <Route path="/patients/search" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><PatientList /></ProtectedRoute>} />
              <Route path="/patients/list" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><PatientList /></ProtectedRoute>} />
              <Route path="/patients/register" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><PatientRegistration /></ProtectedRoute>} />
              <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><PatientProfile /></ProtectedRoute>} />
              <Route path="/appointments/calendar" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><AppointmentCalendar /></ProtectedRoute>} />
              <Route path="/appointments/book" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><AppointmentBooking /></ProtectedRoute>} />
              <Route path="/front-desk/queue" element={<ProtectedRoute allowedRoles={ROLES_FRONT_DESK}><LiveQueueBoard /></ProtectedRoute>} />

              {/* Clinical / Doctor EMR */}
              <Route path="/clinical/dashboard" element={<ProtectedRoute allowedRoles={ROLES_CLINICAL}><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/clinical/queue" element={<ProtectedRoute allowedRoles={ROLES_CLINICAL}><LiveQueueBoard /></ProtectedRoute>} />
              <Route path="/clinical/consultation" element={<ProtectedRoute allowedRoles={ROLES_CLINICAL}><ConsultationEncounter /></ProtectedRoute>} />
              <Route path="/clinical/prescriptions" element={<ProtectedRoute allowedRoles={ROLES_CLINICAL}><PrescriptionList /></ProtectedRoute>} />
              <Route path="/clinical/lab-orders" element={<ProtectedRoute allowedRoles={ROLES_CLINICAL}><LabDashboard /></ProtectedRoute>} />
              <Route path="/clinical/ipd-rounds" element={<ProtectedRoute allowedRoles={ROLES_CLINICAL}><BedBoard /></ProtectedRoute>} />

              {/* Role Aliases to Prevent 404 / Signin Redirects */}
              <Route path="/doctor" element={<Navigate to="/clinical/dashboard" replace />} />
              <Route path="/doctor/dashboard" element={<Navigate to="/clinical/dashboard" replace />} />
              <Route path="/doctor/queue" element={<Navigate to="/clinical/queue" replace />} />
              <Route path="/doctor/consultation" element={<Navigate to="/clinical/consultation" replace />} />
              <Route path="/doctor/prescriptions" element={<Navigate to="/clinical/prescriptions" replace />} />
              <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
              <Route path="/branches" element={<Navigate to="/hospital/branches" replace />} />
              <Route path="/reception" element={<Navigate to="/front-desk/dashboard" replace />} />
              <Route path="/billing" element={<Navigate to="/billing/dashboard" replace />} />
              <Route path="/nursing" element={<Navigate to="/nursing/dashboard" replace />} />
              <Route path="/pharmacy" element={<Navigate to="/pharmacy/dashboard" replace />} />
              <Route path="/lab" element={<Navigate to="/diagnostics/lab" replace />} />

              {/* Nursing & IPD */}
              <Route path="/nursing/dashboard" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><NursingDashboard /></ProtectedRoute>} />
              <Route path="/nursing/chart" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><NursingChartMAR /></ProtectedRoute>} />
              <Route path="/nursing/icu" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><ICUDashboard /></ProtectedRoute>} />
              <Route path="/ipd/bed-board" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><BedBoard /></ProtectedRoute>} />
              <Route path="/ipd/emergency" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><EmergencyTriage /></ProtectedRoute>} />
              <Route path="/ipd/ot" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><OTSchedule /></ProtectedRoute>} />
              <Route path="/ipd/discharge" element={<ProtectedRoute allowedRoles={ROLES_NURSING_IPD}><DischargeClearance /></ProtectedRoute>} />

              {/* Diagnostic Lab & Radiology */}
              <Route path="/diagnostics/lab" element={<ProtectedRoute allowedRoles={ROLES_DIAGNOSTICS}><LabDashboard /></ProtectedRoute>} />
              <Route path="/diagnostics/lab/sample-collection" element={<ProtectedRoute allowedRoles={ROLES_DIAGNOSTICS}><LabSampleCollection /></ProtectedRoute>} />
              <Route path="/diagnostics/lab/workbench" element={<ProtectedRoute allowedRoles={ROLES_DIAGNOSTICS}><LabWorkbench /></ProtectedRoute>} />
              <Route path="/diagnostics/radiology" element={<ProtectedRoute allowedRoles={ROLES_DIAGNOSTICS}><RadiologyWorklist /></ProtectedRoute>} />
              <Route path="/diagnostics/radiology/reporting" element={<ProtectedRoute allowedRoles={ROLES_DIAGNOSTICS}><RadiologyReporting /></ProtectedRoute>} />

              {/* Pharmacy */}
              <Route path="/pharmacy/dashboard" element={<ProtectedRoute allowedRoles={ROLES_PHARMACY}><PharmacyDashboard /></ProtectedRoute>} />
              <Route path="/pharmacy/pos" element={<ProtectedRoute allowedRoles={ROLES_PHARMACY}><PharmacyPOS /></ProtectedRoute>} />
              <Route path="/pharmacy/inventory" element={<ProtectedRoute allowedRoles={ROLES_PHARMACY}><MedicineInventory /></ProtectedRoute>} />
              <Route path="/pharmacy/low-stock" element={<ProtectedRoute allowedRoles={ROLES_PHARMACY}><MedicineInventory /></ProtectedRoute>} />

              {/* Billing & Revenue */}
              <Route path="/billing/dashboard" element={<ProtectedRoute allowedRoles={ROLES_BILLING}><BillingDashboard /></ProtectedRoute>} />
              <Route path="/billing/invoices" element={<ProtectedRoute allowedRoles={ROLES_BILLING}><InvoiceList /></ProtectedRoute>} />
              <Route path="/billing/collect" element={<ProtectedRoute allowedRoles={ROLES_BILLING}><PaymentCollection /></ProtectedRoute>} />
              <Route path="/billing/refunds" element={<ProtectedRoute allowedRoles={ROLES_BILLING}><RefundsAdjustments /></ProtectedRoute>} />
              <Route path="/billing/insurance" element={<ProtectedRoute allowedRoles={ROLES_BILLING}><InsuranceWorkbench /></ProtectedRoute>} />

              {/* Hospital Administration */}
              <Route path="/hospital/dashboard" element={<ProtectedRoute allowedRoles={ROLES_HOSPITAL_ADMIN}><HospitalDashboard /></ProtectedRoute>} />
              <Route path="/hospital/branches" element={<ProtectedRoute allowedRoles={ROLES_ORG_ADMIN}><BranchManagement /></ProtectedRoute>} />
              <Route path="/hospital/departments" element={<ProtectedRoute allowedRoles={ROLES_ORG_ADMIN}><DepartmentManagement /></ProtectedRoute>} />
              <Route path="/hospital/users" element={<ProtectedRoute allowedRoles={ROLES_HOSPITAL_ADMIN}><UserManagement /></ProtectedRoute>} />
              <Route path="/hospital/roles" element={<ProtectedRoute allowedRoles={ROLES_ORG_ADMIN}><RolesPermissions /></ProtectedRoute>} />
              <Route path="/hospital/approvals" element={<ProtectedRoute allowedRoles={ROLES_HOSPITAL_ADMIN}><ApprovalsInbox /></ProtectedRoute>} />
              <Route path="/hospital/reports" element={<ProtectedRoute allowedRoles={ROLES_HOSPITAL_ADMIN}><HospitalReports /></ProtectedRoute>} />
              <Route path="/hospital/audit-logs" element={<ProtectedRoute allowedRoles={ROLES_HOSPITAL_ADMIN}><AuditLogs /></ProtectedRoute>} />

              {/* SaaS Platform Governance */}
              <Route path="/saas/dashboard" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><SaasDashboard /></ProtectedRoute>} />
              <Route path="/saas/tenants" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><TenantList /></ProtectedRoute>} />
              <Route path="/saas/onboarding" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><TenantOnboarding /></ProtectedRoute>} />
              <Route path="/saas/subscriptions" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><SubscriptionManagement /></ProtectedRoute>} />
              <Route path="/saas/feature-flags" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><FeatureFlags /></ProtectedRoute>} />
              <Route path="/saas/crm" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><CRMCorporate /></ProtectedRoute>} />
              <Route path="/saas/profile" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><SaasProfile /></ProtectedRoute>} />
              <Route path="/saas/audit-logs" element={<ProtectedRoute allowedRoles={ROLES_SAAS_ADMIN}><AuditLogs /></ProtectedRoute>} />

              {/* Dedicated Patient Portal Suite (Strict Patient Protected Routes) */}
              <Route path="/patient-portal/login" element={<PatientLogin />} />
              <Route path="/patient-portal" element={<Navigate to="/patient-portal/dashboard" replace />} />
              <Route path="/patient-portal/dashboard" element={<PatientProtectedRoute><PatientDashboard /></PatientProtectedRoute>} />
              <Route path="/patient-portal/profile" element={<PatientProtectedRoute><PatientOwnProfile /></PatientProtectedRoute>} />
              <Route path="/patient-portal/appointments" element={<PatientProtectedRoute><PatientAppointments /></PatientProtectedRoute>} />
              <Route path="/patient-portal/medical-history" element={<PatientProtectedRoute><PatientMedicalHistory /></PatientProtectedRoute>} />
              <Route path="/patient-portal/prescriptions" element={<PatientProtectedRoute><PatientPrescriptions /></PatientProtectedRoute>} />
              <Route path="/patient-portal/lab-reports" element={<PatientProtectedRoute><PatientLabReports /></PatientProtectedRoute>} />
              <Route path="/patient-portal/radiology-reports" element={<PatientProtectedRoute><PatientRadiologyReports /></PatientProtectedRoute>} />
              <Route path="/patient-portal/bills" element={<PatientProtectedRoute><PatientBills /></PatientProtectedRoute>} />
              <Route path="/patient-portal/payments" element={<Navigate to="/patient-portal/bills" replace />} />
              <Route path="/patient-portal/discharge-summaries" element={<PatientProtectedRoute><PatientDischargeSummaries /></PatientProtectedRoute>} />
              <Route path="/patient-portal/documents" element={<PatientProtectedRoute><PatientDocuments /></PatientProtectedRoute>} />
              <Route path="/patient-portal/feedback" element={<PatientProtectedRoute><PatientFeedback /></PatientProtectedRoute>} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/signin" replace />} />
            </Routes>
          </Layout>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
