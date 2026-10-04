import React, { useState, useEffect } from 'react';
import {
  Pill,
  Calendar,
  User,
  Printer,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientPrescriptions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clinical/prescriptions');
      if (res.data?.success) {
        setPrescriptions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      addToast('Could not load prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (rx) => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">e-Prescriptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital doctor-signed prescriptions with dosage, frequency and administration advice
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Digitally Signed & Verified</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-slate-200 rounded-3xl" />
          <div className="h-36 bg-slate-200 rounded-3xl" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <Pill className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No prescriptions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When a hospital doctor finalizes an e-prescription during your clinical consultation, it will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div
              key={rx._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {rx.prescriptionNumber}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Signed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prescribed by <strong>Dr. {rx.doctor?.name || 'Physician'}</strong>
                      {rx.doctor?.doctorProfile?.specialization && ` (${rx.doctor.doctorProfile.specialization})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5 mr-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(rx.signedAt || rx.createdAt).toLocaleDateString()}</span>
                  </span>
                  <button
                    onClick={() => setSelectedRx(rx)}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {rx.diagnosis && (
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-500 mr-1.5">Clinical Diagnosis:</span>
                  <span className="font-bold text-slate-800">{rx.diagnosis}</span>
                </div>
              )}

              {/* Medications Table (Using backend rx.medications) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Medication & Form</th>
                      <th className="py-2.5 px-4">Dosage / Route</th>
                      <th className="py-2.5 px-4">Frequency</th>
                      <th className="py-2.5 px-4">Duration</th>
                      <th className="py-2.5 px-4">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(rx.medications) && rx.medications.length > 0 ? (
                      rx.medications.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {med.medicineName}
                            {med.form && <span className="text-slate-500 font-normal text-[11px] ml-1">({med.form})</span>}
                          </td>
                          <td className="py-2.5 px-4">
                            {med.dosage} {med.route ? `• ${med.route}` : ''}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-teal-800">
                            {med.frequency}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium">
                            {med.duration}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 italic">
                            {med.instructions || 'As advised'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-center text-slate-400">
                          No specific line items recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {rx.generalAdvice && (
                <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Doctor's Advice:</span> {rx.generalAdvice}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  Rx
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Official e-Prescription</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedRx.prescriptionNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Name</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{user?.patientData?.fullName || user?.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">UHID: {user?.patientData?.uhid}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Prescribing Physician</span>
                <span className="font-bold text-slate-900 mt-0.5 block">Dr. {selectedRx.doctor?.name}</span>
                <span className="text-[11px] text-slate-500">
                  {selectedRx.doctor?.doctorProfile?.specialization || 'Clinical Specialist'}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Diagnosis</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{selectedRx.diagnosis || 'Clinical Consultation'}</span>
              </div>
            </div>

            {/* Medications in modal */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Prescribed Medications</h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Medicine</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRx.medications?.map((m, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.medicineName}</td>
                        <td className="py-2.5 px-3">{m.dosage}</td>
                        <td className="py-2.5 px-3 font-semibold text-teal-800">{m.frequency}</td>
                        <td className="py-2.5 px-3 font-mono">{m.duration}</td>
                        <td className="py-2.5 px-3 text-slate-500">{m.instructions || 'As advised'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {(selectedRx.dietAdvice || selectedRx.generalAdvice) && (
              <div className="space-y-2 text-xs bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                {selectedRx.dietAdvice && (
                  <p><strong className="text-teal-900">Dietary Advice:</strong> {selectedRx.dietAdvice}</p>
                )}
                {selectedRx.generalAdvice && (
                  <p><strong className="text-teal-900">General Advice:</strong> {selectedRx.generalAdvice}</p>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Date: {new Date(selectedRx.signedAt || selectedRx.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => handlePrint(selectedRx)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
