import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400 ${
            Icon ? 'pl-9' : ''
          } ${
            error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-600' : 'border-slate-300/80'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
