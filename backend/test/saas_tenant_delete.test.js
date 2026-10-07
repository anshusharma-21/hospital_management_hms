const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'saas_tenant_delete_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const Department = require('../src/models/Department');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Bed = require('../src/models/Bed');
const Appointment = require('../src/models/Appointment');
const Invoice = require('../src/models/Invoice');
const FeatureFlag = require('../src/models/FeatureFlag');
const AuditLog = require('../src/models/AuditLog');
const tenantController = require('../src/controllers/tenantController');

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

describe('Hospital Vision — SaaS Admin Tenant Deletion Test Suite', () => {
  let superAdminUser;
  let saasAdminUser;
  let hospitalAdminUser;
  let doctorUser;

  let tenantA;
  let branchA;
  let userA;
  let patientA;
  let bedA;

  let tenantB;
  let branchB;
  let userB;
  let patientB;

  const createdTenantIds = [];

  before(async () => {
    await connectDB();

    // 1. Create SaaS Admins
    superAdminUser = await User.create({
      name: 'Super Admin Test',
      email: `super_admin_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'super_admin',
      status: 'active'
    });

    saasAdminUser = await User.create({
      name: 'SaaS Admin Ops Test',
      email: `saas_admin_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'saas_admin',
      status: 'active'
    });

    // 2. Create Tenant A (To be deleted)
    tenantA = await Tenant.create({
      name: 'Hospital Alpha to Delete',
      slug: `hospital-alpha-${Date.now()}`,
      status: 'active'
    });
    createdTenantIds.push(tenantA._id);

    branchA = await Branch.create({
      tenant: tenantA._id,
      name: 'Alpha Main Branch',
      code: 'ALPH-1',
      branchType: 'Main Hospital',
      isMain: true,
      bedCapacity: 50
    });

    userA = await User.create({
      tenant: tenantA._id,
      branch: branchA._id,
      name: 'Alpha Hospital Admin',
      email: `admin.alpha.${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'hospital_admin',
      status: 'active'
    });
    hospitalAdminUser = userA;

    doctorUser = await User.create({
      tenant: tenantA._id,
      branch: branchA._id,
      name: 'Alpha Clinician',
      email: `doctor.alpha.${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'doctor',
      status: 'active'
    });

    patientA = await Patient.create({
      tenant: tenantA._id,
      primaryBranch: branchA._id,
      uhid: `UHID-A-${Date.now()}`,
      firstName: 'Patient',
      lastName: 'Alpha',
      gender: 'Male',
      dob: new Date('1990-01-01'),
      phone: '9876543210'
    });

    bedA = await Bed.create({
      tenant: tenantA._id,
      branch: branchA._id,
      bedNumber: 'A-101',
      ward: 'General Male',
      department: 'General Medicine',
      status: 'Available'
    });

    await Department.create({
      tenant: tenantA._id,
      branch: branchA._id,
      name: 'Alpha Cardiology',
      code: 'CARD-A'
    });

    await FeatureFlag.create({
      tenant: tenantA._id,
      moduleKey: 'module_laboratory',
      isEnabled: true
    });

    await AuditLog.create({
      tenant: tenantA._id,
      user: userA._id,
      action: 'Alpha Tenant Test Setup',
      module: 'SaaS Platform'
    });

    // 3. Create Tenant B (Must remain untouched)
    tenantB = await Tenant.create({
      name: 'Hospital Beta Preserved',
      slug: `hospital-beta-${Date.now()}`,
      status: 'active'
    });
    createdTenantIds.push(tenantB._id);

    branchB = await Branch.create({
      tenant: tenantB._id,
      name: 'Beta Main Branch',
      code: 'BETA-1',
      branchType: 'Main Hospital',
      isMain: true,
      bedCapacity: 80
    });

    userB = await User.create({
      tenant: tenantB._id,
      branch: branchB._id,
      name: 'Beta Hospital Admin',
      email: `admin.beta.${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'hospital_admin',
      status: 'active'
    });

    patientB = await Patient.create({
      tenant: tenantB._id,
      primaryBranch: branchB._id,
      uhid: `UHID-B-${Date.now()}`,
      firstName: 'Patient',
      lastName: 'Beta',
      gender: 'Female',
      dob: new Date('1985-05-05'),
      phone: '9123456789'
    });
  });

  after(async () => {
    try {
      if (createdTenantIds.length > 0) {
        await Promise.allSettled([
          Tenant.deleteMany({ _id: { $in: createdTenantIds } }),
          Branch.deleteMany({ tenant: { $in: createdTenantIds } }),
          Department.deleteMany({ tenant: { $in: createdTenantIds } }),
          User.deleteMany({ tenant: { $in: createdTenantIds } }),
          Patient.deleteMany({ tenant: { $in: createdTenantIds } }),
          Bed.deleteMany({ tenant: { $in: createdTenantIds } }),
          FeatureFlag.deleteMany({ tenant: { $in: createdTenantIds } }),
          AuditLog.deleteMany({ tenant: { $in: createdTenantIds } })
        ]);
      }
      if (superAdminUser) await User.deleteOne({ _id: superAdminUser._id });
      if (saasAdminUser) await User.deleteOne({ _id: saasAdminUser._id });
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(0);
  });

  // =========================================================================
  // TEST 1: REJECT NON-EXISTENT TENANT
  // =========================================================================
  it('TEST 1: Deleting non-existent tenant ID returns HTTP 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const req = {
      params: { id: fakeId.toString() },
      query: { force: 'true' },
      user: superAdminUser
    };
    const { result, res } = makeMockRes();
    await tenantController.deleteTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 404);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('not found'));
  });

  // =========================================================================
  // TEST 2: REJECT UNFORCED DELETION OF TENANT WITH ACTIVE USERS
  // =========================================================================
  it('TEST 2: Attempting deletion without ?force=true when tenant has users returns HTTP 400', async () => {
    const req = {
      params: { id: tenantA._id.toString() },
      query: {},
      user: superAdminUser
    };
    const { result, res } = makeMockRes();
    await tenantController.deleteTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('active user'));

    // Verify Tenant A was NOT deleted
    const checkA = await Tenant.findById(tenantA._id);
    assert.ok(checkA, 'Tenant A must still exist');
  });

  // =========================================================================
  // TEST 3: AUTHORIZED SAAS ADMIN DELETES TENANT WITH FORCE=TRUE
  // =========================================================================
  it('TEST 3: Authorized SaaS Admin deleting Tenant A with ?force=true succeeds (HTTP 200)', async () => {
    const req = {
      params: { id: tenantA._id.toString() },
      query: { force: 'true' },
      user: saasAdminUser
    };
    const { result, res } = makeMockRes();
    await tenantController.deleteTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.success, true);
    assert.ok(result.data.message.includes('deleted successfully'));

    // Verify Tenant A is deleted from DB
    const checkA = await Tenant.findById(tenantA._id);
    assert.strictEqual(checkA, null, 'Tenant A must be null in MongoDB');
  });

  // =========================================================================
  // TEST 4: VERIFY ALL TENANT-A RELATED DATA IS DELETED
  // =========================================================================
  it('TEST 4: All related tenant-scoped records for Tenant A are cleanly cascade deleted', async () => {
    const [branchesA, usersA, patientsA, bedsA, deptsA, flagsA, logsA] = await Promise.all([
      Branch.find({ tenant: tenantA._id }),
      User.find({ tenant: tenantA._id }),
      Patient.find({ tenant: tenantA._id }),
      Bed.find({ tenant: tenantA._id }),
      Department.find({ tenant: tenantA._id }),
      FeatureFlag.find({ tenant: tenantA._id }),
      AuditLog.find({ tenant: tenantA._id })
    ]);

    assert.strictEqual(branchesA.length, 0, 'All branches of Tenant A must be deleted');
    assert.strictEqual(usersA.length, 0, 'All users of Tenant A must be deleted');
    assert.strictEqual(patientsA.length, 0, 'All patients of Tenant A must be deleted');
    assert.strictEqual(bedsA.length, 0, 'All beds of Tenant A must be deleted');
    assert.strictEqual(deptsA.length, 0, 'All departments of Tenant A must be deleted');
    assert.strictEqual(flagsA.length, 0, 'All feature flags of Tenant A must be deleted');
    assert.strictEqual(logsA.length, 0, 'All audit logs of Tenant A must be deleted');
  });

  // =========================================================================
  // TEST 5: TENANT ISOLATION - TENANT B DATA IS UNTOUCHED
  // =========================================================================
  it('TEST 5: Deleting Tenant A does NOT affect Tenant B or any of Tenant B records (Tenant Isolation)', async () => {
    const [checkTenantB, checkBranchB, checkUserB, checkPatientB] = await Promise.all([
      Tenant.findById(tenantB._id),
      Branch.findById(branchB._id),
      User.findById(userB._id),
      Patient.findById(patientB._id)
    ]);

    assert.ok(checkTenantB, 'Tenant B must still exist in MongoDB');
    assert.strictEqual(checkTenantB.name, 'Hospital Beta Preserved');
    assert.ok(checkBranchB, 'Branch B must still exist');
    assert.strictEqual(checkBranchB.code, 'BETA-1');
    assert.ok(checkUserB, 'User B must still exist');
    assert.strictEqual(checkUserB.role, 'hospital_admin');
    assert.ok(checkPatientB, 'Patient B must still exist');
    assert.strictEqual(checkPatientB.name, 'Patient Beta');
  });

  // =========================================================================
  // TEST 6: RBAC AUTHORIZATION - UNAUTHORIZED ROLES ARE REJECTED
  // =========================================================================
  it('TEST 6: Route middleware authorize blocks non-SaaS-Admin roles with HTTP 403', async () => {
    const { authorize } = require('../src/middleware/authMiddleware');
    const authMw = authorize('super_admin', 'saas_admin');

    // 6A. Hospital Admin attempt
    let blockedHospAdmin = false;
    const reqHospAdmin = { user: { role: 'hospital_admin' } };
    const { result: resHosp, res: mockHosp } = makeMockRes();
    authMw(reqHospAdmin, mockHosp, () => { blockedHospAdmin = false; });
    assert.strictEqual(resHosp.code, 403);
    assert.ok(resHosp.data.error.includes('not authorized'));

    // 6B. Doctor attempt
    const reqDoc = { user: { role: 'doctor' } };
    const { result: resDoc, res: mockDoc } = makeMockRes();
    authMw(reqDoc, mockDoc, () => {});
    assert.strictEqual(resDoc.code, 403);

    // 6C. Nurse attempt
    const reqNurse = { user: { role: 'nurse' } };
    const { result: resNurse, res: mockNurse } = makeMockRes();
    authMw(reqNurse, mockNurse, () => {});
    assert.strictEqual(resNurse.code, 403);

    // 6D. Patient attempt
    const reqPatient = { user: { role: 'patient' } };
    const { result: resPatient, res: mockPatient } = makeMockRes();
    authMw(reqPatient, mockPatient, () => {});
    assert.strictEqual(resPatient.code, 403);

    // 6E. Super Admin permitted
    let superAdminPassed = false;
    const reqSuper = { user: { role: 'super_admin' } };
    const { result: resSuper, res: mockSuper } = makeMockRes();
    authMw(reqSuper, mockSuper, () => { superAdminPassed = true; });
    assert.strictEqual(superAdminPassed, true);

    // 6F. SaaS Admin permitted
    let saasAdminPassed = false;
    const reqSaas = { user: { role: 'saas_admin' } };
    const { result: resSaas, res: mockSaas } = makeMockRes();
    authMw(reqSaas, mockSaas, () => { saasAdminPassed = true; });
    assert.strictEqual(saasAdminPassed, true);
  });
});
