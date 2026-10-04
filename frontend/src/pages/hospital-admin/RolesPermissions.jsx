import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const RolesPermissions = () => {
  const { addToast } = useToast();
  const [selectedRole, setSelectedRole] = useState('receptionist');

  const roles = [
    { key: 'receptionist', label: 'Receptionist / Front Desk' },
    { key: 'doctor', label: 'Doctor / Clinician' },
    { key: 'nurse', label: 'Nurse / Ward Station' },
    { key: 'billing_cashier', label: 'Billing Cashier' },
    { key: 'pharmacist', label: 'Pharmacist' },
    { key: 'lab_tech', label: 'Lab Technician' },
    { key: 'radiologist', label: 'Radiologist' },
    { key: 'hospital_admin', label: 'Hospital Administrator' }
  ];

  // Action-based permission modules
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    receptionist: {
      'patients.create': true,
      'patients.read': true,
      'patients.update': true,
      'appointments.create': true,
      'appointments.cancel': true,
      'encounters.read': false,
      'prescriptions.create': false,
      'billing.collect': false,
      'lab.verify': false
    },
    doctor: {
      'patients.create': false,
      'patients.read': true,
      'patients.update': false,
      'appointments.create': false,
      'appointments.cancel': false,
      'encounters.read': true,
      'prescriptions.create': true,
      'billing.collect': false,
      'lab.verify': false
    },
    nurse: {
      'patients.create': false,
      'patients.read': true,
      'patients.update': false,
      'appointments.create': false,
      'appointments.cancel': false,
      'encounters.read': true,
      'prescriptions.create': false,
      'billing.collect': false,
      'lab.verify': false
    },
    billing_cashier: {
      'patients.create': false,
      'patients.read': true,
      'patients.update': false,
      'appointments.create': false,
      'appointments.cancel': false,
      'encounters.read': false,
      'prescriptions.create': false,
      'billing.collect': true,
      'lab.verify': false
    },
    pharmacist: {
      'patients.create': false,
      'patients.read': true,
      'patients.update': false,
      'appointments.create': false,
      'appointments.cancel': false,
      'encounters.read': false,
      'prescriptions.create': false,
      'billing.collect': true,
      'lab.verify': false
    },
    lab_tech: {
      'patients.create': false,
      'patients.read': true,
      'patients.update': false,
      'appointments.create': false,
      'appointments.cancel': false,
      'encounters.read': false,
      'prescriptions.create': false,
      'billing.collect': false,
      'lab.verify': true
    },
    radiologist: {
      'patients.create': false,
      'patients.read': true,
      'patients.update': false,
      'appointments.create': false,
      'appointments.cancel': false,
      'encounters.read': false,
      'prescriptions.create': false,
      'billing.collect': false,
      'lab.verify': false
    },
    hospital_admin: {
      'patients.create': true,
      'patients.read': true,
      'patients.update': true,
      'appointments.create': true,
      'appointments.cancel': true,
      'encounters.read': true,
      'prescriptions.create': true,
      'billing.collect': true,
      'lab.verify': true
    }
  });

  const permissionLabels = {
    'patients.create': { label: 'Register New Patients', desc: 'Allows front desk intake and UHID generation' },
    'patients.read': { label: 'View Patient Profiles', desc: 'Search and read patient longitudinal records' },
    'patients.update': { label: 'Modify Demographics', desc: 'Edit patient address, phone, emergency contacts' },
    'appointments.create': { label: 'Book Appointments', desc: 'Schedule patient consultation slots' },
    'appointments.cancel': { label: 'Cancel Appointments', desc: 'Mark cancellations or no-shows' },
    'encounters.read': { label: 'Access Clinical EMR', desc: 'View doctor consultation notes and vitals' },
    'prescriptions.create': { label: 'Author e-Prescriptions', desc: 'Prescribe medicines, dosages, and lock Rx' },
    'billing.collect': { label: 'Collect Cash & Payments', desc: 'Generate invoices and record cashier receipts' },
    'lab.verify': { label: 'Verify Diagnostic Reports', desc: 'Approve analyzer test values and publish to EMR' }
  };

  const handleToggle = (permKey) => {
    const roleObj = { ...permissionsMatrix[selectedRole] };
    roleObj[permKey] = !roleObj[permKey];
    setPermissionsMatrix({
      ...permissionsMatrix,
      [selectedRole]: roleObj
    });
  };

  const handleSave = () => {
    addToast(`Security permissions updated for role: ${selectedRole.toUpperCase()}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h1>
              <p className="text-xs text-slate-500">Fine-grained operational permissions enforced at API and database boundaries</p>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1.5" /> Save Role Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Selector Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <Card className="p-2 border-slate-200">
            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Roles</p>
            <div className="space-y-1">
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRole(r.key)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                    selectedRole === r.key
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{r.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    selectedRole === r.key ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {Object.values(permissionsMatrix[r.key] || {}).filter(Boolean).length} Active
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Permissions Grid (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="border-slate-200">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Configuring Policy For</span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {roles.find(r => r.key === selectedRole)?.label}
                </h3>
              </div>
              <Badge variant="info">Enforced Backend API</Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {Object.keys(permissionLabels).map((permKey) => {
                const isEnabled = permissionsMatrix[selectedRole]?.[permKey] || false;
                const info = permissionLabels[permKey];

                return (
                  <div key={permKey} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{info.label}</p>
                      <p className="text-[11px] text-slate-500">{info.desc}</p>
                      <span className="font-mono text-[10px] text-teal-700">{permKey}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggle(permKey)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
