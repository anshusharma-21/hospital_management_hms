import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import {
  Activity,
  Pill,
  Droplets,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Plus
} from 'lucide-react';

export const NursingChartMAR = () => {
  const [searchParams] = useSearchParams();
  const admissionId = searchParams.get('admissionId');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [admission, setAdmission] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // New MAR Form
  const [shift, setShift] = useState('Morning Shift (07:00 - 15:00)');
  const [medications, setMedications] = useState([]);
  const [intakeOutput, setIntakeOutput] = useState({
    oralFluidsMl: 0,
    ivFluidsMl: 0,
    urineOutputMl: 0,
    drainOutputMl: 0
  });
  const [nursingNotes, setNursingNotes] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');

  useEffect(() => {
    const fetchAdmissionData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ipd/admissions?status=Admitted');
        if (res.data.success && res.data.data.length > 0) {
          const adm = admissionId
            ? res.data.data.find((a) => a._id === admissionId)
            : null;
          if (adm) {
            setAdmission(adm);

            // Fetch nursing history
            const recRes = await api.get(`/ipd/nursing-records/${adm._id}`);
            if (recRes.data.success) {
              setRecords(recRes.data.data);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissionData();
  }, [admissionId]);

  const handleUpdateMedStatus = (idx, status) => {
    const updated = [...medications];
    updated[idx].status = status;
    setMedications(updated);
  };

  const handleSaveNursingEntry = async (e) => {
    e.preventDefault();
    if (!admission) return;

    try {
      const res = await api.post('/ipd/nursing-records', {
        admission: admission._id,
        patient: admission.patient?._id,
        shift,
        medicationAdministration: medications,
        intakeOutput,
        nursingNotes,
        shiftHandoverNotes: handoverNotes
      });

      if (res.data.success) {
        addToast({
          title: 'Nursing Chart Saved',
          message: 'MAR, fluid balance, and shift notes recorded successfully.',
          type: 'success'
        });
        setRecords([res.data.data, ...records]);
      }
    } catch (err) {
      addToast({
        title: 'Save Failed',
        message: err.response?.data?.error || 'Could not record nursing notes',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading nursing chart & MAR...</div>;
  }

  if (!admission) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Card className="text-center py-16 space-y-3">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Inpatient Admission Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please select an admitted patient from the Bed Board to document medication administration and fluid balance.
          </p>
          <div className="pt-2">
            <Button size="sm" onClick={() => navigate('/ipd/bed-board')}>
              Open Bed Board
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Patient Header */}
      {admission && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-sm flex items-center justify-center font-mono">
              {admission.bed?.bedNumber || 'BED'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">{admission.patient?.fullName}</h2>
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {admission.patient?.uhid}
                </span>
                <Badge variant="primary" size="sm">
                  {admission.bed?.ward}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attending: <strong>Dr. {admission.attendingDoctor?.name}</strong> • Admitted:{' '}
                {new Date(admission.admissionDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${admission.patient?._id}`)}
          >
            Longitudinal Profile
          </Button>
        </div>
      )}

      {/* Main MAR Charting Form */}
      <form onSubmit={handleSaveNursingEntry} className="space-y-6">
        {/* Section 1: Medication Administration Record (MAR) */}
        <Card
          title="Medication Administration Record (MAR)"
          subtitle="Document drug administration, held doses, or patient refusals for current shift"
          headerIcon={Pill}
          action={
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              type="button"
              onClick={() =>
                setMedications([
                  ...medications,
                  { medicationName: '', dosage: '', scheduledTime: '', status: 'Administered' }
                ])
              }
            >
              Add Medication Task
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Active Shift:</span>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="rounded-lg border border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800"
              >
                <option value="Morning Shift (07:00 - 15:00)">Morning Shift (07:00 - 15:00)</option>
                <option value="Evening Shift (15:00 - 23:00)">Evening Shift (15:00 - 23:00)</option>
                <option value="Night Shift (23:00 - 07:00)">Night Shift (23:00 - 07:00)</option>
              </select>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {medications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white">
                  No active medication tasks charted for this shift. Click &ldquo;Add Medication Task&rdquo; to record doses.
                </div>
              ) : (
                medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{med.medicationName}</span>
                    <p className="text-[10px] text-slate-400">
                      Dose: {med.dosage} • Scheduled: {med.scheduledTime}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {['Administered', 'Held / Omitted', 'Refused by Patient'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateMedStatus(idx, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          med.status === st
                            ? st === 'Administered'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )))}
            </div>
          </div>
        </Card>

        {/* Section 2: Fluid Balance (Intake / Output) */}
        <Card title="Fluid Balance (Intake & Output Chart)" headerIcon={Droplets}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Oral Intake (ml)"
              type="number"
              value={intakeOutput.oralFluidsMl}
              onChange={(e) =>
                setIntakeOutput({ ...intakeOutput, oralFluidsMl: Number(e.target.value) })
              }
            />
            <Input
              label="IV Fluids (ml)"
              type="number"
              value={intakeOutput.ivFluidsMl}
              onChange={(e) =>
                setIntakeOutput({ ...intakeOutput, ivFluidsMl: Number(e.target.value) })
              }
            />
            <Input
              label="Urine Output (ml)"
              type="number"
              value={intakeOutput.urineOutputMl}
              onChange={(e) =>
                setIntakeOutput({ ...intakeOutput, urineOutputMl: Number(e.target.value) })
              }
            />
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs">
              <span className="font-semibold text-teal-800">Net Fluid Balance:</span>
              <p className="text-xl font-black text-teal-900 mt-1">
                {intakeOutput.oralFluidsMl +
                  intakeOutput.ivFluidsMl -
                  intakeOutput.urineOutputMl}{' '}
                ml
              </p>
            </div>
          </div>
        </Card>

        {/* Section 3: Nursing Daily Progress & Handover */}
        <Card title="Shift Nursing Progress & Handover Notes" headerIcon={ClipboardList}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nursing Progress Observations</label>
              <textarea
                rows="3"
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={nursingNotes}
                onChange={(e) => setNursingNotes(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Shift Handover Remarks to Next Nurse</label>
              <textarea
                rows="3"
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <Button type="submit" variant="primary" size="lg" icon={CheckCircle2}>
              Save Shift Nursing Entry
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
