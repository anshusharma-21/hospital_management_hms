import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Search, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  BedDouble, 
  Users, 
  Calendar,
  Trash2 
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-slate-900">Hospital Tenants Directory</h1>
              <p className="text-xs text-slate-500">Multi-tenant client accounts, subscription quotas, domain slugs & privileged support</p>
            </div>
          </div>
        </div>
        <Link to="/saas/onboarding">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Onboard New Hospital
          </Button>
        </Link>
      </div>

      {/* Tenants Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Enrolled Hospital Tenants</h2>
            <Badge variant="neutral">{filteredTenants.length} Tenants</Badge>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by hospital name, slug..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Hospital Name</TableHeader>
              <TableHeader>Tenant Slug</TableHeader>
              <TableHeader>Subscription Tier</TableHeader>
              <TableHeader>Bed Quota</TableHeader>
              <TableHeader>Contact Email</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTenants.map((t) => (
              <TableRow key={t._id}>
                <TableCell>
                  <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                  <p className="text-[10px] text-slate-400">{t.legalName}</p>
                </TableCell>
                <TableCell className="font-mono text-xs text-teal-700 font-semibold">
                  {t.slug}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {t.subscription?.plan || 'Professional'}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-800">
                  {t.subscription?.maxBeds || 100} Beds Max
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {t.email || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="success">Active</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs py-1 px-2.5"
                      onClick={() => handleSupportImpersonation(t)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Inspect Workspace
                    </Button>
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
            ))}
          </TableBody>
        </Table>
      </Card>

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
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to delete this hospital?
          </p>
          {tenantToDelete && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-900 text-sm">{tenantToDelete.name}</p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">Slug: {tenantToDelete.slug}</p>
            </div>
          )}
          <p className="text-rose-600 text-[11px] font-medium">
            This action will permanently delete the hospital organization, its branches, users, and all associated tenant data.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete Hospital'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
