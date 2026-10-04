import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Printer, 
  FileText, 
  Clock, 
  ShieldCheck, 
  User, 
  ChevronRight,
  Send
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const LabWorkbench = () => {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [resultsForm, setResultsForm] = useState([]);
  const [isCritical, setIsCritical] = useState(false);
  const [pathologistNotes, setPathologistNotes] = useState('Morphology within normal parameters. Correlate clinically.');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    fetchWorkbenchOrders();
  }, []);

  const fetchWorkbenchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/lab-orders');
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.data.length > 0) {
          selectOrderForEntry(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load lab workbench', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectOrderForEntry = (ord) => {
    setActiveOrder(ord);
    setIsCritical(ord.isCritical || false);
    setPathologistNotes(ord.pathologistNotes || 'Morphology within normal parameters. Correlate clinically.');

    // Initialize test parameters from order
    if (ord.tests && ord.tests.length > 0) {
      const initialParams = ord.tests.map(t => {
        let defaultVal = t.resultValue || '';
        let defaultUnit = t.unit || 'mg/dL';
        let defaultRef = t.referenceRange || 'Normal';
        
        if (t.testName.includes('Hemoglobin') && !defaultVal) {
          defaultVal = '13.8';
          defaultUnit = 'g/dL';
          defaultRef = '13.0 - 17.0';
        } else if (t.testName.includes('WBC') && !defaultVal) {
          defaultVal = '7200';
          defaultUnit = '/mcL';
          defaultRef = '4000 - 11000';
        } else if (t.testName.includes('Platelet') && !defaultVal) {
          defaultVal = '240000';
          defaultUnit = '/mcL';
          defaultRef = '150000 - 450000';
        } else if (t.testName.includes('Creatinine') && !defaultVal) {
          defaultVal = '0.9';
          defaultUnit = 'mg/dL';
          defaultRef = '0.7 - 1.3';
        } else if (t.testName.includes('Blood Sugar') && !defaultVal) {
          defaultVal = '112';
          defaultUnit = 'mg/dL';
          defaultRef = '70 - 100 Fasting';
        }

        return {
          testName: t.testName,
          resultValue: defaultVal,
          unit: defaultUnit,
          referenceRange: defaultRef,
          flag: t.flag || 'NORMAL'
        };
      });
      setResultsForm(initialParams);
    }
  };

  const handleResultChange = (idx, val) => {
    const updated = [...resultsForm];
    updated[idx].resultValue = val;
    
    // Auto-flag demo
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (updated[idx].testName.includes('Hemoglobin') && num < 10) {
        updated[idx].flag = 'LOW';
      } else if (updated[idx].testName.includes('Creatinine') && num > 1.5) {
        updated[idx].flag = 'HIGH';
        setIsCritical(true);
      } else if (updated[idx].testName.includes('Platelet') && num < 50000) {
        updated[idx].flag = 'CRITICAL';
        setIsCritical(true);
      } else {
        updated[idx].flag = 'NORMAL';
      }
    }

    setResultsForm(updated);
  };

  const handleSaveDraft = async () => {
    try {
      const payload = {
        tests: resultsForm,
        isCritical,
        status: 'processing',
        isVerified: false,
        pathologistRemarks: pathologistNotes,
        pathologistNotes
      };
      await api.put(`/diagnostics/lab-orders/${activeOrder._id}/results`, payload);
      addToast('Analyzer parameters saved as draft', 'success');
      fetchWorkbenchOrders();
    } catch (err) {
      console.error(err);
      addToast('Error saving analyzer parameters', 'error');
    }
  };

  const handleVerifyReport = async () => {
    try {
      const payload = {
        tests: resultsForm,
        isCritical,
        status: 'verified',
        isVerified: true,
        pathologistRemarks: pathologistNotes,
        pathologistNotes,
        verifiedAt: new Date(),
        verifiedBy: 'Dr. Sujata Rao (MD Pathology)'
      };
      const res = await api.put(`/diagnostics/lab-orders/${activeOrder._id}/results`, payload);
      if (res.data.success) {
        addToast(`Lab report verified & published to Patient & Doctor portal!`, 'success');
        setShowVerifyModal(false);
        fetchWorkbenchOrders();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to verify lab report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pathology Analyzer Workbench</h1>
              <p className="text-xs text-slate-500">Analyzer result entry, reference ranges, panic value alerts & pathologist sign-off</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Report
          </Button>
          <Button size="sm" onClick={() => setShowVerifyModal(true)}>
            <ShieldCheck className="w-4 h-4 mr-1.5" /> Verify & Authorize
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Worklist Queue */}
        <Card className="p-0 overflow-hidden border-slate-200 lg:col-span-1">
          <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <span className="font-bold text-xs text-slate-800">Assigned Analyzer Worklist</span>
            <Badge variant="neutral">{orders.length} Orders</Badge>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {orders.map((ord) => {
              const isSelected = activeOrder?._id === ord._id;
              return (
                <div 
                  key={ord._id}
                  onClick={() => selectOrderForEntry(ord)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50/90 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono font-bold text-teal-700 text-xs">{ord.barcode}</span>
                    <Badge variant={ord.status === 'verified' ? 'success' : ord.status === 'processing' ? 'info' : 'warning'}>
                      {ord.status}
                    </Badge>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">{ord.patient?.fullName}</p>
                  <p className="font-mono text-[10px] text-slate-400">{ord.patient?.uhid}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ord.tests?.map((t, idx) => (
                      <span key={idx} className="bg-slate-200/80 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">
                        {t.testName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right 2 Columns: Result Entry Console */}
        <div className="lg:col-span-2 space-y-4">
          {activeOrder ? (
            <Card className="border-slate-200">
              {/* Order Patient Summary Bar */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 mb-5 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Demographics</span>
                  <h3 className="font-bold text-slate-900 text-sm">{activeOrder.patient?.fullName}</h3>
                  <p className="font-mono text-xs text-teal-700 font-semibold">{activeOrder.patient?.uhid}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specimen Barcode</span>
                  <p className="font-mono font-bold text-slate-800 text-xs">{activeOrder.barcode}</p>
                  <p className="text-[11px] text-slate-500">Order: {activeOrder.orderNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referring Doctor</span>
                  <p className="font-medium text-slate-800 text-xs">{activeOrder.doctor?.name || 'Dr. Arun Sharma'}</p>
                  <p className="text-[11px] text-slate-500">Dept: General Medicine</p>
                </div>
              </div>

              {/* Critical Alert Banner if Flagged */}
              {isCritical && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-between text-xs text-rose-800 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                    <span><strong>CRITICAL VALUE ALERT:</strong> Immediate clinical notification required to attending physician.</span>
                  </div>
                  <Badge variant="danger">PANIC VALUE</Badge>
                </div>
              )}

              {/* Parameter Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="p-3">Investigation Parameter</th>
                      <th className="p-3">Observed Value</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Biological Reference Interval</th>
                      <th className="p-3">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultsForm.map((param, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{param.testName}</td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={param.resultValue}
                            onChange={(e) => handleResultChange(idx, e.target.value)}
                            className="w-24 px-2 py-1 font-mono font-bold text-slate-800 rounded border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{param.unit}</td>
                        <td className="p-3 text-slate-600">{param.referenceRange}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            param.flag === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            param.flag === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            param.flag === 'LOW' ? 'bg-blue-100 text-blue-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {param.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Clinical Impression */}
              <div className="space-y-2 mb-5">
                <label className="text-xs font-bold text-slate-700 block">Pathologist Impression & Microscopic Notes</label>
                <textarea 
                  rows={2}
                  value={pathologistNotes}
                  onChange={(e) => setPathologistNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700">
                  <input 
                    type="checkbox" 
                    checked={isCritical}
                    onChange={(e) => setIsCritical(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Mark Order as Critical Panic Value</span>
                </label>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                    Save Draft
                  </Button>
                  <Button size="sm" onClick={() => setShowVerifyModal(true)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Authorize & Publish
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-20 text-slate-400 text-xs">
              Select an order from the left worklist to enter analyzer parameters.
            </Card>
          )}
        </div>
      </div>

      {/* Verify & Sign Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Authorize & Publish Diagnostic Lab Report"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are authorizing this diagnostic report as Pathologist. Once verified, this report will become immutable and immediately accessible on the Patient Portal and Doctor EMR.
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <p><strong>Patient:</strong> {activeOrder?.patient?.fullName} ({activeOrder?.patient?.uhid})</p>
            <p><strong>Barcode:</strong> {activeOrder?.barcode}</p>
            <p><strong>Pathologist:</strong> Dr. Sujata Rao (MD Pathology, Reg: MCI-41092)</p>
            <p><strong>Critical Alert:</strong> {isCritical ? 'YES (Panic Alert Triggered)' : 'No'}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVerifyModal(false)}>
              Back
            </Button>
            <Button size="sm" onClick={handleVerifyReport}>
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Apply Digital Signature & Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
