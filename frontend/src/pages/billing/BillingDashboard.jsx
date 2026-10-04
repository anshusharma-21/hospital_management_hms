import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Search, 
  Plus, 
  DollarSign, 
  ShieldCheck, 
  FileText,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const BillingDashboard = () => {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/invoices');
      if (res.data.success) {
        const invs = res.data.data;
        setInvoices(invs);

        const billed = invs.reduce((sum, i) => sum + (i.netAmount || 0), 0);
        const collected = invs.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
        const outstanding = invs.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

        setSummary({
          totalBilled: billed,
          totalCollected: collected,
          totalOutstanding: outstanding,
          paidCount: invs.filter(i => i.status === 'paid').length,
          partialCount: invs.filter(i => i.status === 'partial').length,
          unpaidCount: invs.filter(i => i.status === 'unpaid').length
        });
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load billing metrics', 'error');
    } finally {
      setLoading(false);
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
              <h1 className="text-xl font-bold text-slate-900">Hospital Billing & Revenue Operations</h1>
              <p className="text-xs text-slate-500">Cross-department billing, cashier desks, partial payments, TPA claims & refunds</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/billing/collect">
            <Button size="sm">
              <CreditCard className="w-4 h-4 mr-1.5" /> Cashier Payment Desk
            </Button>
          </Link>
          <Link to="/billing/invoices">
            <Button variant="outline" size="sm">
              <Receipt className="w-4 h-4 mr-1.5" /> All Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Invoiced Gross" 
          value={`₹${summary.totalBilled.toLocaleString()}`} 
          icon={<Receipt className="w-4 h-4 text-teal-600" />} 
        />
        <StatsCard 
          title="Total Realized Collections" 
          value={`₹${summary.totalCollected.toLocaleString()}`} 
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} 
        />
        <StatsCard 
          title="Pending Receivables / Dues" 
          value={`₹${summary.totalOutstanding.toLocaleString()}`} 
          icon={<Clock className="w-4 h-4 text-rose-600" />} 
        />
        <StatsCard 
          title="Invoices Overview" 
          value={`${invoices.length} Invoices`} 
          subtitle={`${summary.paidCount} Paid • ${summary.partialCount} Partial • ${summary.unpaidCount} Due`}
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />} 
        />
      </div>

      {/* Recent Invoices Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Recent Hospital Invoices Ledger</h2>
          </div>
          <Link to="/billing/invoices" className="text-xs font-semibold text-teal-700 hover:underline">
            View All Invoices →
          </Link>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Invoice #</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Bill Date</TableHeader>
              <TableHeader>Net Total</TableHeader>
              <TableHeader>Paid</TableHeader>
              <TableHeader>Balance Due</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.slice(0, 5).map((inv) => (
              <TableRow key={inv._id}>
                <TableCell className="font-mono font-bold text-teal-700 text-xs">{inv.invoiceNumber}</TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-800 text-xs">{inv.patient?.fullName}</p>
                  <p className="font-mono text-[11px] text-slate-400">{inv.patient?.uhid}</p>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">
                  {inv.department?.name || 'General OPD'}
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-slate-900">
                  ₹{inv.netAmount?.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-emerald-700 font-semibold">
                  ₹{inv.paidAmount?.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-rose-700 font-bold">
                  ₹{inv.balanceAmount?.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'danger'}>
                    {inv.status?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link to={`/billing/collect?invoiceId=${inv._id}`}>
                    <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                      Pay / Receipt
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
