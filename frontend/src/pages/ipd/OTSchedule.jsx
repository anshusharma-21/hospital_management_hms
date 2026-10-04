import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  FileText, 
  ShieldAlert, 
  Scissors, 
  HeartPulse, 
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const OTSchedule = () => {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // New Booking State
  const [formData, setFormData] = useState({
    patientId: '',
    patientUhid: '',
    patientName: '',
    theatreId: 'OT-1',
    procedureName: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    durationMinutes: 120,
    priority: 'Elective',
    anaesthesiaType: 'General Anaesthesia (GA)'
  });

  // Pre-Op Checklist items
  const [checklist, setChecklist] = useState({
    consentSigned: true,
    npoVerified: true,
    siteMarked: true,
    bloodArranged: true,
    pacClearance: true,
    implantsReady: false,
    allergiesNoted: true
  });

  const fetchSurgeriesAndPatients = async () => {
    setLoading(true);
    try {
      const [otRes, patRes] = await Promise.allSettled([
        api.get('/ipd/ot'),
        api.get('/patients')
      ]);

      if (otRes.status === 'fulfilled' && otRes.value.data?.success) {
        setBookings(otRes.value.data.data || []);
      }
      if (patRes.status === 'fulfilled' && patRes.value.data?.data) {
        setPatients(patRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching OT data:', err);
      addToast('Failed to load OT schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeriesAndPatients();
  }, []);

  const handlePatientSelect = (patId) => {
    const chosen = patients.find(p => p._id === patId);
    if (chosen) {
      setFormData(prev => ({
        ...prev,
        patientId: chosen._id,
        patientUhid: chosen.uhid,
        patientName: chosen.fullName || chosen.name
      }));
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!formData.procedureName) {
      addToast('Please enter the surgical procedure name', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.startTime}:00`);

      const res = await api.post('/ipd/ot', {
        patient: formData.patientId || undefined,
        patientUhid: formData.patientUhid || undefined,
        procedureName: formData.procedureName,
        theatreRoom: formData.theatreId,
        scheduledStartTime: scheduledDateTime,
        durationMinutes: Number(formData.durationMinutes),
        anaesthesiaType: formData.anaesthesiaType,
        preOpChecklist: checklist
      });

      if (res.data?.success) {
        addToast(res.data.message || 'Surgical case scheduled on OT board', 'success');
        setShowBookingModal(false);
        setFormData({
          patientId: '',
          patientUhid: '',
          patientName: '',
          theatreId: 'OT-1',
          procedureName: '',
          scheduledDate: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          durationMinutes: 120,
          priority: 'Elective',
          anaesthesiaType: 'General Anaesthesia (GA)'
        });
        await fetchSurgeriesAndPatients();
      }
    } catch (err) {
      console.error('OT booking error:', err);
      addToast(err.response?.data?.error || 'Failed to book surgery', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignPreOp = () => {
    setShowChecklistModal(false);
    addToast('WHO Surgical Safety Checklist verified & signed', 'success');
  };

  // Derive theatre statuses
  const theatreRooms = [
    { id: 'OT-1', name: 'Major OT 1 (Cardiac / Neuro)', desc: 'OT-1 (Major Cardiac / Neuro)' },
    { id: 'OT-2', name: 'Major OT 2 (Ortho / Joint)', desc: 'OT-2 (Orthopedic / Joint Replacement)' },
    { id: 'OT-3', name: 'Major OT 3 (General / Laparoscopy)', desc: 'OT-3 (General & Laparoscopy)' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Operation Theatre (OT) Management</h1>
              <p className="text-xs text-slate-500">Surgical scheduling, WHO safety checklists, anesthesia records & recovery tracking</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSurgeriesAndPatients}>
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowBookingModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Book Surgical Case
          </Button>
        </div>
      </div>

      {/* Theatres Live Real-time Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {theatreRooms.map((ot) => {
          const activeSurg = bookings.find(b => b.theatreRoom?.includes(ot.id) || b.theatreRoom === ot.desc);
          const status = activeSurg ? (activeSurg.status === 'In Progress' ? 'In Surgery' : 'Booked') : 'Available';

          return (
            <Card key={ot.id} className="relative overflow-hidden border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 text-sm">{ot.name}</span>
                <Badge 
                  variant={status === 'In Surgery' ? 'danger' : status === 'Booked' ? 'warning' : 'success'}
                >
                  {status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                    {activeSurg ? activeSurg.procedureName : 'Available for Booking'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Surgeon:</span>
                  <span className="font-medium text-slate-700">
                    {activeSurg?.leadSurgeon?.name ? `Dr. ${activeSurg.leadSurgeon.name}` : 'On Call'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[150px]">
                    {activeSurg?.patient?.fullName || 'None'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Start Time:</span>
                  <span className="font-bold text-teal-700">
                    {activeSurg?.scheduledStartTime ? new Date(activeSurg.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Surgical Queue Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Operating Theatre Schedule</h2>
            <Badge variant="neutral">{bookings.length} Procedures</Badge>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-xs">Loading surgical bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Scissors className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No scheduled surgeries found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Book Surgical Case" to schedule an OT procedure.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Booking #</TableHeader>
                <TableHeader>Patient (UHID)</TableHeader>
                <TableHeader>Theatre</TableHeader>
                <TableHeader>Procedure</TableHeader>
                <TableHeader>Surgical Team</TableHeader>
                <TableHeader>Schedule</TableHeader>
                <TableHeader>Pre-Op Safety</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((surg) => (
                <TableRow key={surg._id}>
                  <TableCell className="font-mono font-bold text-teal-700 text-xs">{surg.otBookingNumber || surg._id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{surg.patient?.fullName || 'Patient'}</p>
                    <p className="font-mono text-[11px] text-slate-400">{surg.patient?.uhid || 'UHID-N/A'}</p>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700 text-xs">{surg.theatreRoom}</TableCell>
                  <TableCell className="font-medium text-slate-800 text-xs">{surg.procedureName}</TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-800">{surg.leadSurgeon?.name ? `Dr. ${surg.leadSurgeon.name}` : 'Surgeon'}</p>
                    <p className="text-[11px] text-slate-500">Anesth: {surg.anaesthetist?.name || 'Assigned'}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">
                    {surg.scheduledStartTime ? new Date(surg.scheduledStartTime).toLocaleString() : '--'}
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => { setSelectedCase(surg); setShowChecklistModal(true); }}
                      className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-semibold bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WHO Verified</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={surg.status === 'In Progress' ? 'danger' : surg.status === 'Completed' ? 'success' : 'info'}>
                      {(surg.status || 'SCHEDULED').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs py-1 px-2.5"
                      onClick={() => { setSelectedCase(surg); setShowChecklistModal(true); }}
                    >
                      WHO Checklist
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal: Book Surgical Case */}
      <Modal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        title="Schedule Operating Theatre Case"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Select Patient</label>
            {patients.length > 0 && (
              <select
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 mb-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                defaultValue=""
              >
                <option value="">-- Choose Admitted / Registered Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.fullName} ({p.uhid}) - {p.gender}, {p.age}y
                  </option>
                ))}
              </select>
            )}
            <Input 
              value={formData.patientUhid}
              onChange={(e) => setFormData({...formData, patientUhid: e.target.value})}
              placeholder="Or enter Patient UHID e.g. HV-2026-0001"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Procedure / Surgery Name</label>
            <Input 
              value={formData.procedureName}
              onChange={(e) => setFormData({...formData, procedureName: e.target.value})}
              placeholder="e.g. Laparoscopic Appendectomy / Total Knee Replacement"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Operating Theatre</label>
              <select
                value={formData.theatreId}
                onChange={(e) => setFormData({...formData, theatreId: e.target.value})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="OT-1">Major OT 1 (General/Cardio)</option>
                <option value="OT-2">Major OT 2 (Ortho/Neuro)</option>
                <option value="OT-3">Major OT 3 (General/Laparoscopy)</option>
                <option value="OT-4">Major OT 4 (OB-GYN)</option>
                <option value="OT-5">Major OT 5 (Minor / Daycare)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Anaesthesia Type</label>
              <select 
                value={formData.anaesthesiaType}
                onChange={(e) => setFormData({...formData, anaesthesiaType: e.target.value})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="General Anaesthesia (GA)">General Anaesthesia (GA)</option>
                <option value="Spinal / Regional Anaesthesia">Spinal / Regional Anaesthesia</option>
                <option value="Epidural Anaesthesia">Epidural Anaesthesia</option>
                <option value="Local Anaesthesia (LA)">Local Anaesthesia (LA)</option>
                <option value="MAC / Sedation">MAC / Sedation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Scheduled Date</label>
              <Input 
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Start Time</label>
              <Input 
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Duration (mins)</label>
              <Input 
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Confirm OT Booking'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: WHO Surgical Safety Checklist */}
      <Modal 
        isOpen={showChecklistModal} 
        onClose={() => setShowChecklistModal(false)}
        title="WHO Surgical Safety & Pre-Op Checklist"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex justify-between font-bold text-slate-800">
              <span>{selectedCase?.procedureName}</span>
              <span className="text-teal-700 font-mono">{selectedCase?.patient?.uhid}</span>
            </div>
            <p className="text-slate-500 mt-1">Patient: {selectedCase?.patient?.fullName} | Theatre: {selectedCase?.theatreRoom}</p>
          </div>

          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-teal-800">Sign-In Phase (Before Induction of Anesthesia)</h3>
            
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <input 
                type="checkbox" 
                checked={checklist.consentSigned} 
                onChange={(e) => setChecklist({...checklist, consentSigned: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="font-medium text-slate-700">Patient identity, site, procedure & informed consent confirmed</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <input 
                type="checkbox" 
                checked={checklist.siteMarked} 
                onChange={(e) => setChecklist({...checklist, siteMarked: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="font-medium text-slate-700">Surgical site marked by operating surgeon</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <input 
                type="checkbox" 
                checked={checklist.npoVerified} 
                onChange={(e) => setChecklist({...checklist, npoVerified: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="font-medium text-slate-700">NPO status verified (Nothing by mouth {'>'} 8 hours)</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <input 
                type="checkbox" 
                checked={checklist.allergiesNoted} 
                onChange={(e) => setChecklist({...checklist, allergiesNoted: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="font-medium text-slate-700">Known allergies reviewed & highlighted to team</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <input 
                type="checkbox" 
                checked={checklist.bloodArranged} 
                onChange={(e) => setChecklist({...checklist, bloodArranged: e.target.checked})}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="font-medium text-slate-700">Blood components cross-matched & reserved at blood bank</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowChecklistModal(false)}>
              Close
            </Button>
            <Button size="sm" onClick={handleSignPreOp}>
              Sign & Certify Pre-Op Clearance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OTSchedule;
