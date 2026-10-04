import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  User,
  Pill,
  FlaskConical,
  Scan,
  FileCheck,
  Stethoscope,
  ChevronRight,
  Filter,
  HeartPulse,
  Thermometer,
  ShieldCheck,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientMedicalHistory = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/me/timeline');
      if (res.data?.success) {
        setTimeline(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load medical history timeline:', err);
      addToast('Could not load clinical history timeline', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeline = filterType === 'ALL'
    ? timeline
    : timeline.filter(event => event.type === filterType);

  const getEventBadge = (type) => {
    switch (type) {
      case 'ENCOUNTER':
        return { label: 'Consultation', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: Stethoscope };
      case 'VITALS':
        return { label: 'Vitals Recorded', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: HeartPulse };
      case 'PRESCRIPTION':
        return { label: 'e-Prescription', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Pill };
      case 'LAB_ORDER':
        return { label: 'Laboratory Test', color: 'bg-violet-100 text-violet-800 border-violet-200', icon: FlaskConical };
      case 'RADIOLOGY':
        return { label: 'Radiology Imaging', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Scan };
      case 'ADMISSION':
        return { label: 'Inpatient Stay', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: FileCheck };
      case 'APPOINTMENT':
        return { label: 'Visit', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Calendar };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText };
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Longitudinal Medical History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your unified chronological clinical encounters, vitals, prescriptions and diagnostics
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Patient-Owned Clinical Records</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold uppercase text-[10px] pl-1 shrink-0">Filter By:</span>
        {[
          { key: 'ALL', label: 'All Records' },
          { key: 'ENCOUNTER', label: 'Consultations' },
          { key: 'VITALS', label: 'Vitals' },
          { key: 'PRESCRIPTION', label: 'Prescriptions' },
          { key: 'LAB_ORDER', label: 'Lab Tests' },
          { key: 'RADIOLOGY', label: 'Radiology' },
          { key: 'ADMISSION', label: 'Admissions' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterType(item.key)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              filterType === item.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
        </div>
      ) : filteredTimeline.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No clinical history records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your clinical timeline will automatically update as consultations, vitals, prescriptions and diagnostic reports are finalized by hospital care teams.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 my-4">
          {filteredTimeline.map((item, index) => {
            const badge = getEventBadge(item.type);
            const Icon = badge.icon;
            const eventDate = new Date(item.timestamp || item.createdAt);

            return (
              <div key={item.id || index} className="relative group">
                {/* Node on the timeline vertical line */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center text-teal-700 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Timeline Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {item.status && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {eventDate.toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })} • {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.details}
                  </p>

                  {/* Metadata Chips if Vitals or Encounters */}
                  {item.meta && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                      {item.meta.bp && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          BP: <strong>{item.meta.bp} mmHg</strong>
                        </span>
                      )}
                      {item.meta.pulse && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          Pulse: <strong>{item.meta.pulse} bpm</strong>
                        </span>
                      )}
                      {item.meta.spo2 && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          SpO2: <strong>{item.meta.spo2}%</strong>
                        </span>
                      )}
                      {item.meta.doctor && (
                        <span className="text-slate-500 font-medium">
                          Attending: <strong>Dr. {item.meta.doctor}</strong>
                        </span>
                      )}
                      {item.meta.followUp && (
                        <span className="text-teal-700 font-semibold">
                          Follow-up: {new Date(item.meta.followUp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
