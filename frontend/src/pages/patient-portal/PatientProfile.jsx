import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  ShieldCheck,
  Building,
  Contact,
  CreditCard,
  Edit3,
  KeyRound,
  Droplet,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

export const PatientProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    phone: '',
    alternatePhone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/patients/me');
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setProfile(data);
        populateEditForm(data);
      } else {
        throw new Error('Profile record not returned');
      }
    } catch (err) {
      console.error('Failed to fetch patient profile:', err);
      setError('Could not retrieve your patient record. Please re-authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (data) => {
    setEditForm({
      phone: data.phone || '',
      alternatePhone: data.alternatePhone || '',
      email: data.email || '',
      street: data.address?.street || '',
      city: data.address?.city || '',
      state: data.address?.state || '',
      pincode: data.address?.pincode || '',
      emergencyName: data.emergencyContact?.name || '',
      emergencyRelation: data.emergencyContact?.relation || data.emergencyContact?.relationship || '',
      emergencyPhone: data.emergencyContact?.phone || ''
    });
  };

  // Submit profile edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile?._id) return;

    setIsSavingProfile(true);
    try {
      const payload = {
        phone: editForm.phone,
        alternatePhone: editForm.alternatePhone,
        email: editForm.email,
        address: {
          street: editForm.street,
          city: editForm.city,
          state: editForm.state,
          pincode: editForm.pincode,
          country: 'India'
        },
        emergencyContact: {
          name: editForm.emergencyName,
          relation: editForm.emergencyRelation,
          relationship: editForm.emergencyRelation,
          phone: editForm.emergencyPhone
        }
      };

      const res = await api.put(`/patients/${profile._id}`, payload);
      if (res.data?.success) {
        addToast('Profile details updated successfully', 'success');
        setProfile(res.data.data);
        setIsEditModalOpen(false);
      } else {
        throw new Error(res.data?.error || 'Update failed');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      addToast(err.response?.data?.error || 'Failed to update details', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit password change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      addToast('Please provide both current and new password', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data?.success) {
        addToast('Password updated successfully', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsPasswordModalOpen(false);
      } else {
        throw new Error(res.data?.error || 'Password update failed');
      }
    } catch (err) {
      console.error('Password change error:', err);
      addToast(err.response?.data?.error || 'Failed to change password. Verify your current password.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-6">
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 max-w-md mx-auto text-center bg-white rounded-3xl border border-rose-200 shadow-sm mt-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Profile Unavailable</h3>
        <p className="text-xs text-slate-600">{error || 'Unable to access your patient record.'}</p>
        <Button onClick={fetchProfile} size="sm" className="bg-teal-700 text-white font-bold">
          Retry
        </Button>
      </div>
    );
  }

  const patientInitials = (profile.fullName || profile.firstName || 'P')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formattedDob = profile.dob
    ? new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${profile.age || '—'} Years`;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* The Single Unified Profile Card (Square with Overlapping Circle Avatar on top) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Cover Header Banner */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 relative p-6 flex flex-col justify-between overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar inside Cover */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-200 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              Patient Personal Profile
            </span>

            {/* Quick Actions in Cover */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md transition-all shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md transition-all shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Identity & Overlapping Circular Photo Section */}
        <div className="px-6 sm:px-12 pb-10 pt-0">
          <div className="text-center -mt-16 sm:-mt-20">
            {/* Overlapping Circle Avatar */}
            <div className="inline-block relative">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white font-black text-4xl sm:text-5xl flex items-center justify-center tracking-tight ring-4 ring-teal-500/15 mx-auto">
                {patientInitials}
              </div>
              <span
                className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-md"
                title="Active Patient"
              />
            </div>

            {/* Name & Basic Tag Line */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-4">
              {profile.fullName || `${profile.firstName} ${profile.lastName || ''}`}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
              <span className="font-mono text-xs bg-teal-50 text-teal-800 border border-teal-200/80 px-3 py-1 rounded-full font-bold">
                UHID: {profile.uhid}
              </span>
              <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200/80 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-rose-600" />
                Blood: {profile.bloodGroup || 'Not set'}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                {profile.gender} • {profile.age || '—'} Years
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                {profile.primaryBranch?.name || 'Main Hospital Campus'}
              </span>
            </div>
          </div>

          {/* Seamless Content Flow (One Single Card - No Disjointed Floating Boxes!) */}
          <div className="mt-10 space-y-8">
            {/* 1. Personal Information */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-teal-700" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-6 pt-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">First Name</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{profile.firstName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Name</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{profile.lastName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{formattedDob}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{profile.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{profile.age || '—'} Years</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marital Status</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{profile.maritalStatus || 'Single'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                  <span className="text-sm font-bold text-rose-600 mt-0.5 block">{profile.bloodGroup || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">National ID / Aadhaar</span>
                  <span className="text-sm font-mono text-slate-800 mt-0.5 block">
                    {profile.nationalId ? `•••• •••• ${profile.nationalId.slice(-4)}` : 'Not Linked'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ABHA Health ID</span>
                  <span className="text-sm font-mono text-slate-800 mt-0.5 block">{profile.abhaId || 'Not Linked'}</span>
                </div>
              </div>
            </div>

            {/* 2. Contact & Address Information */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Phone className="w-4 h-4 text-teal-700" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Contact & Address Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 pt-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Mobile Phone</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-mono font-bold text-slate-900">+91 {profile.phone}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alternate Phone</span>
                  <span className="text-sm font-mono font-semibold text-slate-800 mt-0.5 block">
                    {profile.alternatePhone ? `+91 ${profile.alternatePhone}` : 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                    {profile.email || 'No email registered'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</span>
                  <p className="text-sm font-medium text-slate-800 mt-0.5 leading-relaxed">
                    {profile.address?.street || ''}
                    {profile.address?.city ? `, ${profile.address.city}` : ''}
                    {profile.address?.state ? `, ${profile.address.state}` : ''}
                    {profile.address?.pincode ? ` - ${profile.address.pincode}` : ''}
                    {!profile.address?.street && !profile.address?.city && 'Address details not provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Emergency Contact & Hospital Branch */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Contact className="w-4 h-4 text-teal-700" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Emergency Contact & Hospital Branch
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 pt-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Contact Person</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {profile.emergencyContact?.name || 'Not provided'}
                    </span>
                    {profile.emergencyContact?.name && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        {profile.emergencyContact.relation || profile.emergencyContact.relationship || 'Next of Kin'}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Phone Number</span>
                  {profile.emergencyContact?.phone ? (
                    <a
                      href={`tel:${profile.emergencyContact.phone}`}
                      className="text-sm font-mono font-bold text-teal-700 hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                      +91 {profile.emergencyContact.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 mt-0.5 block">Not registered</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Hospital Branch</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {profile.primaryBranch?.name || 'Main Hospital Campus'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hospital Contact Helpline</span>
                  <span className="text-sm font-mono text-slate-800 mt-0.5 block">
                    {profile.primaryBranch?.phone || '1800-HOSPITAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Personal & Contact Details"
        subtitle="Update your phone, email, address, and emergency contact details."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone Number"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              required
              placeholder="e.g. 9876543210"
            />
            <Input
              label="Alternate Phone (Optional)"
              value={editForm.alternatePhone}
              onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })}
              placeholder="e.g. 9123456789"
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            placeholder="patient@example.com"
          />

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Residential Address
            </h4>
            <div className="space-y-3">
              <Input
                label="Street Address / House No."
                value={editForm.street}
                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                placeholder="123 Hospital Road, Suite 4"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                />
                <Input
                  label="State"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="State"
                />
                <Input
                  label="Pincode"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Designated Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Contact Name"
                value={editForm.emergencyName}
                onChange={(e) => setEditForm({ ...editForm, emergencyName: e.target.value })}
                placeholder="Guardian name"
              />
              <Input
                label="Relationship"
                value={editForm.emergencyRelation}
                onChange={(e) => setEditForm({ ...editForm, emergencyRelation: e.target.value })}
                placeholder="e.g. Father, Spouse"
              />
              <Input
                label="Phone Number"
                value={editForm.emergencyPhone}
                onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                placeholder="Emergency phone"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingProfile} className="bg-teal-700 text-white font-bold">
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Security & Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Account Password"
        subtitle="Keep your account and personal records protected with a secure password."
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPass ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showNewPass ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPass ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isSavingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingPassword} className="bg-teal-700 text-white font-bold">
              {isSavingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
