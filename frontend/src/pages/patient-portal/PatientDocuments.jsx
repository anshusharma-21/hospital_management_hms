import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  FileText,
  Calendar,
  Lock,
  Download,
  Eye,
  ShieldCheck,
  AlertCircle,
  X,
  Clock,
  KeyRound
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientDocuments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [secureTokenDoc, setSecureTokenDoc] = useState(null);
  const [requestingToken, setRequestingToken] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      if (res.data?.success) {
        setDocuments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load patient documents:', err);
      addToast('Could not load registered documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSecureAccess = async (doc) => {
    setRequestingToken(true);
    try {
      const res = await api.get(`/documents/${doc._id}/secure-access`);
      if (res.data?.success) {
        setSecureTokenDoc({
          ...doc,
          secureAccess: res.data.data
        });
        addToast('Ephemeral 15-minute secure access granted', 'success');
      } else {
        addToast('Secure token generation failed', 'error');
      }
    } catch (err) {
      console.error('Secure document access failed:', err);
      addToast(err.response?.data?.message || 'Access denied for this document', 'error');
    } finally {
      setRequestingToken(false);
    }
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'Prescription':
        return 'bg-emerald-100 text-emerald-800';
      case 'Lab report':
        return 'bg-violet-100 text-violet-800';
      case 'Radiology report':
        return 'bg-amber-100 text-amber-800';
      case 'Invoice':
      case 'Payment receipt':
        return 'bg-blue-100 text-blue-800';
      case 'Discharge summary':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Document Vault</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered medical certificates, discharge documents, test reports, and financial receipts
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted Zero-Knowledge Vault</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No registered documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Clinical certificates, official discharge slips, and verified reports issued by hospital care teams will be stored securely here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate max-w-xs" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {doc.documentNumber}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getDocTypeBadge(doc.documentType)}`}>
                    {doc.documentType}
                  </span>
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Format</span>
                    <span className="font-mono text-slate-700">{doc.mimeType || 'application/pdf'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Registered On</span>
                    <span className="font-mono text-slate-700">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Secure Reference</span>
                </span>
                <button
                  onClick={() => handleRequestSecureAccess(doc)}
                  disabled={requestingToken}
                  className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Generate Access Token</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secure Access Modal */}
      {secureTokenDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Ephemeral Vault Stream</h3>
                  <p className="text-xs text-slate-500 font-mono">{secureTokenDoc.documentNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSecureTokenDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Time-Limited Encrypted Access Token</span>
              </div>
              <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                To maintain strict HIPAA and NABH privacy standards, hospital medical files are never served over public unprotected links. This ephemeral token authorizes 15 minutes of streamed viewing.
              </p>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Document Title:</span>
                <span className="font-bold text-slate-800">{secureTokenDoc.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-semibold text-slate-800">{secureTokenDoc.documentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Access Mode:</span>
                <span className="font-mono text-teal-800">{secureTokenDoc.secureAccess?.accessMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token Expiry:</span>
                <span className="font-mono font-bold text-slate-800">
                  {new Date(secureTokenDoc.secureAccess?.expiresAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">One-Time Token Hash:</span>
                <span className="font-mono text-[11px] text-slate-700 break-all select-all bg-white p-2 rounded border border-slate-200 block mt-1">
                  {secureTokenDoc.secureAccess?.token}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSecureTokenDoc(null)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Close Vault Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
