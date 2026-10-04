import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Search,
  User,
  Phone,
  Calendar,
  ArrowRight,
  UserPlus,
  FileText,
  CreditCard,
  Pill,
  FlaskConical,
  Building,
  Activity
} from 'lucide-react';

export const GlobalSearchModal = ({ isOpen, onClose, onSelectPatient }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({
    patients: [],
    appointments: [],
    users: [],
    invoices: [],
    medicines: [],
    labOrders: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ patients: [], appointments: [], users: [], invoices: [], medicines: [], labOrders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success && res.data.results) {
          setResults(res.data.results);
        } else {
          // Fallback to patient search
          const patientRes = await api.get(`/patients?search=${encodeURIComponent(query.trim())}`);
          if (patientRes.data.success) {
            setResults({
              patients: patientRes.data.data,
              appointments: [],
              users: [],
              invoices: [],
              medicines: [],
              labOrders: []
            });
          }
        }
      } catch (err) {
        // Fallback to patient search on error
        try {
          const patientRes = await api.get(`/patients?search=${encodeURIComponent(query.trim())}`);
          if (patientRes.data.success) {
            setResults({
              patients: patientRes.data.data,
              appointments: [],
              users: [],
              invoices: [],
              medicines: [],
              labOrders: []
            });
          }
        } catch (_) {}
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPatient = (patient) => {
    onClose();
    if (onSelectPatient) {
      onSelectPatient(patient);
    } else {
      navigate(`/patients/${patient._id}`);
    }
  };

  const handleRegisterNew = () => {
    onClose();
    navigate('/patients/register');
  };

  const totalResults =
    (results.patients?.length || 0) +
    (results.appointments?.length || 0) +
    (results.users?.length || 0) +
    (results.invoices?.length || 0) +
    (results.medicines?.length || 0) +
    (results.labOrders?.length || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Hospital Search"
      subtitle="Search across Patients, Appointments, Staff, Invoices, Medicines, and Diagnostics"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <Input
          autoFocus
          icon={Search}
          placeholder="Search UHID, patient name, phone, invoice #, medicine, or staff..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* Category Tabs */}
        {totalResults > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-100">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'all' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({totalResults})
            </button>
            {results.patients?.length > 0 && (
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'patients' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Patients ({results.patients.length})
              </button>
            )}
            {results.appointments?.length > 0 && (
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'appointments' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Appointments ({results.appointments.length})
              </button>
            )}
            {results.invoices?.length > 0 && (
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'invoices' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Invoices ({results.invoices.length})
              </button>
            )}
            {results.medicines?.length > 0 && (
              <button
                onClick={() => setActiveTab('medicines')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'medicines' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Medicines ({results.medicines.length})
              </button>
            )}
            {results.labOrders?.length > 0 && (
              <button
                onClick={() => setActiveTab('labOrders')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'labOrders' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Lab ({results.labOrders.length})
              </button>
            )}
            {results.users?.length > 0 && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'users' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Staff ({results.users.length})
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Searching records across modules...</div>
        ) : totalResults > 0 ? (
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {/* Patients List */}
            {(activeTab === 'all' || activeTab === 'patients') && results.patients?.map((p) => (
              <div
                key={p._id}
                onClick={() => handleSelectPatient(p)}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-bold text-xs text-slate-800 group-hover:text-teal-700">
                      {p.firstName} {p.lastName || ''}
                    </span>
                    <Badge variant="primary" size="sm">{p.uhid}</Badge>
                    <span className="text-[11px] text-slate-500">{p.gender}, {p.age} yrs</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pl-5.5">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{p.phone}</span>
                    {p.bloodGroup && <span className="text-[10px] text-rose-600 font-semibold">{p.bloodGroup}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-teal-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Open Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}

            {/* Appointments List */}
            {(activeTab === 'all' || activeTab === 'appointments') && results.appointments?.map((a) => (
              <div
                key={a._id}
                onClick={() => { onClose(); navigate('/appointments/calendar'); }}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold text-xs text-slate-800">{a.appointmentNumber || 'Appointment'}</span>
                    <Badge variant="outline" size="sm">{a.status}</Badge>
                    {a.patient && (
                      <span className="text-xs text-slate-600 font-medium">
                        Patient: {a.patient.firstName} {a.patient.lastName || ''} ({a.patient.uhid})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 pl-5.5">{a.reason || 'Routine Consultation'}</p>
                </div>
                <span className="text-indigo-600 text-xs font-bold opacity-0 group-hover:opacity-100">Calendar →</span>
              </div>
            ))}

            {/* Invoices List */}
            {(activeTab === 'all' || activeTab === 'invoices') && results.invoices?.map((inv) => (
              <div
                key={inv._id}
                onClick={() => { onClose(); navigate('/billing/invoices'); }}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-800">{inv.invoiceNumber}</span>
                    <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'} size="sm">{inv.status}</Badge>
                    {inv.patient && (
                      <span className="text-xs text-slate-600">
                        {inv.patient.firstName} {inv.patient.lastName || ''} ({inv.patient.uhid})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pl-5.5">
                    <span>Total: ₹{inv.grandTotal?.toLocaleString('en-IN')}</span>
                    <span>Paid: ₹{inv.paidAmount?.toLocaleString('en-IN')}</span>
                    <span className="font-bold text-slate-700">Due: ₹{inv.balanceDue?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-bold opacity-0 group-hover:opacity-100">View Invoice →</span>
              </div>
            ))}

            {/* Medicines List */}
            {(activeTab === 'all' || activeTab === 'medicines') && results.medicines?.map((med) => (
              <div
                key={med._id}
                onClick={() => { onClose(); navigate('/pharmacy/inventory'); }}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Pill className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold text-xs text-slate-800">{med.name}</span>
                    <Badge variant="outline" size="sm">{med.dosageForm || 'Medicine'}</Badge>
                    <span className="text-xs text-slate-500">Generic: {med.genericName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pl-5.5">
                    <span>Stock: <strong className="text-slate-800">{med.stockQuantity}</strong> units</span>
                    <span>MRP: ₹{med.mrp}</span>
                  </div>
                </div>
                <span className="text-amber-600 text-xs font-bold opacity-0 group-hover:opacity-100">Inventory →</span>
              </div>
            ))}

            {/* Lab Orders List */}
            {(activeTab === 'all' || activeTab === 'labOrders') && results.labOrders?.map((lab) => (
              <div
                key={lab._id}
                onClick={() => { onClose(); navigate('/diagnostics/lab'); }}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-cyan-400 hover:bg-cyan-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="font-bold text-xs text-slate-800">{lab.orderNumber}</span>
                    <Badge variant="outline" size="sm">{lab.overallStatus}</Badge>
                    {lab.sampleBarcode && <Badge variant="primary" size="sm">{lab.sampleBarcode}</Badge>}
                  </div>
                  {lab.patient && (
                    <p className="text-xs text-slate-500 pl-5.5">
                      Patient: {lab.patient.firstName} {lab.patient.lastName || ''} ({lab.patient.uhid})
                    </p>
                  )}
                </div>
                <span className="text-cyan-600 text-xs font-bold opacity-0 group-hover:opacity-100">Lab Orders →</span>
              </div>
            ))}

            {/* Users / Staff List */}
            {(activeTab === 'all' || activeTab === 'users') && results.users?.map((u) => (
              <div
                key={u._id}
                onClick={() => { onClose(); navigate('/hospital/users'); }}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-bold text-xs text-slate-800">{u.name}</span>
                    <Badge variant="outline" size="sm">{u.role}</Badge>
                    {u.department && <span className="text-xs text-slate-500">Dept: {u.department}</span>}
                  </div>
                  <p className="text-xs text-slate-500 pl-5.5">{u.email}</p>
                </div>
                <span className="text-purple-600 text-xs font-bold opacity-0 group-hover:opacity-100">Directory →</span>
              </div>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-slate-500">No matching records found for "{query}"</p>
            <Button variant="outline" size="sm" icon={UserPlus} onClick={handleRegisterNew}>
              Register New Patient
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Start typing above to search patients, appointments, medicines, invoices, lab orders, or staff.
          </div>
        )}
      </div>
    </Modal>
  );
};

