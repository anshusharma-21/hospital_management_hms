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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/saas/audit-logs?module=${moduleFilter}`);
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setLogs([]);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.userName && l.userName.toLowerCase().includes(term)) ||
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      (l.userRole && l.userRole.toLowerCase().includes(term)) ||
      (l.module && l.module.toLowerCase().includes(term))
    );
  });

  const getRoleBadgeClass = (role = '') => {
    const r = role.toLowerCase();
    if (r.includes('admin')) return 'bg-teal-50 text-teal-800 border-teal-200/80';
    if (r.includes('doctor')) return 'bg-blue-50 text-blue-800 border-blue-200/80';
    if (r.includes('nurse')) return 'bg-rose-50 text-rose-800 border-rose-200/80';
    if (r.includes('receptionist')) return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    if (r.includes('billing')) return 'bg-amber-50 text-amber-800 border-amber-200/80';
    if (r.includes('pharm')) return 'bg-purple-50 text-purple-800 border-purple-200/80';
    if (r.includes('lab') || r.includes('diag')) return 'bg-cyan-50 text-cyan-800 border-cyan-200/80';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getModuleBadgeClass = (module = '') => {
    const m = module.toLowerCase();
    if (m.includes('auth') || m.includes('sec')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (m.includes('clin') || m.includes('pat') || m.includes('emr')) return 'bg-blue-50 text-blue-700 border-blue-200/70';
    if (m.includes('bill')) return 'bg-amber-50 text-amber-700 border-amber-200/70';
    if (m.includes('pharm')) return 'bg-purple-50 text-purple-700 border-purple-200/70';
    if (m.includes('diag')) return 'bg-cyan-50 text-cyan-700 border-cyan-200/70';
    return 'bg-slate-100 text-slate-700 border-slate-200';
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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

        {/* Quick Search */}
        <div className="relative min-w-[240px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actor, action, details..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Elevated Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            Loading security audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            {searchTerm ? 'No audit records match your search criteria.' : 'No audit records matching the current module filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <colgroup>
                <col style={{ width: '160px' }} />
                <col style={{ width: '165px' }} />
                <col style={{ width: '125px' }} />
                <col style={{ width: '115px' }} />
                <col style={{ width: '125px' }} />
                <col style={{ width: 'auto' }} />
              </colgroup>
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-3 whitespace-nowrap">User / Actor</th>
                  <th className="py-3 px-3 whitespace-nowrap">Role</th>
                  <th className="py-3 px-3 whitespace-nowrap">Module</th>
                  <th className="py-3 px-3 whitespace-nowrap">Action</th>
                  <th className="py-3 px-4 whitespace-nowrap">Activity Context & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90 bg-white text-xs">
                {filteredLogs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 border border-teal-200/80 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                          {l.userName ? l.userName.charAt(0) : 'S'}
                        </div>
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]" title={l.userName}>
                          {l.userName || 'System Agent'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap border shadow-2xs uppercase tracking-wider ${getRoleBadgeClass(l.userRole)}`}>
                        {l.userRole?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getModuleBadgeClass(l.module)}`}>
                        {l.module}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {l.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed break-words text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <span className="break-words">{l.details}</span>
                        {l.ipAddress && (
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {l.ipAddress}
                          </span>
                        )}
                      </div>
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

