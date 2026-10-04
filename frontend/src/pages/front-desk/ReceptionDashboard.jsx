import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  UserPlus,
  Search,
  ArrowRight,
  Stethoscope,
  Phone
} from 'lucide-react';

export const ReceptionDashboard = ({ onOpenSearch }) => {
  const [stats, setStats] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, queueRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/appointments/queue')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (queueRes.data.success) {
        setQueueData(queueRes.data.data.waiting || []);
      }
    } catch (err) {
      console.error('Failed to load reception stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.put(`/appointments/${appointmentId}/status`, {
        status: 'Checked-In'
      });
      if (res.data.success) {
        addToast({
          title: 'Patient Checked In',
          message: 'Encounter initialized and token added to active consultation queue.',
          type: 'success'
        });
        fetchDashboardData();
      }
    } catch (err) {
      addToast({
        title: 'Check-in Failed',
        message: err.response?.data?.error || 'Could not check in patient',
        type: 'error'
      });
    }
  };

  const queueColumns = [
    {
      header: 'Token #',
      render: (row) => (
        <span className="font-mono font-black text-sm text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
          #{row.tokenNumber}
        </span>
      )
    },
    {
      header: 'Patient Details',
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-slate-800">{row.patient?.fullName}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            <span>{row.patient?.uhid}</span>
            <span>•</span>
            <span>{row.patient?.gender}, {row.patient?.age}y</span>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Doctor',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-700">{row.doctor?.name}</span>
          <p className="text-[10px] text-slate-400">{row.department?.name}</p>
        </div>
      )
    },
    {
      header: 'Slot / Priority',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600">{row.slotTime}</p>
          <Badge
            variant={
              row.priority === 'Emergency'
                ? 'danger'
                : row.priority === 'Senior Citizen'
                ? 'purple'
                : 'neutral'
            }
            size="sm"
          >
            {row.priority}
          </Badge>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge
          variant={row.status === 'Checked-In' ? 'success' : 'warning'}
          size="sm"
          dot
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Scheduled' && (
            <Button
              size="sm"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckIn(row._id);
              }}
            >
              Check-In
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${row.patient?._id}`);
            }}
          >
            Profile
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Front Desk Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient registration, appointment scheduling, and live OPD queue triage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" icon={Search} onClick={onOpenSearch}>
            Search Patient
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => navigate('/patients/register')}
          >
            Register Patient
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Calendar}
            onClick={() => navigate('/appointments/book')}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Appointments"
          value={stats?.todayAppointments || '0'}
          subtitle="Scheduled across all OPD doctors"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Waiting in Queue"
          value={stats?.waitingQueueCount || '0'}
          subtitle="Checked in and waiting for consult"
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Total Registered Patients"
          value={stats?.totalPatients || '0'}
          subtitle="Unified longitudinal records"
          icon={Users}
          color="teal"
        />
        <StatsCard
          title="Hospital Bed Occupancy"
          value={`${stats?.occupancyRate || '0'}%`}
          subtitle={`${stats?.availableBeds || '0'} beds available in wards`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Live Waiting Patients Table Card */}
      <Card
        title="Live OPD Waiting Queue & Token Board"
        subtitle="Patients waiting in reception lobbies for doctor consultation"
        headerIcon={Clock}
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/front-desk/queue')}
          >
            Full Queue Board
          </Button>
        }
      >
        <Table
          columns={queueColumns}
          data={queueData}
          isLoading={loading}
          emptyMessage="No waiting patients in OPD queue right now. Use 'Book Appointment' to schedule a patient."
          onRowClick={(row) => navigate(`/patients/${row.patient?._id}`)}
        />
      </Card>
    </div>
  );
};
