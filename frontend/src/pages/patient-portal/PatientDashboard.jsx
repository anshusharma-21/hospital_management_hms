import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Pill,
  FlaskConical,
  Scan,
  CreditCard,
  FileCheck,
  FolderLock,
  MessageSquareQuote,
  ShieldCheck,
  AlertCircle,
  Heart,
  ChevronRight,
  PlusCircle,
  FileText,
  Activity,
  ArrowUpRight,
  Receipt,
  Phone
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [radiologyOrders, setRadiologyOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Strictly load the authenticated patient's profile from /patients/me
      const meRes = await api.get('/patients/me');
      if (!meRes.data?.success || !meRes.data?.data) {
        throw new Error('Authenticated patient record not found');
      }
      const pat = meRes.data.data;
      setPatientData(pat);

      // Concurrently fetch this patient's records
      const [appRes, rxRes, labRes, radRes, invRes] = await Promise.allSettled([
        api.get('/appointments'),
        api.get('/clinical/prescriptions'),
        api.get('/diagnostics/lab-orders'),
        api.get('/diagnostics/radiology-orders'),
        api.get('/billing/invoices')
      ]);

      if (appRes.status === 'fulfilled' && appRes.value.data?.success) {
        setAppointments(appRes.value.data.data || []);
      }
      if (rxRes.status === 'fulfilled' && rxRes.value.data?.success) {
        setPrescriptions(rxRes.value.data.data || []);
      }
      if (labRes.status === 'fulfilled' && labRes.value.data?.success) {
        setLabOrders(labRes.value.data.data || []);
      }
      if (radRes.status === 'fulfilled' && radRes.value.data?.success) {
        setRadiologyOrders(radRes.value.data.data || []);
      }
      if (invRes.status === 'fulfilled' && invRes.value.data?.success) {
        setInvoices(invRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
      setError('Unable to load your health records. Please ensure you are logged into a registered patient account.');
    } finally {
      setLoading(false);
    }
  };

  // Determine dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Upcoming appointment logic: find first non-cancelled upcoming or scheduled
  const upcomingAppointment = appointments.find(a => 
    !['Cancelled', 'Completed', 'No-Show'].includes(a.status)
  ) || appointments[0];

  // Billing calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-3xl border border-rose-200 shadow-sm mt-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600">{error || 'Patient health record unavailable.'}</p>
        <button
          onClick={() => navigate('/patient-portal/login')}
          className="mt-4 px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl text-sm hover:bg-teal-700 transition-colors"
        >
          Return to Patient Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome & Longitudinal Patient Overview Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 font-extrabold text-2xl sm:text-3xl shrink-0 shadow-inner">
              {patientData.fullName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-teal-300 text-xs font-semibold uppercase tracking-wider">
                  {getGreeting()},
                </span>
                <span className="font-mono text-xs bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  UHID: {patientData.uhid}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {patientData.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-1">
                Here's your personal health overview.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to="/patient-portal/appointments"
              className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 group"
            >
              <PlusCircle className="w-4 h-4 text-teal-700 group-hover:rotate-90 transition-transform" />
              <span>Book Appointment</span>
            </NavLink>
            <NavLink
              to="/patient-portal/profile"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </NavLink>
          </div>
        </div>

        {/* Real Patient Summary Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-teal-300/70 text-[10px] uppercase font-bold block">Age / Gender</span>
            <span className="font-semibold text-white mt-0.5 block">{patientData.age} Yrs • {patientData.gender}</span>
          </div>
          <div>
            <span className="text-teal-300/70 text-[10px] uppercase font-bold block">Blood Group</span>
            <span className="font-bold text-emerald-300 mt-0.5 block">{patientData.bloodGroup || 'Not Specified'}</span>
          </div>
          <div>
            <span className="text-teal-300/70 text-[10px] uppercase font-bold block">Registered Mobile</span>
            <span className="font-mono text-white mt-0.5 block">{patientData.phone || 'N/A'}</span>
          </div>
          <div>
            <span className="text-teal-300/70 text-[10px] uppercase font-bold block">Primary Branch</span>
            <span className="text-white mt-0.5 block truncate" title={patientData.primaryBranch?.name}>
              {patientData.primaryBranch?.name || 'Main Hospital'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-teal-300/70 text-[10px] uppercase font-bold block">Emergency Contact</span>
            <span className="text-white mt-0.5 block truncate">
              {patientData.emergencyContact?.name 
                ? `${patientData.emergencyContact.name} (${patientData.emergencyContact.relationship || 'Kin'}) • ${patientData.emergencyContact.phone}` 
                : 'Not Registered'}
            </span>
          </div>
        </div>

        {/* Clinical Alerts / Formatted Allergies (NO [object Object]) */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {Array.isArray(patientData.allergies) && patientData.allergies.length > 0 ? (
            patientData.allergies.map((allergy, idx) => {
              const allergen = typeof allergy === 'object' ? allergy.allergen : allergy;
              const severity = typeof allergy === 'object' && allergy.severity ? allergy.severity : 'Moderate';
              const reaction = typeof allergy === 'object' && allergy.reaction ? `(${allergy.reaction})` : '';
              return (
                <div
                  key={idx}
                  className="bg-rose-500/20 border border-rose-400/30 text-rose-200 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    <strong>Allergy:</strong> {allergen} • <em>{severity}</em> {reaction}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-teal-200/60 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>No known drug or food allergies on record</span>
            </div>
          )}

          {Array.isArray(patientData.chronicConditions) && patientData.chronicConditions.length > 0 && (
            patientData.chronicConditions.map((condition, idx) => (
              <div
                key={idx}
                className="bg-sky-500/20 border border-sky-400/30 text-sky-200 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 font-medium"
              >
                <Heart className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Condition: {condition}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Key Action Cards Grid (Upcoming Visit, Active Meds, Billing) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Appointment Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Next Appointment</h3>
              </div>
              {upcomingAppointment && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  upcomingAppointment.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                  upcomingAppointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {upcomingAppointment.status}
                </span>
              )}
            </div>

            {upcomingAppointment ? (
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-slate-900 text-base">
                    Dr. {upcomingAppointment.doctor?.name || 'Assigned Physician'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {upcomingAppointment.department?.name || upcomingAppointment.doctor?.doctorProfile?.specialization || 'Clinical Consultation'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })} • {upcomingAppointment.slotTime}
                    </span>
                  </div>
                  {upcomingAppointment.tokenNumber && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-semibold text-teal-800">Token Number:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                        #{upcomingAppointment.tokenNumber}
                      </span>
                    </div>
                  )}
                  {upcomingAppointment.branch?.name && (
                    <p className="text-[11px] text-slate-500">
                      Location: {upcomingAppointment.branch.name}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">No upcoming consultations scheduled</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <NavLink
              to="/patient-portal/appointments"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>View All Appointments ({appointments.length})</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>

        {/* Recent Prescriptions Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Active Medications</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                {prescriptions.length} Prescriptions
              </span>
            </div>

            {prescriptions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 font-mono">
                    {prescriptions[0].prescriptionNumber}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(prescriptions[0].signedAt || prescriptions[0].createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Prescribed by <strong>Dr. {prescriptions[0].doctor?.name || 'Physician'}</strong>
                </p>

                {/* Real Medications List (Using rx.medications) */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {prescriptions[0].medications?.slice(0, 3).map((med, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between"
                    >
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 truncate">{med.medicineName}</p>
                        <p className="text-[10px] text-slate-500">
                          {med.dosage} • {med.frequency}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-teal-700 font-semibold shrink-0">
                        {med.duration}
                      </span>
                    </div>
                  ))}
                  {prescriptions[0].medications?.length > 3 && (
                    <p className="text-[11px] text-slate-500 text-center font-medium">
                      +{prescriptions[0].medications.length - 3} more medications
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">No active e-prescriptions on record</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <NavLink
              to="/patient-portal/prescriptions"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>View Prescriptions</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>

        {/* Real Billing / Balance Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Billing Summary</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                totalBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {totalBalance === 0 ? 'No Due Balance' : 'Balance Outstanding'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total Invoiced:</span>
                  <span className="font-semibold text-slate-800">₹{totalBilled.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-emerald-700">₹{totalPaid.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Balance Due:</span>
                  <span className={`text-base font-extrabold ${totalBalance > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    ₹{totalBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {invoices.length > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Latest Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {invoices[0].invoiceNumber} ({invoices[0].status})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <NavLink
              to="/patient-portal/bills"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>View Invoices & Receipts</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic & Radiology Reports Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lab Reports Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Laboratory Diagnostics</h3>
                <p className="text-[11px] text-slate-500">Pathology, biochemistry & hematology</p>
              </div>
            </div>
            <NavLink
              to="/patient-portal/lab-reports"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {labOrders.length > 0 ? (
            <div className="space-y-2.5">
              {labOrders.slice(0, 3).map((order) => (
                <div
                  key={order._id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {order.orderNumber}
                      </span>
                      {order.sampleBarcode && (
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                          {order.sampleBarcode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {order.tests?.map(t => t.testName).join(', ') || 'Diagnostic tests'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.overallStatus === 'Completed' || order.overallStatus === 'Verified' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.overallStatus}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-1.5">
              <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">No laboratory test orders recorded</p>
            </div>
          )}
        </div>

        {/* Radiology Imaging Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Radiology Imaging</h3>
                <p className="text-[11px] text-slate-500">X-Ray, CT Scan, MRI & Ultrasound</p>
              </div>
            </div>
            <NavLink
              to="/patient-portal/radiology-reports"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {radiologyOrders.length > 0 ? (
            <div className="space-y-2.5">
              {radiologyOrders.slice(0, 3).map((rad) => (
                <div
                  key={rad._id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {rad.modality} — {rad.bodyPart}
                      </span>
                      {rad.criticalFinding && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                          Critical Alert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate max-w-xs">
                      {rad.clinicalIndication || rad.impression || 'Diagnostic imaging'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rad.status === 'Report Finalized' || rad.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rad.status}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(rad.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-1.5">
              <Scan className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">No radiology imaging studies recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Quick Portal Access Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-sm text-slate-800 mb-4">Patient Portal Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[
            { path: '/patient-portal/profile', label: 'My Profile', icon: User, color: 'text-teal-600 bg-teal-50' },
            { path: '/patient-portal/appointments', label: 'Appointments', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
            { path: '/patient-portal/medical-history', label: 'Medical History', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
            { path: '/patient-portal/prescriptions', label: 'Prescriptions', icon: Pill, color: 'text-emerald-600 bg-emerald-50' },
            { path: '/patient-portal/lab-reports', label: 'Lab Reports', icon: FlaskConical, color: 'text-violet-600 bg-violet-50' },
            { path: '/patient-portal/radiology-reports', label: 'Radiology', icon: Scan, color: 'text-amber-600 bg-amber-50' },
            { path: '/patient-portal/bills', label: 'Bills & Receipts', icon: CreditCard, color: 'text-rose-600 bg-rose-50' },
            { path: '/patient-portal/discharge-summaries', label: 'Discharge Summaries', icon: FileCheck, color: 'text-cyan-600 bg-cyan-50' },
            { path: '/patient-portal/documents', label: 'Documents Vault', icon: FolderLock, color: 'text-slate-600 bg-slate-100' },
            { path: '/patient-portal/feedback', label: 'Feedback & Support', icon: MessageSquareQuote, color: 'text-teal-600 bg-teal-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-slate-50 transition-all flex flex-col items-center text-center gap-2 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
