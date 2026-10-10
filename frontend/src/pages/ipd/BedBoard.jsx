import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  BedDouble,
  User,
  ArrowRightLeft,
  Sparkles,
  Wrench,
  CheckCircle2,
  Filter,
  UserPlus,
  Plus,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const BedBoard = () => {
  const { activeBranch } = useAuth();
  const [beds, setBeds] = useState([]);
  const [occupancyStats, setOccupancyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Bed for Action Modal
  const [selectedBed, setSelectedBed] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [targetBedId, setTargetBedId] = useState('');

  // Add Bed Modal State
  const [addBedModalOpen, setAddBedModalOpen] = useState(false);
  const [addingBed, setAddingBed] = useState(false);
  const [newBedForm, setNewBedForm] = useState({
    bedNumber: '',
    roomNumber: '',
    ward: 'General Medical Ward (Male)',
    wardType: 'General Male',
    floor: '2nd Floor',
    building: 'Main Tower',
    ratePerDay: 1500,
    status: 'Available'
  });

  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleCreateBed = async (e) => {
    e?.preventDefault();
    if (!newBedForm.bedNumber?.trim() || !newBedForm.roomNumber?.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'Bed number and room number are required',
        type: 'error'
      });
      return;
    }
    setAddingBed(true);
    const branchId = activeBranch?._id || activeBranch?.id || (typeof activeBranch === 'string' ? activeBranch : undefined);
    try {
      const res = await api.post('/ipd/beds', {
        ...newBedForm,
        branch: branchId
      });
      if (res.data.success) {
        addToast({
          title: 'Bed Provisioned',
          message: `Bed ${res.data.data.bedNumber} added successfully to ${res.data.data.ward}`,
          type: 'success'
        });
        setAddBedModalOpen(false);
        setNewBedForm({
          bedNumber: '',
          roomNumber: '',
          ward: 'General Medical Ward (Male)',
          wardType: 'General Male',
          floor: '2nd Floor',
          building: 'Main Tower',
          ratePerDay: 1500,
          status: 'Available'
        });
        fetchBeds();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Could not provision new bed';
      addToast({
        title: 'Provisioning Failed',
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setAddingBed(false);
    }
  };

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (wardFilter !== 'all') params.append('ward', wardFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/ipd/beds?${params.toString()}`);
      if (res.data.success) {
        setBeds(res.data.data);
        setOccupancyStats(res.data.occupancyStats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [wardFilter, statusFilter, activeBranch]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedBed) return;
    try {
      const res = await api.put(`/ipd/beds/${selectedBed._id}/status`, { status: newStatus });
      if (res.data.success) {
        addToast({
          title: 'Bed Status Updated',
          message: `${selectedBed.bedNumber} is now marked as ${newStatus}.`,
          type: 'success'
        });
        setSelectedBed(null);
        fetchBeds();
      }
    } catch (err) {
      addToast({
        title: 'Update Error',
        message: err.response?.data?.error || 'Could not update bed status',
        type: 'error'
      });
    }
  };

  const handleTransfer = async () => {
    if (!selectedBed?.currentAdmission || !targetBedId) return;
    try {
      const res = await api.put(`/ipd/admissions/${selectedBed.currentAdmission._id || selectedBed.currentAdmission}/transfer-bed`, {
        newBedId: targetBedId
      });
      if (res.data.success) {
        addToast({
          title: 'Bed Transfer Completed',
          message: `Patient transferred to new bed. Previous bed sent to Cleaning.`,
          type: 'success'
        });
        setTransferModalOpen(false);
        setSelectedBed(null);
        fetchBeds();
      }
    } catch (err) {
      addToast({
        title: 'Transfer Failed',
        message: err.response?.data?.error || 'Could not complete bed transfer',
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <Badge variant="success" size="sm" dot>Available</Badge>;
      case 'Occupied':
        return <Badge variant="danger" size="sm" dot>Occupied</Badge>;
      case 'Cleaning':
        return <Badge variant="info" size="sm" dot>Sanitizing</Badge>;
      case 'Maintenance':
        return <Badge variant="warning" size="sm" dot>Maintenance</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getBedCardBorder = (status) => {
    switch (status) {
      case 'Available':
        return 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20';
      case 'Occupied':
        return 'border-rose-300 hover:border-rose-500 bg-rose-50/20';
      case 'Cleaning':
        return 'border-blue-300 hover:border-blue-500 bg-blue-50/20';
      case 'Maintenance':
        return 'border-amber-300 hover:border-amber-500 bg-amber-50/20';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Wards & Bed Board Grid</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational bed occupancy management, sanitization workflows, condition triage, and bed provisioning
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setAddBedModalOpen(true)}
          >
            + Add New Bed
          </Button>
        </div>
      </div>

      {/* Occupancy Stats Banner */}
      {occupancyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Beds</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{occupancyStats.total}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 font-bold uppercase">Available Beds</span>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">{occupancyStats.available}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center">
            <span className="text-xs text-rose-700 font-bold uppercase">Occupied Beds</span>
            <p className="text-2xl font-black text-rose-800 mt-0.5">{occupancyStats.occupied}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
            <span className="text-xs text-blue-700 font-bold uppercase">Occupancy Rate</span>
            <p className="text-2xl font-black text-blue-800 mt-0.5">{occupancyStats.occupancyRatePercent}%</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Filter by Ward / Floor"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Wards & Units' },
              { value: 'ICU (Intensive Care Unit)', label: 'ICU (Intensive Care Unit)' },
              { value: 'General Male Ward', label: 'General Male Ward' },
              { value: 'Private Deluxe Suite', label: 'Private Deluxe Suite' }
            ]}
          />
          <Select
            label="Filter by Operational Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'Available', label: 'Available Only' },
              { value: 'Occupied', label: 'Occupied Only' },
              { value: 'Cleaning', label: 'Sanitizing / Cleaning' },
              { value: 'Maintenance', label: 'Maintenance' }
            ]}
          />
        </div>
      </Card>

      {/* Bed Board Visual Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {beds.map((bed) => (
          <div
            key={bed._id}
            onClick={() => setSelectedBed(bed)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-3 ${getBedCardBorder(
              bed.status
            )}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-black text-base text-slate-800">{bed.bedNumber}</span>
                <p className="text-[10px] text-slate-500 font-semibold">{bed.ward}</p>
                <p className="text-[10px] text-slate-400">Room: {bed.roomNumber}</p>
              </div>
              {getStatusBadge(bed.status)}
            </div>

            {bed.status === 'Occupied' && bed.currentPatient ? (
              <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 space-y-1">
                <p className="font-bold text-xs text-slate-800 truncate">
                  {bed.currentPatient.fullName}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {bed.currentPatient.uhid} • {bed.currentPatient.gender}
                </p>
              </div>
            ) : bed.status === 'Cleaning' ? (
              <div className="p-2 rounded-xl bg-blue-100/60 text-blue-800 text-[10px] font-semibold text-center">
                Sanitization in progress by Housekeeping
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-100/50 text-emerald-800 text-[10px] font-semibold text-center">
                Ready for immediate allocation • ₹{bed.ratePerDay}/day
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bed Detail & Action Modal */}
      {selectedBed && (
        <Modal
          isOpen={!!selectedBed}
          onClose={() => setSelectedBed(null)}
          title={`Bed Operations: ${selectedBed.bedNumber}`}
          subtitle={`${selectedBed.ward} • Room ${selectedBed.roomNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <p>Current Operational State: <strong>{selectedBed.status}</strong></p>
              <p>Daily Bed Charge: <strong>₹{selectedBed.ratePerDay}</strong></p>
              {selectedBed.currentPatient && (
                <p>
                  Occupant: <strong>{selectedBed.currentPatient.fullName}</strong> ({selectedBed.currentPatient.uhid})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Change Operational State:</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => handleUpdateStatus('Available')}
                >
                  Mark Available
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => handleUpdateStatus('Cleaning')}
                >
                  Send for Cleaning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Wrench}
                  onClick={() => handleUpdateStatus('Maintenance')}
                >
                  Maintenance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ShieldAlert}
                  onClick={() => handleUpdateStatus('Blocked')}
                >
                  Block Bed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Layers}
                  onClick={() => handleUpdateStatus('Reserved')}
                >
                  Reserve Bed
                </Button>
                {selectedBed.status === 'Occupied' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ArrowRightLeft}
                    onClick={() => setTransferModalOpen(true)}
                  >
                    Transfer Patient
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Bed Transfer Modal */}
      {transferModalOpen && (
        <Modal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          title={`Transfer Patient from ${selectedBed?.bedNumber}`}
          subtitle="Select target vacant bed"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 py-2">
            <Select
              label="Select Available Target Bed"
              value={targetBedId}
              onChange={(e) => setTargetBedId(e.target.value)}
              options={[
                { value: '', label: '-- Choose Vacant Bed --' },
                ...beds
                  .filter((b) => b.status === 'Available')
                  .map((b) => ({
                    value: b._id,
                    label: `${b.bedNumber} (${b.ward}) - ₹${b.ratePerDay}/d`
                  }))
              ]}
            />
            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={ArrowRightLeft}
              disabled={!targetBedId}
              onClick={handleTransfer}
            >
              Confirm Patient Transfer
            </Button>
          </div>
        </Modal>
      )}

      {/* Add New Bed Modal */}
      {addBedModalOpen && (
        <Modal
          isOpen={addBedModalOpen}
          onClose={() => setAddBedModalOpen(false)}
          title="Provision New Hospital Bed"
          subtitle="Configure ward location, room number, daily rate, and initial operational state"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateBed} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Bed Number / Identifier"
                required
                placeholder="e.g. B-103, ICU-05, DLX-02"
                value={newBedForm.bedNumber}
                onChange={(e) => setNewBedForm({ ...newBedForm, bedNumber: e.target.value })}
              />
              <Input
                label="Room Number"
                required
                placeholder="e.g. Room 103, ICU Bay 2"
                value={newBedForm.roomNumber}
                onChange={(e) => setNewBedForm({ ...newBedForm, roomNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Ward / Department"
                value={newBedForm.ward}
                onChange={(e) => setNewBedForm({ ...newBedForm, ward: e.target.value })}
                options={[
                  { value: 'General Medical Ward (Male)', label: 'General Medical Ward (Male)' },
                  { value: 'General Medical Ward (Female)', label: 'General Medical Ward (Female)' },
                  { value: 'Semi-Private Ward', label: 'Semi-Private Ward' },
                  { value: 'Private Deluxe Suite', label: 'Private Deluxe Suite' },
                  { value: 'ICU (Intensive Care Unit)', label: 'ICU (Intensive Care Unit)' },
                  { value: 'NICU (Neonatal ICU)', label: 'NICU (Neonatal ICU)' },
                  { value: 'Emergency Triage Bay', label: 'Emergency Triage Bay' },
                  { value: 'Post-Op / Recovery', label: 'Post-Op / Recovery' }
                ]}
              />
              <Select
                label="Ward Category"
                value={newBedForm.wardType}
                onChange={(e) => setNewBedForm({ ...newBedForm, wardType: e.target.value })}
                options={[
                  { value: 'General Male', label: 'General Male' },
                  { value: 'General Female', label: 'General Female' },
                  { value: 'Semi-Private', label: 'Semi-Private' },
                  { value: 'Private Deluxe', label: 'Private Deluxe' },
                  { value: 'ICU', label: 'ICU' },
                  { value: 'NICU', label: 'NICU' },
                  { value: 'Emergency', label: 'Emergency' },
                  { value: 'Post-Op / Recovery', label: 'Post-Op / Recovery' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Hospital Floor"
                value={newBedForm.floor}
                onChange={(e) => setNewBedForm({ ...newBedForm, floor: e.target.value })}
                options={[
                  { value: 'Ground Floor', label: 'Ground Floor (Emergency & Diagnostics)' },
                  { value: '1st Floor', label: '1st Floor (General Medical & Surgical)' },
                  { value: '2nd Floor', label: '2nd Floor (Semi-Private & Private Suites)' },
                  { value: '3rd Floor', label: '3rd Floor (ICU, CCU, & Critical Care)' },
                  { value: '4th Floor', label: '4th Floor (Maternity, NICU, & Pediatrics)' }
                ]}
              />
              <Input
                label="Building / Wing"
                placeholder="e.g. Main Tower, East Wing"
                value={newBedForm.building}
                onChange={(e) => setNewBedForm({ ...newBedForm, building: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Daily Bed Charge (₹)"
                type="number"
                required
                placeholder="1500"
                value={newBedForm.ratePerDay}
                onChange={(e) => setNewBedForm({ ...newBedForm, ratePerDay: Number(e.target.value) })}
              />
              <Select
                label="Initial Condition / State"
                value={newBedForm.status}
                onChange={(e) => setNewBedForm({ ...newBedForm, status: e.target.value })}
                options={[
                  { value: 'Available', label: 'Available (Sanitized & Ready)' },
                  { value: 'Cleaning', label: 'Cleaning (Sanitization in progress)' },
                  { value: 'Maintenance', label: 'Maintenance (Under repair)' },
                  { value: 'Blocked', label: 'Blocked / Isolated' },
                  { value: 'Reserved', label: 'Reserved' }
                ]}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => setAddBedModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={addingBed}
                icon={Plus}
              >
                Provision Bed
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
