import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  Printer,
  ChevronRight,
  X,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientBills = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'payments'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.allSettled([
        api.get('/billing/invoices'),
        api.get('/billing/payments')
      ]);

      if (invRes.status === 'fulfilled' && invRes.value.data?.success) {
        setInvoices(invRes.value.data.data || []);
      }
      if (payRes.status === 'fulfilled' && payRes.value.data?.success) {
        setPayments(payRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load billing records:', err);
      addToast('Could not load billing or payment records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceStatusBadge = (status) => {
    // Backend enum: 'Draft', 'Finalized', 'Partially Paid', 'Fully Paid', 'Cancelled', 'Refunded'
    switch (status) {
      case 'Fully Paid':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Fully Paid</span>;
      case 'Partially Paid':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Partially Paid</span>;
      case 'Finalized':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Finalized</span>;
      case 'Draft':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Draft</span>;
      case 'Cancelled':
      case 'Refunded':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bills & Payments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent hospital invoices, payment receipts, and balance settlement
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>GST Compliant Invoices</span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Invoiced</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{invoices.length} Invoices Generated</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Amount Paid</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{totalPaid.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">{payments.length} Verified Receipts</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Outstanding Balance Due</span>
          <p className={`text-2xl font-extrabold mt-1 ${totalBalance > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            ₹{totalBalance.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {totalBalance === 0 ? 'All bills settled' : 'Payable at hospital cashier'}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'invoices' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Hospital Invoices ({invoices.length})</span>
          {activeTab === 'invoices' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'payments' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Payment Receipts ({payments.length})</span>
          {activeTab === 'payments' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Content based on Active Tab */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
        </div>
      ) : activeTab === 'invoices' ? (
        invoices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No hospital invoices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any outpatient consultation, pharmacy, or inpatient stay invoices generated will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-mono">
                          {inv.invoiceNumber}
                        </span>
                        {getInvoiceStatusBadge(inv.status)}
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          {inv.billingType || 'OPD Consultation'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issued on {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block text-[10px] uppercase font-bold">Total Bill</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{Number(inv.grandTotal).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Items</span>
                    </button>
                  </div>
                </div>

                {/* Amounts Breakdown Bar */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Grand Total</span>
                    <span className="font-bold text-slate-800">₹{Number(inv.grandTotal).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Paid Amount</span>
                    <span className="font-bold text-emerald-700">₹{Number(inv.paidAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Balance Due</span>
                    <span className={`font-bold ${inv.balanceDue > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      ₹{Number(inv.balanceDue).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        payments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No payment receipts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Receipts for payments made via Cash, UPI, Credit/Debit card or Insurance will be archived here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((pay) => (
              <div
                key={pay._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {pay.receiptNumber}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {pay.status || 'Completed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mode: <strong className="text-slate-700">{pay.paymentMethod}</strong> • {new Date(pay.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount Paid</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      ₹{Number(pay.amountPaid).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPayment(pay)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  INV
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Hospital Vision Invoice</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Billed Patient</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{user?.patientData?.fullName || user?.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">UHID: {user?.patientData?.uhid}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice Status</span>
                <span className="font-bold text-teal-800 mt-0.5 block">{selectedInvoice.status}</span>
                <span className="text-[11px] text-slate-500">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Itemized Services</h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Tax</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{item.description}</td>
                        <td className="py-2.5 px-3 font-mono">{item.quantity || 1}</td>
                        <td className="py-2.5 px-3 font-mono">₹{item.unitPrice}</td>
                        <td className="py-2.5 px-3 font-mono">₹{item.taxAmount || 0}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-900">
                          ₹{item.totalAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-mono font-semibold">₹{selectedInvoice.grandTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid to Date:</span>
                <span className="font-mono font-semibold text-emerald-700">₹{selectedInvoice.paidAmount}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                <span>Remaining Balance Due:</span>
                <span className="font-mono text-slate-900">₹{selectedInvoice.balanceDue}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">Official Hospital Vision Receipt</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  REC
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Payment Receipt</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedPayment.receiptNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Amount Received</span>
              <p className="text-3xl font-black text-emerald-700">₹{Number(selectedPayment.amountPaid).toLocaleString()}</p>
              <span className="text-[11px] text-emerald-800/80 font-mono block">Status: Payment Verified</span>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{user?.patientData?.fullName || user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UHID:</span>
                <span className="font-mono text-slate-800">{user?.patientData?.uhid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-800">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedPayment.transactionReference && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Txn Ref:</span>
                  <span className="font-mono text-slate-800">{selectedPayment.transactionReference}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[10px] text-slate-400">Hospital Vision Cashier System</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
