import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Calendar,
  Clock,
  User,
  Barcode,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Eye,
  X,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientLabReports = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/lab-orders');
      if (res.data?.success) {
        setLabOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load lab reports:', err);
      addToast('Could not load laboratory test orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>;
      case 'In Progress':
      case 'Analyzing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">In Progress</span>;
      case 'Sample Collected':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Sample Collected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Laboratory Diagnostics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pathology, biochemistry, and clinical lab test investigations with reference ranges
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>NABH / NABL Standards Compliant</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
        </div>
      ) : labOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No laboratory investigations recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When blood, urine or pathology tests are ordered by your physician, track sample accessioning and test results here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {labOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.overallStatus)}
                      {order.criticalAlert && (
                        <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Critical Alert</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested by <strong>Dr. {order.doctor?.name || 'Physician'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {order.sampleBarcode && (
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-mono text-slate-700 border border-slate-200">
                      <Barcode className="w-4 h-4 text-slate-500" />
                      <span>{order.sampleBarcode}</span>
                    </div>
                  )}
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </span>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </button>
                </div>
              </div>

              {/* Tests Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Test Parameter</th>
                      <th className="py-2.5 px-4">Result Value</th>
                      <th className="py-2.5 px-4">Biological Reference Range</th>
                      <th className="py-2.5 px-4">Status / Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.tests?.map((test, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {test.testName}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 font-mono">
                          {test.resultValue ? `${test.resultValue} ${test.unit || ''}` : 'Pending Analysis'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {test.referenceRange || 'Standard normal range'}
                        </td>
                        <td className="py-2.5 px-4">
                          {test.isCritical ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px]">Critical</span>
                          ) : test.isAbnormal ? (
                            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">Abnormal</span>
                          ) : test.resultValue ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Normal</span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">{test.status || 'Ordered'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lab Report Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  LAB
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Laboratory Investigation Report</h3>
                  <p className="text-xs text-slate-500 font-mono">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
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
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Ordering Physician</span>
                <span className="font-bold text-slate-900 mt-0.5 block">Dr. {selectedOrder.doctor?.name || 'Hospital Physician'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Sample Barcode</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">{selectedOrder.sampleBarcode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Order Date</span>
                <span className="font-mono text-slate-700 mt-0.5 block">
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Test Findings</h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Test Parameter</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.tests?.map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{t.testName}</td>
                        <td className="py-2.5 px-3 font-semibold font-mono text-slate-800">
                          {t.resultValue ? `${t.resultValue} ${t.unit || ''}` : 'Awaiting Lab Result'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{t.referenceRange || '—'}</td>
                        <td className="py-2.5 px-3">
                          {t.isCritical ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px]">Critical</span>
                          ) : t.isAbnormal ? (
                            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">Abnormal</span>
                          ) : (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Status: <strong>{selectedOrder.overallStatus}</strong>
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Diagnostic Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
