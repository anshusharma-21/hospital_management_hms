import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Calendar,
  Clock,
  User,
  Bed,
  Building,
  AlertCircle,
  Eye,
  Printer,
  ShieldCheck,
  Stethoscope,
  X,
  HeartPulse
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientDischargeSummaries = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  useEffect(() => {
    fetchDischargeSummaries();
  }, []);

  const fetchDischargeSummaries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ipd/admissions?status=all');
      if (res.data?.success) {
        setAdmissions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load discharge summaries:', err);
      addToast('Could not load inpatient records', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discharge Summaries & Inpatient Stays</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinical discharge reports, hospital course summaries, and home recovery instructions
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Inpatient Health Record</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
        </div>
      ) : admissions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No inpatient admission records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            If you have been admitted to a hospital ward or room, your clinical course and discharge clearance summary will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {admissions.map((adm) => (
            <div
              key={adm._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {adm.admissionNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        adm.status === 'Discharged' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {adm.status}
                      </span>
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {adm.admissionType || 'Elective'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attending: <strong>Dr. {adm.attendingDoctor?.name || 'Care Team'}</strong>
                      {adm.bed?.bedNumber && ` • Bed: ${adm.bed.bedNumber} (${adm.bed.ward || 'Ward'})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Admitted: {new Date(adm.admissionDate).toLocaleDateString()}</span>
                  </span>
                  <button
                    onClick={() => setSelectedAdmission(adm)}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Summary</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis and Summary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Admission Diagnosis
                  </span>
                  <p className="text-slate-800 font-semibold">
                    {adm.diagnosisAtAdmission || 'Inpatient Medical Care'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Condition at Discharge
                  </span>
                  <p className="text-emerald-700 font-bold">
                    {adm.dischargeSummary?.conditionAtDischarge || (adm.status === 'Discharged' ? 'Stable / Recovered' : 'Currently Admitted')}
                  </p>
                </div>
              </div>

              {adm.dischargeSummary?.finalDiagnosis && (
                <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100 text-xs">
                  <span className="font-bold text-teal-900 block mb-0.5">Final Clinical Diagnosis:</span>
                  <p className="text-slate-700">{adm.dischargeSummary.finalDiagnosis}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Discharge Summary Modal */}
      {selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  IPD
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Hospital Discharge Summary</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedAdmission.admissionNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{user?.patientData?.fullName || user?.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">UHID: {user?.patientData?.uhid}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Attending Physician</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  Dr. {selectedAdmission.attendingDoctor?.name || 'Medical Officer'}
                </span>
                <span className="text-[11px] text-slate-500">{selectedAdmission.department?.name || 'Inpatient Services'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission Date</span>
                <span className="font-mono text-slate-800 mt-0.5 block">
                  {new Date(selectedAdmission.admissionDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Discharge Date</span>
                <span className="font-mono text-slate-800 mt-0.5 block">
                  {selectedAdmission.dischargeDate ? new Date(selectedAdmission.dischargeDate).toLocaleDateString() : 'Active Inpatient'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Primary Admission Diagnosis
                </h4>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700">
                  {selectedAdmission.diagnosisAtAdmission || 'Inpatient Medical Care'}
                </p>
              </div>

              {selectedAdmission.dischargeSummary?.treatmentCourse && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Hospital Treatment Course
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedAdmission.dischargeSummary.treatmentCourse}
                  </p>
                </div>
              )}

              {selectedAdmission.dischargeSummary?.dischargeMedications && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Discharge Medications & Regimen
                  </h4>
                  <p className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-teal-900 whitespace-pre-line font-medium">
                    {selectedAdmission.dischargeSummary.dischargeMedications}
                  </p>
                </div>
              )}

              {selectedAdmission.dischargeSummary?.followUpInstructions && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Follow-Up Instructions
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-700">
                    {selectedAdmission.dischargeSummary.followUpInstructions}
                  </p>
                </div>
              )}

              {selectedAdmission.dischargeSummary?.emergencySignsToReport && (
                <div>
                  <h4 className="font-bold text-rose-700 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Emergency Red-Flag Symptoms to Report</span>
                  </h4>
                  <p className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                    {selectedAdmission.dischargeSummary.emergencySignsToReport}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Hospital Vision Inpatient Record
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Discharge Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
