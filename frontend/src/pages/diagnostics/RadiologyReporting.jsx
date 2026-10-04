import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileText, 
  Eye, 
  Layers, 
  ZoomIn, 
  Maximize2, 
  ShieldCheck,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const RadiologyReporting = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(queryOrderId || null);

  // Active study report state
  const [reportData, setReportData] = useState({
    _id: null,
    accessionNumber: 'ACC-PENDING',
    orderNumber: 'RAD-2026-XXXX',
    patientName: 'Select an Order',
    patientUhid: 'HV-XXXX',
    ageGender: 'N/A',
    modality: 'X-RAY',
    studyName: 'Medical Imaging Study',
    referringDoctor: 'Doctor Assigned',
    clinicalHistory: '',
    technique: 'Standard imaging protocol',
    findings: '',
    impression: '',
    status: 'Ordered'
  });

  useEffect(() => {
    loadOrderDetails();
  }, [queryOrderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      // Fetch list of orders
      const listRes = await api.get('/diagnostics/radiology-orders');
      const orders = listRes.data?.data || [];
      setAvailableOrders(orders);

      let targetOrder = null;
      if (queryOrderId) {
        try {
          const singleRes = await api.get(`/diagnostics/radiology-orders/${queryOrderId}`);
          targetOrder = singleRes.data?.data;
        } catch (err) {
          console.warn('Could not fetch single order, searching in list:', err);
          targetOrder = orders.find(o => o._id === queryOrderId);
        }
      }

      if (!targetOrder && orders.length > 0) {
        targetOrder = orders[0];
      }

      if (targetOrder) {
        setActiveOrderId(targetOrder._id);
        setIsCritical(Boolean(targetOrder.criticalFinding));
        setReportData({
          _id: targetOrder._id,
          accessionNumber: targetOrder.accessionNumber || `ACC-${targetOrder._id.slice(-6).toUpperCase()}`,
          orderNumber: targetOrder.orderNumber || 'RAD-ORDER',
          patientName: targetOrder.patient?.fullName || targetOrder.patient?.name || 'Patient',
          patientUhid: targetOrder.patient?.uhid || 'N/A',
          ageGender: `${targetOrder.patient?.age || '30'} Yrs / ${targetOrder.patient?.gender || 'Unknown'}`,
          modality: targetOrder.modality || 'CT',
          studyName: targetOrder.studyName || `${targetOrder.modality} ${targetOrder.bodyPart || 'Scan'}`,
          referringDoctor: targetOrder.doctor?.name ? `Dr. ${targetOrder.doctor.name}` : 'Attending Physician',
          clinicalHistory: targetOrder.clinicalIndication || 'Diagnostic evaluation requested by treating team.',
          technique: 'Standard multi-slice volumetric CT/Digital Radiography acquisition.',
          findings: targetOrder.findings || '',
          impression: targetOrder.impression || '',
          status: targetOrder.status || 'Ordered'
        });
      }
    } catch (err) {
      console.error('Error fetching radiology order:', err);
      addToast('Failed to load radiology order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId) => {
    const chosen = availableOrders.find(o => o._id === orderId);
    if (chosen) {
      setActiveOrderId(chosen._id);
      setIsCritical(Boolean(chosen.criticalFinding));
      setReportData({
        _id: chosen._id,
        accessionNumber: chosen.accessionNumber || `ACC-${chosen._id.slice(-6).toUpperCase()}`,
        orderNumber: chosen.orderNumber || 'RAD-ORDER',
        patientName: chosen.patient?.fullName || chosen.patient?.name || 'Patient',
        patientUhid: chosen.patient?.uhid || 'N/A',
        ageGender: `${chosen.patient?.age || '30'} Yrs / ${chosen.patient?.gender || 'Unknown'}`,
        modality: chosen.modality || 'CT',
        studyName: chosen.studyName || `${chosen.modality} ${chosen.bodyPart || 'Scan'}`,
        referringDoctor: chosen.doctor?.name ? `Dr. ${chosen.doctor.name}` : 'Attending Physician',
        clinicalHistory: chosen.clinicalIndication || 'Diagnostic evaluation requested.',
        technique: 'Standard imaging protocol.',
        findings: chosen.findings || '',
        impression: chosen.impression || '',
        status: chosen.status || 'Ordered'
      });
    }
  };

  const handleAuthorizeReport = async () => {
    if (!reportData._id) {
      addToast('No active radiology order selected', 'error');
      return;
    }
    if (!reportData.findings?.trim() || !reportData.impression?.trim()) {
      addToast('Please enter both findings and impression before signing', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.put(`/diagnostics/radiology-orders/${reportData._id}/report`, {
        findings: reportData.findings,
        impression: reportData.impression,
        criticalFinding: isCritical,
        criticalAlertRemarks: isCritical ? 'Immediate alert forwarded to attending clinician' : ''
      });

      if (res.data?.success) {
        setShowSignModal(false);
        setReportData(prev => ({ ...prev, status: 'Finalized' }));
        addToast('Radiology report digitally signed & authorized. Available to doctor and patient portal!', 'success');
      }
    } catch (err) {
      console.error('Error signing radiology report:', err);
      addToast(err.response?.data?.error || 'Failed to authorize radiology report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/diagnostics/radiology">
              <Button variant="outline" size="sm" className="p-2">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Radiologist Diagnostic Console</h1>
                {reportData.status && (
                  <Badge variant={reportData.status === 'Finalized' ? 'success' : 'warning'}>
                    {reportData.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">DICOM imaging review, structured findings & digital sign-off</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableOrders.length > 1 && (
            <select
              value={activeOrderId || ''}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 p-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 font-medium"
            >
              {availableOrders.map(o => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} - {o.patient?.fullName || 'Patient'} ({o.modality})
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Report
          </Button>
          <Button size="sm" onClick={() => setShowSignModal(true)} disabled={reportData.status === 'Finalized'}>
            <ShieldCheck className="w-4 h-4 mr-1.5" /> 
            {reportData.status === 'Finalized' ? 'Authorized' : 'Sign & Authorize'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
          <p className="text-xs">Loading radiology order and study metadata...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Simulated DICOM Multi-Slice Viewer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-200">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-teal-400">{reportData.accessionNumber}</span>
                  <span className="text-slate-400">• DICOM Preview</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ZoomIn className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Maximize2 className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Medical Imaging Display */}
              <div className="relative aspect-square flex items-center justify-center bg-black overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="w-full h-full rounded-2xl border border-teal-500/20 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center relative shadow-inner">
                    <div className="w-48 h-64 border-2 border-slate-700/60 rounded-[40%] flex items-center justify-between px-4 relative opacity-80">
                      <div className="w-16 h-36 border border-slate-600/50 rounded-[45%] bg-slate-800/30"></div>
                      <div className="w-16 h-36 border border-slate-600/50 rounded-[45%] bg-slate-800/30"></div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4 h-16 border-l border-r border-slate-600/40"></div>
                    </div>
                    <span className="absolute bottom-4 font-mono text-[10px] text-teal-400/80">
                      {reportData.modality} Window - Calibrated 1.0mm
                    </span>
                  </div>
                </div>

                {/* DICOM OSD HUD Text */}
                <div className="absolute top-2 left-2 font-mono text-[10px] text-teal-400/90 leading-tight pointer-events-none">
                  <p className="font-bold">{reportData.patientName}</p>
                  <p>{reportData.patientUhid}</p>
                  <p>{reportData.ageGender}</p>
                </div>

                <div className="absolute top-2 right-2 font-mono text-[10px] text-slate-400 text-right leading-tight pointer-events-none">
                  <p>Hospital Vision PACS</p>
                  <p>{reportData.modality} Station</p>
                  <p>{reportData.orderNumber}</p>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="p-2 border-t border-slate-800 flex gap-2 overflow-x-auto bg-slate-900/60">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-14 h-14 shrink-0 rounded border cursor-pointer flex items-center justify-center bg-black ${i === 1 ? 'border-teal-500' : 'border-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 font-mono">Series {i}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Diagnostic Structured Report (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-slate-200">
              {/* Patient Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 flex flex-wrap justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{reportData.patientName}</p>
                  <p className="font-mono text-teal-700">{reportData.patientUhid} • {reportData.ageGender}</p>
                </div>
                <div>
                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                    {reportData.modality}
                  </span>
                  <p className="font-mono text-slate-500 mt-0.5">{reportData.accessionNumber}</p>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Study Description</label>
                  <input 
                    type="text" 
                    value={reportData.studyName}
                    onChange={(e) => setReportData({...reportData, studyName: e.target.value})}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    disabled={reportData.status === 'Finalized'}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Indication & History</label>
                  <input 
                    type="text" 
                    value={reportData.clinicalHistory}
                    onChange={(e) => setReportData({...reportData, clinicalHistory: e.target.value})}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    disabled={reportData.status === 'Finalized'}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Imaging Findings (Detailed Description)</label>
                  <textarea 
                    rows={6}
                    placeholder="Enter diagnostic imaging findings, organ pathology, soft tissue evaluation..."
                    value={reportData.findings}
                    onChange={(e) => setReportData({...reportData, findings: e.target.value})}
                    className="w-full font-mono text-xs rounded-xl border border-slate-300 p-2.5 leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    disabled={reportData.status === 'Finalized'}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Conclusion / Impression</label>
                  <textarea 
                    rows={2}
                    placeholder="Summary impression and diagnostic conclusions..."
                    value={reportData.impression}
                    onChange={(e) => setReportData({...reportData, impression: e.target.value})}
                    className="w-full font-bold text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-teal-50/30"
                    disabled={reportData.status === 'Finalized'}
                  />
                </div>

                {/* Critical Alert Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-700">
                    <input 
                      type="checkbox" 
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      disabled={reportData.status === 'Finalized'}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Flag as Critical Finding (Emergency Physician Alert)</span>
                  </label>
                  {isCritical && <Badge variant="danger">High Alert</Badge>}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Digital Sign Modal */}
      <Modal 
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        title="Digitally Sign Radiology Report"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Authorizing this study locks the medical findings. The signed report and DICOM accession record will be immediately published to the referring physician and patient portal.
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <p><strong>Order Number:</strong> {reportData.orderNumber}</p>
            <p><strong>Patient:</strong> {reportData.patientName} ({reportData.patientUhid})</p>
            <p><strong>Modality & Study:</strong> {reportData.modality} - {reportData.studyName}</p>
            <p><strong>Critical Alert:</strong> {isCritical ? 'YES - STAT Alert' : 'No'}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSignModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAuthorizeReport} disabled={submitting}>
              {submitting ? 'Signing...' : 'Sign & Publish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default RadiologyReporting;
