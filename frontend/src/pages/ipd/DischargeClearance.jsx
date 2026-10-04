import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  BedDouble, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Building2, 
  ShieldCheck, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  CreditCard 
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

export const DischargeClearance = () => {
  const { addToast } = useToast();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Department clearances state for active modal
  const [clearances, setClearances] = useState({
    doctor: false,
    nursing: false,
    pharmacy: false,
    lab: false,
    billing: false
  });

  const [dischargeNotes, setDischargeNotes] = useState({
    dischargeType: 'Normal Discharge',
    conditionAtDischarge: 'Stable, Ambulatory, Afebrile',
    finalDiagnosis: 'Acute Calculous Cholecystitis, post laparoscopic cholecystectomy',
    dischargeAdvice: 'Low-fat diet, wound dressing change on Day 5, avoid lifting heavy weights for 3 weeks',
    medicationsPrescribed: 'Tab Cefuroxime 500mg BD x 5 days, Tab Pantoprazole 40mg OD x 7 days, Tab Paracetamol 650mg SOS',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchActiveAdmissions();
  }, []);

  const fetchActiveAdmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ipd/admissions?status=admitted');
      if (res.data.success) {
        setAdmissions(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load inpatients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDischarge = (adm) => {
    setSelectedAdmission(adm);
    // Pre-populate clearances from admission record
    setClearances({
      doctor: adm.departmentClearances?.doctor || true,
      nursing: adm.departmentClearances?.nursing || true,
      pharmacy: adm.departmentClearances?.pharmacy || true,
      lab: adm.departmentClearances?.lab || true,
      billing: adm.departmentClearances?.billing || (adm.totalOutstanding === 0)
    });
    setShowSummaryModal(true);
  };

  const handleFinalizeDischarge = async () => {
    if (!clearances.billing) {
      addToast('Cannot discharge patient with pending billing clearance. Balance must be cleared.', 'warning');
      return;
    }

    try {
      const payload = {
        dischargeDate: new Date(),
        dischargeType: dischargeNotes.dischargeType,
        dischargeSummary: {
          finalDiagnosis: dischargeNotes.finalDiagnosis,
          conditionAtDischarge: dischargeNotes.conditionAtDischarge,
          treatmentGiven: 'Laparoscopic Cholecystectomy under GA. Uneventful post-op recovery.',
          dischargeAdvice: dischargeNotes.dischargeAdvice,
          medicationsOnDischarge: dischargeNotes.medicationsPrescribed,
          followUpAdvice: `Review in OPD on ${dischargeNotes.followUpDate}`
        }
      };

      const res = await api.post(`/ipd/admissions/${selectedAdmission._id}/discharge`, payload);
      if (res.data.success) {
        addToast(`Patient ${selectedAdmission.patient?.fullName} successfully discharged. Bed released!`, 'success');
        setShowSummaryModal(false);
        fetchActiveAdmissions();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Discharge process failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Patient Discharge & Multi-Department Clearance</h1>
              <p className="text-xs text-slate-500">Cross-department clearance checklist (Doctor, Nursing, Pharmacy, Lab, Cashier) and automatic bed release</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchActiveAdmissions}>
          Refresh Inpatients
        </Button>
      </div>

      {/* Inpatient Discharge Clearance Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Currently Admitted Inpatients Ready for Clearance</h2>
            <Badge variant="neutral">{admissions.length} Admitted</Badge>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Admission #</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Bed & Ward</TableHeader>
              <TableHeader>Admitted Date</TableHeader>
              <TableHeader>Attending Doctor</TableHeader>
              <TableHeader>Clearance Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {admissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                  No active inpatient admissions requiring discharge clearance at this moment.
                </TableCell>
              </TableRow>
            ) : (
              admissions.map((adm) => (
                <TableRow key={adm._id}>
                  <TableCell className="font-mono font-bold text-teal-700 text-xs">{adm.admissionNumber}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{adm.patient?.fullName}</p>
                    <p className="font-mono text-[11px] text-slate-400">{adm.patient?.uhid}</p>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-800 text-xs">{adm.bed?.bedNumber || 'Bed-101'}</span>
                    <p className="text-[11px] text-slate-500">{adm.bed?.ward || 'General Male Ward'}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">
                    {new Date(adm.admissionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {adm.attendingDoctor?.name || 'Dr. Arun Sharma'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-medium text-slate-700">Clearances Pending</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      className="text-xs py-1 px-3"
                      onClick={() => handleOpenDischarge(adm)}
                    >
                      Process Discharge
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Discharge & Clearance Modal */}
      <Modal 
        isOpen={showSummaryModal} 
        onClose={() => setShowSummaryModal(false)}
        title="Inpatient Discharge & Final Summary Workflow"
        size="lg"
      >
        {selectedAdmission && (
          <div className="space-y-5">
            {/* Patient Header Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="text-xs text-slate-400">Patient Details</p>
                <h3 className="font-bold text-slate-900 text-sm">{selectedAdmission.patient?.fullName}</h3>
                <p className="font-mono text-xs text-teal-700 font-semibold">{selectedAdmission.patient?.uhid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Bed Location</p>
                <p className="font-bold text-slate-800 text-xs">{selectedAdmission.bed?.bedNumber} ({selectedAdmission.bed?.ward})</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Admission #</p>
                <p className="font-mono text-xs text-slate-700 font-semibold">{selectedAdmission.admissionNumber}</p>
              </div>
            </div>

            {/* 5-Department Clearance Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Departmental Clearance Matrix (Mandatory)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {/* 1. Clinical Doctor */}
                <div 
                  onClick={() => setClearances({...clearances, doctor: !clearances.doctor})}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    clearances.doctor ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${clearances.doctor ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">1. Doctor Clearance</p>
                    <p className="text-[11px] text-slate-500">Clinical summary ready</p>
                  </div>
                </div>

                {/* 2. Nursing Station */}
                <div 
                  onClick={() => setClearances({...clearances, nursing: !clearances.nursing})}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    clearances.nursing ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${clearances.nursing ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">2. Nursing Station</p>
                    <p className="text-[11px] text-slate-500">Cannula / catheter removed</p>
                  </div>
                </div>

                {/* 3. Pharmacy Return */}
                <div 
                  onClick={() => setClearances({...clearances, pharmacy: !clearances.pharmacy})}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    clearances.pharmacy ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${clearances.pharmacy ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">3. Pharmacy Return</p>
                    <p className="text-[11px] text-slate-500">Unused drugs returned</p>
                  </div>
                </div>

                {/* 4. Diagnostic Lab */}
                <div 
                  onClick={() => setClearances({...clearances, lab: !clearances.lab})}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    clearances.lab ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${clearances.lab ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">4. Lab & Radiology</p>
                    <p className="text-[11px] text-slate-500">All reports delivered</p>
                  </div>
                </div>

                {/* 5. Billing Settlement */}
                <div 
                  onClick={() => setClearances({...clearances, billing: !clearances.billing})}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    clearances.billing ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${clearances.billing ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">5. Cashier Settlement</p>
                    <p className="text-[11px] text-slate-500">Zero outstanding balance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Discharge Summary Form */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Discharge Summary & Medical Advice
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Discharge Type</label>
                  <Select 
                    value={dischargeNotes.dischargeType}
                    onChange={(e) => setDischargeNotes({...dischargeNotes, dischargeType: e.target.value})}
                    options={[
                      { value: 'Normal Discharge', label: 'Normal / Routine Discharge' },
                      { value: 'LAMA / DAMA', label: 'Left Against Medical Advice (LAMA)' },
                      { value: 'Transfer to Higher Center', label: 'Transfer to Higher Center' },
                      { value: 'Absconded', label: 'Absconded' },
                      { value: 'Deceased', label: 'Expired / Deceased' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Review / Follow-up Date</label>
                  <Input 
                    type="date"
                    value={dischargeNotes.followUpDate}
                    onChange={(e) => setDischargeNotes({...dischargeNotes, followUpDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Final Diagnosis</label>
                <Input 
                  value={dischargeNotes.finalDiagnosis}
                  onChange={(e) => setDischargeNotes({...dischargeNotes, finalDiagnosis: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Discharge Medications</label>
                <textarea 
                  rows={2}
                  value={dischargeNotes.medicationsPrescribed}
                  onChange={(e) => setDischargeNotes({...dischargeNotes, medicationsPrescribed: e.target.value})}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Discharge Advice & Warning Signs</label>
                <textarea 
                  rows={2}
                  value={dischargeNotes.dischargeAdvice}
                  onChange={(e) => setDischargeNotes({...dischargeNotes, dischargeAdvice: e.target.value})}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Summary Draft
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSummaryModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleFinalizeDischarge}>
                  Finalize Discharge & Release Bed
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
