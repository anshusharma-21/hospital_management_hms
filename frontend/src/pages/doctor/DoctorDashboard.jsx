import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';
import { Table } from '../../components/ui/Table';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FlaskConical,
  Users,
  BedDouble,
  ArrowRight
} from 'lucide-react';

export const DoctorDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [criticalLabs, setCriticalLabs] = useState([]);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const [queueRes, admRes, labRes, rxRes] = await Promise.all([
          api.get(`/appointments/queue?date=${selectedDate}`),
          api.get('/ipd/admissions?status=Admitted'),
          api.get('/diagnostics/lab-orders?criticalOnly=true'),
          api.get('/clinical/prescriptions')
        ]);

        if (queueRes.data.success) {
          const waiting = queueRes.data.data.waiting || [];
          const inConsult = queueRes.data.data.inConsultation || [];
          setQueue([...inConsult, ...waiting]);
        }
        if (admRes.data.success) {
          setAdmissions(admRes.data.data || []);
        }
        if (labRes.data.success) {
          setCriticalLabs(labRes.data.data || []);
        }
        if (rxRes.data?.success) {
          setPrescriptionsCount(rxRes.data.count || rxRes.data.data?.length || 0);
        }
      } catch (err) {
        console.error('Doctor dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [selectedDate]);

  const queueColumns = [
    {
      header: 'Token #',
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-md border border-teal-200/70">
          #{row.tokenNumber}
        </span>
      )
    },
    {
      header: 'Patient Details',
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-slate-900">{row.patient?.fullName}</span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {row.patient?.uhid} • {row.patient?.gender}, {row.patient?.age}y
          </p>
        </div>
      )
    },
    {
      header: 'Visit Reason',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1">
          {row.reasonForVisit || 'Routine Consultation'}
        </span>
      )
    },
    {
      header: 'Priority',
      render: (row) => (
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
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge
          variant={row.status === 'In-Consultation' ? 'primary' : 'warning'}
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
        <Button
          size="sm"
          variant="primary"
          icon={Stethoscope}
          onClick={(e) => {
            e.stopPropagation();
            navigate(
              `/clinical/consultation?appointmentId=${row._id}&patientId=${row.patient?._id}`
            );
          }}
        >
          Consult
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Doctor Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Today's patient appointments, active encounters, and diagnostic reports
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Stethoscope}
          onClick={() => navigate('/clinical/consultation')}
        >
          Open Consultation Room
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's OPD Queue"
          value={queue.length}
          subtitle="Waiting & in-consultation"
          icon={Clock}
          color="teal"
        />
        <StatsCard
          title="Admitted IPD Patients"
          value={admissions.length}
          subtitle="Under inpatient clinical care"
          icon={BedDouble}
          color="blue"
        />
        <StatsCard
          title="Critical Lab Alerts"
          value={criticalLabs.length}
          subtitle="Pathology alert thresholds exceeded"
          icon={AlertTriangle}
          color="rose"
        />
        <StatsCard
          title="e-Prescriptions Issued"
          value={prescriptionsCount}
          subtitle="Real-time recorded prescriptions"
          icon={FileText}
          color="emerald"
        />
      </div>

      {/* Critical Results Banner if any */}
      {criticalLabs.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-950">
                Critical Diagnostic Value Alert ({criticalLabs.length} pending review)
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Urgent abnormal test results reported by laboratory requiring immediate clinician attention.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => navigate('/diagnostics/lab?criticalOnly=true')}
          >
            Review Alerts
          </Button>
        </div>
      )}

      {/* Main OPD Queue Card */}
      <Card
        title={selectedDate === new Date().toISOString().split('T')[0] ? "Today's Outpatient Consultation Queue" : "Outpatient Consultation Queue"}
        subtitle={selectedDate === new Date().toISOString().split('T')[0] ? "Patients waiting in lobby for examination" : `Consultation schedule for ${selectedDate}`}
        headerIcon={Users}
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            />
            <Button
              size="sm"
              variant="ghost"
              icon={ArrowRight}
              onClick={() => navigate('/clinical/queue')}
            >
              Token Board
            </Button>
          </div>
        }
      >
        <Table
          columns={queueColumns}
          data={queue}
          isLoading={loading}
          emptyMessage="No patients currently waiting in your OPD queue."
          onRowClick={(row) =>
            navigate(`/clinical/consultation?appointmentId=${row._id}&patientId=${row.patient?._id}`)
          }
        />
      </Card>
    </div>
  );
};
