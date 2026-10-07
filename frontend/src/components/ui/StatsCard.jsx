import React from 'react';

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = 'teal'
}) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200/70 shadow-teal-900/5',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/70 shadow-sky-900/5',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/70 shadow-emerald-900/5',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/70 shadow-amber-900/5',
    rose: 'bg-rose-50 text-rose-800 border-rose-200/70 shadow-rose-900/5',
    purple: 'bg-indigo-50 text-indigo-800 border-indigo-200/70 shadow-indigo-900/5'
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-slate-200/85 flex items-start justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 select-none group"
      style={{
        boxShadow:
          '0 2px 6px -1px rgba(15, 23, 42, 0.03), 0 8px 18px -4px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
      }}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1 mb-1">{value}</h4>
        {subtitle && <p className="text-xs text-slate-500 leading-normal truncate">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-emerald-700">
            <span>{trend}</span>
            {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
          </div>
        )}
      </div>
      {icon && (
        <div
          className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.teal} shrink-0 flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105`}
          style={{
            boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)'
          }}
        >
          {renderIcon()}
        </div>
      )}
    </div>
  );
};
