import React, { useState, useEffect } from 'react';
import {
  Scan,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Eye,
  X,
  Printer,
  ShieldCheck,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientRadiologyReports = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [radiologyOrders, setRadiologyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState(null);

  useEffect(() => {
    fetchRadiologyOrders();
  }, []);

  const fetchRadiologyOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/radiology-orders');
      if (res.data?.success) {
        setRadiologyOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load radiology reports:', err);
      addToast('Could not load radiology imaging reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Report Finalized':
      case 'Completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Report Finalized</span>;
      case 'Image Acquired':
      case 'In Reporting':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">In Reporting</span>;
      case 'Scheduled':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Scheduled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Radiology & Imaging Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostic imaging records including X-Ray, CT Scan, MRI, and Ultrasonography
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>DICOM & PACS Integrated</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
        </div>
      ) : radiologyOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <Scan className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No radiology reports on record</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When diagnostic radiology studies are ordered and scanned, radiologist impressions and findings will be accessible here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {radiologyOrders.map((study) => (
            <div
              key={study._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {study.modality} — {study.bodyPart}
                      </span>
                      {getStatusBadge(study.status)}
                      {study.criticalFinding && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Critical Finding</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Referred by <strong>Dr. {study.doctor?.name || 'Physician'}</strong>
                      {study.radiologist && ` • Radiologist: Dr. ${study.radiologist.name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(study.createdAt).toLocaleDateString()}</span>
                  </span>
                  <button
                    onClick={() => setSelectedStudy(study)}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Impression</span>
                  </button>
                </div>
              </div>

              {/* Study Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Clinical Indication / Reason
                  </span>
                  <p className="text-slate-800 font-medium">
                    {study.clinicalIndication || 'Diagnostic examination'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Radiological Impression
                  </span>
                  <p className="text-slate-800 font-medium">
                    {study.impression || 'Formal radiologist interpretation pending acquisition verification.'}
                  </p>
                </div>
              </div>

              {study.findings && (
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Detailed Findings:</span>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {study.findings}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Radiology Modal */}
      {selectedStudy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  RAD
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Radiology Examination Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudy.modality} • {selectedStudy.bodyPart}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudy(null)}
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
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Radiologist</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedStudy.radiologist?.name ? `Dr. ${selectedStudy.radiologist.name}` : 'Staff Radiologist'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Study Date</span>
                <span className="font-mono text-slate-700 mt-0.5 block">
                  {new Date(selectedStudy.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Report Status</span>
                <span className="font-semibold text-teal-800 mt-0.5 block">{selectedStudy.status}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Clinical Indication
                </h4>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700">
                  {selectedStudy.clinicalIndication || 'Diagnostic imaging'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Impression
                </h4>
                <p className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-teal-900 font-medium">
                  {selectedStudy.impression || 'Formal interpretation in progress.'}
                </p>
              </div>

              {selectedStudy.findings && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Findings & Observations
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedStudy.findings}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Hospital Vision PACS Network
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Radiology Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
