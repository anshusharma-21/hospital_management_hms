import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Building,
  Activity,
  Contact,
  CreditCard,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientProfile = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/patients/me');
      if (res.data?.success && res.data.data) {
        setProfile(res.data.data);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
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
        <p className="text-xs text-slate-600">{error || 'Unable to access your profile.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-200 font-extrabold text-2xl sm:text-3xl shadow-inner">
              {profile.fullName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{profile.fullName}</h1>
                <span className="font-mono text-xs bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-bold">
                  {profile.uhid}
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-1">
                {profile.age} Years Old • {profile.gender} • Blood Group: <strong className="text-white">{profile.bloodGroup || 'Not set'}</strong>
              </p>
              <p className="text-xs text-teal-100/60 font-mono mt-0.5">
                Registered Phone: +91 {profile.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Verified Patient Identity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Demographics & Identification */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Personal Demographics</h3>
              <p className="text-[11px] text-slate-500">Official hospital registry record</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">First Name</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{profile.firstName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Last Name</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{profile.lastName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Date of Birth</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {profile.dob ? new Date(profile.dob).toLocaleDateString() : `${profile.age} Years (Approx)`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Gender</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{profile.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Blood Group</span>
              <span className="font-bold text-teal-700 mt-0.5 block">{profile.bloodGroup || 'Not Specified'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Marital Status</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{profile.maritalStatus || 'Single'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">National ID / Aadhaar</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {profile.nationalId ? `•••• •••• ${profile.nationalId.slice(-4)}` : 'Not Linked'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">ABHA Health ID</span>
              <span className="font-mono text-slate-700 mt-0.5 block">{profile.abhaId || 'Not Linked'}</span>
            </div>
          </div>
        </div>

        {/* 2. Contact & Address Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Contact & Residential Address</h3>
              <p className="text-[11px] text-slate-500">For communications & medical alerts</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Primary Mobile</span>
                  <span className="font-mono font-semibold text-slate-800">+91 {profile.phone}</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Verified</span>
            </div>

            {profile.alternatePhone && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Alternate Phone</span>
                    <span className="font-mono font-semibold text-slate-800">+91 {profile.alternatePhone}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
                  <span className="font-semibold text-slate-800">{profile.email || 'No email registered'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Residential Address</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {profile.address?.street || ''}
                    {profile.address?.city ? `, ${profile.address.city}` : ''}
                    {profile.address?.state ? `, ${profile.address.state}` : ''}
                    {profile.address?.postalCode ? ` - ${profile.address.postalCode}` : ''}
                    {!profile.address?.street && !profile.address?.city && 'Address not registered'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Clinical Profile: Allergies & Chronic Conditions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Clinical Profile & Safety Alerts</h3>
              <p className="text-[11px] text-slate-500">Critical allergies & known conditions</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Drug & Substance Allergies
              </span>
              {Array.isArray(profile.allergies) && profile.allergies.length > 0 ? (
                <div className="space-y-2">
                  {profile.allergies.map((a, idx) => {
                    const allergen = typeof a === 'object' ? a.allergen : a;
                    const severity = typeof a === 'object' && a.severity ? a.severity : 'Moderate';
                    const reaction = typeof a === 'object' && a.reaction ? a.reaction : 'Adverse clinical reaction';
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">{allergen}</p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Severity: <strong className="capitalize">{severity}</strong> • Reaction: {reaction}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>No known medical or substance allergies recorded.</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Chronic Medical Conditions
              </span>
              {Array.isArray(profile.chronicConditions) && profile.chronicConditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.chronicConditions.map((c, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 text-blue-600" />
                      <span>{c}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-500">
                  No chronic medical conditions recorded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Emergency Contacts & Primary Branch */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <Contact className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Emergency & Hospital Branch</h3>
              <p className="text-[11px] text-slate-500">Primary care center and guardian details</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Designated Emergency Contact
              </span>
              {profile.emergencyContact?.name ? (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{profile.emergencyContact.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                      {profile.emergencyContact.relationship || 'Next of Kin'}
                    </span>
                  </div>
                  <p className="text-slate-600 font-mono flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>{profile.emergencyContact.phone}</span>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-500">
                  No emergency contact registered. Please notify the front desk on your next visit.
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Primary Hospital Branch
              </span>
              <div className="p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-slate-900">{profile.primaryBranch?.name || 'Main Hospital Campus'}</span>
                </div>
                {profile.primaryBranch?.address && (
                  <p className="text-slate-600 pl-6 text-[11px]">
                    {typeof profile.primaryBranch.address === 'string'
                      ? profile.primaryBranch.address
                      : [profile.primaryBranch.address.street, profile.primaryBranch.address.city, profile.primaryBranch.address.state]
                          .filter(Boolean)
                          .join(', ')}
                  </p>
                )}
                {profile.primaryBranch?.phone && (
                  <p className="text-teal-800 pl-6 text-[11px] font-mono">Branch Contact: {profile.primaryBranch.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
