import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  BedDouble, 
  AlertOctagon, 
  CheckCircle2, 
  Edit3,
  Search,
  Trash2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhoneNumber, getPhoneErrorMessage } from '../../utils/validation';

export const BranchManagement = () => {
  const { addToast } = useToast();
  const { user, role, branch, activeBranch } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine currently active operating branch (from top navbar or user context)
  const currentOperatingBranch = activeBranch || branch || (typeof user?.branch === 'object' ? user?.branch : null);

  // Check if currently operating on the Primary Main Branch
  const isOperatingOnMainBranch = Boolean(
    currentOperatingBranch && (
      currentOperatingBranch.isMain === true ||
      currentOperatingBranch.code === 'MAIN' ||
      currentOperatingBranch.branchType === 'Main Hospital'
    )
  );

  // Check if the logged-in user is assigned to a Sub-Branch
  const userAssignedBranchId = user?.branch?._id || (typeof user?.branch === 'string' ? user?.branch : null);
  const userAssignedBranch = branches.find(b => b._id === userAssignedBranchId) || (typeof user?.branch === 'object' ? user?.branch : null);
  const isUserAssignedToSubBranch = Boolean(
    userAssignedBranch &&
    !userAssignedBranch.isMain &&
    userAssignedBranch.code !== 'MAIN' &&
    userAssignedBranch.branchType !== 'Main Hospital'
  );

  const isPlatformSuperAdmin = ['super_admin', 'saas_admin'].includes(role || user?.role);

  // STRICT HIERARCHY RULE: Only Main Branch can create new branches! Sub-branches cannot create branches!
  const canCreateBranch = isPlatformSuperAdmin || (!isUserAssignedToSubBranch && isOperatingOnMainBranch);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = {
    name: '',
    code: '',
    branchType: 'Satellite Clinic',
    phone: '',
    email: '',
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    bedCapacity: 50,
    hasEmergency: true,
    hasICU: true
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      // Get current user to know tenant ID
      const userRes = await api.get('/auth/me');
      const tenantId = userRes.data.user?.tenant?._id || userRes.data.user?.tenant;
      if (tenantId) {
        const res = await api.get(`/tenants/${tenantId}/branches`);
        if (res.data.success) {
          setBranches(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      setBranches([]);
      addToast('Failed to load branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!canCreateBranch) {
      addToast('Branch creation is restricted to the Primary Main Branch administration.', 'error');
      return;
    }

    if (!formData.name?.trim() || !formData.code?.trim()) {
      addToast('Branch name and code are required', 'warning');
      return;
    }
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      addToast(getPhoneErrorMessage(formData.phone, 'Branch phone') || 'Branch phone must be 10 digits starting with 6, 7, 8, or 9', 'warning');
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      addToast('Please provide a valid branch email address', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const userRes = await api.get('/auth/me');
      const tenantId = userRes.data.user?.tenant?._id || userRes.data.user?.tenant;

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        branchType: formData.branchType || 'Satellite Clinic',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim()
        },
        bedCapacity: Number(formData.bedCapacity),
        hasEmergency: Boolean(formData.hasEmergency),
        hasICU: Boolean(formData.hasICU)
      };

      const res = await api.post(`/tenants/${tenantId}/branches`, payload);
      if (res.data.success) {
        addToast(`Branch ${formData.name} created successfully!`, 'success');
        setFormData(initialFormData);
        setShowAddModal(false);
        fetchBranches();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to add branch', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      const userRes = await api.get('/auth/me');
      const tenantId = userRes.data.user?.tenant?._id || userRes.data.user?.tenant;

      if (!tenantId) {
        addToast('Hospital tenant context not found. Please re-login.', 'error');
        return;
      }

      const res = await api.delete(`/tenants/${tenantId}/branches/${branchToDelete._id}`);
      if (res.data?.success) {
        addToast(`Branch "${branchToDelete.name}" deleted successfully!`, 'success');
        
        // If the deleted branch was active in localStorage, heal it
        const currentActive = localStorage.getItem('hv_active_branch');
        if (currentActive && (currentActive.includes(branchToDelete._id) || currentActive.includes(branchToDelete.code))) {
          localStorage.removeItem('hv_active_branch');
          window.dispatchEvent(new CustomEvent('hv_branch_reset'));
        }
        
        setBranchToDelete(null);
        fetchBranches();
      }
    } catch (err) {
      console.error('[Branch Delete Error]:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete branch';
      addToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
              <h1 className="text-xl font-bold text-slate-900">Hospital Branch Management</h1>
              <p className="text-xs text-slate-500">Configure multi-branch locations, bed allocations, operating hours and emergency service centers</p>
            </div>
          </div>
        </div>
        {canCreateBranch ? (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add New Branch
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">Branch Creation Restricted to Main Campus</span>
          </div>
        )}
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b) => (
          <Card key={b._id} className="border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    CODE: {b.code}
                  </span>
                  {b.isMain || b.branchType === 'Main Hospital' || b.code === 'MAIN' ? (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full">
                      Primary Main Branch
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                      Sub-Branch
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">{b.name}</h3>
                <p className="text-xs text-slate-500">{b.branchType}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Operational</Badge>
                {canCreateBranch && !(b.isMain || b.branchType === 'Main Hospital' || b.code === 'MAIN') && (
                  <button
                    type="button"
                    onClick={() => setBranchToDelete(b)}
                    title={`Delete ${b.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{[b.address?.street, b.address?.city, b.address?.state].filter(Boolean).join(', ') || 'Address not configured'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{b.phone || 'Phone not configured'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{b.email || 'Email not configured'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <BedDouble className="w-4 h-4 text-teal-600" />
                <span>{b.bedCapacity} Bed Capacity</span>
              </div>
              <div className="flex gap-2">
                {b.hasEmergency && <Badge variant="danger">24x7 ER</Badge>}
                {b.hasICU && <Badge variant="info">ICU Unit</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Branch Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Hospital Branch"
      >
        <form onSubmit={handleAddBranch} className="space-y-4 text-xs">
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
            <Building2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p>
              <strong>Main Branch Hierarchy:</strong> New branches are created as sub-branches. Main Branch administration maintains oversight and can switch to this branch. Sub-branch staff will only have access to their local branch operations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Branch Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. City Extension Campus"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Branch Code (3-4 chars)</label>
              <Input 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="e.g. WEST"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <Input 
                isPhone={true}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="10-digit mobile (e.g. 9876543210)"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="branch@hospital.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Street Address</label>
            <Input 
              value={formData.street}
              onChange={(e) => setFormData({...formData, street: e.target.value})}
              placeholder="Building, Road, Landmark"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Sanctioned Bed Capacity</label>
              <Input 
                type="number"
                value={formData.bedCapacity}
                onChange={(e) => setFormData({...formData, bedCapacity: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={formData.hasEmergency}
                  onChange={(e) => setFormData({...formData, hasEmergency: e.target.checked})}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <span>24x7 Emergency Trauma Unit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={formData.hasICU}
                  onChange={(e) => setFormData({...formData, hasICU: e.target.checked})}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <span>Critical Care / ICU Unit</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Branch...' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Branch Confirmation Modal */}
      {branchToDelete && (
        <Modal
          isOpen={!!branchToDelete}
          onClose={() => setBranchToDelete(null)}
          title="Delete Hospital Branch"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">
                  Permanently delete {branchToDelete.name}?
                </p>
                <p className="text-rose-700 text-xs mt-1 leading-relaxed">
                  Are you sure you want to delete branch <span className="font-bold">{branchToDelete.name}</span> (Code: {branchToDelete.code})? Any staff assigned to this branch will be safely reassigned to the central Main Hospital campus.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setBranchToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteBranch}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
