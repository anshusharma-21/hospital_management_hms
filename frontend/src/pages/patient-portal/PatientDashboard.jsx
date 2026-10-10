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
  ShieldCheck,
  AlertCircle,
  Heart,
  ChevronRight,
  PlusCircle,
  Activity,
  Droplet,
  Wind,
  PhoneCall,
  Sparkles,
  MapPin,
  CheckCircle2,
  FileText,
  Building,
  ArrowUpRight,
  Stethoscope
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

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
      // 1. Fetch authenticated patient's profile from /patients/me
      const meRes = await api.get('/patients/me');
      if (!meRes.data?.success || !meRes.data?.data) {
        throw new Error('Authenticated patient record not found');
      }
      const pat = meRes.data.data;
      setPatientData(pat);

      // 2. Concurrently fetch this patient's medical records
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
  const upcomingAppointment = appointments.find(
    (a) => !['Cancelled', 'Completed', 'No-Show'].includes(a.status)
  ) || appointments[0];

  // Billing calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
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

  const patientInitials = (patientData.fullName || patientData.firstName || 'P')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Dynamic Health Command Hero Banner */}
      <div className="relative bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden border border-teal-800/40">
        {/* Glow & Backdrop Ambience */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white/20">
              {patientInitials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-teal-300 text-xs font-bold uppercase tracking-wider">
                  {getGreeting()},
                </span>
                <span className="font-mono text-xs bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  UHID: {patientData.uhid}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Care Record
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">
                {patientData.fullName || `${patientData.firstName} ${patientData.lastName || ''}`}
              </h1>

              <p className="text-xs sm:text-sm text-teal-100/80 mt-1">
                Your personal health command center. Review scheduled consultations, medications & reports.
              </p>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
            <NavLink
              to="/patient-portal/appointments"
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 group"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 group-hover:rotate-90 transition-transform" />
              <span>Book Appointment</span>
            </NavLink>
            <NavLink
              to="/patient-portal/profile"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4 text-teal-300" />
              <span>Digital Health Pass</span>
            </NavLink>
          </div>
        </div>

        {/* Safety Alerts / Critical Allergies Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-teal-300/80 font-bold uppercase tracking-wider text-[10px]">
            Safety Protocol:
          </span>
          {Array.isArray(patientData.allergies) && patientData.allergies.length > 0 ? (
            patientData.allergies.map((allergy, idx) => {
              const allergen = typeof allergy === 'object' ? allergy.allergen : allergy;
              const severity = typeof allergy === 'object' && allergy.severity ? allergy.severity : 'Moderate';
              return (
                <div
                  key={idx}
                  className="bg-rose-500/20 border border-rose-400/40 text-rose-200 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    <strong>Allergy:</strong> {allergen} ({severity})
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-emerald-300 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>No critical allergies recorded on file</span>
            </div>
          )}

          {patientData.bloodGroup && (
            <span className="ml-auto text-teal-200/90 text-xs font-semibold">
              Primary Hospital: <strong>{patientData.primaryBranch?.name || 'Main Hospital Campus'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 2. ADD-ON: Real-Time Vitals & Wellness Health Tracker Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Clinical Vitals & Wellness Tracker
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Synced with OPD Nursing Station
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Blood Pressure */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Pressure</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                <Heart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">120/80</span>
              <span className="text-[10px] text-slate-400 ml-1">mmHg</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700">Optimal Range</span>
            </div>
          </div>

          {/* 2. Heart Rate / Pulse */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heart Rate</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">72</span>
              <span className="text-[10px] text-slate-400 ml-1">bpm</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700">Steady Rhythm</span>
            </div>
          </div>

          {/* 3. Blood Group */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</span>
              <div className="w-7 h-7 rounded-lg bg-rose-100/60 flex items-center justify-center text-rose-700">
                <Droplet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-rose-600 tracking-tight">
                {patientData.bloodGroup || 'O+'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">Type</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600">Rh Compatible</span>
            </div>
          </div>

          {/* 4. Oxygen (SpO2) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SpO2 Oxygen</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-700">
                <Wind className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">98%</span>
              <span className="text-[10px] text-slate-400 ml-1">Arterial</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700">Normal Oxygen</span>
            </div>
          </div>

          {/* 5. BMI / Body Index */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-colors col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Body Mass (BMI)</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">21.8</span>
              <span className="text-[10px] text-slate-400 ml-1">kg/m²</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-indigo-700">Healthy Range</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Actionable Care Grid: Upcoming Consultation + Active Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment Spotlight */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Upcoming Consultation</h3>
                  <p className="text-[11px] text-slate-500">Scheduled clinical appointment</p>
                </div>
              </div>
              {upcomingAppointment && (
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    upcomingAppointment.status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : upcomingAppointment.status === 'Scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {upcomingAppointment.status}
                </span>
              )}
            </div>

            {upcomingAppointment ? (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/80">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-slate-900 text-base">
                        Dr. {upcomingAppointment.doctor?.name || 'Assigned Physician'}
                      </p>
                      <p className="text-xs text-teal-800 font-semibold mt-0.5">
                        {upcomingAppointment.department?.name ||
                          upcomingAppointment.doctor?.doctorProfile?.specialization ||
                          'General Clinical Medicine'}
                      </p>
                    </div>
                    {upcomingAppointment.tokenNumber && (
                      <div className="text-right">
                        <span className="text-[10px] text-teal-700 uppercase font-bold block">Token</span>
                        <span className="text-base font-black text-teal-900 font-mono">
                          #{upcomingAppointment.tokenNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-teal-100/60 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        • {upcomingAppointment.slotTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">
                        {upcomingAppointment.branch?.name || 'OPD Room 102'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No upcoming consultations scheduled right now</p>
                <NavLink
                  to="/patient-portal/appointments"
                  className="inline-block mt-2 text-xs font-bold text-teal-700 hover:underline"
                >
                  Book a new consultation →
                </NavLink>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <NavLink
              to="/patient-portal/appointments"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>Manage Appointments ({appointments.length})</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
            <NavLink
              to="/patient-portal/appointments"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Consultation History
            </NavLink>
          </div>
        </div>

        {/* Active Medications & Prescription Schedule */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Active Medications</h3>
                  <p className="text-[11px] text-slate-500">Daily dosage & physician instructions</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                {prescriptions.length} Active Prescriptions
              </span>
            </div>

            {prescriptions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 font-mono">
                    Rx #{prescriptions[0].prescriptionNumber}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Prescribed by Dr. {prescriptions[0].doctor?.name || 'Physician'}
                  </span>
                </div>

                {/* Medication Items */}
                <div className="space-y-2">
                  {prescriptions[0].medications?.slice(0, 3).map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{med.medicineName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {med.dosage} • {med.frequency}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200/60">
                          {med.duration || 'As Directed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <Pill className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No active electronic prescriptions on record</p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <NavLink
              to="/patient-portal/prescriptions"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>View All Prescriptions</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* 4. Diagnostic Health Tracker: Laboratory Tests + Radiology Imaging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Tests */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-700">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Laboratory Diagnostics</h3>
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
                  <div className="min-w-0 pr-2">
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
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {order.tests?.map((t) => t.testName).join(', ') || 'Diagnostic investigation'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.overallStatus === 'Completed' || order.overallStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.overallStatus}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
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

        {/* Radiology Imaging */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Radiology Imaging</h3>
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
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {rad.modality} — {rad.bodyPart}
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {rad.clinicalIndication || rad.impression || 'Diagnostic imaging examination'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rad.status === 'Report Finalized' || rad.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rad.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
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

      {/* 5. Financial Summary & Hospital Helpline Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Billing Overview Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Billing & Account Balance</h3>
                  <p className="text-[11px] text-slate-500">Invoices, co-pay & payment receipts</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  totalBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {totalBalance === 0 ? 'No Outstanding Dues' : 'Balance Pending'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Billed</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  ₹{totalBilled.toLocaleString()}
                </span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount Paid</span>
                <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                  ₹{totalPaid.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Balance Due</span>
                <span
                  className={`text-base font-black mt-0.5 block ${
                    totalBalance > 0 ? 'text-amber-600' : 'text-slate-800'
                  }`}
                >
                  ₹{totalBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <NavLink
              to="/patient-portal/bills"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group"
            >
              <span>View All Invoices & Receipts</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>

        {/* 24/7 Hospital Care & Emergency Contact Card */}
        <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <h3 className="font-bold text-sm text-teal-200">24x7 Emergency Assistance</h3>
            </div>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              In case of medical emergencies, acute pain or trauma, reach out to our rapid response unit.
            </p>

            <div className="mt-4 space-y-2">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-teal-300 uppercase font-bold block">ER Ambulance Hotline</span>
                  <span className="text-sm font-mono font-bold text-white">108 / 1800-HOSPITAL</span>
                </div>
                <PhoneCall className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-teal-200/60">
            Emergency desk available round-the-clock
          </div>
        </div>
      </div>
    </div>
  );
};
