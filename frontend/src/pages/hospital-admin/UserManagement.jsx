import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Building2, 
  Stethoscope, 
  BadgeCheck,
  Eye,
  Edit,
  Trash2,
  Power,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
  User as UserIcon,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Lock,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { isValidEmail, isValidPhoneNumber, getPhoneErrorMessage } from '../../utils/validation';

export const UserManagement = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Detail Pop-up Card
  const [editingUser, setEditingUser] = useState(null); // Edit Modal
  const [userToDelete, setUserToDelete] = useState(null); // Delete Confirm Dialog
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // New staff registration form state
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    email: '',
    phone: '',
    password: 'Password123!',
    role: 'doctor',
    branch: '',
    specialty: 'Internal Medicine',
    consultationFee: 800,
    registrationNumber: 'MCI-99482',
    opdRoom: 'OPD Room 102'
  });

  // Edit staff form state
  const [editFormData, setEditFormData] = useState({
    _id: '',
    name: '',
    gender: 'male',
    email: '',
    phone: '',
    role: 'doctor',
    branch: '',
    status: 'active',
    password: '',
    specialty: '',
    consultationFee: 500,
    registrationNumber: '',
    opdRoom: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userRes = await api.get('/auth/me');
      const me = userRes.data.user;
      setCurrentUser(me);
      const tenantId = me?.tenant?._id || me?.tenant;
      if (tenantId) {
        const res = await api.get(`/tenants/${tenantId}/users`);
        if (res.data.success) {
          setUsers(res.data.data);
        }
        const branchRes = await api.get(`/tenants/${tenantId}/branches`);
        if (branchRes.data?.success) {
          setBranches(branchRes.data.data.filter(b => b.status === 'active'));
        }
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
      addToast('Failed to load user roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add staff handler
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userRes = await api.get('/auth/me');
      const me = userRes.data?.user || currentUser;
      const tenantId = me?.tenant?._id || me?.tenant;

      if (!tenantId) {
        addToast('Hospital tenant information not found. Please log in again.', 'error');
        return;
      }
      if (!formData.name?.trim()) {
        addToast('Staff user name is required', 'error');
        return;
      }
      if (!isValidEmail(formData.email)) {
        addToast('Please provide a valid staff email address (e.g. doctor@hospital.com)', 'error');
        return;
      }
      if (!isValidPhoneNumber(formData.phone)) {
        addToast(getPhoneErrorMessage(formData.phone, 'Staff mobile number') || 'Mobile number must be 10 digits starting with 6, 7, 8, or 9', 'error');
        return;
      }

      const targetBranch = (me?.role === 'branch_admin'
        ? (me?.branch?._id || me?.branch)
        : (formData.branch || undefined)) || undefined;

      const payload = {
        name: formData.name.trim(),
        gender: formData.gender || 'male',
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        branch: targetBranch,
        doctorProfile: formData.role === 'doctor' ? {
          specialty: formData.specialty,
          consultationFee: Number(formData.consultationFee),
          registrationNumber: formData.registrationNumber,
          opdRoom: formData.opdRoom
        } : undefined
      };

      const res = await api.post(`/tenants/${tenantId}/users`, payload);
      if (res.data?.success) {
        addToast(`Staff user "${formData.name}" registered successfully!`, 'success');
        setShowAddModal(false);
        setFormData({
          name: '',
          gender: 'male',
          email: '',
          phone: '',
          password: 'Password123!',
          role: 'doctor',
          branch: '',
          specialty: 'Internal Medicine',
          consultationFee: 800,
          registrationNumber: 'MCI-99482',
          opdRoom: 'OPD Room 102'
        });
        fetchUsers();
      }
    } catch (err) {
      console.error('[UserManagement Add Staff Error]:', err);
      const serverErrMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      addToast(serverErrMsg || 'Failed to create staff user', 'error');
    }
  };

  // Toggle staff active/inactive status
  const handleToggleStatus = async (user) => {
    if (!user) return;
    const tenantId = currentUser?.tenant?._id || currentUser?.tenant;
    if (!tenantId) {
      addToast('Organization context not found', 'error');
      return;
    }

    const currentStatus = user.status || 'active';
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';

    setIsUpdatingStatus(true);
    try {
      const res = await api.put(`/tenants/${tenantId}/users/${user._id}`, {
        status: newStatus
      });

      if (res.data?.success) {
        const updatedUser = res.data.data;
        // Update users state
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
        // If popup card is open for this user, update it
        if (selectedUser?._id === user._id) {
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
        }
        addToast(
          `${user.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`,
          'success'
        );
      }
    } catch (err) {
      console.error('[UserManagement Toggle Status Error]:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update staff status';
      addToast(msg, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open Edit Modal with selected user details
  const handleStartEdit = (user) => {
    setEditFormData({
      _id: user._id,
      name: user.name || '',
      gender: user.gender || 'male',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'receptionist',
      branch: user.branch?._id || user.branch || '',
      status: user.status || 'active',
      password: '',
      specialty: user.doctorProfile?.specialty || (user.role === 'doctor' ? 'General Medicine' : ''),
      consultationFee: user.doctorProfile?.consultationFee || 500,
      registrationNumber: user.doctorProfile?.registrationNumber || '',
      opdRoom: user.doctorProfile?.opdRoom || 'OPD-101'
    });
    setEditingUser(user);
  };

  // Save Edit Handler
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData || !editingUser) return;

    if (!editFormData.name?.trim()) {
      addToast('Staff user name is required', 'error');
      return;
    }
    if (!isValidEmail(editFormData.email)) {
      addToast('Please provide a valid email address', 'error');
      return;
    }
    if (!isValidPhoneNumber(editFormData.phone)) {
      addToast(getPhoneErrorMessage(editFormData.phone, 'Staff mobile number') || 'Mobile number must be 10 digits', 'error');
      return;
    }

    const tenantId = currentUser?.tenant?._id || currentUser?.tenant;
    try {
      const payload = {
        name: editFormData.name.trim(),
        gender: editFormData.gender,
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim(),
        role: editFormData.role,
        branch: editFormData.branch || undefined,
        status: editFormData.status,
        doctorProfile: editFormData.role === 'doctor' ? {
          specialty: editFormData.specialty,
          consultationFee: Number(editFormData.consultationFee) || 500,
          registrationNumber: editFormData.registrationNumber,
          opdRoom: editFormData.opdRoom
        } : undefined
      };

      if (editFormData.password && editFormData.password.trim().length >= 6) {
        payload.password = editFormData.password.trim();
      }

      const res = await api.put(`/tenants/${tenantId}/users/${editingUser._id}`, payload);
      if (res.data?.success) {
        const updated = res.data.data;
        addToast(`Staff profile for "${updated.name}" updated successfully!`, 'success');
        setUsers(prev => prev.map(u => u._id === editingUser._id ? updated : u));
        if (selectedUser?._id === editingUser._id) {
          setSelectedUser(updated);
        }
        setEditingUser(null);
      }
    } catch (err) {
      console.error('[UserManagement Save Edit Error]:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update staff member';
      addToast(msg, 'error');
    }
  };

  // Delete Staff Handler
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const myId = currentUser?._id || currentUser?.id;
    if (myId && (myId === userToDelete._id)) {
      addToast('You cannot delete your own logged-in administrator account.', 'error');
      setUserToDelete(null);
      return;
    }

    const tenantId = currentUser?.tenant?._id || currentUser?.tenant;
    try {
      const res = await api.delete(`/tenants/${tenantId}/users/${userToDelete._id}`);
      if (res.data?.success) {
        addToast(`Staff member "${userToDelete.name}" was removed successfully`, 'success');
        setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
        if (selectedUser?._id === userToDelete._id) {
          setSelectedUser(null);
        }
        setUserToDelete(null);
      }
    } catch (err) {
      console.error('[UserManagement Delete Staff Error]:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to remove staff member';
      addToast(msg, 'error');
    }
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    addToast('Email copied to clipboard', 'info');
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.branch?.name && u.branch.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Staff & Clinician Directory</h1>
              <p className="text-xs text-slate-500">Manage hospital staff credentials, roles, branches, and operational access</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Staff Member
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Authorized Personnel</h2>
            <Badge variant="neutral">{filteredUsers.length} Staff</Badge>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {inactiveCount} Inactive
              </span>
            )}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by name, role, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Staff Name</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Assigned Branch</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-medium">No staff members found matching your search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isActive = (u.status || 'active') === 'active';
                const branchName = u.branch?.name || (branches.find(b => b._id === u.branch)?.name) || 'Organization / All';
                const branchCode = u.branch?.code || branches.find(b => b._id === u.branch)?.code;
                const initials = u.name
                  ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'ST';

                return (
                  <TableRow 
                    key={u._id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Staff Name - Clickable to open Profile Card Modal */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="flex items-center gap-3 text-left group focus:outline-none"
                        title="Click to view full staff profile card"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                          isActive 
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs group-hover:text-teal-600 transition-colors flex items-center gap-1.5">
                            {u.name}
                            <ExternalLink className="w-3 h-3 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[10px] text-slate-400 group-hover:text-teal-600 font-medium">
                            Click to view full card
                          </p>
                        </div>
                      </button>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <span className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 inline-block">
                        {u.role?.replace('_', ' ')}
                      </span>
                    </TableCell>

                    {/* Assigned Branch */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-800">
                          {branchName}
                        </span>
                        {branchCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {branchCode}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status - Clickable to toggle Active/Inactive */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(u);
                        }}
                        disabled={isUpdatingStatus}
                        className="group flex items-center gap-1.5 focus:outline-none cursor-pointer"
                        title={`Click to ${isActive ? 'Deactivate' : 'Activate'} ${u.name}`}
                      >
                        <Badge 
                          variant={isActive ? 'success' : 'neutral'} 
                          dot={true}
                          className="hover:ring-2 hover:ring-teal-400/30 transition-all"
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          {isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        </span>
                      </button>
                    </TableCell>

                    {/* Actions: View Card, Edit, Delete */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setSelectedUser(u)}
                          className="text-teal-700 hover:text-teal-800 hover:bg-teal-50 text-xs font-semibold px-2"
                          title="Open Profile Card"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Card
                        </Button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(u);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                          title="Edit Staff Member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(u);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Staff Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ======================================================== */}
      {/* 1. POPUP PROFILE CARD MODAL (Detailed View)              */}
      {/* ======================================================== */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={null}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Rich Card Hero Header */}
            <div className="relative rounded-2xl p-6 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white overflow-hidden shadow-md">
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-lg">
                    {selectedUser.name
                      ? selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'ST'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-400/20 text-teal-200 border border-teal-300/30">
                        {selectedUser.role?.replace('_', ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                        (selectedUser.status || 'active') === 'active'
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (selectedUser.status || 'active') === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                        }`} />
                        {(selectedUser.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      {selectedUser.gender && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-white/10 text-white/90 border border-white/20">
                          {selectedUser.gender}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {selectedUser.name}
                    </h2>
                    <p className="text-xs text-teal-200/80 mt-0.5">
                      {selectedUser.doctorProfile?.specialty || (selectedUser.role === 'nurse' ? 'Staff Nurse' : 'Hospital Operations Staff')}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons inside Card Header */}
                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  {/* Toggle Active / Deactivate */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedUser)}
                    disabled={isUpdatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      (selectedUser.status || 'active') === 'active'
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-300/30'
                        : 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-300/40'
                    }`}
                  >
                    {(selectedUser.status || 'active') === 'active' ? (
                      <>
                        <UserX className="w-3.5 h-3.5 text-amber-300" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                        Activate
                      </>
                    )}
                  </button>

                  {/* Edit Staff Details */}
                  <button
                    type="button"
                    onClick={() => {
                      const u = selectedUser;
                      setSelectedUser(null);
                      handleStartEdit(u);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-teal-700" />
                    Edit Details
                  </button>

                  {/* Delete Staff Member */}
                  <button
                    type="button"
                    onClick={() => {
                      const u = selectedUser;
                      setUserToDelete(u);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-300/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Card Grid Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Panel 1: Personal & Contact Information */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
                  <UserIcon className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Personal & Contact Info</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Full Name</span>
                    <span className="font-bold text-slate-800">{selectedUser.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Gender</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedUser.gender || 'Not specified (Defaults to Male)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Email Address</span>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="font-semibold text-slate-800 break-all">{selectedUser.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(selectedUser.email)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500"
                        title="Copy email"
                      >
                        {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Mobile Phone</span>
                    <span className="font-mono text-slate-800 font-semibold">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Panel 2: Hospital & Branch Assignment */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hospital Assignment</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Role & Access</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedUser.role?.replace('_', ' ')}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assigned Campus</span>
                    <span className="font-semibold text-slate-800">
                      {selectedUser.branch?.name || (branches.find(b => b._id === selectedUser.branch)?.name) || 'Organization / All Branches'}
                    </span>
                    {(selectedUser.branch?.code || branches.find(b => b._id === selectedUser.branch)?.code) && (
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                        Campus Code: {selectedUser.branch?.code || branches.find(b => b._id === selectedUser.branch)?.code}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Operational Status</span>
                    <Badge variant={(selectedUser.status || 'active') === 'active' ? 'success' : 'neutral'} dot={true}>
                      {(selectedUser.status || 'active') === 'active' ? 'Active - Authorized' : 'Inactive - Access Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Clinical & Practitioner Details (Doctor/Specialty Info) */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Clinical & Specialty Profile
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Specialty</span>
                  <span className="font-bold text-slate-800">
                    {selectedUser.doctorProfile?.specialty || (selectedUser.role === 'nurse' ? 'Staff Nurse' : 'Hospital Operations')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Consultation Tariff</span>
                  <span className="font-bold text-slate-800">
                    {selectedUser.doctorProfile?.consultationFee ? `₹${selectedUser.doctorProfile.consultationFee}` : '₹500 (Default)'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">OPD Chamber / Room</span>
                  <span className="font-bold text-slate-800">
                    {selectedUser.doctorProfile?.opdRoom || 'OPD-101'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Reg. Number</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {selectedUser.doctorProfile?.registrationNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
              <span>
                User ID: <span className="font-mono text-slate-500">{selectedUser._id}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Close Card
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 2. EDIT STAFF DETAILS MODAL                               */}
      {/* ======================================================== */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit Staff Details: ${editingUser.name}`}
          subtitle="Update credentials, role assignments, gender, contact information and clinical fees"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <Input 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="e.g. Dr. Rajesh Khanna"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gender</label>
                <Select 
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Role</label>
                <Select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  options={[
                    { value: 'doctor', label: 'Doctor / Consultant' },
                    { value: 'nurse', label: 'Nurse / Nursing Station' },
                    { value: 'receptionist', label: 'Receptionist / Front Desk' },
                    { value: 'billing_cashier', label: 'Billing Cashier / Accountant' },
                    { value: 'pharmacist', label: 'Pharmacist' },
                    { value: 'lab_tech', label: 'Lab Technician / Pathologist' },
                    { value: 'radiologist', label: 'Radiology Technician / Radiologist' },
                    { value: 'branch_admin', label: 'Branch Administrator' },
                    { value: 'hospital_admin', label: 'Hospital Administrator' },
                  ]}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                <Select 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  options={[
                    { value: 'active', label: 'Active (Operational)' },
                    { value: 'inactive', label: 'Inactive (Deactivated)' }
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Branch Campus Assignment</label>
              {currentUser?.role === 'branch_admin' ? (
                <Input 
                  disabled 
                  value={branches.find(b => b._id === (currentUser.branch?._id || currentUser.branch))?.name || 'Assigned Branch'} 
                  className="bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              ) : (
                <Select 
                  value={editFormData.branch}
                  onChange={(e) => setEditFormData({...editFormData, branch: e.target.value})}
                  options={[
                    { value: '', label: 'Organization-Wide / All Branches' },
                    ...branches.map(b => ({
                      value: b._id,
                      label: `${b.name} (${b.code || 'Campus'})`
                    }))
                  ]}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <Input 
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  placeholder="doctor@hospital.com"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <Input 
                  isPhone={true}
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  placeholder="10-digit mobile"
                  required
                />
              </div>
            </div>

            {/* Doctor Profile Settings (shown for doctor role) */}
            {editFormData.role === 'doctor' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  Doctor Clinical Profile
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Specialty</label>
                    <Input 
                      value={editFormData.specialty}
                      onChange={(e) => setEditFormData({...editFormData, specialty: e.target.value})}
                      placeholder="e.g. Cardiology"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">OPD Room</label>
                    <Input 
                      value={editFormData.opdRoom}
                      onChange={(e) => setEditFormData({...editFormData, opdRoom: e.target.value})}
                      placeholder="OPD-201"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Consultation Fee (₹)</label>
                    <Input 
                      type="number"
                      value={editFormData.consultationFee}
                      onChange={(e) => setEditFormData({...editFormData, consultationFee: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Registration Number</label>
                    <Input 
                      value={editFormData.registrationNumber}
                      onChange={(e) => setEditFormData({...editFormData, registrationNumber: e.target.value})}
                      placeholder="e.g. MCI-99482"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reset Password <span className="text-[10px] font-normal text-slate-400">(Leave blank to keep current)</span>
              </label>
              <Input 
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                placeholder="Enter new password (optional)"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 3. DELETE STAFF CONFIRMATION MODAL                        */}
      {/* ======================================================== */}
      {userToDelete && (
        <Modal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          title="Remove Staff Member"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">
                  Permanently delete {userToDelete.name}?
                </p>
                <p className="text-rose-700 text-xs mt-1">
                  This action will permanently remove <span className="font-bold">{userToDelete.name}</span> ({userToDelete.role}) from this hospital's active staff registry. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setUserToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleDeleteUser}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Confirm Deletion
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 4. REGISTER NEW STAFF MODAL                              */}
      {/* ======================================================== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Hospital Staff"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Dr. Rajesh Khanna"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Gender</label>
              <Select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Hospital Role</label>
              <Select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                options={[
                  { value: 'doctor', label: 'Doctor / Consultant' },
                  { value: 'nurse', label: 'Nurse / Nursing Station' },
                  { value: 'receptionist', label: 'Receptionist / Front Desk' },
                  { value: 'billing_cashier', label: 'Billing Cashier / Accountant' },
                  { value: 'pharmacist', label: 'Pharmacist' },
                  { value: 'lab_tech', label: 'Lab Technician / Pathologist' },
                  { value: 'radiologist', label: 'Radiology Technician / Radiologist' },
                  { value: 'branch_admin', label: 'Branch Administrator' },
                  { value: 'hospital_admin', label: 'Hospital Administrator' },
                ]}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Branch Campus Assignment</label>
              {currentUser?.role === 'branch_admin' ? (
                <Input 
                  disabled 
                  value={branches.find(b => b._id === (currentUser.branch?._id || currentUser.branch))?.name || 'Assigned Branch'} 
                  className="bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              ) : (
                <Select 
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  options={[
                    { value: '', label: 'Select Branch (Optional / Organization-Wide)' },
                    ...branches.map(b => ({
                      value: b._id,
                      label: `${b.name} (${b.code || 'Campus'})`
                    }))
                  ]}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="doctor@hospital.com"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <Input 
                isPhone={true}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="10-digit mobile (e.g. 9820011000)"
                required
              />
            </div>
          </div>

          {formData.role === 'doctor' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Doctor Profile Settings</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Specialty</label>
                  <Input 
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">OPD Room</label>
                  <Input 
                    value={formData.opdRoom}
                    onChange={(e) => setFormData({...formData, opdRoom: e.target.value})}
                    placeholder="OPD-201"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Standard Consultation Fee (₹)</label>
                  <Input 
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Registration Number</label>
                  <Input 
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    placeholder="MCI-99482"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Initial Password</label>
            <Input 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Staff User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
