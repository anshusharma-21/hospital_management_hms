import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Users, 
  BedDouble, 
  CreditCard, 
  FileText,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const HospitalReports = () => {
  const { addToast } = useToast();
  const [activeReport, setActiveReport] = useState('opd');
  
  // Set default dates: 30 days ago to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ columns: [], rows: [] });

  const reportCategories = [
    { key: 'opd', label: 'OPD Census & Visits' },
    { key: 'ipd', label: 'IPD Admissions & Bed Occupancy' },
    { key: 'revenue', label: 'Revenue by Department' },
    { key: 'doctor', label: 'Physician Productivity' },
    { key: 'pharmacy', label: 'Pharmacy Drug Consumption' },
    { key: 'lab', label: 'Diagnostic Lab Test Volumes' }
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reports', {
        params: {
          category: activeReport,
          startDate,
          endDate
        }
      });
      if (res.data?.success && res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching hospital reports:', err);
      addToast('Failed to load live report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeReport, startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportData.rows || reportData.rows.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }

    try {
      const headers = reportData.columns.join(',');
      const csvRows = reportData.rows.map(row => {
        return Object.values(row).map(val => `"${val ?? ''}"`).join(',');
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...csvRows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${activeReport}_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Hospital report exported successfully as CSV', 'success');
    } catch (err) {
      console.error('CSV Export Error:', err);
      addToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hospital Management Reports & Census</h1>
              <p className="text-xs text-slate-500">Executive analytics across patient census, bed utilization, clinician revenue & diagnostics</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
          <Button size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Report Switcher & Date Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {reportCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveReport(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReport === cat.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Period:</span>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-lg text-xs"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Active Report Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            {reportCategories.find(c => c.key === activeReport)?.label} (Live Aggregation)
          </h2>
          <Badge variant="neutral">Period: {startDate} to {endDate}</Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-xs">Aggregating hospital operational statistics...</p>
          </div>
        ) : reportData.rows?.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No records found for the selected date range</p>
            <p className="text-xs text-slate-400 mt-1">Try widening the date filter to include operational records.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                {reportData.columns.map((col, idx) => (
                  <TableHeader key={idx}>{col}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.rows.map((row, idx) => {
                const values = Object.values(row);
                return (
                  <TableRow key={idx}>
                    {values.map((val, cellIdx) => (
                      <TableCell 
                        key={cellIdx}
                        className={`text-xs ${
                          cellIdx === 0 
                            ? 'font-bold text-slate-900' 
                            : typeof val === 'number' || (typeof val === 'string' && val.startsWith('₹'))
                              ? 'font-mono text-slate-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {typeof val === 'number' && val > 999 ? val.toLocaleString() : String(val ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default HospitalReports;
