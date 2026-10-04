import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hv_token') || null);
  const [loading, setLoading] = useState(true);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(() => {
    const saved = localStorage.getItem('hv_active_branch');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const loadTenantBranches = async (currentUser) => {
    if (!currentUser) {
      setAvailableBranches([]);
      setActiveBranch(null);
      return;
    }

    const tenantId = currentUser.tenant?._id || (typeof currentUser.tenant === 'string' ? currentUser.tenant : null);
    if (!tenantId) {
      setAvailableBranches([]);
      return;
    }

    const isOrgAdmin = ['super_admin', 'saas_admin', 'hospital_admin', 'org_admin'].includes(currentUser.role);

    try {
      const res = await api.get(`/tenants/${tenantId}/branches`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const branches = res.data.data.filter(b => b.status === 'active');

        const userBranchId = currentUser.branch?._id || (typeof currentUser.branch === 'string' ? currentUser.branch : null);
        const assigned = branches.find(b => b._id === userBranchId) || (currentUser.branch && typeof currentUser.branch === 'object' ? currentUser.branch : null);

        // Check if the user belongs to the Main Branch (or is Org/Platform Admin)
        const isMainBranchUser = isOrgAdmin || Boolean(
          assigned && (
            assigned.isMain ||
            assigned.branchType === 'Main Hospital' ||
            assigned.code === 'MAIN'
          )
        );

        if (!isMainBranchUser) {
          // Sub-branch users are strictly restricted to their own assigned branch!
          // They cannot view other branches or the main branch.
          if (assigned) {
            setAvailableBranches([assigned]);
            setActiveBranch(assigned);
            localStorage.setItem('hv_active_branch', JSON.stringify(assigned));
          } else {
            setAvailableBranches([]);
            setActiveBranch(null);
            localStorage.removeItem('hv_active_branch');
          }
          return;
        }

        // Main Branch users (and Org Admins) can see and switch to ALL branches ("wo branches m v ja skta")!
        setAvailableBranches(branches);

        // 1. Check if existing activeBranch or localStorage activeBranch is in valid active branches
        const stored = localStorage.getItem('hv_active_branch');
        let matched = null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const targetId = parsed?._id || parsed?.id || parsed;
            matched = branches.find(b => b._id === targetId);
          } catch (e) {
            matched = branches.find(b => b._id === stored);
          }
        }

        // 2. If not matched, try user's default assigned branch
        if (!matched && assigned) {
          matched = assigned;
        }

        // 3. Fallback to main branch or first branch
        if (!matched && branches.length > 0) {
          matched = branches.find(b => b.isMain || b.branchType === 'Main Hospital') || branches[0];
        }

        if (matched) {
          setActiveBranch(matched);
          localStorage.setItem('hv_active_branch', JSON.stringify(matched));
        } else {
          setActiveBranch(null);
          localStorage.removeItem('hv_active_branch');
        }
      }
    } catch (err) {
      console.error('Failed to load tenant branches:', err);
      if (currentUser.branch && typeof currentUser.branch === 'object') {
        setActiveBranch(currentUser.branch);
        setAvailableBranches([currentUser.branch]);
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('hv_token');
      const storedUser = localStorage.getItem('hv_user');

      if (storedToken && storedUser) {
        try {
          let loadedUser = JSON.parse(storedUser);
          setUser(loadedUser);
          setToken(storedToken);
          await loadTenantBranches(loadedUser);

          // Refresh user context from server
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            loadedUser = res.data.user;
            setUser(loadedUser);
            localStorage.setItem('hv_user', JSON.stringify(loadedUser));
            await loadTenantBranches(loadedUser);
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleBranchReset = () => {
      const storedUser = localStorage.getItem('hv_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          loadTenantBranches(parsed);
        } catch (e) {
          // ignore
        }
      }
    };
    window.addEventListener('hv_branch_reset', handleBranchReset);
    return () => window.removeEventListener('hv_branch_reset', handleBranchReset);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('hv_token', token);
        localStorage.setItem('hv_user', JSON.stringify(user));
        await loadTenantBranches(user);
        return { success: true, user };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials or server unavailable'
      };
    }
  };

  const patientLogin = async (phone, otp = '1234') => {
    try {
      const res = await api.post('/auth/patient-login', { phone, otp });
      if (res.data.success) {
        const { token, patient } = res.data;
        const patientUser = {
          _id: patient._id,
          name: patient.fullName,
          phone: patient.phone,
          role: 'patient',
          patient: patient._id || patient.id,
          patientData: patient,
          tenant: patient.tenant
        };
        setToken(token);
        setUser(patientUser);
        localStorage.setItem('hv_token', token);
        localStorage.setItem('hv_user', JSON.stringify(patientUser));
        return { success: true, patient };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'No patient record found with this mobile number'
      };
    }
  };

  const switchBranch = (targetBranch) => {
    if (!targetBranch) return;
    const isOrgAdmin = ['super_admin', 'saas_admin', 'hospital_admin', 'org_admin'].includes(user?.role);
    if (!isOrgAdmin) {
      console.warn('Branch-scoped users cannot switch branches.');
      return;
    }
    const branchObj = availableBranches.find(b => b._id === (targetBranch._id || targetBranch.id || targetBranch)) || targetBranch;
    setActiveBranch(branchObj);
    localStorage.setItem('hv_active_branch', JSON.stringify(branchObj));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveBranch(null);
    setAvailableBranches([]);
    localStorage.removeItem('hv_token');
    localStorage.removeItem('hv_user');
    localStorage.removeItem('hv_active_branch');
    localStorage.removeItem('hv_support_tenant_id');
  };

  // Helper for instant role switching during demo/testing
  const switchRole = async (targetRole) => {
    const roleCredentials = {
      super_admin: 'superadmin@hospitalvision.com',
      saas_admin: 'superadmin@hospitalvision.com',
      hospital_admin: 'admin@lifelinehospital.com',
      doctor: 'dr.arun@lifelinehospital.com',
      receptionist: 'reception@lifelinehospital.com',
      nurse: 'nurse.anita@lifelinehospital.com',
      billing_cashier: 'cashier@lifelinehospital.com',
      pharmacist: 'pharmacist@lifelinehospital.com',
      lab_tech: 'lab@lifelinehospital.com',
      radiologist: 'radiology@lifelinehospital.com'
    };

    if (targetRole === 'patient') {
      return await patientLogin('9876543210');
    }

    const email = roleCredentials[targetRole];
    if (email) {
      return await login(email, 'Password123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        tenant: user?.tenant || null,
        branch: activeBranch || user?.branch || null,
        activeBranch,
        availableBranches,
        switchBranch,
        isAuthenticated: !!token && !!user,
        isPatient: user?.role === 'patient',
        loading,
        login,
        patientLogin,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
