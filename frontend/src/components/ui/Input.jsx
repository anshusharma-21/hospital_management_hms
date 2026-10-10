import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { sanitizePhoneInput } from '../../utils/validation';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  required = false,
  type = 'text',
  isPhone = false,
  onChange,
  value,
  placeholder,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const isPhoneType = isPhone || type === 'tel';

  const effectiveType = isPasswordType
    ? (showPassword ? 'text' : 'password')
    : type;

  const handleChange = (e) => {
    if (isPhoneType) {
      // Auto sanitize phone input: digits only, first digit 6-9, max 10
      const sanitized = sanitizePhoneInput(e.target.value);
      e.target.value = sanitized;
      if (onChange) onChange(e);
    } else {
      if (onChange) onChange(e);
    }
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={effectiveType}
          value={value}
          onChange={handleChange}
          placeholder={
            placeholder ||
            (isPhoneType ? '10-digit mobile (e.g. 9876543210)' : undefined)
          }
          maxLength={isPhoneType ? 10 : props.maxLength}
          inputMode={isPhoneType ? 'numeric' : props.inputMode}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-600 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs font-medium ${
            Icon ? 'pl-10' : ''
          } ${isPasswordType ? 'pr-11 font-mono' : ''} ${
            error
              ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-600'
              : 'border-slate-200'
          } ${className}`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
