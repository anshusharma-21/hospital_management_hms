import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token, tenant context, and active branch context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const impersonatedTenantId = localStorage.getItem('hv_support_tenant_id');
    if (impersonatedTenantId) {
      config.headers['x-tenant-id'] = impersonatedTenantId;
    }
    const url = config.url || '';
    const isBranchQueryUrl = url.includes('/branches') || url.includes('/auth/me');

    const storedBranch = localStorage.getItem('hv_active_branch');
    if (!isBranchQueryUrl && storedBranch) {
      try {
        const branchObj = JSON.parse(storedBranch);
        const branchId = branchObj?._id || branchObj?.id || (typeof branchObj === 'string' ? branchObj : null);
        if (branchId) {
          config.headers['x-branch-id'] = branchId;
        }
      } catch (e) {
        if (typeof storedBranch === 'string' && storedBranch.trim()) {
          config.headers['x-branch-id'] = storedBranch.trim();
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiry and branch healing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        if (!window.location.pathname.includes('/signin') && !window.location.pathname.includes('/patient-portal/login')) {
          localStorage.removeItem('hv_token');
          localStorage.removeItem('hv_user');
          localStorage.removeItem('hv_active_branch');
        }
      } else if (
        (error.response.status === 404 || error.response.status === 400 || error.response.status === 403) &&
        typeof error.response.data?.error === 'string' &&
        (error.response.data.error.includes('branch does not exist') || error.response.data.error.includes('branch context'))
      ) {
        // Auto-heal: stale or invalid active branch
        console.warn('[API Interceptor] Active branch is stale or invalid. Clearing from localStorage.');
        localStorage.removeItem('hv_active_branch');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hv_branch_reset'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
