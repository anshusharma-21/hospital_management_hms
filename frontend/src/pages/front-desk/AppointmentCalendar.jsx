import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Stethoscope,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const AppointmentCalendar = () => {
  const { activeBranch } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ date });
      if (status !== 'all') params.append('status', status);
      if (selectedDoctor !== 'all') params.append('doctor', selectedDoctor);

      const res = await api.get(`/appointments?${params.toString()}`);
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/tenants/me/users'); // or fetch users
      } catch (e) {
        // fallback
      }
    };
    fetchAppointments();
  }, [date, status, selectedDoctor, activeBranch]);

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.put(`/appointments/${appointmentId}/status`, { status: 'Checked-In' });
      if (res.data.success) {
        addToast({
          title: 'Checked In',
          message: 'Patient added to waiting queue for consultation.',
          type: 'success'
        });
        fetchAppointments();
      }
    } catch (err) {
      addToast({
        title: 'Check-in Error',
        message: err.response?.data?.error || 'Failed to check in',
        type: 'error'
      });
    }
  };

  const columns = [
    {
      header: 'Token & Slot',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
            #{row.tokenNumber}
          </span>
          <span className="font-semibold text-xs text-slate-700">{row.slotTime}</span>
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-slate-800">{row.patient?.fullName}</span>
          <p className="text-[10px] text-slate-400">
            {row.patient?.uhid} • {row.patient?.phone}
          </p>
        </div>
      )
    },
    {
      header: 'Doctor & Department',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-700">{row.doctor?.name}</span>
          <p className="text-[10px] text-slate-400">{row.department?.name}</p>
        </div>
      )
    },
    {
      header: 'Type & Priority',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-xs text-slate-600 font-medium">{row.type}</p>
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
      header: 'Fee & Payment',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-700">₹{row.consultationFee}</span>
          <p>
            <Badge
              variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'}
              size="sm"
            >
              {row.paymentStatus}
            </Badge>
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Checked-In'
              ? 'success'
              : row.status === 'In-Consultation'
              ? 'info'
              : row.status === 'Completed'
              ? 'neutral'
              : 'warning'
          }
          size="sm"
          dot
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Scheduled' && (
            <Button size="sm" variant="primary" onClick={() => handleCheckIn(row._id)}>
              Check-In
            </Button>
          )}
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
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Appointment Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View daily consultation schedules and check in arriving patients
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => navigate('/appointments/book')}
        >
          Book Appointment
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="date"
            label="Schedule Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Appointment Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Checked-In', label: 'Checked-In' },
              { value: 'In-Consultation', label: 'In-Consultation' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
          />
          <div className="flex items-end">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={Filter}
              onClick={fetchAppointments}
            >
              Refresh Calendar
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <Table
          columns={columns}
          data={appointments}
          isLoading={loading}
          emptyMessage={`No appointments scheduled for ${new Date(date).toLocaleDateString()}.`}
        />
      </Card>
    </div>
  );
};
