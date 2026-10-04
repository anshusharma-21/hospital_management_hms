import React, { useState } from 'react';
import { 
  Sparkles, 
  Building2, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  BedDouble, 
  User, 
  Lock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const TenantOnboarding = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Organization
    name: '',
    slug: '',
    legalName: '',
    hospitalType: 'Super-Specialty',
    email: '',
    phone: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    plan: 'Professional (Up to 100 Beds)',
    maxBeds: 100,

    // Step 2: Main Branch
    branchName: 'Main Medical Tower',
    branchCode: 'MAIN',
    branchBedCapacity: 80,
    hasEmergency: true,
    hasICU: true,

    // Step 3: Admin User
    adminName: 'Chief Medical Administrator',
    adminEmail: '',
    adminPhone: '',
    adminPassword: 'Password123!'
  });

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.slug || !formData.email)) {
      addToast('Please fill in required hospital details', 'warning');
      return;
    }
    setStep(step + 1);
  };

  const handleCompleteOnboarding = async () => {
    if (isSubmitting) return;

    if (!formData.name?.trim() || !formData.slug?.trim()) {
      addToast('Hospital name and URL slug are required', 'warning');
      setStep(1);
      return;
    }
    if (!formData.branchName?.trim() || !formData.branchCode?.trim()) {
      addToast('Primary branch name and code are required', 'warning');
      setStep(2);
      return;
    }
    if (!formData.adminEmail?.trim() || !formData.adminPassword?.trim()) {
      addToast('Admin login email and temporary password are required', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        legalName: formData.legalName?.trim() || formData.name.trim(),
        hospitalType: formData.hospitalType,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: {
          city: formData.city,
          state: formData.state,
          country: 'India'
        },
        subscription: {
          plan: formData.plan,
          maxBeds: Number(formData.maxBeds),
          status: 'active'
        },
        initialBranch: {
          name: formData.branchName.trim(),
          code: formData.branchCode.trim().toUpperCase(),
          bedCapacity: Number(formData.branchBedCapacity),
          hasEmergency: formData.hasEmergency,
          hasICU: formData.hasICU
        },
        adminUser: {
          name: formData.adminName.trim(),
          email: formData.adminEmail.trim().toLowerCase(),
          phone: (formData.adminPhone || formData.phone || '').trim(),
          password: formData.adminPassword,
          role: 'hospital_admin'
        }
      };

      const res = await api.post('/tenants', payload);
      if (res.data.success) {
        addToast(`Hospital Tenant ${formData.name} successfully onboarded!`, 'success');
        navigate('/saas/tenants');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to onboard tenant', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Hospital Vision Tenant Onboarding Wizard</h1>
        <p className="text-xs text-slate-500 mt-1">Enroll a new healthcare institution, provision data isolation boundaries & admin credentials</p>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>1</span>
            <span className="text-xs font-bold text-slate-700">Hospital Organization</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>2</span>
            <span className="text-xs font-bold text-slate-700">Primary Branch</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>3</span>
            <span className="text-xs font-bold text-slate-700">Hospital Admin Setup</span>
          </div>
        </div>
      </div>

      {/* Wizard Step Forms */}
      <Card className="border-slate-200">
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Step 1: Hospital Details & Subscription Plan</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Display Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')})}
                  placeholder="e.g. Apex Multispecialty Hospital"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tenant URL Slug</label>
                <Input 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="e.g. apex-hospital"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Legal Corporate Name</label>
                <Input 
                  value={formData.legalName}
                  onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                  placeholder="e.g. Apex Health Enterprises Pvt Ltd"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Classification</label>
                <Select 
                  value={formData.hospitalType}
                  onChange={(e) => setFormData({...formData, hospitalType: e.target.value})}
                  options={[
                    { value: 'Super-Specialty', label: 'Super-Specialty Hospital' },
                    { value: 'Multi-Specialty', label: 'Multi-Specialty Hospital' },
                    { value: 'Nursing Home', label: 'Nursing Home / Secondary Care' },
                    { value: 'Daycare Surgical', label: 'Daycare Surgery Center' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Contact Email</label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@apexhospital.com"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 22 4500 1000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subscription Plan</label>
                <Select 
                  value={formData.plan}
                  onChange={(e) => setFormData({...formData, plan: e.target.value})}
                  options={[
                    { value: 'Starter (Up to 30 Beds)', label: 'Starter (Up to 30 Beds) — ₹19,000/mo' },
                    { value: 'Professional (Up to 100 Beds)', label: 'Professional (Up to 100 Beds) — ₹49,000/mo' },
                    { value: 'Enterprise (Up to 500 Beds)', label: 'Enterprise (Up to 500 Beds) — ₹99,000/mo' },
                  ]}
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Licensed Max Beds</label>
                <Input 
                  type="number"
                  value={formData.maxBeds}
                  onChange={(e) => setFormData({...formData, maxBeds: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button onClick={handleNext}>
                Continue to Branch Setup <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Step 2: Primary Hospital Branch & Facilities</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Branch Name</label>
                <Input 
                  value={formData.branchName}
                  onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Branch Code</label>
                <Input 
                  value={formData.branchCode}
                  onChange={(e) => setFormData({...formData, branchCode: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Branch Bed Capacity</label>
              <Input 
                type="number"
                value={formData.branchBedCapacity}
                onChange={(e) => setFormData({...formData, branchBedCapacity: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={formData.hasEmergency}
                  onChange={(e) => setFormData({...formData, hasEmergency: e.target.checked})}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <span>Enable 24x7 Emergency Trauma & Triage Bay</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={formData.hasICU}
                  onChange={(e) => setFormData({...formData, hasICU: e.target.checked})}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <span>Enable High-Acuity ICU Observation Unit</span>
              </label>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue to Admin Setup <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Step 3: Initial Hospital Administrator Account</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrator Full Name</label>
                <Input 
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Login Email</label>
                <Input 
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Temporary Password</label>
              <Input 
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                required
              />
            </div>

            <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 text-teal-900 space-y-1">
              <p className="font-bold">Ready to Provision Hospital Vision Tenant</p>
              <p className="text-teal-700">Submitting will initialize tenant-isolated database records, seed default clinical departments (OPD, IPD, Lab, Radiology, Pharmacy, Billing) and generate the root hospital admin credentials.</p>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={handleCompleteOnboarding} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 animate-spin" /> Provisioning Hospital Tenant...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Provision Hospital Tenant
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
