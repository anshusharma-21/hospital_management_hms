import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Plus, 
  Search, 
  CheckCircle2, 
  Building2, 
  Users, 
  Stethoscope, 
  FlaskConical, 
  ShieldCheck 
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

export const DepartmentManagement = () => {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentType: 'Clinical',
    headOfDepartment: 'Dr. Arun Sharma'
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const userRes = await api.get('/auth/me');
      const tenantId = userRes.data.user?.tenant?._id || userRes.data.user?.tenant;
      if (tenantId) {
        const res = await api.get(`/tenants/${tenantId}/departments`);
        if (res.data.success) {
          setDepartments(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      setDepartments([]);
      addToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      const userRes = await api.get('/auth/me');
      const tenantId = userRes.data.user?.tenant?._id || userRes.data.user?.tenant;

      const res = await api.post(`/tenants/${tenantId}/departments`, formData);
      if (res.data.success) {
        addToast(`Department ${formData.name} created!`, 'success');
        setShowAddModal(false);
        fetchDepartments();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to create department', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Department Master</h1>
              <p className="text-xs text-slate-500">Configure Clinical, Diagnostic, Nursing and Administrative departments & designated HODs</p>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Department
        </Button>
      </div>

      {/* Departments Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Department Name</TableHeader>
              <TableHeader>Dept Code</TableHeader>
              <TableHeader>Classification Type</TableHeader>
              <TableHeader>Head of Department (HOD)</TableHeader>
              <TableHeader>Operational Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d._id}>
                <TableCell>
                  <p className="font-bold text-slate-900 text-xs">{d.name}</p>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {d.code}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium text-slate-700">{d.departmentType}</span>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-800">
                  {d.headOfDepartment || 'Designated Lead'}
                </TableCell>
                <TableCell>
                  <Badge variant="success">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Dept Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Hospital Department"
      >
        <form onSubmit={handleAddDept} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Department Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Cardiology & Cath Lab"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Department Code</label>
              <Input 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="e.g. CARDIO"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Classification Type</label>
              <Select 
                value={formData.departmentType}
                onChange={(e) => setFormData({...formData, departmentType: e.target.value})}
                options={[
                  { value: 'Clinical', label: 'Clinical OPD / IPD' },
                  { value: 'Diagnostic', label: 'Diagnostic Lab / Radiology' },
                  { value: 'Nursing', label: 'Nursing Station' },
                  { value: 'Administrative', label: 'Administrative / Billing' },
                  { value: 'Support', label: 'Support & Facility' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Head of Department (Lead Physician/Manager)</label>
            <Input 
              value={formData.headOfDepartment}
              onChange={(e) => setFormData({...formData, headOfDepartment: e.target.value})}
              placeholder="Full Name"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
