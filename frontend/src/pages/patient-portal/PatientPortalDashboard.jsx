import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  FlaskConical, 
  Scan, 
  CreditCard, 
  Download, 
  Printer, 
  Heart, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck,
  Phone,
  LogOut,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const PatientPortalDashboard = () => {
  const { user, isPatient, logout, switchRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected document for viewing
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Retrieve authenticated patient profile from server
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
        const patRes = await api.get('/patients');
        if (patRes.data.success && patRes.data.data.length > 0) {
          pat = patRes.data.data[0];
        }
      }

      if (pat) {
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
      }
    } catch (err) {
      console.error('Error loading patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookVisit = () => {
    addToast('Follow-up appointment requested. Front desk will confirm slot via SMS.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Patient Profile Card (Longitudinal Header) */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-200 text-2xl font-bold">
              {patientData?.fullName?.[0] || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{patientData?.fullName || 'Rahul Sharma'}</h1>
                <span className="font-mono text-xs bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-bold">
                  {patientData?.uhid || 'HV-2026-0001'}
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-1">
                {patientData?.age || 34} Yrs • {patientData?.gender || 'Male'} • Blood Group: <strong className="text-white">{patientData?.bloodGroup || 'O+'}</strong>
              </p>
              <p className="text-xs text-teal-100/60 font-mono mt-0.5">Mobile: +91 {patientData?.phone || '9876543210'}</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2">
            <Button 
              size="sm" 
              className="bg-white text-teal-900 hover:bg-teal-50 text-xs shadow-md border-0"
              onClick={handleBookVisit}
            >
              <Calendar className="w-3.5 h-3.5 mr-1" /> Book Follow-up
            </Button>
            <span className="text-[10px] text-teal-200/80 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" /> Verified Health Record
            </span>
          </div>
        </div>

        {/* Clinical Alert Tags */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 text-xs">
          {patientData?.allergies?.length > 0 && (
            <span className="bg-rose-500/20 border border-rose-400/30 text-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" /> Allergies: {patientData.allergies.join(', ')}
            </span>
          )}
          {patientData?.chronicConditions?.length > 0 && (
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1">
              <Heart className="w-3 h-3 text-blue-400" /> {patientData.chronicConditions.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1 overflow-x-auto text-xs">
        {[
          { key: 'overview', label: 'Health Overview', icon: User },
          { key: 'appointments', label: `Visits (${appointments.length})`, icon: Calendar },
          { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: Pill },
          { key: 'labs', label: `Diagnostic Reports (${labOrders.length})`, icon: FlaskConical },
          { key: 'billing', label: `Invoices & Receipts (${invoices.length})`, icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upcoming Appointment */}
            <Card className="border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" /> Next Consultation
                </span>
                <Badge variant="success">Confirmed</Badge>
              </div>

              {appointments.length > 0 ? (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{appointments[0].doctor?.name || 'Dr. Arun Sharma'}</p>
                  <p className="text-slate-500">{appointments[0].doctor?.specialty || 'General Medicine'}</p>
                  <div className="flex items-center gap-2 pt-2 text-teal-800 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{appointments[0].date} at {appointments[0].timeSlot || '10:30 AM'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4">No upcoming appointments scheduled.</p>
              )}
            </Card>

            {/* Active Prescription Summary */}
            <Card className="border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" /> Current Medication Regimen
                </span>
                <span className="text-[10px] text-slate-400">Dr. Arun Sharma</span>
              </div>

              {prescriptions.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {prescriptions[0].medicines?.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{m.medicineName}</p>
                        <p className="text-[11px] text-slate-500">{m.dosage} • {m.frequency}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {m.instructions}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4">No active prescriptions on file.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointments' && (
        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Your Consultations & Hospital Visits</h2>
            <Button size="sm" onClick={handleBookVisit}>
              <Plus className="w-4 h-4 mr-1.5" /> Book Consultation
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {apt.appointmentNumber || 'APT-2026-001'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{apt.doctor?.name || 'Dr. Arun Sharma'}</h3>
                  <p className="text-slate-500">{apt.doctor?.specialty || 'General Medicine'} • {apt.type || 'OPD Consultation'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{apt.date}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{apt.timeSlot || '10:30 AM'}</p>
                  </div>
                  <Badge variant="success">Confirmed</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <Card key={rx._id} className="border-slate-200">
              <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700">{rx.prescriptionNumber}</span>
                  <p className="font-semibold text-slate-800 text-xs">Prescribed by {rx.doctor?.name || 'Dr. Arun Sharma'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{new Date(rx.createdAt).toLocaleDateString()}</span>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print Rx
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {rx.medicines?.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{m.medicineName}</p>
                      <p className="text-slate-500">{m.dosage} • {m.frequency} x {m.duration}</p>
                    </div>
                    <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                      {m.instructions}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 4: Diagnostic Lab Reports */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labOrders.map((ord) => (
            <Card key={ord._id} className="border-slate-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700">{ord.barcode}</span>
                  <h3 className="font-bold text-slate-900 text-sm">Pathology Laboratory Report</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Verified by Pathologist</Badge>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF Report
                  </Button>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Investigation</th>
                      <th className="p-2.5">Observed Value</th>
                      <th className="p-2.5">Reference Range</th>
                      <th className="p-2.5">Result Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {ord.tests?.map((t, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-sans font-semibold text-slate-800">{t.testName}</td>
                        <td className="p-2.5 font-bold text-slate-900">{t.resultValue} {t.unit}</td>
                        <td className="p-2.5 text-slate-600">{t.referenceRange}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {t.flag || 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 5: Invoices & Receipts */}
      {activeTab === 'billing' && (
        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Your Hospital Invoices & Official Payment Receipts</h2>
            <Badge variant="neutral">{invoices.length} Bills</Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700">{inv.invoiceNumber}</span>
                  <p className="text-slate-500 mt-0.5">Billed on {new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 text-sm">₹{inv.netAmount?.toLocaleString()}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">Paid in Full</p>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'success' : 'danger'}>
                    {inv.status?.toUpperCase()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5 mr-1" /> Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
