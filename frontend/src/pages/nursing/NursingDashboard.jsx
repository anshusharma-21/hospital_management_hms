import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { StatsCard } from '../../components/ui/StatsCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import {
  Activity,
  BedDouble,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HeartPulse,
  ArrowRight
} from 'lucide-react';

export const NursingDashboard = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNursingData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ipd/admissions?status=Admitted');
        if (res.data.success) {
          setAdmissions(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNursingData();
  }, []);

  const columns = [
    {
      header: 'Bed & Ward',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
            {row.bed?.bedNumber || 'Bed Assigned'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">{row.bed?.ward}</p>
        </div>
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
      header: 'Admission Diagnosis',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1">
          {row.diagnosisAtAdmission || 'Inpatient Care'}
        </span>
      )
    },
    {
      header: 'Attending Physician',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.attendingDoctor?.name || 'Dr. Assigned'}
        </span>
      )
    },
    {
      header: 'Admitted On',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(row.admissionDate).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Shift Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={Activity}
            onClick={() => navigate(`/nursing/chart?admissionId=${row._id}`)}
          >
            MAR & Vitals Chart
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/patients/${row.patient?._id}`)}
          >
            Profile
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Nursing Station & Wards</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bedside care tasks, Medication Administration Record (MAR), and shift handovers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={BedDouble} onClick={() => navigate('/ipd/bed-board')}>
            Bed Board Grid
          </Button>
          <Button variant="secondary" size="sm" icon={HeartPulse} onClick={() => navigate('/nursing/icu')}>
            ICU Unit
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Inpatients"
          value={admissions.length}
          subtitle="Currently occupying ward & ICU beds"
          icon={BedDouble}
          color="blue"
        />
        <StatsCard
          title="Medication Tasks Due"
          value="12"
          subtitle="Scheduled for this nursing shift"
          icon={Activity}
          color="teal"
        />
        <StatsCard
          title="Vitals Alerts"
          value="2"
          subtitle="Borderline SpO2 or temperature"
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title="Pending Clearances"
          value="3"
          subtitle="Patients preparing for discharge"
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Admitted Patients Table */}
      <Card
        title="Assigned Inpatient Ward Roster"
        subtitle="Active admitted patients requiring bedside observations and medication administration"
        headerIcon={BedDouble}
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/ipd/bed-board')}
          >
            Open Bed Board
          </Button>
        }
      >
        <Table
          columns={columns}
          data={admissions}
          isLoading={loading}
          emptyMessage="No patients currently admitted in this ward."
        />
      </Card>
    </div>
  );
};
