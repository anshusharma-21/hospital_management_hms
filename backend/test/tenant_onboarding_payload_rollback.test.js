const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'onboarding_test_secret_2026_super_secure';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const Department = require('../src/models/Department');
const User = require('../src/models/User');
const FeatureFlag = require('../src/models/FeatureFlag');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Invoice = require('../src/models/Invoice');
const AuditLog = require('../src/models/AuditLog');

const tenantController = require('../src/controllers/tenantController');
const authController = require('../src/controllers/authController');

const makeMockRes = () => {
  const result = { code: 200, data: null };
  const res = {
    status: (code) => {
      result.code = code;
      return res;
    },
    json: (payload) => {
      result.data = payload;
      return res;
    }
  };
  return { result, res };
};

describe('Hospital Vision — Tenant Onboarding Payload Compatibility & Safe Rollback Test Suite', () => {
  let superAdminUser;
  let seededTenantCount = 0;
  let seededPatientCount = 0;
  let seededInvoiceCount = 0;

  before(async () => {
    await connectDB();

    // Capture baseline counts of existing data
    seededTenantCount = await Tenant.countDocuments();
    seededPatientCount = await Patient.countDocuments();
    seededInvoiceCount = await Invoice.countDocuments();

    superAdminUser = await User.findOne({ role: 'super_admin' });
    if (!superAdminUser) {
      superAdminUser = await User.create({
        name: 'Platform Super Admin',
        email: `platform_admin_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'super_admin',
        status: 'active'
      });
    }
  });

  // =========================================================================
  // TEST A: SUBMIT THE EXISTING NESTED FRONTEND WIZARD PAYLOAD
  // =========================================================================
  let createdNestedTenantId = null;
  const nestedSlug = `nested-hospital-${Date.now()}`;
  const nestedAdminEmail = `admin-${nestedSlug}@hospitalvision.org`;

  it('A. Should successfully onboard tenant using EXISTING nested frontend payload (HTTP 201)', async () => {
    const { result, res } = makeMockRes();

    // Exact payload structure sent by frontend/src/pages/saas-admin/TenantOnboarding.jsx
    const req = {
      user: superAdminUser,
      body: {
        name: 'Apex Super-Specialty Hospital',
        slug: nestedSlug,
        legalName: 'Apex Healthcare Pvt Ltd',
        hospitalType: 'Super-Specialty',
        email: 'info@apexhospital.org',
        phone: '9876543210',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        },
        subscription: {
          plan: 'Professional (Up to 100 Beds)',
          maxBeds: 100,
          status: 'active'
        },
        initialBranch: {
          name: 'Apex Tower Main Campus',
          code: 'APEX-MAIN',
          bedCapacity: 100,
          hasEmergency: true,
          hasICU: true
        },
        adminUser: {
          name: 'Dr. Apex Director',
          email: nestedAdminEmail,
          phone: '9876543210',
          password: 'Password123!',
          role: 'hospital_admin'
        }
      }
    };

    let nextError = null;
    await tenantController.createTenant(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null, `Expected no error, got: ${nextError?.message}`);
    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.tenant.name, 'Apex Super-Specialty Hospital');
    assert.strictEqual(result.data.data.tenant.slug, nestedSlug);
    assert.strictEqual(result.data.data.branch.name, 'Apex Tower Main Campus');
    assert.strictEqual(result.data.data.branch.code, 'APEX-MAIN');
    assert.strictEqual(result.data.data.adminUser.email, nestedAdminEmail.toLowerCase());
    assert.strictEqual(result.data.data.adminUser.role, 'hospital_admin');

    createdNestedTenantId = result.data.data.tenant._id;

    // Verify database entities created
    const branchCount = await Branch.countDocuments({ tenant: createdNestedTenantId });
    assert.strictEqual(branchCount, 1);

    const deptsCount = await Department.countDocuments({ tenant: createdNestedTenantId });
    assert.strictEqual(deptsCount, 8); // 8 default clinical/diagnostic/support departments

    const usersCount = await User.countDocuments({ tenant: createdNestedTenantId });
    assert.strictEqual(usersCount, 1);

    const flagsCount = await FeatureFlag.countDocuments({ tenant: createdNestedTenantId });
    assert.strictEqual(flagsCount, 10);
  });

  // =========================================================================
  // TEST B: LOGIN WITH NEWLY-CREATED HOSPITAL ADMIN
  // =========================================================================
  it('B. Should login successfully with the newly-created Hospital Admin credentials', async () => {
    const { result, res } = makeMockRes();

    const req = {
      body: {
        email: nestedAdminEmail,
        password: 'Password123!'
      }
    };

    let nextError = null;
    await authController.login(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.success, true);
    assert.ok(result.data.token, 'Should receive a signed JWT token');
    assert.strictEqual(result.data.user.role, 'hospital_admin');
    assert.strictEqual(result.data.user.email, nestedAdminEmail.toLowerCase());
    assert.strictEqual(result.data.user.tenant._id.toString(), createdNestedTenantId.toString());
  });

  // =========================================================================
  // TEST C: VERIFY TENANT APPEARS IN SAAS HOSPITAL TENANTS LIST
  // =========================================================================
  it('C. Should include newly created tenant in SaaS Hospital Tenants list', async () => {
    const { result, res } = makeMockRes();

    const req = { user: superAdminUser };
    let nextError = null;
    await tenantController.getTenants(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.success, true);

    const found = result.data.data.find(t => t._id.toString() === createdNestedTenantId.toString());
    assert.ok(found, 'Newly created tenant should be listed in tenants list');
    assert.strictEqual(found.branchCount, 1);
    assert.strictEqual(found.userCount, 1);
  });

  // =========================================================================
  // TEST D: REFRESH THE PAGE / VERIFY PERSISTENCE
  // =========================================================================
  it('D. Should retrieve persisted tenant details by ID with branches, departments, and users', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: createdNestedTenantId.toString() },
      user: superAdminUser
    };
    let nextError = null;
    await tenantController.getTenantById(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.data.tenant.slug, nestedSlug);
    assert.strictEqual(result.data.data.branches.length, 1);
    assert.strictEqual(result.data.data.departments.length, 8);
    assert.strictEqual(result.data.data.users.length, 1);
    assert.strictEqual(result.data.data.users[0].email, nestedAdminEmail.toLowerCase());
  });

  // =========================================================================
  // TEST E: SUBMIT SAME SLUG AGAIN -> CLEAN DUPLICATE-SLUG ERROR
  // =========================================================================
  it('E. Should return a clean duplicate-slug validation error when submitting the same slug again', async () => {
    const { result, res } = makeMockRes();

    const beforeTenantCount = await Tenant.countDocuments();

    const req = {
      user: superAdminUser,
      body: {
        name: 'Another Hospital Name',
        slug: nestedSlug, // Duplicate slug
        legalName: 'Another Legal Name',
        initialBranch: { name: 'Branch 2', code: 'BR2' },
        adminUser: { name: 'Admin 2', email: 'unique-email@test.com', password: 'Password123!' }
      }
    };

    let nextError = null;
    await tenantController.createTenant(req, res, (err) => { nextError = err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.strictEqual(result.data.error, 'Hospital with this URL slug already exists.');

    // Ensure no partial records were created
    const afterTenantCount = await Tenant.countDocuments();
    assert.strictEqual(afterTenantCount, beforeTenantCount, 'No tenant should be created on duplicate slug');
  });

  // =========================================================================
  // TEST F: FLAT LEGACY PAYLOAD BACKWARD COMPATIBILITY
  // =========================================================================
  it('F. Should onboard tenant using legacy flat payload format (backward compatibility)', async () => {
    const { result, res } = makeMockRes();
    const flatSlug = `flat-hospital-${Date.now()}`;
    const flatAdminEmail = `admin-${flatSlug}@test.com`;

    const req = {
      user: superAdminUser,
      body: {
        name: 'Legacy Horizon Medical Center',
        legalName: 'Legacy Horizon Pvt Ltd',
        hospitalType: 'Multi-Specialty',
        email: 'info@horizon.org',
        phone: '9123456780',
        subscriptionPlan: 'Professional (Up to 100 Beds)',
        initialBedCapacity: 80,
        mainBranchName: 'Horizon Central Campus',
        mainBranchCode: 'HORIZON-1',
        adminName: 'Horizon Admin Officer',
        adminEmail: flatAdminEmail,
        adminPassword: 'Password123!'
      }
    };

    let nextError = null;
    await tenantController.createTenant(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.tenant.name, 'Legacy Horizon Medical Center');
    assert.strictEqual(result.data.data.branch.name, 'Horizon Central Campus');
    assert.strictEqual(result.data.data.branch.code, 'HORIZON-1');
    assert.strictEqual(result.data.data.adminUser.email, flatAdminEmail.toLowerCase());

    const flatTenantId = result.data.data.tenant._id;
    const branch = await Branch.findOne({ tenant: flatTenantId });
    assert.strictEqual(branch.bedCapacity, 80);
  });

  // =========================================================================
  // TEST G: MISSING ADMIN EMAIL -> HTTP 400 (NOT 500)
  // =========================================================================
  it('G. Should reject missing admin email with HTTP 400 validation error (NOT HTTP 500 crash)', async () => {
    const { result, res } = makeMockRes();

    const req = {
      user: superAdminUser,
      body: {
        name: 'Missing Email Hospital',
        slug: `missing-email-${Date.now()}`,
        // Missing adminEmail completely
        initialBranch: { name: 'Main Campus', code: 'MAIN' },
        adminUser: { name: 'Admin', password: 'Password123!' }
      }
    };

    let nextError = null;
    await tenantController.createTenant(req, res, (err) => { nextError = err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.strictEqual(result.data.error, 'Admin login email is required');
  });

  // =========================================================================
  // TEST H: FAILED PROVISIONING COMPENSATING ROLLBACK
  // =========================================================================
  it('H. Should cleanly roll back created tenant and branches if user creation fails', async () => {
    const { result, res } = makeMockRes();
    const rollbackSlug = `rollback-test-${Date.now()}`;

    // First create a user with this email to induce duplicate email error on user creation
    const duplicateEmail = `duplicate-user-${Date.now()}@test.com`;
    await User.create({
      name: 'Existing Pre-registered User',
      email: duplicateEmail,
      password: 'Password123!',
      role: 'receptionist'
    });

    const beforeTenantCount = await Tenant.countDocuments();
    const beforeBranchCount = await Branch.countDocuments();
    const beforeDeptCount = await Department.countDocuments();

    // Now attempt onboarding with that duplicate user email
    const req = {
      user: superAdminUser,
      body: {
        name: 'Rollback Clinic',
        slug: rollbackSlug,
        initialBranch: { name: 'Rollback Branch', code: 'RB-1' },
        adminUser: {
          name: 'Colliding Admin',
          email: duplicateEmail,
          password: 'Password123!'
        }
      }
    };

    let nextError = null;
    await tenantController.createTenant(req, res, (err) => { nextError = err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('already exists'));

    // Verify compensating rollback: No orphan tenant, branch, or department exists
    const orphanTenant = await Tenant.findOne({ slug: rollbackSlug });
    assert.strictEqual(orphanTenant, null, 'Orphan tenant must not exist');

    const afterTenantCount = await Tenant.countDocuments();
    const afterBranchCount = await Branch.countDocuments();
    const afterDeptCount = await Department.countDocuments();

    assert.strictEqual(afterTenantCount, beforeTenantCount, 'Tenant count should not increase on failure');
    assert.strictEqual(afterBranchCount, beforeBranchCount, 'Branch count should not increase on failure');
    assert.strictEqual(afterDeptCount, beforeDeptCount, 'Department count should not increase on failure');
  });

  // =========================================================================
  // TEST I: VERIFY EXISTING SEEDED TENANTS AND DATA REMAIN UNTOUCHED
  // =========================================================================
  it('I. Should verify seeded tenants, patients, and clinical/billing data remain untouched', async () => {
    const currentPatientCount = await Patient.countDocuments();
    const currentInvoiceCount = await Invoice.countDocuments();

    assert.strictEqual(currentPatientCount, seededPatientCount, 'Patient records must remain intact');
    assert.strictEqual(currentInvoiceCount, seededInvoiceCount, 'Invoice records must remain intact');

    // Verify Lifeline Hospital (primary seeded tenant) remains intact
    const lifeline = await Tenant.findOne({ slug: 'lifeline-hospital' });
    if (lifeline) {
      const lifelineUsers = await User.countDocuments({ tenant: lifeline._id });
      assert.ok(lifelineUsers >= 5, 'Lifeline hospital staff must remain intact');
    }
  });

  // =========================================================================
  // TEST J: SUPER ADMIN CAN SAFELY DELETE/PURGE FAILED/ORPHAN TENANTS
  // =========================================================================
  it('J. Should allow Super Admin to delete orphan tenant and prevent deleting active populated tenant', async () => {
    // Attempting to delete tenant with active users without force should be blocked
    const { result: blockedRes, res: bRes } = makeMockRes();
    const reqBlocked = {
      params: { id: createdNestedTenantId.toString() },
      query: {},
      user: superAdminUser
    };
    await tenantController.deleteTenant(reqBlocked, bRes, (err) => { if (err) throw err; });
    assert.strictEqual(blockedRes.code, 400);
    assert.ok(blockedRes.data.error.includes('active user'));

    // Create a dummy orphan tenant with 0 users
    const orphan = await Tenant.create({
      name: 'Dummy Orphan Tenant',
      slug: `orphan-${Date.now()}`
    });
    const orphanBranch = await Branch.create({
      tenant: orphan._id,
      name: 'Orphan Branch',
      code: 'ORPH-1'
    });

    const { result: delRes, res: dRes } = makeMockRes();
    const reqDel = {
      params: { id: orphan._id.toString() },
      query: {},
      user: superAdminUser
    };
    await tenantController.deleteTenant(reqDel, dRes, (err) => { if (err) throw err; });
    assert.strictEqual(delRes.code, 200);
    assert.strictEqual(delRes.data.success, true);

    const checkTenant = await Tenant.findById(orphan._id);
    const checkBranch = await Branch.findById(orphanBranch._id);
    assert.strictEqual(checkTenant, null);
    assert.strictEqual(checkBranch, null);
  });

  after(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(0);
  });
});
