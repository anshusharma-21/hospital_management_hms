import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  FlaskConical, 
  Search, 
  CheckCircle2, 
  Clock, 
  Printer, 
  AlertCircle, 
  Tag, 
  User, 
  Calendar 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const LabSampleCollection = () => {
  const { addToast } = useToast();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [sampleDetails, setSampleDetails] = useState({
    tubeType: 'EDTA Lavender (Whole Blood)',
    sampleVolume: '3.0 mL',
    site: 'Left Antecubital Fossa',
    collectedBy: 'Staff Phlebotomist Sunita',
    notes: 'Sample collected with minimal hemolysis'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/lab-orders');
      if (res.data.success) {
        // Show orders that need sample collection or have samples
        setPendingOrders(res.data.data.filter(o => o.status === 'ordered' || o.status === 'sample_collected'));
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load lab sample queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollect = (ord) => {
    setSelectedOrder(ord);
    setShowCollectModal(true);
  };

  const handleConfirmCollection = async () => {
    try {
      const payload = {
        status: 'sample_collected',
        specimen: {
          sampleType: sampleDetails.tubeType,
          collectedAt: new Date(),
          collectedBy: sampleDetails.collectedBy,
          volume: sampleDetails.sampleVolume
        }
      };

      const res = await api.put(`/diagnostics/lab-orders/${selectedOrder._id}/collect-sample`, payload);
      if (res.data.success) {
        addToast(`Specimen collected & barcoded (${selectedOrder.barcode}) for ${selectedOrder.patient?.fullName}`, 'success');
        setShowCollectModal(false);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update sample collection status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Phlebotomy & Sample Collection Station</h1>
              <p className="text-xs text-slate-500">Specimen draw, vacutainer labeling, barcode printing & rack routing</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          Refresh Queue
        </Button>
      </div>

      {/* Queue Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Pending Specimen Collection Queue</h2>
            <Badge variant="neutral">{pendingOrders.length} Patients</Badge>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Order #</TableHeader>
              <TableHeader>Barcode</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Test Panel</TableHeader>
              <TableHeader>Sample Specimen Required</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                  All lab requisitions have been processed and collected.
                </TableCell>
              </TableRow>
            ) : (
              pendingOrders.map((ord) => (
                <TableRow key={ord._id}>
                  <TableCell className="font-mono font-bold text-teal-700 text-xs">{ord.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-800">
                      <QrCode className="w-3.5 h-3.5 text-teal-600" />
                      <span>{ord.barcode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{ord.patient?.fullName}</p>
                    <p className="font-mono text-[11px] text-slate-400">{ord.patient?.uhid}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ord.tests?.map((t, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {t.testName}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    Whole Blood (EDTA) / Serum
                  </TableCell>
                  <TableCell>
                    <Badge variant={ord.status === 'sample_collected' ? 'success' : 'warning'}>
                      {ord.status === 'sample_collected' ? 'Collected & Tagged' : 'Awaiting Phlebotomy'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        className="text-xs py-1 px-2.5"
                        onClick={() => handleOpenCollect(ord)}
                      >
                        {ord.status === 'sample_collected' ? 'Re-tag Sample' : 'Collect Specimen'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs py-1 px-2"
                        onClick={() => addToast(`Printing barcode label ${ord.barcode} on Zebra Thermal...`, 'info')}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Collect Sample Modal */}
      <Modal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        title="Collect & Barcode Specimen"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{selectedOrder.patient?.fullName}</p>
                <p className="font-mono text-slate-500">{selectedOrder.patient?.uhid}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-teal-700 text-sm">{selectedOrder.barcode}</span>
                <p className="text-[10px] text-slate-400">Order: {selectedOrder.orderNumber}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Vacutainer Tube Type</label>
                <select 
                  value={sampleDetails.tubeType}
                  onChange={(e) => setSampleDetails({...sampleDetails, tubeType: e.target.value})}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="EDTA Lavender (Whole Blood)">Lavender Top (K2-EDTA) — CBC / HbA1c</option>
                  <option value="SST Yellow/Gold (Serum Gel)">Gold / Yellow SST Gel — LFT, KFT, Lipids</option>
                  <option value="Sodium Fluoride Grey (Plasma)">Grey Top (Fluoride) — Fasting Blood Glucose</option>
                  <option value="Sodium Citrate Light Blue">Light Blue (Citrate) — Coagulation PT/INR</option>
                  <option value="Sterile Urine Container">Sterile Container — Urine Routine & Microscopy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Draw Volume</label>
                  <input 
                    type="text" 
                    value={sampleDetails.sampleVolume}
                    onChange={(e) => setSampleDetails({...sampleDetails, sampleVolume: e.target.value})}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Draw Site</label>
                  <input 
                    type="text" 
                    value={sampleDetails.site}
                    onChange={(e) => setSampleDetails({...sampleDetails, site: e.target.value})}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Phlebotomist In-Charge</label>
                <input 
                  type="text" 
                  value={sampleDetails.collectedBy}
                  onChange={(e) => setSampleDetails({...sampleDetails, collectedBy: e.target.value})}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCollectModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmCollection}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Confirm Draw & Affix Barcode
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
