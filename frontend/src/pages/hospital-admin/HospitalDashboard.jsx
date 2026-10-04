import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  BedDouble, 
  TrendingUp, 
  Stethoscope, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Activity, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';

export const HospitalDashboard = () => {
  const { addToast } = useToast();
  const { tenant, activeBranch, branch } = useAuth();
  const [metrics, setMetrics] = useState({
    opdToday: 42,
    bedsOccupied: 46,
    totalBeds: 100,
    activeSurgeries: 3,
    collectionsToday: 184500,
    activeDoctors: 12
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success && res.data.stats) {
          const s = res.data.stats;
          setMetrics(prev => ({
            ...prev,
            opdToday: s.todayAppointments ?? prev.opdToday,
            bedsOccupied: (s.totalBeds - s.availableBeds) >= 0 ? (s.totalBeds - s.availableBeds) : prev.bedsOccupied,
            totalBeds: s.totalBeds ?? prev.totalBeds,
            collectionsToday: s.todayCollections ?? prev.collectionsToday
          }));
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    };
    fetchMetrics();
  }, [activeBranch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Administration & Operations</h1>
              <p className="text-xs text-slate-500">
                {tenant?.name || 'Hospital Vision Organization'}
                {(activeBranch || branch) ? ` • ${(activeBranch || branch).name}` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/hospital/reports">
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-1.5" /> Operations Reports
            </Button>
          </Link>
          <Link to="/hospital/approvals">
            <Button size="sm">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Approvals Inbox
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Today's OPD Consultations" 
          value={metrics.opdToday} 
          icon={<Users className="w-4 h-4 text-teal-600" />} 
        />
        <StatsCard 
          title="Inpatient Bed Occupancy" 
          value={`${metrics.bedsOccupied} / ${metrics.totalBeds}`} 
          subtitle="46% General & ICU Occupancy"
          icon={<BedDouble className="w-4 h-4 text-indigo-600" />} 
        />
        <StatsCard 
          title="Today's Realized Revenue" 
          value={`₹${metrics.collectionsToday.toLocaleString()}`} 
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />} 
        />
        <StatsCard 
          title="Clinicians on Duty" 
          value={`${metrics.activeDoctors} Doctors`} 
          subtitle="8 OPDs • 4 IPD Rounds"
          icon={<Stethoscope className="w-4 h-4 text-blue-600" />} 
        />
      </div>

      {/* Quick Administration Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/hospital/branches">
          <Card className="hover:border-teal-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Building2 className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Branch Management</h3>
            <p className="text-xs text-slate-500 mt-1">Configure tertiary branches, bed allocations, operating hours and emergency readiness</p>
          </Card>
        </Link>

        <Link to="/hospital/departments">
          <Card className="hover:border-teal-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Activity className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Department Master</h3>
            <p className="text-xs text-slate-500 mt-1">Manage Clinical, Diagnostic, Nursing and Support departments with designated HODs</p>
          </Card>
        </Link>

        <Link to="/hospital/users">
          <Card className="hover:border-teal-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Users className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Staff & User Directory</h3>
            <p className="text-xs text-slate-500 mt-1">Physician schedules, consultation tariffs, nursing rosters & role credentials</p>
          </Card>
        </Link>
      </div>
    </div>
  );
};
