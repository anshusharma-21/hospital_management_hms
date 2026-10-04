import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  Search, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Receipt, 
  User, 
  FileText,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const RefundsAdjustments = () => {
  const { addToast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    patientName: '',
    uhid: '',
    refundAmount: '',
    reason: ''
  });

  const fetchRefundsAndInvoices = async () => {
    try {
      setLoading(true);
      const [refundsRes, invoicesRes] = await Promise.allSettled([
        api.get('/billing/refunds'),
        api.get('/billing/invoices')
      ]);

      if (refundsRes.status === 'fulfilled' && refundsRes.value.data?.success) {
        setRefunds(refundsRes.value.data.data || []);
      }
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data?.data) {
        setInvoices(invoicesRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
      addToast('Failed to load refunds data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundsAndInvoices();
  }, []);

  const handleInvoiceSelect = (invNum) => {
    const matched = invoices.find(inv => inv.invoiceNumber === invNum);
    if (matched) {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: matched.invoiceNumber,
        patientName: matched.patient?.fullName || matched.patient?.name || '',
        uhid: matched.patient?.uhid || '',
        refundAmount: matched.paidAmount || '',
        reason: prev.reason || 'Authorized fee adjustment / cancellation'
      }));
    } else {
      setFormData(prev => ({ ...prev, invoiceNumber: invNum }));
    }
  };

  const handleCreateRefundRequest = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber) {
      addToast('Please provide an invoice number', 'error');
      return;
    }
    if (!formData.refundAmount || Number(formData.refundAmount) <= 0) {
      addToast('Refund amount must be greater than zero', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/billing/refunds', {
        invoiceNumber: formData.invoiceNumber.trim(),
        refundAmount: Number(formData.refundAmount),
        reason: formData.reason
      });

      if (res.data?.success) {
        addToast(res.data.message || 'Refund successfully processed and ledger updated', 'success');
        setShowRequestModal(false);
        setFormData({
          invoiceNumber: '',
          patientName: '',
          uhid: '',
          refundAmount: '',
          reason: ''
        });
        await fetchRefundsAndInvoices();
      }
    } catch (err) {
      console.error('Refund creation error:', err);
      addToast(err.response?.data?.error || 'Failed to process refund', 'error');
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
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Billing Refunds & Financial Adjustments</h1>
              <p className="text-xs text-slate-500">Credit notes, fee waivers, duplicate charge reversals & approval audit trail</p>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowRequestModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Request Refund / Waiver
        </Button>
      </div>

      {/* Refunds Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Financial Adjustments & Credit Notes</h2>
            <Badge variant="neutral">{refunds.length} Records</Badge>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-xs">Loading refund audit history...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No refund or adjustment records found</p>
            <p className="text-xs text-slate-400 mt-1">Processed credit notes and ledger adjustments will appear here.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Credit Note #</TableHeader>
                <TableHeader>Invoice #</TableHeader>
                <TableHeader>Patient (UHID)</TableHeader>
                <TableHeader>Refund Amount</TableHeader>
                <TableHeader>Justification Reason</TableHeader>
                <TableHeader>Processed By</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {refunds.map((ref) => (
                <TableRow key={ref._id || ref.id}>
                  <TableCell className="font-mono font-bold text-teal-700 text-xs">{ref.id || ref.receiptNumber}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{ref.invoiceNumber}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{ref.patientName}</p>
                    <p className="font-mono text-[11px] text-slate-400">{ref.uhid}</p>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-rose-700">₹{ref.amount}</TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">{ref.reason}</TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">{ref.approvedBy || ref.requestedBy}</TableCell>
                  <TableCell>
                    <Badge variant={ref.status === 'approved' || ref.status === 'Refunded' ? 'success' : 'warning'}>
                      {(ref.status || 'PROCESSED').toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Request Refund Modal */}
      <Modal 
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Create Refund / Waiver Request"
      >
        <form onSubmit={handleCreateRefundRequest} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Recent Invoice or Enter Invoice Number</label>
            {invoices.length > 0 && (
              <select
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 mb-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                value={formData.invoiceNumber}
              >
                <option value="">-- Choose Existing Invoice --</option>
                {invoices.map(inv => (
                  <option key={inv._id} value={inv.invoiceNumber}>
                    {inv.invoiceNumber} - {inv.patient?.fullName || 'Patient'} (Paid: ₹{inv.paidAmount || 0})
                  </option>
                ))}
              </select>
            )}
            <Input 
              placeholder="Or enter Invoice # e.g. INV-2026-001"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient Name</label>
              <Input 
                placeholder="Patient Full Name"
                value={formData.patientName}
                onChange={(e) => setFormData({...formData, patientName: e.target.value})}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient UHID</label>
              <Input 
                placeholder="UHID"
                value={formData.uhid}
                onChange={(e) => setFormData({...formData, uhid: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Refund Amount (₹)</label>
            <Input 
              type="number"
              placeholder="Amount to refund"
              value={formData.refundAmount}
              onChange={(e) => setFormData({...formData, refundAmount: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Justification / Waiver Reason</label>
            <textarea 
              rows={3}
              placeholder="State reason for refund/credit note..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Processing...' : 'Authorize Refund / Credit Note'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default RefundsAdjustments;
