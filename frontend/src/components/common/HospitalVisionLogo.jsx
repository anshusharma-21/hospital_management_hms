import React from 'react';
import { Activity } from 'lucide-react';

/**
 * HospitalVisionLogo — Unified single brand mark for Hospital Vision
 * Used consistently across Staff Login, Patient Login, Navbar, Sidebar, and Dashboards.
 */
export const HospitalVisionLogo = ({
  size = 'md',
  variant = 'light',
  subtitle = '',
  badge = '',
  className = ''
}) => {
  // Sizing tokens
  const sizeMap = {
    sm: {
      box: 'w-7 h-7 rounded-lg',
      icon: 'w-4 h-4',
      title: 'text-sm',
      sub: 'text-[9px]',
      badgeText: 'text-[9px] px-1 py-0.2'
    },
    md: {
      box: 'w-9 h-9 rounded-xl',
      icon: 'w-5 h-5',
      title: 'text-base',
      sub: 'text-[10px]',
      badgeText: 'text-[10px] px-1.5 py-0.5'
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      icon: 'w-6 h-6',
      title: 'text-xl',
      sub: 'text-xs',
      badgeText: 'text-[11px] px-2 py-0.5'
    },
    xl: {
      box: 'w-16 h-16 rounded-2xl',
      icon: 'w-8 h-8',
      title: 'text-2xl sm:text-3xl',
      sub: 'text-xs sm:text-sm',
      badgeText: 'text-xs px-2.5 py-0.5'
    }
  };

  const s = sizeMap[size] || sizeMap.md;
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 3D Elevated Brand Icon */}
      <div
        className={`${s.box} relative flex items-center justify-center shrink-0 bg-gradient-to-tr from-teal-700 via-teal-600 to-cyan-500 text-white shadow-md shadow-teal-900/30 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105`}
        style={{
          boxShadow: isDark 
            ? '0 10px 25px -5px rgba(13, 148, 136, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)' 
            : '0 4px 14px -2px rgba(15, 118, 110, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        <Activity className={`${s.icon} drop-shadow-sm`} />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-center gap-2">
          <span
            className={`${s.title} font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Hospital<span className={isDark ? 'text-teal-400' : 'text-teal-600'}>Vision</span>
          </span>
          {badge && (
            <span
              className={`${s.badgeText} font-bold rounded-md uppercase tracking-wider whitespace-nowrap ${
                isDark
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                  : 'bg-teal-50 text-teal-800 border border-teal-200/80'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            className={`${s.sub} font-medium tracking-wide mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
