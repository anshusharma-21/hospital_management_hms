import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Clock, 
  User, 
  Filter, 
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const AuditLogs = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/saas/audit-logs?module=${moduleFilter}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setLogs([]);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Hospital Security & Clinical Audit Trail</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Immutable chronological ledger of sensitive medical, financial and user operations</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2 font-semibold">
          <History className="w-3.5 h-3.5 text-teal-700" />
          Refresh Trail
        </Button>
      </div>

      {/* Segmented Filter Control Bar */}
      <div className="inline-flex p-1 bg-slate-200/75 rounded-2xl gap-1 border border-slate-300/60 shadow-2xs overflow-x-auto max-w-full">
        {['all', 'Auth / Security', 'Clinical EMR', 'Billing', 'Diagnostics', 'Pharmacy'].map((mod) => (
          <button
            key={mod}
            onClick={() => setModuleFilter(mod)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              moduleFilter === mod 
                ? 'bg-white text-teal-900 shadow-sm font-bold border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {mod === 'all' ? 'All Modules' : mod}
          </button>
        ))}
      </div>

      {/* Elevated Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            Loading security audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No audit records matching the current module filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User / Actor</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Role</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Activity Context & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90 bg-white text-xs">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-teal-50/25 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {l.userName || 'System Agent'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs uppercase tracking-wider">
                        {l.userRole?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {l.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-lg">
                      {l.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
