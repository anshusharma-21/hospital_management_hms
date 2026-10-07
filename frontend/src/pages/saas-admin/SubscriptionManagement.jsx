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
  AlertCircle
} from 'lucide-react';
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
              <h1 className="text-xl font-bold text-slate-900">Hospital Vision SaaS Subscription Plans</h1>
              <p className="text-xs text-slate-500">Tiered licensing by licensed bed capacity, concurrent user seats & departmental module access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planTiers.map((p) => {
          const matchingTenants = tenants.filter(t => {
            const plan = t.subscription?.plan;
            if (!plan) return p.id === 'professional';
            return plan === p.planName ||
                   (p.id === 'starter' && (plan.includes('Starter') || plan === 'starter')) ||
                   (p.id === 'professional' && (plan.includes('Professional') || plan === 'professional' || plan === 'Basic' || plan === 'Business')) ||
                   (p.id === 'enterprise' && (plan.includes('Enterprise') || plan === 'enterprise'));
          });
          return (
            <Card 
              key={p.id} 
              className={`flex flex-col justify-between relative border-2 ${
                p.isPopular ? 'border-teal-500 shadow-md' : 'border-slate-200'
              }`}
            >
              <div>
                {p.isPopular && (
                  <div className="absolute -top-3 right-4 bg-teal-600 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                    Most Selected
                  </div>
                )}

                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.badge}</span>
                  <h3 className="font-bold text-slate-900 text-lg mt-0.5">{p.displayName}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-500">{p.period}</span>
                  </div>
                </div>

                <div className="space-y-2 py-3 border-t border-b border-slate-100 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-teal-600" />
                    <span>{p.beds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>{p.branches}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>{p.users}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Included Capabilities:</p>
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-600">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Enrolled Hospitals:</span>
                  <Badge variant="neutral">{matchingTenants.length}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Hospital Tenant Subscriptions Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Hospital Tenants & Active Subscription Contracts</h2>
            <Badge variant="neutral">{tenants.length} Tenants</Badge>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-xs">Loading tenant subscription contracts...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-600">No hospital organizations found</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Hospital Name</TableHeader>
                <TableHeader>Subscription Plan</TableHeader>
                <TableHeader>License Limits</TableHeader>
                <TableHeader>Billing Cycle</TableHeader>
                <TableHeader>Renewal Date</TableHeader>
                <TableHeader>State</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>
                    <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                    <p className="font-mono text-[11px] text-teal-600">{t.slug} • {t.hospitalType}</p>
                  </TableCell>
                  <TableCell className="font-medium text-xs text-slate-800">
                    {t.subscription?.plan || 'Professional'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {t.subscription?.maxBeds || 100} Beds • {t.branchCount || t.subscription?.maxBranches || 1} Branches • {t.userCount || t.subscription?.maxUsers || 10} Users
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 capitalize">
                    {t.subscription?.billingCycle || 'Annual'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {t.subscription?.renewalDate ? new Date(t.subscription.renewalDate).toLocaleDateString() : 'Active'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      t.subscription?.status === 'active' ? 'success' :
                      t.subscription?.status === 'grace_period' ? 'warning' :
                      t.subscription?.status === 'renewal' ? 'info' : 'danger'
                    }>
                      {(t.subscription?.status || 'ACTIVE').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs py-1 px-2.5"
                      onClick={() => openUpgradeModal(t)}
                    >
                      Manage Plan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Plan / Subscription Edit Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={`Manage Subscription: ${selectedTenant?.name || 'Hospital'}`}
      >
        <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Subscription Plan Tier</label>
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
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {planTiers.map(p => (
                <option key={p.id} value={p.planName}>
                  {p.displayName} ({p.price}{p.period})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lifecycle Status</label>
              <select
                value={upgradeForm.status}
                onChange={(e) => setUpgradeForm({...upgradeForm, status: e.target.value})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="renewal">Renewal Pending</option>
                <option value="grace_period">Grace Period</option>
                <option value="read_only">Read Only</option>
                <option value="past_due">Past Due</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Billing Cycle</label>
              <select
                value={upgradeForm.billingCycle}
                onChange={(e) => setUpgradeForm({...upgradeForm, billingCycle: e.target.value})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="semi-annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Beds</label>
              <input
                type="number"
                value={upgradeForm.maxBeds}
                onChange={(e) => setUpgradeForm({...upgradeForm, maxBeds: Number(e.target.value)})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Branches</label>
              <input
                type="number"
                value={upgradeForm.maxBranches}
                onChange={(e) => setUpgradeForm({...upgradeForm, maxBranches: Number(e.target.value)})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Users</label>
              <input
                type="number"
                value={upgradeForm.maxUsers}
                onChange={(e) => setUpgradeForm({...upgradeForm, maxUsers: Number(e.target.value)})}
                className="w-full text-xs rounded-xl border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowUpgradeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Update Contract'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
