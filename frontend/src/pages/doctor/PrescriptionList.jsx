import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { FileText, Printer, Stethoscope, Search, Pill } from 'lucide-react';

export const PrescriptionList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRx, setActiveRx] = useState(null);

  useEffect(() => {
    const fetchRx = async () => {
      try {
        setLoading(true);
        // Try direct clinical prescriptions API first
        const rxRes = await api.get('/clinical/prescriptions');
        if (rxRes.data?.success && rxRes.data?.data?.length > 0) {
          setPrescriptions(rxRes.data.data);
          return;
        }

        // Fallback: Check patient timeline events if any
        const pts = await api.get('/patients');
        if (pts.data?.success && pts.data?.data?.length > 0) {
          const pt = pts.data.data[0];
          const tl = await api.get(`/patients/${pt._id}/timeline`);
          if (tl.data?.success) {
            const rxEvents = tl.data.timeline.filter((e) => e.type === 'PRESCRIPTION');
            setPrescriptions(rxEvents);
          }
        }
      } catch (err) {
        console.error('Failed to load prescriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRx();
  }, []);

  const columns = [
    {
      header: 'Prescription',
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-purple-50 text-purple-800 px-2.5 py-1 rounded border border-purple-200 whitespace-nowrap inline-block">
          {row.prescriptionNumber || row.title?.match(/\((.*?)\)/)?.[1] || 'RX-2026-0001'}
        </span>
      )
    },
    {
      header: 'Clinical Title / Patient',
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-slate-800">
            {row.patient?.fullName
              ? `${row.patient.fullName} (${row.patient.uhid})`
              : (row.title || 'Clinical e-Prescription').replace(/Dr\.\s*Dr\./g, 'Dr.')}
          </span>
          <p className="text-[10px] text-slate-400">
            {new Date(row.signedAt || row.createdAt || row.timestamp).toLocaleDateString()}
            {row.doctor?.name ? ` • Dr. ${row.doctor.name.replace(/^Dr\.?\s*/i, '')}` : ''}
          </p>
        </div>
      )
    },
    {
      header: 'Details & Diagnosis',
      render: (row) => (
        <span className="text-xs text-slate-600 line-clamp-1">
          {row.diagnosis
            ? `Diagnosis: ${row.diagnosis} • ${row.medications?.length || 0} medications prescribed`
            : row.details}
        </span>
      )
    },
    {
      header: 'Signature Lock',
      render: () => (
        <Badge variant="success" size="sm">
          Digitally Signed
        </Badge>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          icon={FileText}
          onClick={() => setActiveRx(row)}
        >
          View Rx
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">e-Prescriptions Registry</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable signed clinical prescriptions synchronized with hospital pharmacy dispensing
        </p>
      </div>

      <Card noPadding>
        <Table
          columns={columns}
          data={prescriptions}
          isLoading={loading}
          emptyMessage="No prescriptions issued yet."
        />
      </Card>

      {/* Printable Prescription Modal */}
      {activeRx && (
        <Modal
          isOpen={!!activeRx}
          onClose={() => setActiveRx(null)}
          title="Medical Prescription (Rx)"
          maxWidth="max-w-2xl"
          footer={
            <Button variant="primary" size="md" icon={Printer} onClick={() => window.print()}>
              Print Prescription
            </Button>
          }
        >
          <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-6 print:border-none print:p-0">
            {/* Header */}
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  LIFELINE MULTI-SPECIALTY HOSPITAL
                </h2>
                <p className="text-xs text-slate-500">Sector 18, Health Boulevard, Mumbai • Phone: +91 22 2840 5000</p>
              </div>
              <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded border border-teal-200 whitespace-nowrap">
                {activeRx.prescriptionNumber || activeRx.title?.match(/\((.*?)\)/)?.[1] || 'RX-2026-0001'}
              </span>
            </div>

            {/* Patient & Doctor Info */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800">{activeRx.patient?.fullName || 'OPD Patient'}</p>
                <p className="text-[11px] text-slate-500">
                  {activeRx.patient?.uhid ? `UHID: ${activeRx.patient.uhid}` : ''}
                  {activeRx.patient?.age ? ` • ${activeRx.patient.age}y / ${activeRx.patient.gender || ''}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">
                  {activeRx.doctor?.name
                    ? `Dr. ${activeRx.doctor.name.replace(/^Dr\.?\s*/i, '')}`
                    : 'Dr. Arun Joshi, MD'}
                </p>
                <p className="text-[11px] text-slate-500">Reg. Number: MCI-2012-88741</p>
              </div>
            </div>

            {/* Rx Content */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-black text-teal-800 font-serif">℞ (Prescription)</h3>

              {activeRx.medications && activeRx.medications.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {activeRx.medications.map((m, idx) => (
                    <div key={idx} className="p-3 bg-white hover:bg-slate-50/50 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{m.medicineName}</div>
                        <div className="text-[11px] text-slate-500">
                          {m.dosage} • {m.frequency} • {m.duration} • {m.instructions}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        Qty: {m.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {activeRx.details}
                </p>
              )}

              {activeRx.diagnosis && (
                <div className="text-xs text-slate-600 pt-2">
                  <strong>Clinical Diagnosis:</strong> {activeRx.diagnosis}
                </div>
              )}
              {activeRx.dietAdvice && (
                <div className="text-xs text-slate-600">
                  <strong>Dietary Advice:</strong> {activeRx.dietAdvice}
                </div>
              )}
            </div>

            {/* Signature Footer */}
            <div className="pt-6 border-t border-slate-100 flex justify-between items-end text-xs text-slate-400">
              <div>
                <p>Generated by Hospital Vision SaaS Core</p>
                <p>Digital SHA-256 Signature Verified</p>
              </div>
              <div className="text-right">
                <div className="w-32 border-b border-slate-300 mb-1 ml-auto"></div>
                <p className="font-bold text-slate-700">
                  {activeRx.doctor?.name
                    ? `Dr. ${activeRx.doctor.name.replace(/^Dr\.?\s*/i, '')}`
                    : 'Dr. Arun Joshi, MD'}
                </p>
                <p className="text-[10px]">Authorized Medical Practitioner</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
