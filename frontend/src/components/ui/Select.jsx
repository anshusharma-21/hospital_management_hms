import React from 'react';

export const Select = ({
  label,
  options = [],
  error,
  helperText,
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
      <select
        className={`w-full rounded-lg border bg-white px-3.5 py-2 text-xs text-slate-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400 ${
          error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-600' : 'border-slate-300/80'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
