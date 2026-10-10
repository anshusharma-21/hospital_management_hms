import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Building2,
  Search, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  BedDouble, 
  Users, 
  Calendar,
  Trash2,
  Copy,
  Check,
  Globe,
  Mail,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Sliders,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const TenantList = () => {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants');
      if (res.data.success) {
        setTenants(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tenant directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportImpersonation = (tenant) => {
    addToast(`Switched active SaaS context to ${tenant.name}`, 'info');
  };

  const openDeleteConfirmation = (tenant) => {
    setTenantToDelete(tenant);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tenantToDelete?._id) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/tenants/${tenantToDelete._id}?force=true`);
      if (res.data?.success) {
        addToast(`Hospital '${tenantToDelete.name}' deleted successfully`, 'success');
        setDeleteModalOpen(false);
        setTenantToDelete(null);
        await fetchTenants();
      } else {
        addToast(res.data?.error || 'Failed to delete hospital', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to delete hospital', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySlug = (slug) => {
    const fullDomain = `${slug}.hospitalvision.in`;
    navigator.clipboard?.writeText(fullDomain);
    setCopiedSlug(slug);
    addToast(`Copied domain '${fullDomain}' to clipboard`, 'success');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // KPI calculations
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => (t.subscription?.status || 'active') === 'active').length;
  const totalLicensedBeds = tenants.reduce((acc, t) => acc + (Number(t.subscription?.maxBeds) || 50), 0);
  const totalBranches = tenants.reduce((acc, t) => acc + (Number(t.branchCount || t.subscription?.maxBranches) || 1), 0);

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.hospitalType?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL') {
      const status = (t.subscription?.status || 'active').toLowerCase();
      if (statusFilter === 'active' && status !== 'active') return false;
      if (statusFilter === 'trialing' && status !== 'trialing') return false;
    }

    if (tierFilter !== 'ALL') {
      const plan = (t.subscription?.plan || '').toLowerCase();
      if (tierFilter === 'professional' && !plan.includes('professional')) return false;
      if (tierFilter === 'starter' && !(plan.includes('starter') || plan.includes('basic'))) return false;
      if (tierFilter === 'enterprise' && !(plan.includes('enterprise') || plan.includes('business'))) return false;
    }

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
              Multi-Tenant Architecture
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Master Client Directory</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Hospital Tenants Directory
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Multi-tenant client accounts, subscription quotas, custom subdomain slugs, branch networks, and privileged support operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchTenants}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            Refresh
          </button>
          <Link to="/saas/onboarding">
            <Button size="sm" className="bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white font-bold shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Onboard New Hospital
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tenants Directory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
                <Building className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Enrolled Hospital Tenants
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {filteredTenants.length} of {tenants.length} Tenants
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live database of registered hospitals, assigned subdomain routing, subscription tiers, and quota limits.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search hospital, slug, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>

            {/* Quick Plan Filter Pills */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-600">
              <button
                onClick={() => setTierFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tierFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTierFilter('professional')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tierFilter === 'professional' ? 'bg-white text-teal-800 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pro
              </button>
              <button
                onClick={() => setTierFilter('starter')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tierFilter === 'starter' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setTierFilter('enterprise')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tierFilter === 'enterprise' ? 'bg-white text-indigo-800 font-bold shadow-xs' : 'hover:text-slate-900'
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
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-xs font-semibold text-slate-600">Loading tenant directory...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700">No matching hospital tenants found</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter settings</p>
          </div>
        ) : (
          <Table borderless className="border-0 rounded-none shadow-none">
            <TableHead>
              <TableRow className="bg-slate-50/80">
                <TableHeader className="w-[28%]">Hospital Organization</TableHeader>
                <TableHeader className="w-[18%]">Tenant Subdomain / Slug</TableHeader>
                <TableHeader className="w-[18%]">Subscription Tier</TableHeader>
                <TableHeader className="w-[14%]">Bed Quota</TableHeader>
                <TableHeader className="w-[12%]">Contact Info</TableHeader>
                <TableHeader className="w-[8%] text-center">Status</TableHeader>
                <TableHeader className="w-[12%] text-right pr-6">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenants.map((t) => {
                const isPro = (t.subscription?.plan || '').includes('Professional');
                const isEnt = (t.subscription?.plan || '').includes('Enterprise') || (t.subscription?.plan || '').includes('Business');
                const isCopied = copiedSlug === t.slug;

                return (
                  <TableRow key={t._id} className="hover:bg-teal-50/20 transition-colors">
                    {/* Hospital Name & Legal Entity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs tracking-wider">
                          {(t.name || 'H').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate hover:text-teal-700 transition-colors">
                            {t.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span className="text-slate-600 font-medium truncate">{t.legalName || t.name}</span>
                            <span>•</span>
                            <span className="text-slate-400 truncate">{t.hospitalType || 'Hospital'}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Subdomain Slug with 1-click Copy */}
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 px-2.5 py-1 rounded-lg transition-colors group">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-xs text-teal-800 font-bold">
                          {t.slug}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySlug(t.slug)}
                          className="text-slate-400 hover:text-teal-700 transition-colors ml-0.5"
                          title="Copy subdomain URL"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Subscription Tier */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        isPro 
                          ? 'bg-teal-50 text-teal-800 border-teal-200/90' 
                          : isEnt 
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200/90'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        {t.subscription?.plan || 'Professional Plan'}
                      </span>
                    </TableCell>

                    {/* Bed Quota (Clean Non-wrapping pill) */}
                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
                          <BedDouble className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {t.subscription?.maxBeds || 100} Beds Max
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {t.branchCount || t.subscription?.maxBranches || 1} Branch Node
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Email */}
                    <TableCell>
                      {t.email ? (
                        <a 
                          href={`mailto:${t.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-teal-700 font-medium transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{t.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Status Pill */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </TableCell>

                    {/* Actions Group */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs py-1.5 px-3 font-semibold text-slate-700 hover:text-teal-800 hover:border-teal-300"
                          onClick={() => handleSupportImpersonation(t)}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1 text-teal-600" />
                          Inspect
                        </Button>
                        <Link to="/saas/subscriptions">
                          <button
                            type="button"
                            title="Manage Subscription Plan"
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button
                          type="button"
                          title={`Delete ${t.name}`}
                          aria-label={`Delete ${t.name}`}
                          onClick={() => openDeleteConfirmation(t)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setTenantToDelete(null);
          }
        }}
        title="Delete Hospital Organization"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs pt-1">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete this hospital client organization?
          </p>
          {tenantToDelete && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <p className="font-bold text-slate-900 text-sm">{tenantToDelete.name}</p>
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] mt-1">
                <span>Slug: {tenantToDelete.slug}</span>
                <span>•</span>
                <span>Type: {tenantToDelete.hospitalType || 'Hospital'}</span>
              </div>
            </div>
          )}
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium leading-relaxed">
            ⚠️ This action will permanently remove the hospital organization, tenant databases, user accounts, branches, clinical admissions, and associated billing ledgers.
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setDeleteModalOpen(false);
                setTenantToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'Deleting Organization...' : 'Delete Hospital Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TenantList;
