import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  QrCode, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const LabDashboard = () => {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ordered: 0,
    collected: 0,
    processing: 0,
    completed: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLabOrders();
  }, []);

  const fetchLabOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/lab-orders');
      if (res.data.success) {
        setOrders(res.data.data);
        const counts = {
          total: res.data.data.length,
          ordered: res.data.data.filter(o => o.status === 'ordered').length,
          collected: res.data.data.filter(o => o.status === 'sample_collected').length,
          processing: res.data.data.filter(o => o.status === 'processing').length,
          completed: res.data.data.filter(o => o.status === 'completed' || o.status === 'verified').length,
          critical: res.data.data.filter(o => o.isCritical).length
        };
        setStats(counts);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load lab orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.patient?.uhid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-slate-900">Diagnostic Laboratory Operations</h1>
              <p className="text-xs text-slate-500">Specimen collection, analyzer workbench, critical alerts & pathologist verification</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/diagnostics/lab/sample-collection">
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-1.5" /> Sample Station
            </Button>
          </Link>
          <Link to="/diagnostics/lab/workbench">
            <Button size="sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Pathology Workbench
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total Requisitions" 
          value={stats.total} 
          icon={<FlaskConical className="w-4 h-4 text-teal-600" />} 
        />
        <StatsCard 
          title="Pending Collection" 
          value={stats.ordered} 
          icon={<Clock className="w-4 h-4 text-amber-600" />} 
        />
        <StatsCard 
          title="Processing / Analyzers" 
          value={stats.processing + stats.collected} 
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />} 
        />
        <StatsCard 
          title="Verified Reports" 
          value={stats.completed} 
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} 
        />
        <StatsCard 
          title="Critical Alerts" 
          value={stats.critical} 
          icon={<AlertTriangle className="w-4 h-4 text-rose-600" />} 
        />
      </div>

      {/* Orders Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Recent Diagnostic Lab Orders</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by UHID, patient, barcode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Order #</TableHeader>
              <TableHeader>Barcode</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Tests Requisitioned</TableHeader>
              <TableHeader>Priority</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Critical</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                  No diagnostic lab orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow key={ord._id}>
                  <TableCell className="font-mono font-bold text-teal-700 text-xs">{ord.orderNumber}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{ord.barcode}</TableCell>
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
                  <TableCell>
                    <Badge variant={ord.priority === 'stat' ? 'danger' : 'neutral'}>
                      {ord.priority?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      ord.status === 'verified' || ord.status === 'completed' ? 'success' :
                      ord.status === 'processing' ? 'info' :
                      ord.status === 'sample_collected' ? 'warning' : 'neutral'
                    }>
                      {ord.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ord.isCritical ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> High Alert
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Normal</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to="/diagnostics/lab/workbench">
                      <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                        Open Workbench
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
