import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  GitMerge,
  AlertTriangle
} from 'lucide-react';

export const PatientList = () => {
  const { addToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  // Patient Merge State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const [mergeForm, setMergeForm] = useState({
    sourceUhid: '',
    targetUhid: '',
    reason: 'Duplicate patient registration identified at front desk'
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10
      });
      if (search.trim()) params.append('search', search.trim());
      if (gender !== 'all') params.append('gender', gender);

      const res = await api.get(`/patients?${params.toString()}`);
      if (res.data.success) {
        setPatients(res.data.data);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, gender]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    if (!mergeForm.sourceUhid || !mergeForm.targetUhid) {
      addToast('Please specify both Source UHID and Target Master UHID', 'warning');
      return;
    }
    if (mergeForm.sourceUhid.trim().toUpperCase() === mergeForm.targetUhid.trim().toUpperCase()) {
      addToast('Source and Target cannot be the exact same patient UHID', 'error');
      return;
    }

    try {
      setMergeSubmitting(true);
      // Resolve patient IDs
      const [srcRes, tgtRes] = await Promise.all([
        api.get(`/patients?search=${encodeURIComponent(mergeForm.sourceUhid.trim())}`),
        api.get(`/patients?search=${encodeURIComponent(mergeForm.targetUhid.trim())}`)
      ]);

      const sourcePatient = srcRes.data?.data?.find(p => p.uhid === mergeForm.sourceUhid.trim().toUpperCase()) || srcRes.data?.data?.[0];
      const targetPatient = tgtRes.data?.data?.find(p => p.uhid === mergeForm.targetUhid.trim().toUpperCase()) || tgtRes.data?.data?.[0];

      if (!sourcePatient || !targetPatient) {
        addToast('Could not locate one or both patients in registry', 'error');
        return;
      }

      const res = await api.post('/patients/merge', {
        sourcePatientId: sourcePatient._id,
        targetPatientId: targetPatient._id,
        reason: mergeForm.reason
      });

      if (res.data?.success) {
        addToast(res.data.message || 'Patient history safely consolidated under master UHID', 'success');
        setShowMergeModal(false);
        setMergeForm({
          sourceUhid: '',
          targetUhid: '',
          reason: 'Duplicate patient registration identified at front desk'
        });
        await fetchPatients();
      }
    } catch (err) {
      console.error('Merge error:', err);
      addToast(err.response?.data?.error || 'Failed to complete patient record merge', 'error');
    } finally {
      setMergeSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'UHID',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
          {row.uhid}
        </span>
      )
    },
    {
      header: 'Patient Name',
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-slate-800 hover:text-teal-700 cursor-pointer">
            {row.fullName}
          </span>
          <p className="text-[10px] text-slate-400">
            {row.gender}, {row.age} yrs • Blood Group: {row.bloodGroup || 'N/A'}
          </p>
          {row.isMerged && (
            <Badge variant="warning" className="mt-0.5 text-[9px]">
              Merged Record
            </Badge>
          )}
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-0.5 text-xs text-slate-600">
          <p className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            {row.phone}
          </p>
          {row.email && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.email}</p>}
        </div>
      )
    },
    {
      header: 'Branch Campus',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.primaryBranch?.name || 'Main Campus'}
        </span>
      )
    },
    {
      header: 'Clinical Alerts',
      render: (row) => (
        <div>
          {row.allergies?.length > 0 ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Allergy: {row.allergies.map((a) => a.allergen).join(', ')}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">No known allergies</span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={ExternalLink}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${row._id}`);
            }}
          >
            Longitudinal Profile
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Calendar}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/appointments/book?patientId=${row._id}`);
            }}
          >
            Book
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single longitudinal patient registry across all branches ({totalCount} registered)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={GitMerge}
            onClick={() => setShowMergeModal(true)}
          >
            Merge Duplicate Records
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => navigate('/patients/register')}
          >
            Register New Patient
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search by UHID, full name, phone number, or national ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Genders' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>
      </Card>

      {/* Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={patients}
          isLoading={loading}
          emptyMessage="No patient records match the specified search criteria."
          onRowClick={(row) => navigate(`/patients/${row._id}`)}
        />

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages} ({totalCount} total patients)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Patient Merge Dialog */}
      <Modal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        title="Merge Duplicate Patient Records (Audit Safe)"
      >
        <form onSubmit={handleMergeSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Safe Longitudinal Record Consolidation</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Clinical encounters, past appointments, invoices, payments, prescriptions, lab & radiology orders will be safely migrated and linked to the Surviving Master UHID. The duplicate record will be archived as merged.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Duplicate UHID (To be merged & archived)
              </label>
              <Input
                placeholder="e.g. HV-2026-0002"
                value={mergeForm.sourceUhid}
                onChange={(e) => setMergeForm({ ...mergeForm, sourceUhid: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Surviving Master UHID (To retain history)
              </label>
              <Input
                placeholder="e.g. HV-2026-0001"
                value={mergeForm.targetUhid}
                onChange={(e) => setMergeForm({ ...mergeForm, targetUhid: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Audit Justification & Verification Reason
            </label>
            <textarea
              rows={3}
              placeholder="State reason for patient record merge (e.g. Registered twice under different mobile numbers)..."
              value={mergeForm.reason}
              onChange={(e) => setMergeForm({ ...mergeForm, reason: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowMergeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={mergeSubmitting}>
              {mergeSubmitting ? 'Consolidating...' : 'Authorize Patient Merge'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientList;
