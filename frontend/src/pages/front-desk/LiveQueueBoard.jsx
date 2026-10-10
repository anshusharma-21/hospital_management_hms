import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Volume2,
  RefreshCcw,
  Sparkles
} from 'lucide-react';

export const LiveQueueBoard = () => {
  const { user, activeBranch } = useAuth();
  const [queue, setQueue] = useState({ waiting: [], inConsultation: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments/queue?date=${date}`);
      if (res.data.success) {
        setQueue(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [date, activeBranch]);

  const handleCallPatient = (appt) => {
    addToast({
      title: `Calling Token #${appt.tokenNumber}`,
      message: `${appt.patient?.fullName} please proceed to ${appt.doctor?.doctorProfile?.opdRoom || 'Consultation Room'}`,
      type: 'info'
    });
  };

  const handleStartConsultation = async (appt) => {
    try {
      await api.put(`/appointments/${appt._id}/status`, { status: 'In-Consultation' });
      navigate(`/clinical/consultation?appointmentId=${appt._id}&patientId=${appt.patient?._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Live OPD Queue & Token Display</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient consultation token board and patient status tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          />
          <Button variant="outline" size="sm" icon={RefreshCcw} onClick={fetchQueue}>
            Refresh
          </Button>
          {user?.role !== 'doctor' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/appointments/book')}
            >
              + Add Walk-In Patient
            </Button>
          )}
        </div>
      </div>

      {/* 3-Column Queue Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Waiting / Checked-In */}
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Waiting for Consultation
              </h3>
            </div>
            <span className="font-mono font-bold text-xs bg-white text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
              {queue.waiting.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {queue.waiting.map((appt) => (
              <div
                key={appt._id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-400 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-mono font-black text-base flex items-center justify-center border border-amber-200">
                      #{appt.tokenNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{appt.patient?.fullName}</h4>
                      <p className="text-[10px] text-slate-400">
                        {appt.patient?.uhid} • Slot: {appt.slotTime}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appt.priority === 'Emergency'
                        ? 'danger'
                        : appt.priority === 'Senior Citizen'
                        ? 'purple'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {appt.priority}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 pt-2 border-t border-slate-100">
                  <p>
                    Doctor: <strong>{appt.doctor?.name}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Reason: {appt.reasonForVisit || 'Regular consultation'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    icon={Volume2}
                    onClick={() => handleCallPatient(appt)}
                  >
                    Call Token
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={Stethoscope}
                    onClick={() => handleStartConsultation(appt)}
                  >
                    Consult
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Currently In-Consultation */}
        <div className="space-y-3">
          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                In-Consultation Now
              </h3>
            </div>
            <span className="font-mono font-bold text-xs bg-white text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
              {queue.inConsultation.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {queue.inConsultation.map((appt) => (
              <div
                key={appt._id}
                className="p-4 rounded-2xl bg-teal-50/40 border border-teal-300 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-teal-600 text-white font-mono font-black text-base flex items-center justify-center shadow-xs">
                      #{appt.tokenNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{appt.patient?.fullName}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Room: {appt.doctor?.doctorProfile?.opdRoom || 'OPD Suite'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm" dot>
                    Active
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 pt-2 border-t border-teal-100">
                  <p>
                    Consulting with: <strong>{appt.doctor?.name}</strong>
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={ArrowRight}
                  onClick={() =>
                    navigate(
                      `/clinical/consultation?appointmentId=${appt._id}&patientId=${appt.patient?._id}`
                    )
                  }
                >
                  Resume Encounter Workspace
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Completed Today */}
        <div className="space-y-3">
          <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Completed Consultations
              </h3>
            </div>
            <span className="font-mono font-bold text-xs bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              {queue.completed.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {queue.completed.map((appt) => (
              <div
                key={appt._id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-mono font-bold text-xs flex items-center justify-center">
                    #{appt.tokenNumber}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-700">{appt.patient?.fullName}</h4>
                    <p className="text-[10px] text-slate-400">Dr. {appt.doctor?.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/patients/${appt.patient?._id}`)}
                >
                  History
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
