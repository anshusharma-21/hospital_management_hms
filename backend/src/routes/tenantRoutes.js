const express = require('express');
const router = express.Router();
const {
  getTenants,
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
  getBranches,
  createBranch,
  getDepartments,
  createDepartment,
  getTenantUsers,
  createTenantUser,
  previewBulkImport,
  commitBulkImport,
  initiateTenantOffboarding,
  exportTenantData,
  purgeTenantData,
  exportFhirPatientBundle,
  syncHrmsStaff
} = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTenants)
  .post(authorize('super_admin', 'saas_admin'), createTenant);

// Bulk Import
router.post('/import/preview', previewBulkImport);
router.post('/import/commit', commitBulkImport);

// ABDM / FHIR Interoperability Export
router.post('/interop/fhir-bundle', exportFhirPatientBundle);

// HRMS Staff Sync
router.post('/hrms/sync', syncHrmsStaff);

// Offboarding & Purge (SaaS Super Admin only)
router.post('/:id/offboard', authorize('super_admin', 'saas_admin'), initiateTenantOffboarding);
router.get('/:id/export', authorize('super_admin', 'saas_admin', 'hospital_admin'), exportTenantData);
router.post('/:id/purge', authorize('super_admin'), purgeTenantData);

router.route('/:id')
  .get(getTenantById)
  .put(updateTenant)
  .delete(authorize('super_admin'), deleteTenant);

router.route('/:id/branches')
  .get(getBranches)
  .post(authorize('super_admin', 'saas_admin', 'hospital_admin', 'org_admin'), createBranch);

router.route('/:id/departments')
  .get(getDepartments)
  .post(authorize('super_admin', 'saas_admin', 'hospital_admin', 'org_admin'), createDepartment);

router.route('/:id/users')
  .get(getTenantUsers)
  .post(authorize('super_admin', 'saas_admin', 'hospital_admin', 'org_admin', 'branch_admin'), createTenantUser);

module.exports = router;

