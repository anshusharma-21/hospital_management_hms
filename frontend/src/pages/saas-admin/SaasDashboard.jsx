import React, { useState, useEffect } from 'react';
import { 
  Building, 
  TrendingUp, 
  Users, 
  BedDouble, 
  ShieldCheck, 
  Server, 
  Sparkles, 
  Plus, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';

export const SaasDashboard = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalPatients: 0,
    totalBeds: 0,
    mrr: 0,
    systemHealth: {
      uptime: '99.99%',
      databaseLatency: '1.4ms',
      apiStatus: 'Healthy',
      activeNodes: 1
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaasStats();
  }, []);

  const fetchSaasStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/saas/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
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
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Vision SaaS Platform Engine</h1>
              <p className="text-xs text-slate-500">Multi-tenant architecture governance, subscription MRR, health telemetry & global accounts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/saas/onboarding">
            <Button size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" /> Onboard Hospital Tenant
            </Button>
          </Link>
          <Link to="/saas/tenants">
            <Button variant="outline" size="sm">
              <Building className="w-4 h-4 mr-1.5" /> Tenant Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Active Hospital Tenants" 
          value={stats.activeTenants} 
          subtitle="Operational Organizations"
          icon={<Building className="w-4 h-4 text-teal-600" />} 
        />
        <StatsCard 
          title="Monthly Recurring Revenue" 
          value={`₹${(stats.mrr || 0).toLocaleString()}`} 
          subtitle={stats.mrr ? `Annualized Run Rate: ₹${(stats.mrr * 12).toLocaleString()}` : 'Recurring subscription revenue'}
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} 
        />
        <StatsCard 
          title="Licensed Hospital Beds" 
          value={`${stats.totalBeds || 0} Beds`} 
          subtitle="Across All Client Hospitals"
          icon={<BedDouble className="w-4 h-4 text-indigo-600" />} 
        />
        <StatsCard 
          title="Platform Uptime" 
          value={stats.systemHealth?.uptime || '99.99%'} 
          subtitle={`Latency: ${stats.systemHealth?.databaseLatency || '1.8ms'}`}
          icon={<Server className="w-4 h-4 text-blue-600" />} 
        />
      </div>

      {/* Platform Navigation Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/saas/tenants">
          <Card className="hover:border-teal-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Building className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Tenant Hospital Directory</h3>
            <p className="text-xs text-slate-500 mt-1">Manage hospital accounts, subscriptions, quotas, and support impersonation</p>
          </Card>
        </Link>

        <Link to="/saas/feature-flags">
          <Card className="hover:border-teal-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Tenant Feature Flags</h3>
            <p className="text-xs text-slate-500 mt-1">Enable or toggle modules per tenant: Lab, Radiology, AI Copilot, CRM, Insurance</p>
          </Card>
        </Link>

        <Link to="/saas/crm">
          <Card className="hover:border-teal-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Users className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">CRM & Enterprise Leads</h3>
            <p className="text-xs text-slate-500 mt-1">Track enterprise hospital sales pipeline, corporate tie-ups, and demo requests</p>
          </Card>
        </Link>
      </div>
    </div>
  );
};
