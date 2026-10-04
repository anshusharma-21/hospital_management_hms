import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  Search, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const PharmacyDashboard = () => {
  const { addToast } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const [rxRes, medRes] = await Promise.all([
        api.get('/pharmacy/prescriptions'),
        api.get('/pharmacy/medicines')
      ]);

      if (rxRes.data.success) {
        setPrescriptions(rxRes.data.data);
      }
      if (medRes.data.success) {
        setMedicines(medRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingRx = prescriptions.filter(p => p.pharmacyStatus === 'pending');
  const dispensedRx = prescriptions.filter(p => p.pharmacyStatus === 'dispensed');
  const lowStock = medicines.filter(m => (m.totalStock || 0) <= (m.reorderLevel || 50));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Pharmacy & POS Station</h1>
              <p className="text-xs text-slate-500">e-Prescription validation, FEFO batch dispensing, inventory management & receipts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/pharmacy/inventory">
            <Button variant="outline" size="sm">
              <PackageCheck className="w-4 h-4 mr-1.5" /> Medicine Master
            </Button>
          </Link>
          <Link to="/pharmacy/pos">
            <Button size="sm">
              <ShoppingCart className="w-4 h-4 mr-1.5" /> Open Dispense POS
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Pending Prescriptions" 
          value={pendingRx.length} 
          icon={<Clock className="w-4 h-4 text-amber-600" />} 
        />
        <StatsCard 
          title="Dispensed Today" 
          value={dispensedRx.length} 
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} 
        />
        <StatsCard 
          title="Low Stock Items" 
          value={lowStock.length} 
          icon={<AlertTriangle className="w-4 h-4 text-rose-600" />} 
        />
        <StatsCard 
          title="Active Formulations" 
          value={medicines.length} 
          icon={<Pill className="w-4 h-4 text-teal-600" />} 
        />
      </div>

      {/* Pending Prescriptions Queue */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Pending Outpatient & Inpatient Prescriptions Queue</h2>
            <Badge variant="warning">{pendingRx.length} Pending</Badge>
          </div>
          <Link to="/pharmacy/pos" className="text-xs font-semibold text-teal-700 hover:underline">
            View All in POS →
          </Link>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Rx Number</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Prescribing Doctor</TableHeader>
              <TableHeader>Medicines Prescribed</TableHeader>
              <TableHeader>Date / Time</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingRx.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                  All doctor e-prescriptions have been dispensed and cleared.
                </TableCell>
              </TableRow>
            ) : (
              pendingRx.map((rx) => (
                <TableRow key={rx._id}>
                  <TableCell className="font-mono font-bold text-teal-700 text-xs">{rx.prescriptionNumber}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-800 text-xs">{rx.patient?.fullName}</p>
                    <p className="font-mono text-[11px] text-slate-400">{rx.patient?.uhid}</p>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {rx.doctor?.name || 'Dr. Arun Sharma'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rx.medicines?.map((m, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {m.medicineName} ({m.quantity} qty)
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">
                    {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">Awaiting Dispense</Badge>
                  </TableCell>
                  <TableCell>
                    <Link to="/pharmacy/pos">
                      <Button size="sm" className="text-xs py-1 px-3">
                        Dispense in POS
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
