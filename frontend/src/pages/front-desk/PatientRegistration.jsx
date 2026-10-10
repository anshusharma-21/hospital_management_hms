import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  UserPlus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  Phone,
  Shield,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { isValidPhoneNumber, isValidEmail, getPhoneErrorMessage } from '../../utils/validation';

export const PatientRegistration = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Search Before Register State
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'Unknown',
    maritalStatus: 'Single',
    phone: '',
    alternatePhone: '',
    email: '',
    address: {
      street: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: ''
    },
    emergencyContact: {
      name: '',
      relation: 'Spouse',
      phone: ''
    },
    nationalId: '',
    abhaId: '',
    insuranceDetails: {
      provider: '',
      policyNumber: '',
      tpaName: ''
    }
  });

  const [allergies, setAllergies] = useState([]);
  const [chronicConditions, setChronicConditions] = useState([]);
  const [newAllergen, setNewAllergen] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success Modal
  const [createdPatient, setCreatedPatient] = useState(null);

  // Search before register
  const handleCheckExisting = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await api.get(`/patients?search=${encodeURIComponent(searchQuery.trim())}`);
      if (res.data.success && res.data.data.length > 0) {
        setDuplicateWarning(res.data.data[0]);
      } else {
        setDuplicateWarning(null);
        addToast({
          title: 'No Duplicate Found',
          message: 'Proceed with new patient demographic entry.',
          type: 'info'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDobChange = (e) => {
    const dobVal = e.target.value;
    let derivedAge = '';
    if (dobVal) {
      const diffMs = Date.now() - new Date(dobVal).getTime();
      const ageDate = new Date(diffMs);
      derivedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    setFormData((prev) => ({ ...prev, dob: dobVal, age: derivedAge }));
  };

  const addAllergy = () => {
    if (!newAllergen.trim()) return;
    setAllergies((prev) => [...prev, { allergen: newAllergen.trim(), severity: 'Moderate' }]);
    setNewAllergen('');
  };

  const removeAllergy = (idx) => {
    setAllergies((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setChronicConditions((prev) => [...prev, newCondition.trim()]);
    setNewCondition('');
  };

  const removeCondition = (idx) => {
    setChronicConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone) {
      addToast({
        title: 'Validation Error',
        message: 'Please provide patient first name and mobile number',
        type: 'error'
      });
      return;
    }

    if (!isValidPhoneNumber(formData.phone)) {
      addToast({
        title: 'Invalid Mobile Number',
        message: getPhoneErrorMessage(formData.phone, 'Primary mobile number') || 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9',
        type: 'error'
      });
      return;
    }

    if (formData.alternatePhone && !isValidPhoneNumber(formData.alternatePhone)) {
      addToast({
        title: 'Invalid Alternate Mobile',
        message: getPhoneErrorMessage(formData.alternatePhone, 'Alternate mobile') || 'Alternate mobile must be 10 digits starting with 6, 7, 8, or 9',
        type: 'error'
      });
      return;
    }

    if (formData.emergencyContact?.phone && !isValidPhoneNumber(formData.emergencyContact.phone)) {
      addToast({
        title: 'Invalid Emergency Phone',
        message: getPhoneErrorMessage(formData.emergencyContact.phone, 'Emergency contact phone') || 'Emergency phone must be 10 digits starting with 6, 7, 8, or 9',
        type: 'error'
      });
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      addToast({
        title: 'Invalid Email Address',
        message: 'Please provide a valid email format (e.g. patient@example.com)',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        allergies,
        chronicConditions
      };

      const res = await api.post('/patients', payload);
      if (res.data.success) {
        setCreatedPatient(res.data.data);
        addToast({
          title: 'Registration Successful',
          message: `Generated UHID: ${res.data.data.uhid}`,
          type: 'success'
        });
      }
    } catch (err) {
      if (err.response?.data?.isDuplicate) {
        setDuplicateWarning(err.response.data.existingPatient);
        addToast({
          title: 'Duplicate Detected',
          message: err.response.data.error,
          type: 'warning'
        });
      } else {
        addToast({
          title: 'Registration Failed',
          message: err.response?.data?.error || 'Could not register patient',
          type: 'error'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Patient Registration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Create a new tenant-global longitudinal patient identity (UHID) with duplicate protection
        </p>
      </div>

      {/* Step 1: Pre-Registration Duplicate Check */}
      <Card
        title="Step 1: Check for Existing Patient Record"
        subtitle="Prevent accidental duplicates by checking mobile or national ID"
        headerIcon={Search}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search phone number or Aadhaar / National ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            icon={Search}
            isLoading={searchLoading}
            onClick={handleCheckExisting}
          >
            Check Existing
          </Button>
        </div>

        {duplicateWarning && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Existing Patient Identity Matched
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  A patient already exists with these details: <strong>{duplicateWarning.fullName}</strong> ({duplicateWarning.uhid || 'UHID'}).
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={ArrowRight}
              onClick={() => navigate(`/patients/${duplicateWarning._id || duplicateWarning.id}`)}
            >
              Open Profile
            </Button>
          </div>
        )}
      </Card>

      {/* Step 2: Patient Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <Card title="Demographic Information" headerIcon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Ramesh"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Gupta"
            />
            <Select
              label="Gender"
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={handleDobChange}
            />
            <Input
              label="Age (Years)"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 35"
            />
            <Select
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              options={[
                { value: 'Unknown', label: 'Unknown' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' }
              ]}
            />
          </div>
        </Card>

        {/* Contact Information */}
        <Card title="Contact & Address" headerIcon={Phone}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Mobile Number (Primary)"
              required
              isPhone={true}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="10-digit mobile (e.g. 9820011223)"
            />
            <Input
              label="Alternate Mobile"
              isPhone={true}
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              placeholder="Optional alternate (10 digits)"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. patient@example.com"
            />
            <div className="sm:col-span-2">
              <Input
                label="Street Address / Flat No."
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })
                }
                placeholder="e.g. Flat 301, Sunshine Heights, Andheri West"
              />
            </div>
            <Input
              label="City"
              value={formData.address.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })
              }
            />
          </div>

          {/* Emergency Contact */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-3">Emergency Contact Person</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Contact Name"
                value={formData.emergencyContact.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })
                }
                placeholder="e.g. Sunita Gupta"
              />
              <Input
                label="Relationship"
                value={formData.emergencyContact.relation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                  })
                }
                placeholder="e.g. Spouse / Sibling / Parent"
              />
              <Input
                label="Emergency Phone"
                isPhone={true}
                value={formData.emergencyContact.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })
                }
                placeholder="10-digit mobile (e.g. 9820099881)"
              />
            </div>
          </div>
        </Card>

        {/* Identifiers & Insurance */}
        <Card title="Government IDs & Insurance / TPA" headerIcon={Shield}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="National ID / Aadhaar"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              placeholder="e.g. 1234-5678-9012"
            />
            <Input
              label="ABHA ID (Ayushman Bharat)"
              value={formData.abhaId}
              onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
              placeholder="e.g. user@abdm"
            />
            <Input
              label="Insurance Provider"
              value={formData.insuranceDetails.provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  insuranceDetails: { ...formData.insuranceDetails, provider: e.target.value }
                })
              }
              placeholder="e.g. Star Health / Max Bupa"
            />
            <Input
              label="Policy Number"
              value={formData.insuranceDetails.policyNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  insuranceDetails: { ...formData.insuranceDetails, policyNumber: e.target.value }
                })
              }
              placeholder="e.g. POL-992381-A"
            />
            <Input
              label="TPA Company"
              value={formData.insuranceDetails.tpaName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  insuranceDetails: { ...formData.insuranceDetails, tpaName: e.target.value }
                })
              }
              placeholder="e.g. Medi Assist / Paramount"
            />
          </div>
        </Card>

        {/* Clinical History & Allergies */}
        <Card title="Allergies & Known Chronic Conditions" headerIcon={AlertTriangle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Allergies */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Allergies (Drug / Food / Environmental)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Penicillin, Peanuts, Sulfa..."
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                />
                <Button variant="secondary" size="md" icon={Plus} onClick={addAllergy}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {allergies.map((a, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                  >
                    <span>{a.allergen}</span>
                    <button
                      type="button"
                      onClick={() => removeAllergy(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Chronic Pre-existing Conditions</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Diabetes, Hypertension, Asthma..."
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCondition();
                    }
                  }}
                />
                <Button variant="secondary" size="md" icon={Plus} onClick={addCondition}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {chronicConditions.map((c, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 pb-8 border-t border-slate-200">
          <Button variant="outline" size="lg" onClick={() => navigate('/patients/search')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" icon={UserPlus} isLoading={submitting}>
            Complete Registration & Generate UHID
          </Button>
        </div>
      </form>

      {/* Registration Success Modal */}
      {createdPatient && (
        <Modal
          isOpen={!!createdPatient}
          onClose={() => setCreatedPatient(null)}
          title="Patient Registered Successfully"
          maxWidth="max-w-md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Permanent Patient Identity
              </p>
              <h3 className="text-2xl font-black text-teal-800 font-mono tracking-tight">
                {createdPatient.uhid}
              </h3>
              <p className="text-base font-bold text-slate-800">{createdPatient.fullName}</p>
              <p className="text-xs text-slate-500">
                {createdPatient.gender}, {createdPatient.age} yrs • {createdPatient.phone}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={Calendar}
                onClick={() => {
                  setCreatedPatient(null);
                  navigate(`/appointments/book?patientId=${createdPatient._id}`);
                }}
              >
                Book Appointment Now
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                icon={FileText}
                onClick={() => {
                  setCreatedPatient(null);
                  navigate(`/patients/${createdPatient._id}`);
                }}
              >
                Open Longitudinal Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
