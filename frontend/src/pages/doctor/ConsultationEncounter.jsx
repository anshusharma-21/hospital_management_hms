import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import {
  Stethoscope,
  FileText,
  Activity,
  FlaskConical,
  Scan,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  History,
  Phone,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const ConsultationEncounter = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const patientIdParam = searchParams.get('patientId');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [patient, setPatient] = useState(null);
  const [encounter, setEncounter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);

  // Clinical Form Fields
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfIllness, setHistoryOfIllness] = useState('');
  const [examFindings, setExamFindings] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  // Vitals (start empty for real entry)
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    pulse: '',
    temperature: '',
    respiratoryRate: '',
    spo2: '',
    bloodSugarRandom: '',
    painScore: ''
  });

  // e-Prescription Medicines (clean empty list)
  const [medications, setMedications] = useState([]);

  // Diagnostic Orders Checkbox states
  const [labTestsSelected, setLabTestsSelected] = useState([]);
  const [radiologySelected, setRadiologySelected] = useState([]);
  const [followUpDays, setFollowUpDays] = useState('7');
  const [successModal, setSuccessModal] = useState(false);

  useEffect(() => {
    const initEncounter = async () => {
      try {
        setLoading(true);
        const targetPatientId = patientIdParam;

        if (!targetPatientId) {
          setLoading(false);
          return;
        }

        if (targetPatientId) {
          const ptRes = await api.get(`/patients/${targetPatientId}`);
          if (ptRes.data.success) {
            setPatient(ptRes.data.data);
          }

          // Create or retrieve active encounter
          const encRes = await api.post('/clinical/encounters', {
            patient: targetPatientId,
            appointment: appointmentId || null,
            encounterType: 'OPD',
            chiefComplaint: 'Outpatient clinical consultation'
          });

          if (encRes.data.success) {
            setEncounter(encRes.data.data);
            if (encRes.data.data.chiefComplaint) {
              setChiefComplaint(encRes.data.data.chiefComplaint);
            }
          }

          // Load timeline
          const tlRes = await api.get(`/patients/${targetPatientId}/timeline`);
          if (tlRes.data.success) {
            setTimelineEvents(tlRes.data.timeline || []);
          }
        }
      } catch (err) {
        console.error('Failed to init encounter:', err);
      } finally {
        setLoading(false);
      }
    };

    initEncounter();
  }, [appointmentId, patientIdParam]);

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        medicineName: '',
        dosage: '',
        form: 'Tablet',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const removeMedicationRow = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const toggleLabTest = (testName) => {
    if (labTestsSelected.includes(testName)) {
      setLabTestsSelected(labTestsSelected.filter((t) => t !== testName));
    } else {
      setLabTestsSelected([...labTestsSelected, testName]);
    }
  };

  const toggleRadiology = (radName) => {
    if (radiologySelected.includes(radName)) {
      setRadiologySelected(radiologySelected.filter((r) => r !== radName));
    } else {
      setRadiologySelected([...radiologySelected, radName]);
    }
  };

  const handleFinalizeEncounter = async (e) => {
    e.preventDefault();
    if (!patient || !encounter) return;

    setSubmitting(true);
    try {
      // 1. Update Encounter clinical notes
      await api.put(`/clinical/encounters/${encounter._id}`, {
        chiefComplaint,
        historyOfPresentIllness: historyOfIllness,
        examinationFindings: examFindings,
        clinicalNotes,
        followUpDate: new Date(Date.now() + Number(followUpDays) * 24 * 60 * 60 * 1000),
        followUpInstructions: `Review in OPD after ${followUpDays} days with lab reports.`,
        status: 'Completed'
      });

      // 2. Record Vitals
      await api.post('/clinical/vitals', {
        patient: patient._id,
        encounter: encounter._id,
        ...vitals
      });

      // 3. Create e-Prescription
      if (medications.length > 0) {
        await api.post('/clinical/prescriptions', {
          patient: patient._id,
          encounter: encounter._id,
          diagnosis: diagnosis || 'Clinical evaluation & symptom management',
          medications,
          generalAdvice: 'Adequate hydration, warm oral fluids, take medicines on time.'
        });
      }

      // 4. Create Lab Order if any selected
      if (labTestsSelected.length > 0) {
        const tests = labTestsSelected.map((tName) => ({
          testName: tName,
          category: tName.includes('Blood') || tName.includes('CBC') ? 'Hematology' : 'Biochemistry',
          sampleType: 'Blood (Serum)',
          status: 'Ordered'
        }));

        await api.post('/diagnostics/lab-orders', {
          patient: patient._id,
          encounter: encounter._id,
          tests,
          clinicalNotes: diagnosis || chiefComplaint
        });
      }

      // 5. Create Radiology Requisitions if any selected
      if (radiologySelected.length > 0) {
        for (const radItem of radiologySelected) {
          await api.post('/diagnostics/radiology-orders', {
            patient: patient._id,
            encounter: encounter._id,
            modality: radItem.includes('X-Ray') ? 'X-Ray' : radItem.includes('CT') ? 'CT Scan' : 'Ultrasound',
            bodyPart: radItem,
            clinicalIndication: diagnosis || chiefComplaint,
            priority: 'Routine'
          });
        }
      }

      // 6. Complete appointment status if linked
      if (appointmentId) {
        await api.put(`/appointments/${appointmentId}/status`, { status: 'Completed' });
      }

      addToast({
        title: 'Encounter Finalized',
        message: 'Prescription signed, diagnostic orders dispatched to lab & radiology.',
        type: 'success'
      });

      setSuccessModal(true);
    } catch (err) {
      addToast({
        title: 'Finalization Error',
        message: err.response?.data?.error || 'Could not finalize encounter',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Initializing clinical encounter workspace...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Card className="text-center py-16 space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patient Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please select an active patient from the OPD Queue to launch a clinical consultation session.
          </p>
          <div className="pt-2">
            <Button size="sm" onClick={() => navigate('/clinical/dashboard')}>
              Return to Clinical Queue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Patient Header Bar */}
      {patient && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-800 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {patient.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{patient.fullName}</h2>
                <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                  {patient.uhid}
                </span>
                <span className="text-xs text-slate-500">
                  {patient.gender}, {patient.age} yrs
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded text-[11px]">
                  Blood: {patient.bloodGroup}
                </span>
                {patient.allergies?.length > 0 && (
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200">
                    Allergy: {patient.allergies.map((a) => a.allergen).join(', ')}
                  </span>
                )}
                {patient.chronicConditions?.length > 0 && (
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200">
                    {patient.chronicConditions.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={History}
              onClick={() => setTimelineDrawerOpen(true)}
            >
              Longitudinal History ({timelineEvents.length})
            </Button>
          </div>
        </div>
      )}

      {/* Main Consultation Form */}
      <form onSubmit={handleFinalizeEncounter} className="space-y-6">
        {/* Row 1: Vitals strip */}
        <Card title="Patient Vital Signs (Bedside / Triage)" headerIcon={Activity}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Input
              label="BP Systolic"
              type="number"
              value={vitals.bloodPressureSystolic}
              onChange={(e) => setVitals({ ...vitals, bloodPressureSystolic: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="BP Diastolic"
              type="number"
              value={vitals.bloodPressureDiastolic}
              onChange={(e) => setVitals({ ...vitals, bloodPressureDiastolic: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Pulse (bpm)"
              type="number"
              value={vitals.pulse}
              onChange={(e) => setVitals({ ...vitals, pulse: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Temp (°F)"
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="SpO2 (%)"
              type="number"
              value={vitals.spo2}
              onChange={(e) => setVitals({ ...vitals, spo2: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Resp Rate"
              type="number"
              value={vitals.respiratoryRate}
              onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Sugar (mg/dL)"
              type="number"
              value={vitals.bloodSugarRandom}
              onChange={(e) => setVitals({ ...vitals, bloodSugarRandom: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <Input
              label="Pain Score (0-10)"
              type="number"
              min="0"
              max="10"
              value={vitals.painScore}
              onChange={(e) => setVitals({ ...vitals, painScore: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </div>
        </Card>

        {/* Row 2: Clinical Examination & Diagnosis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Chief Complaint & Examination" headerIcon={Stethoscope}>
            <div className="space-y-4">
              <Input
                label="Chief Complaint"
                required
                placeholder="e.g. High grade fever, productive cough, breathlessness"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">History of Present Illness (HPI)</label>
                <textarea
                  rows="2"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="Duration, onset, aggravating/relieving factors..."
                  value={historyOfIllness}
                  onChange={(e) => setHistoryOfIllness(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Physical & Systemic Findings</label>
                <textarea
                  rows="2"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="Chest bilateral rhonchi, heart sounds normal, abdomen soft..."
                  value={examFindings}
                  onChange={(e) => setExamFindings(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card title="Clinical Impression & Diagnosis" headerIcon={FileText}>
            <div className="space-y-4">
              <Input
                label="Primary Diagnosis (Clinical / ICD Coding)"
                required
                placeholder="e.g. Acute Bronchitis with Mild Asthma Exacerbation"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Doctor's Clinical Notes & Treatment Plan</label>
                <textarea
                  rows="5"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="Patient counseled regarding antibiotics course, hydration, and warning signs..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3: e-Prescription Builder */}
        <Card
          title="e-Prescription (Medications Master)"
          subtitle="Directly synchronizes with Hospital Pharmacy POS dispensing queue"
          headerIcon={FileText}
          action={
            <Button size="sm" variant="secondary" icon={Plus} onClick={addMedicationRow}>
              Add Drug Row
            </Button>
          }
        >
          <div className="space-y-3">
            {medications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No medications added yet. Click &ldquo;Add Drug Row&rdquo; to prescribe medication.
              </div>
            ) : (
              medications.map((med, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
              >
                <div className="sm:col-span-2">
                  <Input
                    label="Medicine Name"
                    value={med.medicineName}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].medicineName = e.target.value;
                      setMedications(updated);
                    }}
                  />
                </div>
                <div>
                  <Input
                    label="Dosage"
                    value={med.dosage}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].dosage = e.target.value;
                      setMedications(updated);
                    }}
                  />
                </div>
                <div>
                  <Select
                    label="Frequency"
                    value={med.frequency}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].frequency = e.target.value;
                      setMedications(updated);
                    }}
                    options={[
                      { value: 'Once daily (OD)', label: 'OD (Once daily)' },
                      { value: 'Twice daily (BD)', label: 'BD (Twice daily)' },
                      { value: 'Thrice daily (TDS)', label: 'TDS (Thrice daily)' },
                      { value: 'Four times daily (QID)', label: 'QID (4 times)' },
                      { value: 'As needed (SOS)', label: 'SOS (As needed)' }
                    ]}
                  />
                </div>
                <div>
                  <Input
                    label="Duration"
                    value={med.duration}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].duration = e.target.value;
                      setMedications(updated);
                    }}
                  />
                </div>
                <div className="flex items-end justify-between gap-2 pt-4 sm:pt-0">
                  <Select
                    label="Timing"
                    value={med.instructions}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[idx].instructions = e.target.value;
                      setMedications(updated);
                    }}
                    options={[
                      { value: 'After Food', label: 'After Food' },
                      { value: 'Before Food', label: 'Before Food' },
                      { value: 'With Milk', label: 'With Milk' },
                      { value: 'Empty Stomach', label: 'Empty Stomach' }
                    ]}
                  />
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(idx)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )))}
          </div>
        </Card>

        {/* Row 4: One-Click Diagnostic Requisitions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Laboratory Test Requisitions" headerIcon={FlaskConical}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Complete Blood Count (CBC) with ESR',
                'C-Reactive Protein (Quantitative CRP)',
                'Comprehensive Metabolic Panel (CMP)',
                'Lipid Profile (Cholesterol / Triglycerides)',
                'Liver Function Test (LFT Panel)',
                'Kidney Function Test (Serum Creatinine & Urea)',
                'Fasting Blood Sugar & HbA1c',
                'Urine Routine & Microscopic'
              ].map((test) => (
                <label
                  key={test}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    labTestsSelected.includes(test)
                      ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={labTestsSelected.includes(test)}
                    onChange={() => toggleLabTest(test)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>{test}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card title="Radiology & Medical Imaging Requisitions" headerIcon={Scan}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Chest PA View (X-Ray)',
                'Spine Lumbar AP & Lateral (X-Ray)',
                'CT Scan Brain (Plain)',
                'CT Scan Abdomen & Pelvis',
                'Ultrasound Whole Abdomen',
                'Echocardiogram 2D Doppler',
                'MRI Brain with Contrast',
                'MRI Knee Joint'
              ].map((rad) => (
                <label
                  key={rad}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    radiologySelected.includes(rad)
                      ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={radiologySelected.includes(rad)}
                    onChange={() => toggleRadiology(rad)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>{rad}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Follow-up & Finalize */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-teal-700" />
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Follow-up Advice:</span>
              <select
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                className="rounded-lg border border-slate-200 py-1 px-2.5 font-bold text-slate-800"
              >
                <option value="3">Review after 3 Days</option>
                <option value="7">Review after 7 Days (1 Week)</option>
                <option value="14">Review after 14 Days (2 Weeks)</option>
                <option value="30">Review after 1 Month</option>
                <option value="0">SOS / No fixed review</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/clinical/dashboard')}
            >
              Save Draft & Exit
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={CheckCircle2}
              isLoading={submitting}
            >
              Finalize & Sign Clinical Encounter
            </Button>
          </div>
        </div>
      </form>

      {/* Slide-over Longitudinal History Drawer */}
      <Drawer
        isOpen={timelineDrawerOpen}
        onClose={() => setTimelineDrawerOpen(false)}
        title={`Longitudinal Medical History: ${patient?.fullName}`}
        subtitle={`UHID: ${patient?.uhid}`}
      >
        <div className="space-y-4">
          {timelineEvents.map((evt, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{evt.title}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(evt.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600">{evt.details}</p>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Success Confirmation Modal */}
      {successModal && (
        <Modal
          isOpen={successModal}
          onClose={() => setSuccessModal(false)}
          title="Clinical Encounter Finalized & Signed"
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-md shadow-teal-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Encounter Documented</h3>
              <p className="text-xs text-slate-500 mt-1">
                Prescription issued and diagnostic orders automatically dispatched to Hospital Pharmacy and Diagnostics workbench.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1 text-slate-600">
              <p>
                Patient: <strong>{patient?.fullName}</strong> ({patient?.uhid})
              </p>
              <p>
                Diagnosis: <strong>{diagnosis || 'Clinical evaluation completed'}</strong>
              </p>
              <p>
                Medications Prescribed: <strong>{medications.length} items</strong>
              </p>
              {labTestsSelected.length > 0 && (
                <p>
                  Lab Requisitions: <strong>{labTestsSelected.length} panels</strong>
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setSuccessModal(false);
                  navigate('/clinical/dashboard');
                }}
              >
                Return to Doctor Queue
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
