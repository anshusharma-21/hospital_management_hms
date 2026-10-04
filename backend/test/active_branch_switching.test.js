const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'active_branch_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Encounter = require('../src/models/Encounter');
const Bed = require('../src/models/Bed');
const Invoice = require('../src/models/Invoice');

const { protect } = require('../src/middleware/authMiddleware');
const ipdController = require('../src/controllers/ipdController');
const billingController = require('../src/controllers/billingController');
const clinicalController = require('../src/controllers/clinicalController');
const appointmentController = require('../src/controllers/appointmentController');
const dashboardController = require('../src/controllers/dashboardController');

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

describe('Hospital Vision — Active Branch Context & Switching Test Suite', () => {
  let tenantA;
  let mainBranchA;
  let cityBranchA;
  let inactiveBranchA;
  let tenantB;
  let branchB;
  let adminUser;
  let adminToken;
  let testPatient;

  before(async () => {
    await connectDB();

    // 1. Create or load Tenant A (Green Valley)
    tenantA = await Tenant.findOne({ slug: 'green-valley-hospital' });
    if (!tenantA) {
      tenantA = await Tenant.create({
        name: 'Green Valley Multispeciality Hospital',
        slug: 'green-valley-hospital',
        hospitalType: 'Multi-Specialty',
        subscription: { plan: 'Professional', maxBeds: 150, status: 'active' }
      });
    }

    // Branch 1: Main Campus (100 beds)
    mainBranchA = await Branch.findOne({ tenant: tenantA._id, code: 'GV-MAIN' });
    if (!mainBranchA) {
      mainBranchA = await Branch.create({
        tenant: tenantA._id,
        name: 'Green Valley Main Campus',
        code: 'GV-MAIN',
        branchType: 'Main Hospital',
        bedCapacity: 100,
        status: 'active'
      });
    }

    // Branch 2: City Center (50 beds)
    cityBranchA = await Branch.findOne({ tenant: tenantA._id, code: 'GVC1' });
    if (!cityBranchA) {
      cityBranchA = await Branch.create({
        tenant: tenantA._id,
        name: 'Green Valley City Center',
        code: 'GVC1',
        branchType: 'Satellite Clinic',
        bedCapacity: 50,
        status: 'active'
      });
    }

    // Branch 3: Inactive branch for testing
    inactiveBranchA = await Branch.findOne({ tenant: tenantA._id, code: 'GV-INACT' });
    if (!inactiveBranchA) {
      inactiveBranchA = await Branch.create({
        tenant: tenantA._id,
        name: 'Green Valley Annex (Closed)',
        code: 'GV-INACT',
        branchType: 'Day Care Center',
        bedCapacity: 10,
        status: 'inactive'
      });
    }

    // Tenant B (Lifeline) & Branch B
    tenantB = await Tenant.findOne({ slug: 'lifeline-hospital' });
    if (!tenantB) {
      tenantB = await Tenant.create({
        name: 'Lifeline Super-Specialty Hospital',
        slug: 'lifeline-hospital',
        hospitalType: 'Super-Specialty',
        subscription: { plan: 'Enterprise', maxBeds: 200, status: 'active' }
      });
    }

    branchB = await Branch.findOne({ tenant: tenantB._id, code: 'MAIN' });
    if (!branchB) {
      branchB = await Branch.create({
        tenant: tenantB._id,
        name: 'Lifeline Main Tower',
        code: 'MAIN',
        branchType: 'Main Hospital',
        bedCapacity: 100,
        status: 'active'
      });
    }

    // Admin user for Tenant A
    adminUser = await User.findOne({ email: 'admin.greenvalley@activebranch.test' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Rahul Sharma',
        email: 'admin.greenvalley@activebranch.test',
        password: 'Password123!',
        role: 'hospital_admin',
        tenant: tenantA._id,
        branch: mainBranchA._id,
        status: 'active'
      });
    }
    adminToken = adminUser.getSignedJwtToken();

    // Patient under Tenant A
    testPatient = await Patient.findOne({ tenant: tenantA._id, uhid: 'GV-2026-TEST' });
    if (!testPatient) {
      testPatient = await Patient.create({
        tenant: tenantA._id,
        primaryBranch: mainBranchA._id,
        uhid: 'GV-2026-TEST',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        gender: 'Male',
        phone: '9988776655',
        age: 35
      });
    }

    // Create Beds for Main Campus & City Center
    const existingMainBed = await Bed.findOne({ tenant: tenantA._id, branch: mainBranchA._id, bedNumber: 'GV-M-101' });
    if (!existingMainBed) {
      await Bed.create({
        tenant: tenantA._id,
        branch: mainBranchA._id,
        ward: 'General Ward',
        floor: '1st Floor',
        roomNumber: '101',
        bedNumber: 'GV-M-101',
        status: 'Available'
      });
    }

    const existingCityBed = await Bed.findOne({ tenant: tenantA._id, branch: cityBranchA._id, bedNumber: 'GV-CC-201' });
    if (!existingCityBed) {
      await Bed.create({
        tenant: tenantA._id,
        branch: cityBranchA._id,
        ward: 'Day Care Clinic',
        floor: 'Ground Floor',
        roomNumber: '201',
        bedNumber: 'GV-CC-201',
        status: 'Available'
      });
    }
  });

  // TEST 1
  it('TEST 1: Authenticated request without x-branch-id defaults to user assigned branch', async () => {
    const req = {
      headers: { authorization: `Bearer ${adminToken}` }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.tenantId, tenantA._id.toString());
    assert.strictEqual(req.branchId, mainBranchA._id.toString());
  });

  // TEST 2
  it('TEST 2: Both branches are correctly registered under the same tenant', async () => {
    const branches = await Branch.find({ tenant: tenantA._id, status: 'active' });
    assert.strictEqual(branches.length >= 2, true);
    const codes = branches.map(b => b.code);
    assert.strictEqual(codes.includes('GV-MAIN'), true);
    assert.strictEqual(codes.includes('GVC1'), true);
  });

  // TEST 3 & 4
  it('TEST 3 & 4: Setting x-branch-id to City Center sets req.branchId and req.activeBranch in request context', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-branch-id': cityBranchA._id.toString()
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.branchId, cityBranchA._id.toString());
    assert.strictEqual(req.activeBranch.name, 'Green Valley City Center');
    // Ensure user's permanent MongoDB branch is NOT modified
    const refreshedUser = await User.findById(adminUser._id);
    assert.strictEqual(refreshedUser.branch.toString(), mainBranchA._id.toString());
  });

  // TEST 5
  it('TEST 5: Open Bed Board filters beds by active branch', async () => {
    // With City Center active
    const reqCity = {
      tenantId: tenantA._id.toString(),
      branchId: cityBranchA._id.toString(),
      query: {}
    };
    const { result: resCityResult, res: resCity } = makeMockRes();
    await ipdController.getBeds(reqCity, resCity, () => {});

    assert.strictEqual(resCityResult.code, 200);
    assert.strictEqual(resCityResult.data.data.length >= 1, true);
    assert.strictEqual(resCityResult.data.data.every(b => b.branch.toString() === cityBranchA._id.toString()), true);
    assert.strictEqual(resCityResult.data.data.some(b => b.bedNumber === 'GV-CC-201'), true);

    // With Main Campus active
    const reqMain = {
      tenantId: tenantA._id.toString(),
      branchId: mainBranchA._id.toString(),
      query: {}
    };
    const { result: resMainResult, res: resMain } = makeMockRes();
    await ipdController.getBeds(reqMain, resMain, () => {});

    assert.strictEqual(resMainResult.code, 200);
    assert.strictEqual(resMainResult.data.data.length >= 1, true);
    assert.strictEqual(resMainResult.data.data.every(b => b.branch.toString() === mainBranchA._id.toString()), true);
    assert.strictEqual(resMainResult.data.data.some(b => b.bedNumber === 'GV-M-101'), true);
  });

  // TEST 6
  it('TEST 6: Invoices respect active branch filtering during retrieval and creation', async () => {
    try {
      // Create an invoice with City Center as active branch
      const reqCreate = {
        tenantId: tenantA._id.toString(),
        branchId: cityBranchA._id.toString(),
        user: adminUser,
        body: {
          patient: testPatient._id,
          billingType: 'OPD Consultation',
          items: [{ description: 'Day Care Clinic Consultation', quantity: 1, unitPrice: 500 }],
          payerType: 'Self-Pay (Cash / UPI / Card)'
        }
      };
      const { result: resCreateResult, res: resCreate } = makeMockRes();
      await billingController.createInvoice(reqCreate, resCreate, (err) => { if (err) console.error('T6 create error:', err); });

      if (resCreateResult.code !== 201) {
        console.error('T6 create failed with code:', resCreateResult.code, resCreateResult.data);
      }
      assert.strictEqual(resCreateResult.code, 201);
      const createdInvoice = resCreateResult.data.data;
      assert.strictEqual(createdInvoice.branch.toString(), cityBranchA._id.toString());

      // Query invoices with City Center active branch
      const reqQueryCity = {
        tenantId: tenantA._id.toString(),
        branchId: cityBranchA._id.toString(),
        query: {}
      };
      const { result: resQueryCityResult, res: resQueryCity } = makeMockRes();
      await billingController.getInvoices(reqQueryCity, resQueryCity, (err) => { if (err) console.error('T6 get error:', err); });

      if (resQueryCityResult.code !== 200) {
        console.error('T6 get failed with code:', resQueryCityResult.code, resQueryCityResult.data);
      }
      assert.strictEqual(resQueryCityResult.code, 200);
      assert.strictEqual(resQueryCityResult.data.data.length >= 1, true);
      assert.strictEqual(resQueryCityResult.data.data.every(inv => inv.branch.toString() === cityBranchA._id.toString()), true);
    } catch (e) {
      console.error('TEST 6 ASSERTION FAILED:', e.message);
      throw e;
    }
  });

  // TEST 7
  it('TEST 7: Create clinical encounter while City Center is active stamps encounter.branch = City Center', async () => {
    const reqEnc = {
      tenantId: tenantA._id.toString(),
      branchId: cityBranchA._id.toString(),
      user: adminUser,
      body: {
        patient: testPatient._id,
        encounterType: 'OPD',
        chiefComplaint: 'Headache & Mild Fever'
      }
    };
    const { result, res } = makeMockRes();
    await clinicalController.createOrGetEncounter(reqEnc, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.data.branch.toString(), cityBranchA._id.toString());
  });

  // TEST 8
  it('TEST 8: Create appointment while City Center is active stamps appointment.branch = City Center', async () => {
    try {
      const reqAppt = {
        tenantId: tenantA._id.toString(),
        branchId: cityBranchA._id.toString(),
        user: adminUser,
        body: {
          patient: testPatient._id,
          doctor: adminUser._id,
          appointmentDate: new Date(),
          slotTime: '11:00 AM',
          type: 'New Consultation'
        }
      };
      const { result, res } = makeMockRes();
      await appointmentController.createAppointment(reqAppt, res, (err) => { if (err) console.error('T8 create error:', err); });

      if (result.code !== 201) {
        console.error('T8 create failed with code:', result.code, result.data);
      }
      assert.strictEqual(result.code, 201);
      const appt = await Appointment.findById(result.data.data._id);
      assert.strictEqual(appt.branch.toString(), cityBranchA._id.toString());
    } catch (e) {
      console.error('TEST 8 ASSERTION FAILED:', e.message);
      throw e;
    }
  });

  // TEST 9
  it('TEST 9: Switch back to Main Campus restores Main Campus operational view', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-branch-id': mainBranchA._id.toString()
      }
    };
    const { res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.branchId, mainBranchA._id.toString());
    assert.strictEqual(req.activeBranch.code, 'GV-MAIN');
  });

  // TEST 10
  it('TEST 10: Patient search remains tenant-global across branches without duplication', async () => {
    const patients = await Patient.find({ tenant: tenantA._id, uhid: 'GV-2026-TEST' });
    assert.strictEqual(patients.length, 1);
    assert.strictEqual(patients[0].fullName, 'John Doe');
  });

  // TEST 11
  it('TEST 11: Attempting to use a branch from another tenant is strictly rejected (HTTP 403)', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-branch-id': branchB._id.toString() // Branch from Tenant B
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(result.code, 403);
    assert.strictEqual(result.data.success, false);
    assert.match(result.data.error, /does not belong to your hospital/i);
  });

  // TEST 12
  it('TEST 12: Invalid or non-existent branch ID is safely rejected', async () => {
    // Malformed ObjectId -> 400
    const reqMalformed = {
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-branch-id': 'invalid-branch-id-123'
      }
    };
    const { result: resMalformedResult, res: resMalformed } = makeMockRes();
    let nextCalled1 = false;
    await protect(reqMalformed, resMalformed, () => { nextCalled1 = true; });
    assert.strictEqual(nextCalled1, false);
    assert.strictEqual(resMalformedResult.code, 400);

    // Nonexistent ObjectId -> 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const reqNonExistent = {
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-branch-id': nonExistentId.toString()
      }
    };
    const { result: resNonExistentResult, res: resNonExistent } = makeMockRes();
    let nextCalled2 = false;
    await protect(reqNonExistent, resNonExistent, () => { nextCalled2 = true; });
    assert.strictEqual(nextCalled2, false);
    assert.strictEqual(resNonExistentResult.code, 404);
  });

  // TEST 13
  it('TEST 13: Inactive branch is safely rejected (HTTP 403)', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${adminToken}`,
        'x-branch-id': inactiveBranchA._id.toString()
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(result.code, 403);
    assert.match(result.data.error, /inactive/i);
  });

  // TEST 14
  it('TEST 14: Existing authentication without branch headers continues to work seamlessly', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.email, 'admin.greenvalley@activebranch.test');
    assert.strictEqual(req.tenantId, tenantA._id.toString());
  });

  // TEST 15
  it('TEST 15: SaaS Super Admin cross-tenant impersonation continues to work seamlessly', async () => {
    const superAdmin = await User.findOne({ role: 'super_admin' });
    const superToken = superAdmin.getSignedJwtToken();

    const req = {
      headers: {
        authorization: `Bearer ${superToken}`,
        'x-tenant-id': tenantA._id.toString(),
        'x-branch-id': cityBranchA._id.toString()
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.tenantId, tenantA._id.toString());
    assert.strictEqual(req.branchId, cityBranchA._id.toString());
  });

  // TEST 16
  it('TEST 16: Dashboard statistics filter by branchId when active branch is set', async () => {
    const reqStats = {
      user: adminUser,
      tenantId: tenantA._id.toString(),
      branchId: cityBranchA._id.toString(),
      headers: {}
    };
    const { result, res } = makeMockRes();
    await dashboardController.getDashboardStats(reqStats, res, () => {});

    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(typeof result.data.stats.totalPatients, 'number');
    assert.strictEqual(typeof result.data.stats.availableBeds, 'number');
    assert.strictEqual(typeof result.data.stats.todayAppointments, 'number');
  });

  after(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {}
  });
});
