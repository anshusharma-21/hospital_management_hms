import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  status,
  size = 'md',
  dot = false,
  className = ''
}) => {
  // Semantic status normalization if status prop is provided
  let resolvedVariant = variant;
  if (status) {
    const s = String(status).toLowerCase();
    if (['active', 'available', 'completed', 'paid', 'success', 'verified'].includes(s)) {
      resolvedVariant = 'success';
    } else if (['pending', 'scheduled', 'in-consultation', 'in consultation', 'waiting', 'warning'].includes(s)) {
      resolvedVariant = 'warning';
    } else if (['critical', 'emergency', 'cancelled', 'unpaid', 'danger', 'high acuity'].includes(s)) {
      resolvedVariant = 'danger';
    } else if (['occupied', 'admitted', 'in-progress', 'info', 'blue'].includes(s)) {
      resolvedVariant = 'info';
    } else if (['discharged', 'cleaning', 'maintenance', 'neutral'].includes(s)) {
      resolvedVariant = 'neutral';
    }
  }

  const variants = {
    primary: 'bg-teal-50 text-teal-800 border-teal-200/90',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/90',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/90',
    info: 'bg-sky-50 text-sky-800 border-sky-200/90',
    purple: 'bg-indigo-50 text-indigo-800 border-indigo-200/90',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/90'
  };

  const dots = {
    primary: 'bg-teal-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600 animate-pulse',
    info: 'bg-sky-600',
    purple: 'bg-indigo-600',
    neutral: 'bg-slate-500'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold tracking-wide',
    md: 'text-xs px-2.5 py-0.5 font-semibold tracking-wide',
    lg: 'text-xs px-3 py-1 font-bold tracking-wide'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${variants[resolvedVariant] || variants.neutral} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[resolvedVariant] || dots.neutral}`} />}
      {children || status}
    </span>
  );
};
