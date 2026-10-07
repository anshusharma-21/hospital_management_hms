import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  CreditCard, 
  Printer, 
  FileText, 
  ChevronRight, 
  Trash2, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

export const InvoiceList = () => {
  const { addToast } = useToast();
  const { activeBranch } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice Form
  const [newInv, setNewInv] = useState({
    patientUhid: '',
    patientName: '',
    billingType: 'OPD',
    department: 'General Medicine',
    items: [],
    discount: 0,
    tax: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, [activeBranch]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewInv({
      ...newInv,
      items: [...newInv.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const handleUpdateItem = (idx, field, val) => {
    const updated = [...newInv.items];
    updated[idx][field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = Number(field === 'quantity' ? val : updated[idx].quantity);
      const price = Number(field === 'unitPrice' ? val : updated[idx].unitPrice);
      updated[idx].total = qty * price;
    }
    setNewInv({ ...newInv, items: updated });
  };

  const handleRemoveItem = (idx) => {
    setNewInv({ ...newInv, items: newInv.items.filter((_, i) => i !== idx) });
  };

  const calculateGross = () => newInv.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const calculateNet = () => {
    const gross = calculateGross();
    const disc = Number(newInv.discount) || 0;
    const tax = Number(newInv.tax) || 0;
    return Math.max(0, gross - disc + tax);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      if (!newInv.patientUhid?.trim()) {
        addToast('Please enter the Patient UHID', 'warning');
        return;
      }
      if (newInv.items.length === 0) {
        addToast('Please add at least one line item to generate an invoice', 'warning');
        return;
      }

      // Find patient by UHID
      const patRes = await api.get(`/patients?search=${encodeURIComponent(newInv.patientUhid.trim())}`);
      const patient = patRes.data.data?.find(
        (p) => p.uhid?.toLowerCase() === newInv.patientUhid.trim().toLowerCase()
      ) || (patRes.data.data?.length === 1 ? patRes.data.data[0] : null);

      if (!patient) {
        addToast(`Patient with UHID "${newInv.patientUhid}" not found`, 'warning');
        return;
      }

      const gross = calculateGross();
      const net = calculateNet();

      const payload = {
        patient: patient._id,
        items: newInv.items,
        grossAmount: gross,
        discountAmount: Number(newInv.discount) || 0,
        taxAmount: Number(newInv.tax) || 0,
        netAmount: net,
        balanceAmount: net,
        status: 'unpaid'
      };

      const res = await api.post('/billing/invoices', payload);
      if (res.data.success) {
        addToast(`Invoice ${res.data.data?.invoiceNumber || ''} created successfully!`, 'success');
        setShowCreateModal(false);
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to create invoice', 'error');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient?.uhid?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && inv.status === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Invoices & Ledger</h1>
              <p className="text-xs text-slate-500">Itemized billing across OPD, IPD, Diagnostic services & Pharmacy</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Generate Invoice
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex gap-2">
          {['ALL', 'UNPAID', 'PARTIAL', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st 
                  ? 'bg-teal-800 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/90'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search invoice #, UHID, patient..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Invoice Number</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Bill Date</TableHeader>
              <TableHeader>Gross Amount</TableHeader>
              <TableHeader>Discount / Tax</TableHeader>
              <TableHeader>Net Total</TableHeader>
              <TableHeader>Paid</TableHeader>
              <TableHeader>Balance Due</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((inv) => (
              <TableRow key={inv._id}>
                <TableCell className="font-mono font-bold text-teal-700 text-xs">{inv.invoiceNumber}</TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-800 text-xs">{inv.patient?.fullName}</p>
                  <p className="font-mono text-[11px] text-slate-400">{inv.patient?.uhid}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">₹{inv.grossAmount?.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  -₹{inv.discountAmount || 0} / +₹{inv.taxAmount || 0}
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-slate-900">₹{inv.netAmount?.toLocaleString()}</TableCell>
                <TableCell className="font-mono font-semibold text-xs text-emerald-700">₹{inv.paidAmount?.toLocaleString()}</TableCell>
                <TableCell className="font-mono font-bold text-xs text-rose-700">₹{inv.balanceAmount?.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'danger'}>
                    {inv.status?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Link to={`/billing/collect?invoiceId=${inv._id}`}>
                      <Button size="sm" className="text-xs py-1 px-2.5">
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate Hospital Invoice"
        size="lg"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Patient UHID</label>
              <Input 
                value={newInv.patientUhid}
                onChange={(e) => setNewInv({...newInv, patientUhid: e.target.value})}
                placeholder="HV-2026-0001"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Department / Billing Type</label>
              <Select 
                value={newInv.billingType}
                onChange={(e) => setNewInv({...newInv, billingType: e.target.value})}
                options={[
                  { value: 'OPD', label: 'Outpatient (OPD Consultation)' },
                  { value: 'IPD', label: 'Inpatient (IPD Bed & Nursing)' },
                  { value: 'Diagnostics', label: 'Diagnostic Lab / Imaging' },
                  { value: 'Pharmacy', label: 'Pharmacy Medication' },
                  { value: 'Surgery', label: 'OT Surgical Package' }
                ]}
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Billable Line Items</label>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-2.5">Service / Charge Description</th>
                    <th className="p-2.5 w-20">Qty</th>
                    <th className="p-2.5 w-28">Rate (₹)</th>
                    <th className="p-2.5 w-28">Total (₹)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newInv.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-teal-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono text-center"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                          required
                        />
                      </td>
                      <td className="p-2 font-mono font-bold text-slate-800">
                        ₹{item.total}
                      </td>
                      <td className="p-2 text-center">
                        {newInv.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discount, Tax & Totals */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-2">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Discount Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  value={newInv.discount}
                  onChange={(e) => setNewInv({...newInv, discount: e.target.value})}
                  className="w-full p-2 rounded border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Tax / GST (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  value={newInv.tax}
                  onChange={(e) => setNewInv({...newInv, tax: e.target.value})}
                  className="w-full p-2 rounded border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-right font-mono flex flex-col justify-end">
              <div className="text-slate-600">Gross Total: ₹{calculateGross()}</div>
              <div className="text-emerald-700">Discount: -₹{newInv.discount || 0}</div>
              <div className="text-slate-600">Tax: +₹{newInv.tax || 0}</div>
              <div className="text-base font-bold text-slate-900 pt-1 border-t border-slate-300">
                Net Billable: ₹{calculateNet()}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Receipt className="w-4 h-4 mr-1.5" /> Generate & Lock Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
