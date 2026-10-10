import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Receipt, 
  CheckCircle2, 
  Printer, 
  DollarSign, 
  User, 
  Clock, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const PaymentCollection = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetInvoiceId = searchParams.get('invoiceId');

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPaymentReceipt, setLastPaymentReceipt] = useState(null);

  useEffect(() => {
    fetchPendingInvoices();
  }, [targetInvoiceId]);

  const fetchPendingInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
        if (targetInvoiceId) {
          const matched = res.data.data.find(i => i._id === targetInvoiceId);
          if (matched) selectInvoiceForPayment(matched);
        } else if (res.data.data.length > 0) {
          const unpaidList = res.data.data.filter(i => (i.balanceDue !== undefined ? i.balanceDue : (i.balanceAmount || 0)) > 0);
          if (unpaidList.length > 0) {
            selectInvoiceForPayment(unpaidList[0]);
          } else {
            setSelectedInvoice(null);
          }
        } else {
          setSelectedInvoice(null);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load pending invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectInvoiceForPayment = (inv) => {
    setSelectedInvoice(inv);
    const due = inv.balanceDue !== undefined ? inv.balanceDue : (inv.balanceAmount || inv.grandTotal || inv.netAmount || 0);
    setPaymentAmount(due);
    setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid payment amount', 'warning');
      return;
    }

    const currentBalance = selectedInvoice.balanceDue !== undefined ? selectedInvoice.balanceDue : (selectedInvoice.balanceAmount || 0);
    if (amount > currentBalance) {
      addToast('Payment amount exceeds current balance due', 'warning');
      return;
    }

    try {
      const payload = {
        invoiceId: selectedInvoice._id,
        patientId: selectedInvoice.patient?._id,
        amount,
        paymentMethod,
        transactionReference: transactionRef,
        notes
      };

      const res = await api.post('/billing/payments', payload);
      if (res.data.success) {
        setLastPaymentReceipt({
          receiptNumber: res.data.data?.receiptNumber || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          invoiceNumber: selectedInvoice.invoiceNumber,
          patientName: selectedInvoice.patient?.fullName,
          uhid: selectedInvoice.patient?.uhid,
          amountPaid: amount,
          paymentMethod,
          transactionRef,
          remainingBalance: Math.max(0, currentBalance - amount),
          date: new Date().toLocaleString()
        });
        setShowReceiptModal(true);
        addToast(`Payment of ₹${amount} collected successfully!`, 'success');
        fetchPendingInvoices();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to process payment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Cashier Payment Collection Counter</h1>
              <p className="text-xs text-slate-500">Collect full/partial installments, reconcile advances & print official money receipts</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPendingInvoices}>
          Refresh Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Unpaid Invoices List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Invoices with Outstanding Balance</span>
              <Badge variant="neutral">{invoices.filter(i => (i.balanceDue !== undefined ? i.balanceDue : (i.balanceAmount || 0)) > 0).length} Due</Badge>
            </div>

            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {invoices
                .filter(i => (i.balanceDue !== undefined ? i.balanceDue : (i.balanceAmount || 0)) > 0)
                .map((inv) => {
                  const isSelected = selectedInvoice?._id === inv._id;
                  const invDue = inv.balanceDue !== undefined ? inv.balanceDue : (inv.balanceAmount || 0);
                  const invTotal = inv.grandTotal !== undefined ? inv.grandTotal : (inv.netAmount || 0);
                  return (
                    <div
                      key={inv._id}
                      onClick={() => selectInvoiceForPayment(inv)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/90 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono font-bold text-teal-700 text-xs">{inv.invoiceNumber}</span>
                        <span className="font-mono font-bold text-xs text-rose-700">Due: ₹{invDue}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{inv.patient?.fullName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{inv.patient?.uhid}</p>
                      <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                        <span>Total: ₹{invTotal}</span>
                        <Badge variant={inv.status === 'paid' || inv.status === 'Fully Paid' ? 'success' : inv.status === 'partial' || inv.status === 'Partially Paid' ? 'warning' : 'danger'}>
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              {invoices.filter(i => (i.balanceDue !== undefined ? i.balanceDue : (i.balanceAmount || 0)) > 0).length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">All Invoices Cleared</p>
                  <p className="text-[11px] text-slate-400 mt-1">No pending or outstanding balances found.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Payment Collection Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedInvoice ? (
            <Card className="border-slate-200">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</span>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedInvoice.patient?.fullName}</h3>
                  <p className="font-mono text-teal-700 font-semibold">{selectedInvoice.patient?.uhid}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Balance</span>
                  <p className="font-mono font-bold text-rose-700 text-lg">
                    ₹{selectedInvoice.balanceDue !== undefined ? selectedInvoice.balanceDue : (selectedInvoice.balanceAmount || 0)}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Total: ₹{selectedInvoice.grandTotal !== undefined ? selectedInvoice.grandTotal : (selectedInvoice.netAmount || 0)}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Collection Amount (₹)</label>
                  <div className="flex gap-2">
                    <Input 
                      type="number"
                      min="1"
                      max={selectedInvoice.balanceDue !== undefined ? selectedInvoice.balanceDue : (selectedInvoice.balanceAmount || 0)}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="font-mono font-bold text-base text-teal-800"
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPaymentAmount(selectedInvoice.balanceDue !== undefined ? selectedInvoice.balanceDue : (selectedInvoice.balanceAmount || 0))}
                    >
                      Full Balance
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Cash', 'UPI / QR', 'Card', 'TPA / Ins'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          paymentMethod === mode
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Transaction / Reference #</label>
                    <Input 
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="Cheque / UPI / Auth code"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cashier Remarks</label>
                    <Input 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Balance Preview */}
                <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200 flex justify-between items-center text-xs">
                  <span className="text-teal-900 font-medium">Remaining balance after this transaction:</span>
                  <span className="font-mono font-bold text-teal-800 text-sm">
                    ₹{Math.max(0, selectedInvoice.balanceAmount - Number(paymentAmount || 0))}
                  </span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={selectedInvoice.balanceAmount <= 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Payment & Print Money Receipt
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="text-center py-20 text-slate-400 text-xs">
              Select an invoice from the queue to collect payment.
            </Card>
          )}
        </div>
      </div>

      {/* Official Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Official Hospital Money Receipt"
      >
        {lastPaymentReceipt && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-2.5">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedInvoice?.tenant?.name || user?.tenant?.name || 'Hospital Vision'}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {selectedInvoice?.branch?.name || user?.branch?.name || 'Revenue & Collection Counter'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {[
                    selectedInvoice?.branch?.address?.city || user?.branch?.address?.city || user?.tenant?.address?.city,
                    selectedInvoice?.branch?.address?.state || user?.branch?.address?.state || user?.tenant?.address?.state,
                    user?.branch?.phone || user?.tenant?.phone ? `Tel: ${user?.branch?.phone || user?.tenant?.phone}` : null
                  ].filter(Boolean).join(' • ')}
                </p>
              </div>

              <div className="flex justify-between font-bold text-teal-800">
                <span>Receipt #: {lastPaymentReceipt.receiptNumber}</span>
                <span>{lastPaymentReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient: {lastPaymentReceipt.patientName}</span>
                <span>UHID: {lastPaymentReceipt.uhid}</span>
              </div>
              <div className="flex justify-between">
                <span>Against Invoice: {lastPaymentReceipt.invoiceNumber}</span>
                <span>Mode: {lastPaymentReceipt.paymentMethod}</span>
              </div>
              <div className="text-[10px] text-slate-500">Txn Ref: {lastPaymentReceipt.transactionRef}</div>

              <div className="py-2.5 border-t border-b border-dashed border-slate-300 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">AMOUNT RECEIVED:</span>
                <span className="font-bold text-emerald-700 text-base">₹{lastPaymentReceipt.amountPaid}</span>
              </div>

              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Remaining Balance Due:</span>
                <span className="font-bold text-rose-700">₹{lastPaymentReceipt.remainingBalance}</span>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                This is a computer-generated money receipt. No physical signature required.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReceiptModal(false)}>
                Done
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
