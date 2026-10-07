import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Camera, 
  Layers, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const RadiologyWorklist = () => {
  const { addToast } = useToast();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModality, setActiveModality] = useState('ALL');

  useEffect(() => {
    fetchRadiologyWorklist();
  }, []);

  const fetchRadiologyWorklist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/radiology-orders');
      if (res.data.success) {
        setStudies(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setStudies([]);
      addToast('Failed to load radiology worklist', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudies = activeModality === 'ALL' 
    ? studies 
    : studies.filter(s => s.modality === activeModality);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Radiology & Medical Imaging Worklist</h1>
              <p className="text-xs text-slate-500">Modality scheduling, DICOM image acquisition, and radiologist reporting queue</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/diagnostics/radiology/reporting">
            <Button size="sm">
              <FileText className="w-4 h-4 mr-1.5" /> Radiologist Reporting Desk
            </Button>
          </Link>
        </div>
      </div>

      {/* Modality Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'CT', 'MRI', 'X-RAY', 'USG', 'MAMMO'].map((mod) => (
          <button
            key={mod}
            onClick={() => setActiveModality(mod)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeModality === mod 
                ? 'bg-teal-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90'
            }`}
          >
            {mod === 'ALL' ? 'All Modalities' : mod}
          </button>
        ))}
      </div>

      {/* Worklist Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Today's Radiology Worklist (MWL)</h2>
            <Badge variant="neutral">{filteredStudies.length} Studies</Badge>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Accession #</TableHeader>
              <TableHeader>Patient (UHID)</TableHeader>
              <TableHeader>Modality</TableHeader>
              <TableHeader>Study Description</TableHeader>
              <TableHeader>Scheduled Slot</TableHeader>
              <TableHeader>Assigned Tech</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudies.map((std) => (
              <TableRow key={std._id}>
                <TableCell className="font-mono font-bold text-teal-700 text-xs">{std.accessionNumber}</TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-800 text-xs">{std.patient?.fullName}</p>
                  <p className="font-mono text-[11px] text-slate-400">{std.patient?.uhid} • {std.patient?.age}y / {std.patient?.gender}</p>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {std.modality}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-slate-800 text-xs max-w-xs truncate">
                  {std.studyName}
                </TableCell>
                <TableCell className="text-xs text-slate-600 font-medium">{std.scheduledTime}</TableCell>
                <TableCell className="text-xs text-slate-700">{std.technician || 'Radiology Tech'}</TableCell>
                <TableCell>
                  <Badge variant={
                    std.status === 'reported' ? 'success' :
                    std.status === 'acquired' ? 'info' : 'warning'
                  }>
                    {std.status?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Link to={`/diagnostics/radiology/reporting?orderId=${std._id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View & Report
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
