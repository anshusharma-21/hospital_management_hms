import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../../constants/roles';
import {
  Activity,
  Search,
  LogOut,
  ChevronDown,
  Building,
  Check
} from 'lucide-react';

export const Navbar = ({ onOpenSearch }) => {
  const { user, role, tenant, branch, activeBranch, availableBranches, switchBranch, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  const isMainBranchUser = ['super_admin', 'saas_admin', 'hospital_admin', 'org_admin'].includes(role || user?.role) ||
    Boolean(
      (user?.branch && (user.branch.isMain || user.branch.branchType === 'Main Hospital' || user.branch.code === 'MAIN')) ||
      (branch && (branch.isMain || branch.branchType === 'Main Hospital' || branch.code === 'MAIN')) ||
      (activeBranch && (activeBranch.isMain || activeBranch.branchType === 'Main Hospital' || activeBranch.code === 'MAIN'))
    );

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand & Organization Context */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Hospital<span className="text-teal-600">Vision</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 uppercase">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {tenant?.name || 'Lifeline Multi-Specialty Hospital'}
            </p>
          </div>
        </Link>

        {/* Active Branch Context & Selector */}
        {(activeBranch || branch) && (
          <div className="relative" ref={branchDropdownRef}>
            {isMainBranchUser ? (
              <button
                type="button"
                onClick={() => {
                  if (availableBranches && availableBranches.length > 0) {
                    setBranchDropdownOpen(!branchDropdownOpen);
                  }
                }}
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                  branchDropdownOpen
                    ? 'bg-white border-teal-500 shadow-sm ring-2 ring-teal-500/10'
                    : 'bg-slate-50/90 hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
                }`}
                title="Switch Active Branch"
                aria-expanded={branchDropdownOpen}
                aria-haspopup="true"
              >
                <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <div className="flex flex-col text-left max-w-[130px] xl:max-w-[200px]">
                  <span className="font-semibold text-slate-800 leading-tight truncate">
                    {(activeBranch || branch)?.name || 'Main Campus'}
                  </span>
                  {(activeBranch || branch)?.code && (
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {(activeBranch || branch).code}
                      {(activeBranch || branch).bedCapacity ? ` · ${(activeBranch || branch).bedCapacity} beds` : ''}
                      {((activeBranch || branch).isMain || (activeBranch || branch).branchType === 'Main Hospital') ? ' (Main)' : ''}
                    </span>
                  )}
                </div>
                {availableBranches && availableBranches.length > 1 && (
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>
            ) : (
              <div
                className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 text-xs text-slate-700 cursor-default"
                title="Assigned Branch Context"
              >
                <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <div className="flex flex-col text-left max-w-[130px] xl:max-w-[200px]">
                  <span className="font-semibold text-slate-800 leading-tight truncate">
                    {(activeBranch || branch)?.name || 'Assigned Branch'}
                  </span>
                  {(activeBranch || branch)?.code && (
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {(activeBranch || branch).code}
                      {(activeBranch || branch).bedCapacity ? ` · ${(activeBranch || branch).bedCapacity} beds` : ''}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/50">
                  Assigned
                </span>
              </div>
            )}

            {/* Dropdown Menu (Main Branch Users and Organization Administrators) */}
            {isMainBranchUser && branchDropdownOpen && availableBranches && availableBranches.length > 0 && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Branch</p>
                  <p className="text-xs text-slate-500">Main branch can oversee all operational branches</p>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                  {availableBranches.map((b) => {
                    const isSelected = ((activeBranch || branch)?._id === b._id) || ((activeBranch || branch)?.code === b.code);
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => {
                          switchBranch(b);
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-medium border border-teal-200/60'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{b.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{b.code}</span>
                              <span>·</span>
                              <span>{b.bedCapacity || 0} beds</span>
                              {b.isMain || b.branchType === 'Main Hospital' || b.code === 'MAIN' ? (
                                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 rounded">
                                  Main Branch
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Sub-Branch
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Navigation & Interactive Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Global Patient Search Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-teal-500/50 hover:shadow-sm text-slate-400 hover:text-slate-700 transition-all text-xs cursor-pointer"
          title="Search patient by UHID, Name, or Mobile (Shortcut: /)"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
          <span className="hidden sm:inline font-medium text-slate-500 group-hover:text-slate-800 transition-colors truncate max-w-[140px] md:max-w-[200px]">
            Search patient...
          </span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white group-hover:bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-400 group-hover:text-teal-700 shadow-2xs transition-colors shrink-0">
            /
          </kbd>
        </button>

        {/* User Profile Avatar with Click Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="relative flex items-center justify-center p-0.5 rounded-full hover:ring-3 hover:ring-teal-500/20 hover:shadow-sm transition-all duration-200 cursor-pointer group"
            title={`${user?.name || 'Staff User'} (${ROLE_LABELS[role] || role})`}
            aria-expanded={profileMenuOpen}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {/* Online Pulse Status Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </button>

          {/* Clean User Profile Dropdown */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-extrabold text-sm flex items-center justify-center border border-teal-200 shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Staff User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'staff@hospital.com'}</p>
                  <div className="mt-1">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE_COLORS[role] || 'bg-slate-100'}`}>
                      {ROLE_LABELS[role] || role}
                    </span>
                  </div>
                </div>
              </div>

              {(activeBranch || branch) && (
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campus</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium mt-0.5">
                    <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{(activeBranch || branch)?.name || 'Main Campus'}</span>
                  </div>
                </div>
              )}

              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
