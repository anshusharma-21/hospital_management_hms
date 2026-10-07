import React from 'react';
import { Loader2 } from 'lucide-react';

export const Table = ({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = 'No records found in this view',
  onRowClick,
  children,
  className = ''
}) => {
  if (children) {
    return (
      <div className={`overflow-x-auto rounded-xl border border-slate-200/80 ${className}`}>
        <table className="w-full text-left text-xs border-collapse">
          {children}
        </table>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        <span className="text-xs font-semibold">Loading clinical data...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/90 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3.5 px-4 font-bold ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/90 bg-white">
          {data.map((row, rIdx) => (
            <tr
              key={row._id || row.id || rIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-100 ${
                onRowClick ? 'cursor-pointer hover:bg-teal-50/30' : 'hover:bg-slate-50/70'
              }`}
            >
              {columns.map((col, cIdx) => (
                <td key={cIdx} className={`py-3.5 px-4 text-slate-700 align-middle ${col.cellClassName || ''}`}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TableHead = ({ children, className = '' }) => (
  <thead className={`bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', onClick }) => (
  <tr 
    onClick={onClick} 
    className={`transition-colors hover:bg-slate-50/60 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const TableHeader = ({ children, className = '' }) => (
  <th className={`py-3 px-4 font-bold text-slate-600 ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', colSpan }) => (
  <td colSpan={colSpan} className={`py-3 px-4 text-slate-700 ${className}`}>
    {children}
  </td>
);
