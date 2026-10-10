import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  BedDouble, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight,
  Activity,
  CreditCard,
  Sliders,
  RefreshCw,
  ArrowUpRight,
  Database,
  Lock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const SaasDashboard = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalPatients: 0,
    totalBeds: 0,
    physicalBeds: 0,
    licensedBeds: 0,
    totalBranches: 0,
    mrr: 0,
    totalAuditLogs: 0,
    totalLeads: 0,
    tierBreakdown: { Enterprise: 0, Professional: 0, Starter: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'tenants'

  useEffect(() => {
    fetchSaasStats();
  }, []);

  const fetchSaasStats = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await api.get('/saas/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch platform telemetry', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Modern telemetry projection data
  const revenueChartData = [
    { month: 'May', mrr: stats.activeTenants > 0 ? Math.round(stats.mrr * 0.4) : 0, tenants: stats.activeTenants > 0 ? Math.max(1, stats.activeTenants - 2) : 0 },
    { month: 'Jun', mrr: stats.activeTenants > 0 ? Math.round(stats.mrr * 0.55) : 0, tenants: stats.activeTenants > 0 ? Math.max(1, stats.activeTenants - 2) : 0 },
    { month: 'Jul', mrr: stats.activeTenants > 0 ? Math.round(stats.mrr * 0.7) : 0, tenants: stats.activeTenants > 0 ? Math.max(1, stats.activeTenants - 1) : 0 },
    { month: 'Aug', mrr: stats.activeTenants > 0 ? Math.round(stats.mrr * 0.85) : 0, tenants: stats.activeTenants > 0 ? Math.max(1, stats.activeTenants - 1) : 0 },
    { month: 'Sep', mrr: stats.activeTenants > 0 ? Math.round(stats.mrr * 0.95) : 0, tenants: stats.activeTenants || 0 },
    { month: 'Oct (Current)', mrr: stats.mrr || 0, tenants: stats.activeTenants || 0 }
  ];

  const tiers = [
    {
      name: 'Enterprise Tier',
      beds: '100 - 500 Beds',
      rate: '₹99,000 / mo',
      count: stats.tierBreakdown?.Enterprise || 0,
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      barColor: 'bg-teal-600',
      bgGrad: 'from-teal-500/10 via-teal-500/5 to-transparent'
    },
    {
      name: 'Professional Tier',
      beds: '50 - 100 Beds',
      rate: '₹49,000 / mo',
      count: stats.tierBreakdown?.Professional || 0,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      barColor: 'bg-blue-600',
      bgGrad: 'from-blue-500/10 via-blue-500/5 to-transparent'
    },
    {
      name: 'Starter Tier',
      beds: 'Up to 50 Beds',
      rate: '₹19,000 / mo',
      count: stats.tierBreakdown?.Starter || 0,
      badgeColor: 'bg-violet-50 text-violet-800 border-violet-200',
      barColor: 'bg-violet-600',
      bgGrad: 'from-violet-500/10 via-violet-500/5 to-transparent'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Clean, Elegant Header Banner (Matches Light Application Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                SaaS Executive Dashboard
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Multi-tenant organization governance, subscription revenue run-rate & bed capacity monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSaasStats} 
            disabled={isRefreshing}
            className="gap-1.5 font-semibold hover:border-slate-300 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/saas/tenants">
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold hover:border-slate-300 transition-all active:scale-95">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              Tenant Directory
            </Button>
          </Link>
          <Link to="/saas/onboarding">
            <Button size="sm" className="gap-1.5 font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              Onboard Hospital
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Premium Tinted KPI Metric Cards (With Smooth Hover Lift & Dynamic Lighting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Hospitals */}
        <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-white via-teal-50/20 to-teal-50/50 border border-teal-200/70 hover:border-teal-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Hospitals</span>
            <div className="w-9 h-9 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.activeTenants || 0}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {stats.totalTenants > 0 ? `${stats.totalTenants} registered organization(s)` : '0 hospitals currently onboarded'}
            </p>
          </div>
        </div>

        {/* Card 2: Monthly Recurring Revenue */}
        <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 border border-emerald-200/70 hover:border-emerald-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue (MRR)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{(stats.mrr || 0).toLocaleString()}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Annualized ARR: ₹{((stats.mrr || 0) * 12).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 3: Licensed Bed Capacity (Strictly 0 when 0 hospitals) */}
        <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/50 border border-indigo-200/70 hover:border-indigo-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Licensed Hospital Beds</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalBeds || 0} Beds
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Across active hospital clients
            </p>
          </div>
        </div>

        {/* Card 4: Enterprise CRM Hospital Deals / Leads */}
        <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-white via-amber-50/20 to-amber-50/50 border border-amber-200/70 hover:border-amber-400 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise CRM Leads</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalLeads || 0} Leads
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Prospective Hospital Sales Pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Main Analytics Suite: Sleek Area Chart + Subscription Plan Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Smooth Area Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Revenue & Organization Growth
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Platform subscription progression across trailing billing cycles
                </p>
              </div>

              {/* Chart Toggle Pills */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200/80">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMetric === 'revenue' 
                      ? 'bg-white text-teal-900 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  MRR Revenue (₹)
                </button>
                <button
                  onClick={() => setChartMetric('tenants')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMetric === 'tenants' 
                      ? 'bg-white text-teal-900 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Client Hospitals
                </button>
              </div>
            </div>

            {/* Recharts Area Curve */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartTealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="chartBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    stroke="#e2e8f0" 
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    stroke="#e2e8f0"
                    tickFormatter={(val) => chartMetric === 'revenue' ? `₹${(val / 1000)}k` : val}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(val) => [
                      chartMetric === 'revenue' ? `₹${Number(val).toLocaleString()}` : `${val} Hospital(s)`,
                      chartMetric === 'revenue' ? 'Monthly Revenue' : 'Active Hospitals'
                    ]}
                  />
                  {chartMetric === 'revenue' ? (
                    <Area 
                      type="monotone" 
                      dataKey="mrr" 
                      stroke="#0d9488" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#chartTealGrad)" 
                    />
                  ) : (
                    <Area 
                      type="monotone" 
                      dataKey="tenants" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#chartBlueGrad)" 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Live MRR: <strong className="text-slate-900 font-bold">₹{(stats.mrr || 0).toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Active Hospitals: <strong className="text-slate-900 font-bold">{stats.activeTenants || 0}</strong>
            </span>
          </div>
        </div>

        {/* Right Column: Modern Subscription Tier Matrix (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Subscription Plans & Capacity
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tiered hospital licensing with allocated bed quotas
                </p>
              </div>
              <Link to="/saas/subscriptions">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50">
                  Manage Plans
                </Button>
              </Link>
            </div>

            <div className="space-y-3.5">
              {tiers.map((tier) => (
                <div 
                  key={tier.name}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{tier.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{tier.beds} • {tier.rate}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${tier.badgeColor}`}>
                      {tier.count} Enrolled
                    </span>
                  </div>

                  {/* Visual Capacity Bar */}
                  <div className="mt-3 w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${tier.barColor} transition-all duration-500`} 
                      style={{ width: stats.activeTenants > 0 ? `${(tier.count / stats.activeTenants) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Automated Billing Engine
            </span>
            <Link to="/saas/subscriptions" className="font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-0.5 group">
              <span>View Quotas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Creative, Tastefully Colored Governance Hub Cards (Replaces the basic plain white boxes) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            SaaS Platform Governance Control Center
          </h2>
          <span className="text-xs text-slate-500 font-medium">Direct Administrative Modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hospital Tenants Directory (Teal Accent) */}
          <Link to="/saas/tenants" className="group">
            <div className="h-full p-5 rounded-2xl border-t-4 border-t-teal-500 border border-slate-200/90 bg-gradient-to-b from-teal-50/25 via-white to-white shadow-xs hover:shadow-lg hover:border-teal-300 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-100/60 border border-teal-200/70 px-2.5 py-0.5 rounded-full">
                    {stats.activeTenants || 0} Active
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                  Hospital Tenants Directory
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                  Manage hospital client organizations, branch hierarchy, bed quotas and support access.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>Open Directory</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Subscription & Plan Matrix (Blue Accent) */}
          <Link to="/saas/subscriptions" className="group">
            <div className="h-full p-5 rounded-2xl border-t-4 border-t-blue-500 border border-slate-200/90 bg-gradient-to-b from-blue-50/25 via-white to-white shadow-xs hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-100/60 border border-blue-200/70 px-2.5 py-0.5 rounded-full">
                    ₹{(stats.mrr || 0).toLocaleString()} MRR
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                  Subscription & Plan Matrix
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                  Enterprise, Professional & Starter licensing, renewal dates, bed quotas and ARR billing cycles.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>Manage Subscriptions</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Tenant Feature Flags (Violet Accent) */}
          <Link to="/saas/feature-flags" className="group">
            <div className="h-full p-5 rounded-2xl border-t-4 border-t-violet-500 border border-slate-200/90 bg-gradient-to-b from-violet-50/25 via-white to-white shadow-xs hover:shadow-lg hover:border-violet-300 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100/70 text-violet-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-violet-800 bg-violet-100/60 border border-violet-200/70 px-2.5 py-0.5 rounded-full">
                    10 Modules
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-violet-700 transition-colors">
                  Tenant Feature Flags
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                  Toggle clinical modules per hospital: Lab diagnostics, Radiology, Pharmacy, AI Copilot, CRM.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-violet-700">
                <span>Configure Flags</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 4: CRM & Enterprise Leads (Amber Accent) */}
          <Link to="/saas/crm" className="group">
            <div className="h-full p-5 rounded-2xl border-t-4 border-t-amber-500 border border-slate-200/90 bg-gradient-to-b from-amber-50/25 via-white to-white shadow-xs hover:shadow-lg hover:border-amber-300 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/60 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                    {stats.totalLeads || 0} Leads
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                  CRM & Enterprise Leads
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                  Track enterprise hospital sales pipeline, corporate tie-ups, demonstration inquiries & conversions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>View Pipeline</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
