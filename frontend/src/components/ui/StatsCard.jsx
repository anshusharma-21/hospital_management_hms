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
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100'
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
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-emerald-600">
            <span>{trend}</span>
            {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
          </div>
        )}
      </div>
      {icon && (
        <div className={`p-3 rounded-2xl border ${colorMap[color] || colorMap.teal} shrink-0 flex items-center justify-center`}>
          {renderIcon()}
        </div>
      )}
    </div>
  );
};
