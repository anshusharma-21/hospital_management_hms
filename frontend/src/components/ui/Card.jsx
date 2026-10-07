import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerIcon: Icon,
  noPadding = false
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/85 overflow-hidden transition-all duration-200 ${className}`}
      style={{
        boxShadow:
          '0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 6px 16px -2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
      }}
    >
      {(title || subtitle || action || Icon) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/70 shrink-0 shadow-xs"
                style={{
                  boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)'
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-normal truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};
