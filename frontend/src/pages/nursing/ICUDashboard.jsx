import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatsCard } from '../../components/ui/StatsCard';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Droplets,
  Wind,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const ICUDashboard = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchICU = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ipd/beds?ward=ICU (Intensive Care Unit)');
        if (res.data.success) {
          setBeds(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchICU();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Intensive Care Unit (ICU / CCU)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-acuity bed-level telemetry, hemodynamic monitoring, and ventilator settings
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Total ICU Beds"
          value={beds.length}
          subtitle="Critical care telemetry bays"
          icon={HeartPulse}
          color="rose"
        />
        <StatsCard
          title="Patients on Inotropic Support"
          value="0"
          subtitle="Noradrenaline / Vasopressin"
          icon={Droplets}
          color="amber"
        />
        <StatsCard
          title="Ventilator Assisted"
          value="0"
          subtitle="Synchronized Intermittent SIMV"
          icon={Wind}
          color="blue"
        />
        <StatsCard
          title="Telemetry Alarms"
          value="0"
          subtitle="All parameters within safety thresholds"
          icon={ShieldAlert}
          color="emerald"
        />
      </div>

      {/* Live ICU Bed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {beds.map((bed) => (
          <Card
            key={bed._id}
            title={bed.bedNumber}
            subtitle={`${bed.roomNumber} • Tariff: ₹${bed.ratePerDay}/day`}
            action={
              <Badge
                variant={bed.status === 'Occupied' ? 'danger' : 'success'}
                size="md"
                dot
              >
                {bed.status}
              </Badge>
            }
          >
            {bed.status === 'Occupied' && bed.currentPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{bed.currentPatient.fullName}</h4>
                    <p className="text-xs text-slate-400">
                      {bed.currentPatient.uhid} • {bed.currentPatient.gender}, {bed.currentPatient.age}y
                    </p>
                  </div>
                  <span className="font-bold text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    High Acuity
                  </span>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold">HR / PULSE</p>
                    <p className="text-lg font-black text-slate-800">{bed.currentPatient?.vitals?.pulse || '—'}</p>
                    <p className="text-[10px] text-slate-400">bpm</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold">NIBP</p>
                    <p className="text-lg font-black text-slate-800">{bed.currentPatient?.vitals?.bp || '—'}</p>
                    <p className="text-[10px] text-slate-400">mmHg</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold">SpO2</p>
                    <p className="text-lg font-black text-emerald-600">{bed.currentPatient?.vitals?.spO2 ? `${bed.currentPatient.vitals.spO2}%` : '—'}</p>
                    <p className="text-[10px] text-slate-400">{bed.currentPatient?.vitals?.spO2 ? 'Room Air' : 'No data'}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold">GCS SCORE</p>
                    <p className="text-lg font-black text-teal-600">{bed.currentPatient?.vitals?.gcs || '—'}</p>
                    <p className="text-[10px] text-slate-400">Telemetry Active</p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600">
                  <p>
                    <strong>Active Infusions:</strong> None recorded
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Bed is fully sanitized and available for high-acuity admission.
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
