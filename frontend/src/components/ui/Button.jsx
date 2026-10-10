import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  const variants = {
    primary: 'bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 hover:from-teal-800 hover:to-cyan-900 text-white shadow-md shadow-teal-900/15 border border-teal-800/40 focus:ring-teal-600',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90 focus:ring-slate-400 font-semibold shadow-2xs',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-2xs focus:ring-teal-600 font-semibold',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs focus:ring-emerald-600',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
    md: 'text-xs px-4 py-2 gap-2 rounded-xl',
    lg: 'text-xs sm:text-sm px-5 py-2.5 gap-2.5 rounded-xl'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
