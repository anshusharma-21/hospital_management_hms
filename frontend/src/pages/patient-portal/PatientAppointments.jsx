import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  X,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientAppointments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    departmentId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    slotTime: '10:00 AM',
    reasonForVisit: '',
    type: 'New Consultation'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      if (res.data?.success) {
        setAppointments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      addToast('Could not load appointment records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = async () => {
    setIsBookingOpen(true);
    setLoadingDoctors(true);
    try {
      const res = await api.get('/users?role=doctor');
      if (res.data?.success) {
        setDoctors(res.data.data || []);
        if (res.data.data?.length > 0) {
          setBookingForm(prev => ({
            ...prev,
            doctorId: res.data.data[0]._id,
            departmentId: res.data.data[0].department?._id || ''
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load doctors list:', err);
      addToast('Could not load available doctors', 'error');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDoctorChange = (doctorId) => {
    const selectedDoc = doctors.find(d => d._id === doctorId);
    setBookingForm(prev => ({
      ...prev,
      doctorId,
      departmentId: selectedDoc?.department?._id || ''
    }));
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.doctorId || !bookingForm.appointmentDate) {
      addToast('Please select a doctor and date', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        doctor: bookingForm.doctorId,
        department: bookingForm.departmentId || undefined,
        appointmentDate: bookingForm.appointmentDate,
        slotTime: bookingForm.slotTime,
        reasonForVisit: bookingForm.reasonForVisit || 'Patient Portal Consultation Request',
        type: bookingForm.type
      };

      const res = await api.post('/appointments', payload);
      if (res.data?.success) {
        addToast(`Appointment scheduled successfully! Token #${res.data.data.tokenNumber}`, 'success');
        setIsBookingOpen(false);
        fetchAppointments();
      } else {
        addToast(res.data?.error || 'Booking failed', 'error');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      addToast(err.response?.data?.error || 'Appointment booking failed. Please try another slot.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Partition into upcoming and past
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingList = appointments.filter(a => {
    const d = new Date(a.appointmentDate);
    return !['Completed', 'Cancelled'].includes(a.status) && d >= now;
  });

  const pastList = appointments.filter(a => {
    const d = new Date(a.appointmentDate);
    return ['Completed', 'Cancelled'].includes(a.status) || d < now;
  });

  const currentDisplayList = activeTab === 'upcoming' ? upcomingList : pastList;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Confirmed</span>;
      case 'Scheduled':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Scheduled</span>;
      case 'Completed':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>;
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Appointments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View scheduled visits and book direct consultations with hospital specialists
          </p>
        </div>
        <button
          onClick={openBookingModal}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'upcoming' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Upcoming & Active ({upcomingList.length})</span>
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'past' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Past Visits ({pastList.length})</span>
          {activeTab === 'past' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
        </div>
      ) : currentDisplayList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No {activeTab} appointments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'upcoming' 
              ? 'You do not have any upcoming consultations scheduled. Book an appointment with our specialist physicians.'
              : 'You do not have any past appointment records on file.'}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={openBookingModal}
              className="mt-2 px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentDisplayList.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Dr. {appt.doctor?.name || 'Physician'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {appt.department?.name || appt.doctor?.doctorProfile?.specialization || 'Consultation'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(appt.status)}
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-semibold">
                    {new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{appt.slotTime}</span>
                </div>
                {appt.tokenNumber && (
                  <div className="col-span-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Token Number:</span>
                    <span className="font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Token #{appt.tokenNumber}
                    </span>
                  </div>
                )}
                {appt.branch?.name && (
                  <div className="col-span-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Branch: {appt.branch.name}</span>
                  </div>
                )}
              </div>

              {appt.reasonForVisit && (
                <p className="text-xs text-slate-600 italic px-1">
                  "{appt.reasonForVisit}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Book Specialist Consultation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Linked directly to your patient health record</p>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Specialist Physician
                </label>
                {loadingDoctors ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 animate-pulse">
                    Loading doctors directory...
                  </div>
                ) : (
                  <select
                    value={bookingForm.doctorId}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name} ({doc.doctorProfile?.specialization || doc.department?.name || 'Physician'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingForm.appointmentDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Time Slot
                  </label>
                  <select
                    value={bookingForm.slotTime}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, slotTime: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Type
                </label>
                <select
                  value={bookingForm.type}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="New Consultation">New Consultation</option>
                  <option value="Follow-up">Follow-up Visit</option>
                  <option value="Routine Health Checkup">Routine Health Checkup</option>
                  <option value="Report Review">Diagnostic Report Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe your symptoms or primary concern..."
                  value={bookingForm.reasonForVisit}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, reasonForVisit: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
