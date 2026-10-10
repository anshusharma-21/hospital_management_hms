import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  BedDouble, 
  Building2, 
  Users, 
  ShieldCheck,
  TrendingUp,
  Loader2,
  Calendar,
  AlertCircle,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Shield,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { PLAN_TIERS_LIST } from '../../constants/subscriptionPlans';

export const SubscriptionManagement = () => {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contractSearch, setContractSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');

  const [upgradeForm, setUpgradeForm] = useState({
    plan: 'Professional (Up to 100 Beds)',
    status: 'active',
    maxBeds: 100,
    maxBranches: 3,
    maxUsers: 50,
    billingCycle: 'annual'
  });

  const planTiers = PLAN_TIERS_LIST;

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants');
      if (res.data?.success && res.data?.data) {
        setTenants(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      addToast('Failed to load SaaS tenant subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openUpgradeModal = (tenant) => {
    setSelectedTenant(tenant);
    setUpgradeForm({
      plan: tenant.subscription?.plan || 'Professional (Up to 100 Beds)',
      status: tenant.subscription?.status || 'active',
      maxBeds: tenant.subscription?.maxBeds || 100,
      maxBranches: tenant.subscription?.maxBranches || 3,
      maxUsers: tenant.subscription?.maxUsers || 50,
      billingCycle: tenant.subscription?.billingCycle || 'annual'
    });
    setShowUpgradeModal(true);
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    if (!selectedTenant?._id) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/tenants/${selectedTenant._id}`, {
        subscription: {
          ...selectedTenant.subscription,
          plan: upgradeForm.plan,
          status: upgradeForm.status,
          maxBeds: Number(upgradeForm.maxBeds),
          maxBranches: Number(upgradeForm.maxBranches),
          maxUsers: Number(upgradeForm.maxUsers),
          billingCycle: upgradeForm.billingCycle
        }
      });

      if (res.data?.success) {
        addToast(`Subscription for ${selectedTenant.name} updated successfully!`, 'success');
        setShowUpgradeModal(false);
        await fetchTenants();
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      addToast(err.response?.data?.error || 'Failed to update subscription', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Executive KPI stats calculation
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter(t => (t.subscription?.status || 'active') === 'active').length;
  const totalLicensedBeds = tenants.reduce((acc, t) => acc + (Number(t.subscription?.maxBeds) || 50), 0);
  const totalBranchesAllocated = tenants.reduce((acc, t) => acc + (Number(t.subscription?.maxBranches) || 1), 0);

  // Filtered contracts
  const filteredContracts = tenants.filter((t) => {
    const matchesSearch = 
      t.name?.toLowerCase().includes(contractSearch.toLowerCase()) ||
      t.slug?.toLowerCase().includes(contractSearch.toLowerCase()) ||
      t.subscription?.plan?.toLowerCase().includes(contractSearch.toLowerCase()) ||
      t.hospitalType?.toLowerCase().includes(contractSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (planFilter === 'ALL') return true;
    const plan = (t.subscription?.plan || '').toLowerCase();
    if (planFilter === 'starter') return plan.includes('basic') || plan.includes('starter');
    if (planFilter === 'professional') return plan.includes('professional');
    if (planFilter === 'enterprise') return plan.includes('enterprise') || plan.includes('business');
    return true;
  });

  return (
    <div className="space-y-7 pb-10">
      {/* Executive Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              SaaS Governance & Licensing
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Master Quota Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Hospital Vision SaaS Subscription Plans
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Configure tiered licensing quotas by licensed bed capacity, concurrent user seats, multi-site branches, and clinical departmental module access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchTenants}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh contracts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            Refresh
          </button>
          <Link to="/saas/tenants">
            <Button size="sm" variant="outline" className="text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
              View All Tenants
            </Button>
          </Link>
        </div>
      </div>

      {/* Pricing Tier Plans Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Canonical Subscription Tiers</h2>
            <p className="text-xs text-slate-500">Standardized license models configured for hospital onboarding and contract renewals.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Multi-Tenant Enterprise Stack</span>
          </div>
        </div>

        {/* 3 Pricing Tier Cards ("Boxes") */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {planTiers.map((p) => {
            const matchingTenants = tenants.filter(t => {
              const plan = t.subscription?.plan;
              if (!plan) return p.id === 'professional';
              return plan === p.planName ||
                     (p.id === 'starter' && (plan.includes('Starter') || plan.includes('Basic') || plan === 'starter' || plan === 'basic' || plan === 'Basic')) ||
                     (p.id === 'professional' && (plan.includes('Professional') || plan === 'professional')) ||
                     (p.id === 'enterprise' && (plan.includes('Enterprise') || plan.includes('Business') || plan === 'enterprise' || plan === 'business' || plan === 'Business'));
            });

            const isPro = p.isPopular;

            return (
              <div 
                key={p.id} 
                className={`rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                  isPro 
                    ? 'bg-gradient-to-b from-teal-50/50 via-white to-white border-2 border-teal-500 shadow-lg shadow-teal-500/10 ring-4 ring-teal-500/10 relative -translate-y-1' 
                    : 'bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Card Top / Header */}
                <div className="p-6">
                  {/* Badge & Category Row */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                      {p.badge}
                    </span>
                    {isPro ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-600 text-white shadow-xs">
                        <Sparkles className="w-3 h-3 text-teal-200" />
                        Most Popular Tier
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {p.subTitle}
                      </span>
                    )}
                  </div>

                  {/* Plan Name & Price */}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{p.displayName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.subTitle}</p>
                    
                    <div className="mt-4 flex items-baseline gap-1.5 pb-4 border-b border-slate-100">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{p.price}</span>
                      <span className="text-xs font-semibold text-slate-500">{p.period}</span>
                    </div>
                  </div>

                  {/* Structured Core Quotas Box */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <BedDouble className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Bed Capacity</span>
                      </div>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 text-[11px]">
                        {p.beds}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Branch Nodes</span>
                      </div>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 text-[11px]">
                        {p.branches}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Users className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Staff User Accounts</span>
                      </div>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 text-[11px]">
                        {p.users}
                      </span>
                    </div>
                  </div>

                  {/* Capabilities List */}
                  <div className="mt-5 space-y-2.5 text-xs">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Included Capabilities
                    </p>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-600 leading-tight">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0 mt-0.5 text-emerald-600">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="font-medium text-[12px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Enrolled Organizations */}
                <div className="p-4 bg-slate-50/70 rounded-b-2xl border-t border-slate-100 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Enrolled Hospitals:</span>
                    {matchingTenants.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          {matchingTenants.length} Enrolled
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">None enrolled</span>
                    )}
                  </div>
                  {matchingTenants.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 truncate max-w-[170px]">
                        {matchingTenants.map(t => t.name).join(', ')}
                      </span>
                      <button
                        onClick={() => openUpgradeModal(matchingTenants[0])}
                        className="text-teal-700 hover:text-teal-800 font-bold hover:underline shrink-0"
                      >
                        Reconfigure
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Tenants & Active Subscription Contracts Workbench */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Hospital Tenants & Active Subscription Contracts
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {tenants.length} {tenants.length === 1 ? 'Organization' : 'Organizations'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live contract ledger showing assigned tiers, licensed bed capacity, renewal schedules, and state.
            </p>
          </div>

          {/* Search & Plan Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={contractSearch}
                onChange={(e) => setContractSearch(e.target.value)}
                className="w-full sm:w-48 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>

            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-600">
              <button
                onClick={() => setPlanFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  planFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPlanFilter('professional')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  planFilter === 'professional' ? 'bg-white text-teal-800 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pro
              </button>
              <button
                onClick={() => setPlanFilter('starter')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  planFilter === 'starter' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setPlanFilter('enterprise')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  planFilter === 'enterprise' ? 'bg-white text-indigo-800 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Business
              </button>
            </div>
          </div>
        </div>

        {/* The Seamless Clean Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-xs font-semibold text-slate-600">Loading tenant subscription contracts...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No matching subscriptions found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filter</p>
          </div>
        ) : (
          <Table borderless className="border-0 rounded-none shadow-none">
            <TableHead>
              <TableRow className="bg-slate-50/80">
                <TableHeader className="w-[28%]">Hospital Organization</TableHeader>
                <TableHeader className="w-[20%]">Subscription Plan Tier</TableHeader>
                <TableHeader className="w-[22%]">Licensed Capacity</TableHeader>
                <TableHeader className="w-[12%]">Billing Cycle</TableHeader>
                <TableHeader className="w-[10%]">Renewal Date</TableHeader>
                <TableHeader className="w-[8%] text-center">Status</TableHeader>
                <TableHeader className="w-[10%] text-right pr-6">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.map((t) => {
                const isProPlan = (t.subscription?.plan || '').includes('Professional');
                const isEntPlan = (t.subscription?.plan || '').includes('Enterprise') || (t.subscription?.plan || '').includes('Business');
                
                return (
                  <TableRow key={t._id} className="hover:bg-teal-50/20 transition-colors">
                    {/* Organization Cell */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs tracking-wider">
                          {(t.name || 'H').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{t.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-mono text-teal-700 font-semibold">{t.slug}</span>
                            <span>•</span>
                            <span className="text-slate-400 truncate">{t.hospitalType || 'Hospital'}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Subscription Plan Tier */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          isProPlan 
                            ? 'bg-teal-50 text-teal-800 border-teal-200/90' 
                            : isEntPlan 
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200/90'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          <Sparkles className="w-3 h-3 text-teal-600" />
                          {t.subscription?.plan || 'Professional Plan'}
                        </span>
                      </div>
                    </TableCell>

                    {/* License Quotas Breakdown */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                          <BedDouble className="w-3 h-3 text-teal-600" />
                          {t.subscription?.maxBeds || 100} Beds
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3 text-teal-600" />
                          {t.branchCount || t.subscription?.maxBranches || 1} {t.branchCount === 1 ? 'Site' : 'Sites'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                          <Users className="w-3 h-3 text-teal-600" />
                          {t.userCount || t.subscription?.maxUsers || 10} Users
                        </span>
                      </div>
                    </TableCell>

                    {/* Billing Cadence */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 capitalize">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {t.subscription?.billingCycle || 'Annual'}
                      </span>
                    </TableCell>

                    {/* Renewal Date */}
                    <TableCell>
                      <span className="font-mono text-xs text-slate-700 font-medium">
                        {t.subscription?.renewalDate ? new Date(t.subscription.renewalDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Oct 09, 2027'}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-right pr-6">
                      <button
                        onClick={() => openUpgradeModal(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 border border-teal-200/80 rounded-xl transition-all shadow-xs"
                      >
                        <Sliders className="w-3 h-3" />
                        Manage Plan
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Plan / Subscription Edit Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={`Configure Subscription: ${selectedTenant?.name || 'Hospital'}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs pt-1">
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">Subscription Plan Tier</label>
            <select
              value={upgradeForm.plan}
              onChange={(e) => {
                const chosen = planTiers.find(p => p.planName === e.target.value);
                setUpgradeForm(prev => ({
                  ...prev,
                  plan: e.target.value,
                  maxBeds: chosen?.maxBeds || prev.maxBeds,
                  maxBranches: chosen?.maxBranches || prev.maxBranches,
                  maxUsers: chosen?.maxUsers || prev.maxUsers
                }));
              }}
              className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
            >
              {planTiers.map(p => (
                <option key={p.id} value={p.planName}>
                  {p.displayName} — {p.price} {p.period} ({p.beds})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">Lifecycle Status</label>
              <select
                value={upgradeForm.status}
                onChange={(e) => setUpgradeForm({...upgradeForm, status: e.target.value})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
              >
                <option value="active">Active (Full Access)</option>
                <option value="trialing">Trialing (30 Days)</option>
                <option value="renewal">Renewal Pending</option>
                <option value="grace_period">Grace Period</option>
                <option value="read_only">Read Only Mode</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">Billing Cadence</label>
              <select
                value={upgradeForm.billingCycle}
                onChange={(e) => setUpgradeForm({...upgradeForm, billingCycle: e.target.value})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
              >
                <option value="monthly">Monthly Cycle</option>
                <option value="semi-annual">Semi-Annual (6 Months)</option>
                <option value="annual">Annual Contract (Recommended)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Enforced Hard Quotas
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">Max Beds</label>
                <input
                  type="number"
                  value={upgradeForm.maxBeds}
                  onChange={(e) => setUpgradeForm({...upgradeForm, maxBeds: Number(e.target.value)})}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">Max Branches</label>
                <input
                  type="number"
                  value={upgradeForm.maxBranches}
                  onChange={(e) => setUpgradeForm({...upgradeForm, maxBranches: Number(e.target.value)})}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">Max Users</label>
                <input
                  type="number"
                  value={upgradeForm.maxUsers}
                  onChange={(e) => setUpgradeForm({...upgradeForm, maxUsers: Number(e.target.value)})}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowUpgradeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving Contract...' : 'Save Subscription Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
