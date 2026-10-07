import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Table } from '../../components/ui/Table';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Activity,
  BedDouble,
  CreditCard,
  FlaskConical,
  Scan,
  AlertTriangle,
  History,
  Shield,
  ArrowRight,
  Plus
} from 'lucide-react';

export const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/patients/${id}/timeline`);
        if (res.data.success) {
          setPatient(res.data.patient);
          setTimeline(res.data.timeline || []);
          setAggregates(res.data.aggregates || {});
        }
      } catch (err) {
        console.error('Failed to load patient longitudinal timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading longitudinal patient records...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Patient record not found.
      </div>
    );
  }

  const tabsConfig = [
    { id: 'timeline', label: 'Longitudinal Timeline', count: timeline.length, icon: History },
    { id: 'encounters', label: 'Encounters', count: aggregates.totalEncounters, icon: Stethoscope },
    { id: 'prescriptions', label: 'e-Prescriptions', count: aggregates.totalPrescriptions, icon: FileText },
    { id: 'diagnostics', label: 'Diagnostics (Lab/Rad)', count: aggregates.totalLabOrders, icon: FlaskConical },
    { id: 'billing', label: 'Billing & Payments', count: aggregates.totalInvoices, icon: CreditCard }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
              {patient.fullName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{patient.fullName}</h1>
                <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200">
                  {patient.uhid}
                </span>
                <Badge variant={patient.status === 'active' ? 'success' : 'neutral'} size="sm" dot>
                  {patient.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                <span>
                  {patient.gender}, {patient.age} yrs • DOB: {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
                </span>
                <span>•</span>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                  Blood Group: {patient.bloodGroup || 'Unknown'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </span>
                {patient.address?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {patient.address.city}, {patient.address.state}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              icon={Calendar}
              onClick={() => navigate(`/appointments/book?patientId=${patient._id}`)}
            >
              Book Appointment
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Stethoscope}
              onClick={() => navigate(`/clinical/consultation?patientId=${patient._id}`)}
            >
              Start Encounter
            </Button>
          </div>
        </div>

        {/* Clinical Alert Banners */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {patient.allergies?.length > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Allergies:</strong> {patient.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">No drug allergies recorded</span>
          )}

          {patient.chronicConditions?.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
              <Activity className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Chronic Conditions:</strong> {patient.chronicConditions.join(', ')}
              </span>
            </div>
          )}

          {patient.insuranceDetails?.provider && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Insurance:</strong> {patient.insuranceDetails.provider} (Policy: {patient.insuranceDetails.policyNumber || 'Active'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {/* Tab 1: Longitudinal Timeline */}
      {activeTab === 'timeline' && (
        <Card title="Connected Longitudinal Health Timeline" headerIcon={History}>
          {timeline.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">No medical events recorded yet for this patient.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((event, idx) => {
                const iconColor =
                  event.type === 'APPOINTMENT'
                    ? 'bg-blue-500'
                    : event.type === 'ENCOUNTER'
                    ? 'bg-teal-500'
                    : event.type === 'PRESCRIPTION'
                    ? 'bg-purple-500'
                    : event.type === 'LAB_ORDER'
                    ? 'bg-orange-500'
                    : event.type === 'RADIOLOGY'
                    ? 'bg-indigo-500'
                    : event.type === 'ADMISSION'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500';

                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${iconColor}`}
                    />
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex-1 hover:bg-slate-100/60 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-slate-800">{event.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{event.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Encounters */}
      {activeTab === 'encounters' && (
        <Card title="Clinical Consultation Encounters" headerIcon={Stethoscope}>
          <div className="space-y-3">
            {timeline
              .filter((e) => e.type === 'ENCOUNTER')
              .map((enc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{enc.title}</h4>
                    <span className="text-xs text-slate-400">{new Date(enc.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600">{enc.details}</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <Card title="Historical e-Prescriptions" headerIcon={FileText}>
          <div className="space-y-3">
            {timeline
              .filter((e) => e.type === 'PRESCRIPTION')
              .map((rx, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{rx.title}</h4>
                    <span className="text-xs text-slate-400">{new Date(rx.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600">{rx.details}</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Tab 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <Card title="Laboratory & Radiology Requisitions" headerIcon={FlaskConical}>
          <div className="space-y-3">
            {timeline
              .filter((e) => e.type === 'LAB_ORDER' || e.type === 'RADIOLOGY')
              .map((diag, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{diag.title}</h4>
                    <Badge variant={diag.meta?.critical ? 'danger' : 'neutral'} size="sm">
                      {diag.meta?.critical ? 'CRITICAL ALERT' : 'ROUTINE'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{diag.details}</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Tab 5: Billing */}
      {activeTab === 'billing' && (
        <Card title="Financial Ledger & Invoices" headerIcon={CreditCard}>
          <div className="space-y-3">
            {timeline
              .filter((e) => e.type === 'BILLING')
              .map((bill, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{bill.title}</h4>
                    <Badge variant={bill.status === 'Fully Paid' ? 'success' : 'warning'} size="sm">
                      {bill.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{bill.details}</p>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
