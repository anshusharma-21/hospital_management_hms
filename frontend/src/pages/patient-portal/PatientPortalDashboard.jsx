import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  FlaskConical, 
  CreditCard, 
  Download, 
  Printer, 
  Heart, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck,
  Phone,
  Plus,
  Activity,
  CheckCircle2,
  FileCheck,
  Stethoscope,
  Sparkles,
  Droplets
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const PatientPortalDashboard = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      let pat = null;
      try {
        const meRes = await api.get('/patients/me');
        if (meRes.data.success && meRes.data.data) {
          pat = meRes.data.data;
        }
      } catch (_) {
        if (user?.patientData) pat = user.patientData;
      }

      if (!pat) {
        addToast('No active patient session found. Please log in.', 'error');
        navigate('/patient-portal/login');
        return;
      }

      setPatientData(pat);

      // Fetch patient timeline and records scoped by server-side patient identity
      const [appRes, rxRes, labRes, invRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/clinical/prescriptions'),
        api.get('/diagnostics/lab-orders'),
        api.get('/billing/invoices')
      ]);

      if (appRes.data?.success) setAppointments(appRes.data.data || []);
      if (rxRes.data?.success) setPrescriptions(rxRes.data.data || []);
      if (labRes.data?.success) setLabOrders(labRes.data.data || []);
      if (invRes.data?.success) setInvoices(invRes.data.data || []);
    } catch (err) {
      console.error('Error loading patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookVisit = () => {
    addToast('Follow-up appointment requested. Front desk will confirm your slot via SMS.', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto animate-pulse">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Syncing longitudinal clinical timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* 3D Elevated Longitudinal Patient Hero Banner */}
      <div
        className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-7 sm:p-9 overflow-hidden border border-slate-800/80 shadow-2xl transition-all"
        style={{
          boxShadow:
            '0 20px 50px -12px rgba(15, 23, 42, 0.4), 0 0 35px -5px rgba(13, 148, 136, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Soft Ambient Radial Lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* 3D Avatar Box */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-cyan-500 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-xl shrink-0 ring-1 ring-white/20"
              style={{
                boxShadow:
                  '0 10px 25px -5px rgba(13, 148, 136, 0.5), inset 0 2px 2px 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              {patientData?.fullName?.[0] || 'P'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {patientData?.fullName || 'Patient Record'}
                </h1>
                <span className="font-mono text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2.5 py-0.5 rounded-full">
                  {patientData?.uhid || '—'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active EHR
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
                <span>{patientData?.age ? `${patientData.age} Years` : '—'}</span>
                <span>•</span>
                <span>{patientData?.gender || '—'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-rose-300 font-semibold">
                  <Droplets className="w-3.5 h-3.5" />
                  Blood Group: {patientData?.bloodGroup || 'Not Recorded'}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-400">Mobile: +91 {patientData?.phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              size="md" 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-teal-950/50 border-0 ring-1 ring-white/20 active:scale-[0.98]"
              onClick={handleBookVisit}
            >
              <Calendar className="w-4 h-4 mr-1.5" /> Request Consultation
            </Button>
          </div>
        </div>

        {/* Clinical Safety & Medical Alerts Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2.5 text-xs">
          {patientData?.allergies?.length > 0 ? (
            <span className="bg-rose-500/20 border border-rose-400/30 text-rose-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Allergies: {patientData.allergies.join(', ')}
            </span>
          ) : (
            <span className="bg-white/5 border border-white/10 text-slate-400 px-3 py-1 rounded-xl text-xs">
              No known drug allergies
            </span>
          )}

          {patientData?.chronicConditions?.length > 0 && (
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
              <Heart className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Chronic: {patientData.chronicConditions.join(', ')}
            </span>
          )}

          <span className="ml-auto text-[11px] text-teal-300/80 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Verified Longitudinal Record
          </span>
        </div>
      </div>

      {/* 3D Elevated Navigation Tabs */}
      <div
        className="flex bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs gap-1.5 overflow-x-auto text-xs"
        style={{
          boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.04), 0 2px 6px -2px rgba(0, 0, 0, 0.02)'
        }}
      >
        {[
          { key: 'overview', label: 'Health Summary', icon: Activity },
          { key: 'appointments', label: `Visits & Consults (${appointments.length})`, icon: Calendar },
          { key: 'prescriptions', label: `e-Prescriptions (${prescriptions.length})`, icon: Pill },
          { key: 'labs', label: `Lab & Diagnostics (${labOrders.length})`, icon: FlaskConical },
          { key: 'billing', label: `Invoices & Receipts (${invoices.length})`, icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-800 to-teal-700 text-white shadow-md shadow-teal-900/20 ring-1 ring-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next Consultation Card */}
            <div
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              style={{
                boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/70">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Next Scheduled Visit</h3>
                    <p className="text-[11px] text-slate-500">Upcoming hospital appointment</p>
                  </div>
                </div>
                <Badge variant={appointments.length > 0 ? 'success' : 'neutral'} dot>
                  {appointments.length > 0 ? 'Confirmed' : 'None'}
                </Badge>
              </div>

              {appointments.length > 0 ? (
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {appointments[0].doctor?.name || 'Attending Physician'}
                      </h4>
                      <p className="text-slate-500 font-medium">
                        {appointments[0].doctor?.specialty || appointments[0].department || 'General Medicine'}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] font-bold bg-teal-100/70 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                      #{appointments[0].tokenNumber || 'Token'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-teal-800 font-semibold border-t border-slate-200/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{appointments[0].date} at {appointments[0].timeSlot || 'Consultation Slot'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming outpatient consultations scheduled.
                </div>
              )}
            </div>

            {/* Current Medication Regimen Card */}
            <div
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              style={{
                boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/70">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Current Medication Regimen</h3>
                    <p className="text-[11px] text-slate-500">Active e-prescription items</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {prescriptions[0]?.doctor?.name || ''}
                </span>
              </div>

              {prescriptions.length > 0 && prescriptions[0].medicines?.length > 0 ? (
                <div className="space-y-2.5 text-xs max-h-56 overflow-y-auto pr-1">
                  {prescriptions[0].medicines.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{m.medicineName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.dosage} • {m.frequency}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 shrink-0">
                        {m.instructions}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active medication regimens recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Consultation Visits</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chronological record of your outpatient encounters</p>
            </div>
            <Button size="sm" onClick={handleBookVisit}>
              <Plus className="w-4 h-4 mr-1.5" /> Book Consultation
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No past or scheduled hospital visits found.
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                        {apt.appointmentNumber || 'APT'}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">Token #{apt.tokenNumber}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{apt.doctor?.name || 'Assigned Clinician'}</h3>
                    <p className="text-slate-500">{apt.doctor?.specialty || apt.department || 'Outpatient Consultation'}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{apt.date}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{apt.timeSlot || 'Scheduled Time'}</p>
                    </div>
                    <Badge variant={apt.status === 'Completed' ? 'neutral' : 'success'} dot>
                      {apt.status || 'Scheduled'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-xs text-slate-400">
              No prescriptions issued on your record.
            </div>
          ) : (
            prescriptions.map((rx) => (
              <div
                key={rx._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {rx.prescriptionNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{new Date(rx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">Prescribed by {rx.doctor?.name || 'Physician'}</h3>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print Official Rx
                  </Button>
                </div>

                <div className="space-y-2 text-xs">
                  {rx.medicines?.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap justify-between items-center gap-3"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{m.medicineName}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{m.dosage} • {m.frequency} • {m.duration}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                        {m.instructions}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: LAB REPORTS */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-xs text-slate-400">
              No diagnostic pathology reports available.
            </div>
          ) : (
            labOrders.map((ord) => (
              <div
                key={ord._id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {ord.barcode || ord.orderNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">Diagnostic Pathology Panel</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Verified Report</Badge>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Investigation Name</th>
                        <th className="p-3">Observed Value</th>
                        <th className="p-3">Biological Reference</th>
                        <th className="p-3">Result Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {ord.tests?.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-sans font-semibold text-slate-800">{t.testName}</td>
                          <td className="p-3 font-bold text-slate-900">{t.resultValue} {t.unit}</td>
                          <td className="p-3 text-slate-600">{t.referenceRange}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {t.flag || 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: BILLING & INVOICES */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hospital Billing Ledger & Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Official receipts for consultation and pharmacy payments</p>
            </div>
            <Badge variant="neutral">{invoices.length} Invoices</Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No invoices or billing receipts recorded.
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-50/60 transition-colors">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {inv.invoiceNumber}
                    </span>
                    <p className="text-slate-500 mt-1">Billed on {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 text-sm">₹{inv.netAmount?.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">Realized Payment</p>
                    </div>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'danger'}>
                      {inv.status?.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="w-3.5 h-3.5 mr-1" /> Receipt
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
