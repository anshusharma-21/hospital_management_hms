import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Check, 
  X, 
  FlaskConical, 
  Scan, 
  Pill, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Save,
  Building 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const FeatureFlags = () => {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [flags, setFlags] = useState({
    module_laboratory: true,
    module_radiology: true,
    module_pharmacy: true,
    module_ipd_wards: true,
    module_emergency: true,
    module_ot: true,
    module_insurance_tpa: true,
    module_patient_portal: true,
    module_ai_assistant: true,
    module_crm_corporate: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchFeatureFlags(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      if (res.data.success && res.data.data.length > 0) {
        setTenants(res.data.data);
        const initialTenant = res.data.data[0]._id;
        setSelectedTenant(initialTenant);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const fetchFeatureFlags = async (tenantId) => {
    setLoading(true);
    try {
      const res = await api.get(`/saas/feature-flags?tenantId=${tenantId}`);
      if (res.data.success && res.data.data.length > 0) {
        const flagMap = { ...flags };
        res.data.data.forEach(f => {
          flagMap[f.moduleKey] = f.isEnabled;
          // Also set alias if present
          if (f.moduleKey === 'module_laboratory') flagMap['module_lab'] = f.isEnabled;
          if (f.moduleKey === 'module_insurance_tpa') flagMap['module_insurance'] = f.isEnabled;
          if (f.moduleKey === 'module_ot') flagMap['module_ot_surgery'] = f.isEnabled;
          if (f.moduleKey === 'module_ai_assistant') flagMap['module_ai_copilot'] = f.isEnabled;
        });
        setFlags(flagMap);
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Feature Flags Notice',
        message: 'Could not load remote flags. Displaying active local defaults.',
        type: 'info'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newVal = !flags[key];
    setFlags(prev => ({ ...prev, [key]: newVal }));

    try {
      await api.put('/saas/feature-flags', {
        moduleKey: key,
        isEnabled: newVal,
        tenantId: selectedTenant
      });
      addToast({
        title: 'Feature Flag Updated',
        message: `${key} is now ${newVal ? 'ENABLED' : 'DISABLED'}`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Flag State Preserved',
        message: err.response?.data?.error || 'Flag state saved in active session.',
        type: 'info'
      });
    }
  };

  const modules = [
    { key: 'module_laboratory', name: 'Diagnostic Laboratory Module', desc: 'Analyzer workbenches, specimen collection & barcode integration', icon: FlaskConical },
    { key: 'module_radiology', name: 'Radiology & Imaging Worklist', desc: 'DICOM imaging worklist, PACS integration boundaries & radiologist reporting', icon: Scan },
    { key: 'module_pharmacy', name: 'Pharmacy & Drug POS', desc: 'Prescription dispensing, FEFO batch tracking & drug inventory master', icon: Pill },
    { key: 'module_insurance_tpa', name: 'TPA & Cashless Insurance Desk', desc: 'Pre-authorization requests, claims management & settlement tracking', icon: ShieldCheck },
    { key: 'module_ot', name: 'Operation Theatre (OT) Management', desc: 'Surgical scheduling, WHO checklists & PACU recovery documentation', icon: Settings },
    { key: 'module_ipd_wards', name: 'Inpatient Wards & High-Acuity ICU', desc: 'Bed telemetry monitoring, infusions & critical care observations', icon: Settings },
    { key: 'module_emergency', name: 'Emergency & Trauma Triage Bay', desc: 'Red/Yellow/Green triage bay, critical arrivals & resuscitation beds', icon: ShieldCheck },
    { key: 'module_patient_portal', name: 'Patient Self-Service PWA Portal', desc: 'Longitudinal record lookup, follow-up booking & digital prescription access', icon: Users },
    { key: 'module_ai_assistant', name: 'AI Clinical Notes Copilot (Optional)', desc: 'Assisted discharge summary drafting with strict physician human sign-off', icon: Sparkles },
    { key: 'module_crm_corporate', name: 'CRM & Corporate Accounts', desc: 'Corporate hospital empanelment, health checkup camps & patient leads', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tenant Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tenant Module Feature Flags</h1>
              <p className="text-xs text-slate-500">Dynamically activate or deactivate hospital functional modules per tenant without schema disruption</p>
            </div>
          </div>
        </div>

        {/* Tenant Picker */}
        {tenants.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Building className="w-4 h-4 text-teal-600 shrink-0 ml-1" />
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              {tenants.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Feature Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => {
          const isEnabled = Boolean(flags[m.key]);
          const Icon = m.icon;

          return (
            <Card key={m.key} className="border-slate-200 flex items-center justify-between p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isEnabled ? 'bg-teal-50 text-teal-600 border border-teal-200' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs">{m.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                  <span className="font-mono text-[10px] text-slate-400 mt-1 block">{m.key}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(m.key)}
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
            </Card>
          );
        })}
      </div>
    </div>
  );
};
