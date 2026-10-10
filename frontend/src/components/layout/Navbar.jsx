import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '../../constants/roles';
import { HospitalVisionLogo } from '../common/HospitalVisionLogo';
import {
  Activity,
  Search,
  LogOut,
  ChevronDown,
  Building,
  Check,
  Globe,
  Menu
} from 'lucide-react';

export const Navbar = ({ onOpenSearch, onToggleMobileSidebar }) => {
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

  const getDashboardHome = () => {
    const r = role || user?.role;
    if (r === 'super_admin' || r === 'saas_admin') return '/saas/dashboard';
    if (r === 'doctor') return '/clinical/dashboard';
    if (r === 'nurse') return '/nursing/dashboard';
    if (r === 'receptionist') return '/front-desk/dashboard';
    if (r === 'billing_cashier') return '/billing/dashboard';
    if (r === 'pharmacist') return '/pharmacy/dashboard';
    if (r === 'lab_tech') return '/diagnostics/lab';
    if (r === 'radiologist') return '/diagnostics/radiology';
    if (r === 'hospital_admin' || r === 'org_admin' || r === 'branch_admin') return '/hospital/dashboard';
    return '/front-desk/dashboard';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand & Organization Context */}
      <div className="flex items-center gap-2 sm:gap-6 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl focus:outline-none transition-colors"
          aria-label="Open navigation menu"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to={getDashboardHome()} className="group flex items-center" title="Go to Dashboard Home">
          <HospitalVisionLogo
            size="md"
            variant="light"
            badge="SaaS"
            subtitle={tenant?.name || user?.tenant?.name || ''}
          />
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
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                  branchDropdownOpen
                    ? 'bg-white border-teal-700 shadow-xs ring-2 ring-teal-700/10'
                    : 'bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700'
                }`}
                title="Switch Active Branch"
                aria-expanded={branchDropdownOpen}
                aria-haspopup="true"
              >
                <Building className="w-3.5 h-3.5 text-teal-700 shrink-0" />
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
                className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50 text-xs text-slate-700 cursor-default"
                title="Assigned Branch Context"
              >
                <Building className="w-3.5 h-3.5 text-teal-700 shrink-0" />
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
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/70">
                  Assigned
                </span>
              </div>
            )}

            {/* Dropdown Menu (Main Branch Users and Organization Administrators) */}
            {isMainBranchUser && branchDropdownOpen && availableBranches && availableBranches.length > 0 && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-modal z-50 p-1.5 animate-in fade-in-50 zoom-in-95">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-medium border border-teal-200/70'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
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
                                <span className="text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200/70 px-1.5 py-0.5 rounded">
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
                          <Check className="w-4 h-4 text-teal-700 shrink-0 ml-2" />
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
        {/* Global Patient Search Trigger (Hidden for SaaS Super Admin) */}
        {!['super_admin', 'saas_admin'].includes(role || user?.role) && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-xs text-slate-400 hover:text-slate-700 transition-all text-xs cursor-pointer"
            title="Search patient by UHID, Name, or Mobile (Shortcut: /)"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors shrink-0" />
            <span className="hidden sm:inline font-medium text-slate-500 group-hover:text-slate-800 transition-colors truncate max-w-[140px] md:max-w-[200px]">
              Search patient...
            </span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white group-hover:bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-400 group-hover:text-teal-800 shadow-2xs transition-colors shrink-0">
              /
            </kbd>
          </button>
        )}

        {/* User Profile Avatar with Click Dropdown */}
        <div className="relative shrink-0" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-300 transition-all duration-150 cursor-pointer group"
            title={`${user?.name || 'Staff User'} (${ROLE_LABELS[role] || role})`}
            aria-expanded={profileMenuOpen}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-teal-700 to-cyan-800 text-white font-bold text-xs flex items-center justify-center shadow-xs border border-teal-600/30">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              {/* Online Pulse Status Dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Clearly Visible User Name & Role Pill */}
            <div className="hidden sm:flex flex-col text-left max-w-[110px] lg:max-w-[150px]">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate">
                {user?.name || 'Staff User'}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold leading-tight truncate">
                {ROLE_LABELS[role] || role || 'Staff'}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0" />
          </button>

          {/* Clean User Profile Dropdown */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-xl border border-slate-200 shadow-modal py-2 z-50 animate-in fade-in-50 zoom-in-95 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-100 text-teal-800 font-extrabold text-sm flex items-center justify-center border border-teal-200 shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
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

              <div className="p-1.5 space-y-0.5">
                {/* Profile Settings Link */}
                <Link
                  to={
                    ['super_admin', 'saas_admin'].includes(role || user?.role)
                      ? '/saas/profile'
                      : ['hospital_admin', 'org_admin', 'branch_admin'].includes(role || user?.role)
                      ? '/hospital/users'
                      : (role || user?.role) === 'doctor'
                      ? '/clinical/dashboard'
                      : (role || user?.role) === 'nurse'
                      ? '/nursing/dashboard'
                      : (role || user?.role) === 'receptionist'
                      ? '/front-desk/dashboard'
                      : (role || user?.role) === 'billing_cashier'
                      ? '/billing/dashboard'
                      : '/clinical/dashboard'
                  }
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left"
                >
                  <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    {['super_admin', 'saas_admin', 'hospital_admin', 'org_admin', 'branch_admin'].includes(role || user?.role)
                      ? 'My Administrator Profile'
                      : 'My Staff Workspace'}
                  </span>
                </Link>

                <Link
                  to="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <Globe className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Public Landing Page</span>
                </Link>

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
