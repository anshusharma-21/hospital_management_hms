import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  Search,
  ArrowRight
} from 'lucide-react';

export const AppointmentBooking = () => {
  const [searchParams] = useSearchParams();
  const preSelectedPatientId = searchParams.get('patientId');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { activeBranch, branch } = useAuth();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    slotTime: '10:00 AM',
    type: 'New Consultation',
    priority: 'Normal',
    reasonForVisit: '',
    consultationFee: 700
  });

  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState(null);

  // Available Time Slots
  const slotOptions = [
    { value: '09:00 AM', label: '09:00 AM' },
    { value: '09:30 AM', label: '09:30 AM' },
    { value: '10:00 AM', label: '10:00 AM' },
    { value: '10:30 AM', label: '10:30 AM' },
    { value: '11:00 AM', label: '11:00 AM' },
    { value: '11:30 AM', label: '11:30 AM' },
    { value: '02:00 PM', label: '02:00 PM' },
    { value: '02:30 PM', label: '02:30 PM' },
    { value: '03:00 PM', label: '03:00 PM' },
    { value: '03:30 PM', label: '03:30 PM' }
  ];

  useEffect(() => {
    // If patientId supplied via URL query
    if (preSelectedPatientId) {
      api.get(`/patients/${preSelectedPatientId}`).then((res) => {
        if (res.data.success) {
          setSelectedPatient(res.data.data);
        }
      });
    }

    // Load available doctors from staff directory
    loadDoctors();
  }, [preSelectedPatientId]);

  const loadDoctors = async () => {
    try {
      const userRes = await api.get('/auth/me');
      const tenantId = userRes.data.user?.tenant?._id || userRes.data.user?.tenant;
      if (tenantId) {
        const res = await api.get(`/tenants/${tenantId}/users`);
        if (res.data.success && Array.isArray(res.data.data)) {
          const docList = res.data.data.filter((u) => u.role === 'doctor');
          setDoctors(docList);
          if (docList.length > 0) {
            setFormData((prev) => ({
              ...prev,
              doctor: prev.doctor || docList[0]._id,
              consultationFee: prev.consultationFee || docList[0].doctorProfile?.consultationFee || 700
            }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load doctors for appointment booking:', err);
    }
  };

  // Search Patient
  const handleSearchPatient = async () => {
    if (!patientSearch.trim()) return;
    setPatientSearchLoading(true);
    try {
      const res = await api.get(`/patients?search=${encodeURIComponent(patientSearch.trim())}`);
      if (res.data.success) {
        setPatients(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPatientSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      addToast({
        title: 'Validation Error',
        message: 'Please select a registered patient first.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patient: selectedPatient._id,
        doctor: formData.doctor || (doctors.length > 0 ? doctors[0]._id : undefined),
        branch: activeBranch?._id || branch?._id || undefined,
        appointmentDate: formData.appointmentDate,
        slotTime: formData.slotTime,
        type: formData.type,
        priority: formData.priority,
        reasonForVisit: formData.reasonForVisit,
        consultationFee: formData.consultationFee
      };

      const bookingRes = await api.post('/appointments', payload);

      if (bookingRes.data.success) {
        setConfirmedAppt(bookingRes.data.data);
        addToast({
          title: 'Appointment Booked',
          message: `Token #${bookingRes.data.data.tokenNumber} assigned.`,
          type: 'success'
        });
      }
    } catch (err) {
      addToast({
        title: 'Booking Failed',
        message: err.response?.data?.error || 'Could not schedule appointment',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Book Patient Appointment</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Schedule specialist consultation, assign sequential token, and calculate visit fees
        </p>
      </div>

      {/* Step 1: Select Patient */}
      <Card title="1. Select Patient" headerIcon={User}>
        {selectedPatient ? (
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-teal-900">{selectedPatient.fullName}</span>
                <span className="font-mono text-xs font-bold bg-white text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                  {selectedPatient.uhid}
                </span>
              </div>
              <p className="text-xs text-teal-700">
                {selectedPatient.gender}, {selectedPatient.age} yrs • Mobile: {selectedPatient.phone}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedPatient(null)}>
              Change Patient
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search patient by UHID (e.g. HV-2026-0001), name, or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
              />
              <Button
                variant="secondary"
                size="md"
                icon={Search}
                isLoading={patientSearchLoading}
                onClick={handleSearchPatient}
              >
                Search
              </Button>
            </div>

            {patients.length > 0 && (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {patients.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatients([]);
                    }}
                    className="p-3 hover:bg-teal-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{p.fullName}</span>
                      <span className="ml-2 font-mono text-slate-500 font-medium">({p.uhid})</span>
                      <p className="text-[10px] text-slate-400">
                        {p.gender}, {p.age}y • {p.phone}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Step 2: Schedule & Clinical Details */}
      <form onSubmit={handleSubmit}>
        <Card title="2. Appointment Details & Schedule" headerIcon={Calendar}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Assigned Clinician"
              required
              value={formData.doctor}
              onChange={(e) => {
                const docId = e.target.value;
                const foundDoc = doctors.find((d) => d._id === docId);
                const docFee = foundDoc?.doctorProfile?.consultationFee || 700;
                setFormData({ ...formData, doctor: docId, consultationFee: docFee });
              }}
              options={
                doctors.length > 0
                  ? doctors.map((d) => ({
                      value: d._id,
                      label: `Dr. ${d.name}${d.doctorProfile?.specialization ? ` (${d.doctorProfile.specialization})` : ''}`
                    }))
                  : [
                      { value: '', label: 'Loading clinicians...' }
                    ]
              }
            />

            <Input
              label="Consultation Date"
              type="date"
              required
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            />

            <Select
              label="Preferred Slot"
              value={formData.slotTime}
              onChange={(e) => setFormData({ ...formData, slotTime: e.target.value })}
              options={slotOptions}
            />

            <Select
              label="Visit Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'New Consultation', label: 'New Consultation' },
                { value: 'Follow-up', label: 'Follow-up' },
                { value: 'Routine Checkup', label: 'Routine Checkup' },
                { value: 'Procedure', label: 'Procedure' },
                { value: 'Walk-in', label: 'Walk-in' }
              ]}
            />

            <Select
              label="Priority Triage"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'Normal', label: 'Normal' },
                { value: 'Urgent', label: 'Urgent' },
                { value: 'Senior Citizen', label: 'Senior Citizen' },
                { value: 'Emergency', label: 'Emergency' }
              ]}
            />

            <Input
              label="Consultation Fee (₹)"
              type="number"
              value={formData.consultationFee}
              onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
            />

            <div className="sm:col-span-3">
              <Input
                label="Reason for Visit / Chief Symptoms"
                placeholder="e.g. Chest discomfort on exertion, breathlessness since 2 days"
                value={formData.reasonForVisit}
                onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => navigate('/front-desk/dashboard')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Calendar}
              isLoading={submitting}
            >
              Confirm Booking & Generate Token
            </Button>
          </div>
        </Card>
      </form>

      {/* Confirmation Modal */}
      {confirmedAppt && (
        <Modal
          isOpen={!!confirmedAppt}
          onClose={() => setConfirmedAppt(null)}
          title="Appointment Confirmed"
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-md shadow-teal-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">OPD Live Token</p>
              <h3 className="text-4xl font-black text-teal-700 font-mono">
                #{confirmedAppt.tokenNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Slot: <strong>{confirmedAppt.slotTime}</strong> on{' '}
                {new Date(confirmedAppt.appointmentDate).toLocaleDateString()}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1 text-slate-600">
              <p>
                Patient: <strong>{confirmedAppt.patient?.fullName}</strong> ({confirmedAppt.patient?.uhid})
              </p>
              <p>
                Clinician: <strong>{confirmedAppt.doctor?.name || 'Assigned Physician'}</strong>
              </p>
              <p>
                Fee: <strong>₹{confirmedAppt.consultationFee}</strong> ({confirmedAppt.paymentStatus})
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setConfirmedAppt(null);
                  navigate('/front-desk/queue');
                }}
              >
                View in Live OPD Queue
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
