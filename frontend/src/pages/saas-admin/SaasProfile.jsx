import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  KeyRound, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Building2, 
  History,
  Check,
  RefreshCw,
  Fingerprint,
  Crown,
  Shield,
  Copy,
  Edit3,
  ExternalLink,
  Laptop,
  CheckCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { isValidEmail } from '../../utils/validation';

// Curated avatar presets for quick 1-click selection
const AVATAR_PRESETS = [
  {
    id: 'avatar-1',
    label: 'Medical Director',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'avatar-2',
    label: 'Executive Leader',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'avatar-3',
    label: 'Platform Architect',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'avatar-4',
    label: 'Chief Medical Officer',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'avatar-5',
    label: 'Lead Technologist',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'avatar-6',
    label: 'Health Informatics Head',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80'
  }
];

export const SaasProfile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  // Modals visibility state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Not entered', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 4) return { score: 2, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 3, label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  // Sync state with current authenticated user
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Copy email helper
  const handleCopyEmail = () => {
    if (profileForm.email) {
      navigator.clipboard?.writeText(profileForm.email);
      setCopiedEmail(true);
      addToast('Email copied to clipboard', 'success');
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Profile form submission handler
  const handleProfileSubmit = async (e) => {
    e?.preventDefault();
    const errors = {};

    if (!profileForm.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!profileForm.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!isValidEmail(profileForm.email)) {
      errors.email = 'Please provide a valid email format';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      addToast('Please fix the errors in the profile form', 'error');
      return;
    }

    setProfileErrors({});
    setIsSavingProfile(true);

    try {
      const res = await api.put('/auth/profile', {
        name: profileForm.name.trim(),
        email: profileForm.email.toLowerCase().trim(),
        phone: profileForm.phone.trim(),
        avatar: profileForm.avatar.trim()
      });

      if (res.data.success && res.data.user) {
        updateUser(res.data.user);
        addToast('Profile updated successfully!', 'success');
        setEditModalOpen(false);
      } else {
        addToast(res.data.message || 'Profile saved successfully', 'success');
        setEditModalOpen(false);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update profile details';
      addToast(errMsg, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password change submission handler
  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Enter current master password';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Enter new master password';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      addToast('Please verify password inputs', 'error');
      return;
    }

    setPasswordErrors({});
    setIsSavingPassword(true);

    try {
      const res = await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.data.success) {
        addToast('Master password changed successfully!', 'success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordModalOpen(false);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to change password. Verify your current password.';
      addToast(errMsg, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Return Navigation */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2 text-slate-500">
          <Link to="/saas/dashboard" className="hover:text-teal-700 transition-colors">
            SaaS Platform
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Administrator Profile</span>
        </div>

        <Link to="/saas/dashboard">
          <Button variant="outline" size="sm" className="text-xs font-semibold py-1 px-3">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Creative Overlapping Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Artistic Healthcare Gradient Cover Banner */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 relative overflow-hidden">
          {/* Subtle ambient lighting & texture */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          {/* Top Right Live Badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-teal-200 border border-white/20 backdrop-blur-md shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Root Authority Active
            </span>
          </div>
        </div>

        {/* Card Body with Overlapping Circular Avatar */}
        <div className="px-6 sm:px-10 pb-8 text-center sm:text-left">
          {/* Overlapping Circle Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 mb-5 gap-4">
            <div className="relative group cursor-pointer" onClick={() => setEditModalOpen(true)}>
              {/* Circular Avatar Container */}
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center ring-2 ring-slate-100 transition-transform duration-200 group-hover:scale-102">
                {profileForm.avatar ? (
                  <img 
                    src={profileForm.avatar} 
                    alt={profileForm.name || 'Admin'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-4xl font-black text-white tracking-tight">
                    {profileForm.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                )}
              </div>

              {/* Camera / Edit Icon Overlay Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditModalOpen(true);
                }}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-lg border-2 border-white transition-all hover:scale-110"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Buttons on Desktop */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2 px-3.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPasswordModalOpen(true)}
                className="font-bold text-xs py-2 px-3.5 hover:border-teal-300 text-slate-700"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                Change Password
              </Button>
            </div>
          </div>

          {/* User Name & Core Role Information */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {profileForm.name || user?.name || 'Platform Administrator'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/90 w-fit mx-auto sm:mx-0">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                SaaS Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Cross-tenant root governance overseer. Full administrative control over hospital tenants, clinical modules, and platform subscriptions.
            </p>
          </div>

          {/* Structured Profile Details (Clean, Not Raw Inputs!) */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Email Address Item */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {profileForm.email || 'admin@hospitalvision.com'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-200/60 transition-colors ml-2"
                title="Copy Email"
              >
                {copiedEmail ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Direct Phone Item */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-xs font-bold text-slate-900">
                  {profileForm.phone || '+91 99000 11000'}
                </p>
              </div>
            </div>

            {/* Platform Role & Access Scope */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Access Level</p>
                <p className="text-xs font-bold text-slate-900">
                  root_super_admin (Full Access)
                </p>
              </div>
            </div>

            {/* Security Standard Item */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Security State</p>
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Encrypted TLS 1.3 Active
                </p>
              </div>
            </div>
          </div>

          {/* Footer Quick Links & Security Notice */}
          <div className="mt-7 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">
              Profile modifications are recorded in the immutable audit ledger.
            </span>
            <Link 
              to="/saas/audit-logs" 
              className="text-teal-700 hover:text-teal-800 font-bold hover:underline flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" /> View Audit Trail
            </Link>
          </div>
        </div>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Administrator Profile"
        subtitle="Update your full name, email address, phone number, and avatar"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4 pt-1 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="e.g. Mr. Ajay Kumar"
                className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border ${
                  profileErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                } bg-white text-slate-900 focus:outline-none transition-all`}
              />
            </div>
            {profileErrors.name && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">{profileErrors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Email Address (Login Username) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="e.g. ajay@gmail.com"
                className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border ${
                  profileErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                } bg-white text-slate-900 focus:outline-none transition-all`}
              />
            </div>
            {profileErrors.email && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">{profileErrors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Contact Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. +91 99000 11000"
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-white text-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Avatar Studio Presets */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800">Avatar Studio</p>
              {profileForm.avatar && (
                <button
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, avatar: '' })}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Clear Avatar
                </button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = profileForm.avatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, avatar: preset.url })}
                    className={`group relative aspect-square rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                      isSelected 
                        ? 'border-teal-600 ring-2 ring-teal-300 shadow-sm scale-105' 
                        : 'border-slate-200 hover:border-teal-400 opacity-75 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.label} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-700/40 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative pt-1">
              <Camera className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={profileForm.avatar}
                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                placeholder="Or paste image URL (https://...)"
                className="w-full pl-7 pr-3 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSavingProfile}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
            >
              {isSavingProfile ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Master Password"
        subtitle="Rotate root administrator login credentials"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1 text-xs">
          {/* Current Password */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Current Master Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••••••"
                className={`w-full pl-9 pr-9 py-2 text-xs font-semibold rounded-xl border ${
                  passwordErrors.currentPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                } bg-white text-slate-900 focus:outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPass ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimum 6 characters"
                className={`w-full pl-9 pr-9 py-2 text-xs font-semibold rounded-xl border ${
                  passwordErrors.newPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                } bg-white text-slate-900 focus:outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Dynamic Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Strength:</span>
                  <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {passwordErrors.newPassword && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">{passwordErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className={`w-full pl-9 pr-9 py-2 text-xs font-semibold rounded-xl border ${
                  passwordErrors.confirmPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                } bg-white text-slate-900 focus:outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSavingPassword}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold"
            >
              {isSavingPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SaasProfile;
