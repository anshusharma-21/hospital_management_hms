import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import {
  AlertOctagon,
  AlertTriangle,
  HeartPulse,
  Clock,
  UserPlus,
  Stethoscope,
  ArrowRight
} from 'lucide-react';

export const EmergencyTriage = () => {
  const [emergencyQueue, setEmergencyQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rapidModalOpen, setRapidModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    patient: '',
    triageLevel: 'Level 1: Red (Immediate Resuscitation)',
    modeOfArrival: 'Ambulance (108 / EMS)',
    chiefComplaint: '',
    glasgowComaScale: 15
  });

  const [patients, setPatients] = useState([]);

  const fetchEmergency = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ipd/emergency');
      if (res.data.success) {
        setEmergencyQueue(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergency();
    api.get('/patients').then((res) => {
      if (res.data.success) setPatients(res.data.data);
    });
  }, []);

  const handleRapidRegister = async (e) => {
    e.preventDefault();
    if (!formData.patient) {
      addToast({
        title: 'Validation Error',
        message: 'Please select a registered patient for emergency triage.',
        type: 'warning'
      });
      return;
    }

    try {
      const res = await api.post('/ipd/emergency', {
        patient: formData.patient,
        triageLevel: formData.triageLevel,
        modeOfArrival: formData.modeOfArrival,
        chiefComplaint: formData.chiefComplaint,
        glasgowComaScale: formData.glasgowComaScale
      });

      if (res.data.success) {
        addToast({
          title: 'Emergency Case Registered',
          message: `${res.data.data.emergencyNumber} triaged with priority.`,
          type: 'success'
        });
        setRapidModalOpen(false);
        fetchEmergency();
      }
    } catch (err) {
      addToast({
        title: 'Error',
        message: err.response?.data?.error || 'Could not register emergency arrival',
        type: 'error'
      });
    }
  };

  const columns = [
    {
      header: 'Emergency #',
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
          {row.emergencyNumber}
        </span>
      )
    },
    {
      header: 'Triage Category',
      render: (row) => (
        <span
          className={`font-bold text-xs px-2.5 py-1 rounded-full border ${
            row.triageLevel.includes('Red')
              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
              : row.triageLevel.includes('Yellow')
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          {row.triageLevel}
        </span>
      )
    },
    {
      header: 'Patient Details',
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-slate-800">{row.patient?.fullName}</span>
          <p className="text-[10px] text-slate-400">
            {row.patient?.uhid} • {row.patient?.gender}, {row.patient?.age}y
          </p>
        </div>
      )
    },
    {
      header: 'Chief Complaint',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium line-clamp-1">{row.chiefComplaint}</span>
      )
    },
    {
      header: 'GCS Score',
      render: (row) => (
        <span className="font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
          {row.glasgowComaScale} / 15
        </span>
      )
    },
    {
      header: 'Arrival Time',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(row.arrivalTime).toLocaleTimeString()}
        </span>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Emergency Department & Trauma Triage</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapid casualty triage, GCS assessment, and high-acuity resuscitation bay
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={AlertOctagon}
          onClick={() => setRapidModalOpen(true)}
        >
          + Rapid Emergency Registration
        </Button>
      </div>

      <Card noPadding>
        <Table
          columns={columns}
          data={emergencyQueue}
          isLoading={loading}
          emptyMessage="No active emergency cases in triage bay right now."
        />
      </Card>

      {/* Rapid Registration Modal */}
      {rapidModalOpen && (
        <Modal
          isOpen={rapidModalOpen}
          onClose={() => setRapidModalOpen(false)}
          title="Rapid Emergency Arrival & Triage"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRapidRegister} className="space-y-4 py-2">
            <Select
              label="Select Patient"
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
              options={[
                { value: '', label: 'Select Patient from Master...' },
                ...patients.map((p) => ({ value: p._id, label: `${p.fullName} (${p.uhid})` }))
              ]}
              required
            />

            <Select
              label="Triage Color Code Priority"
              value={formData.triageLevel}
              onChange={(e) => setFormData({ ...formData, triageLevel: e.target.value })}
              options={[
                { value: 'Level 1: Red (Immediate Resuscitation)', label: 'Red (Immediate / Resuscitation)' },
                { value: 'Level 2: Yellow (Urgent / High Risk)', label: 'Yellow (Urgent / 15-30 mins)' },
                { value: 'Level 3: Green (Stable / Non-Urgent)', label: 'Green (Non-urgent / Walking Wounded)' }
              ]}
            />

            <Select
              label="Mode of Arrival"
              value={formData.modeOfArrival}
              onChange={(e) => setFormData({ ...formData, modeOfArrival: e.target.value })}
              options={[
                { value: 'Ambulance (108 / EMS)', label: 'Ambulance (108 / EMS)' },
                { value: 'Private Vehicle', label: 'Private Vehicle' },
                { value: 'Walk-in', label: 'Walk-in' },
                { value: 'Wheelchair', label: 'Wheelchair' }
              ]}
            />

            <Input
              label="Chief Presenting Emergency Symptom"
              required
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
            />

            <Input
              label="Glasgow Coma Scale (3-15)"
              type="number"
              min="3"
              max="15"
              value={formData.glasgowComaScale}
              onChange={(e) => setFormData({ ...formData, glasgowComaScale: Number(e.target.value) })}
            />

            <Button type="submit" variant="danger" size="md" className="w-full">
              Triage to Emergency Bay
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
