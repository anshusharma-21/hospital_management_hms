const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'branch_hierarchy_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Invoice = require('../src/models/Invoice');
const Bed = require('../src/models/Bed');

const { protect } = require('../src/middleware/authMiddleware');
const appointmentController = require('../src/controllers/appointmentController');
const patientController = require('../src/controllers/patientController');
const tenantController = require('../src/controllers/tenantController');
const billingController = require('../src/controllers/billingController');
const ipdController = require('../src/controllers/ipdController');

const makeMockRes = () => {
  const result = { code: 200, data: null, headers: {} };
  const res = {
    setHeader: (k, v) => { result.headers[k] = v; },
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

describe('Hospital Vision — Branch Hierarchy & Data Isolation Test Suite', () => {
  let tenant;
  let mainBranch;
  let subBranch;
  let mainUser;
  let mainToken;
  let subUser;
  let subToken;
  let testPatientMain;
  let testPatientSub;
  let doctorUser;

  before(async () => {
    await connectDB();

    // 1. Create Tenant
    tenant = await Tenant.create({
      name: 'Apollo Apex Health',
      slug: 'apollo-apex-' + Date.now(),
      status: 'active'
    });

    // 2. Create Main Branch
    mainBranch = await Branch.create({
      tenant: tenant._id,
      name: 'Apollo Apex Main Campus',
      code: 'AP-MAIN',
      branchType: 'Main Hospital',
      isMain: true,
      bedCapacity: 100,
      status: 'active'
    });

    // 3. Create Sub-Branch
    subBranch = await Branch.create({
      tenant: tenant._id,
      name: 'Apollo Apex Satellite Center',
      code: 'AP-SAT1',
      branchType: 'Satellite Clinic',
      isMain: false,
      parentBranch: mainBranch._id,
      bedCapacity: 20,
      status: 'active'
    });

    // 4. Create Doctor
    doctorUser = await User.create({
      name: 'Dr. Test Clinician',
      email: 'dr.test.' + Date.now() + '@apex.com',
      password: 'Password123!',
      role: 'doctor',
      tenant: tenant._id,
      branch: mainBranch._id,
      doctorProfile: { consultationFee: 800 }
    });

    // 5. Create Main Branch Staff (Receptionist)
    mainUser = await User.create({
      name: 'Pooja Main FrontDesk',
      email: 'pooja.main.' + Date.now() + '@apex.com',
      password: 'Password123!',
      role: 'receptionist',
      tenant: tenant._id,
      branch: mainBranch._id,
      status: 'active'
    });
    mainToken = jwt.sign({ id: mainUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 6. Create Sub-Branch Staff (Receptionist)
    subUser = await User.create({
      name: 'Ramesh SubFrontDesk',
      email: 'ramesh.sub.' + Date.now() + '@apex.com',
      password: 'Password123!',
      role: 'receptionist',
      tenant: tenant._id,
      branch: subBranch._id,
      status: 'active'
    });
    subToken = jwt.sign({ id: subUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 7. Create Patient in Main Branch
    testPatientMain = await Patient.create({
      tenant: tenant._id,
      primaryBranch: mainBranch._id,
      uhid: 'AP-MAIN-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '9988776655',
      gender: 'Male'
    });

    // 8. Create Patient in Sub-Branch
    testPatientSub = await Patient.create({
      tenant: tenant._id,
      primaryBranch: subBranch._id,
      uhid: 'AP-SUB-001',
      firstName: 'Meera',
      lastName: 'Iyer',
      phone: '9988776644',
      gender: 'Female'
    });
  });

  after(async () => {
    await Tenant.deleteMany({ _id: tenant._id });
    await Branch.deleteMany({ tenant: tenant._id });
    await User.deleteMany({ tenant: tenant._id });
    await Patient.deleteMany({ tenant: tenant._id });
    await Appointment.deleteMany({ tenant: tenant._id });
    await Invoice.deleteMany({ tenant: tenant._id });
    await Bed.deleteMany({ tenant: tenant._id });
  });

  // TEST 1: Main branch is correctly flagged isMain
  it('TEST 1: Main branch is recognized as isMain=true and sub-branch as isMain=false', async () => {
    const mb = await Branch.findById(mainBranch._id);
    const sb = await Branch.findById(subBranch._id);

    assert.strictEqual(mb.isMain, true);
    assert.strictEqual(sb.isMain, false);
    assert.strictEqual(sb.parentBranch.toString(), mainBranch._id.toString());
  });

  // TEST 2: Main branch user can switch to sub-branch ("wo branches m v ja skta")
  it('TEST 2: Main branch user can switch active branch context into sub-branch', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${mainToken}`,
        'x-branch-id': subBranch._id.toString()
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.branchId, subBranch._id.toString());
    assert.strictEqual(req.isSubBranch, true);
    assert.strictEqual(req.isUserFromMainBranch, true);
  });

  // TEST 3: Main branch user booking appointment works seamlessly on Main branch
  it('TEST 3: Main branch user can book appointment on Main branch without error', async () => {
    const req = {
      tenantId: tenant._id.toString(),
      branchId: mainBranch._id.toString(),
      user: mainUser,
      body: {
        patient: testPatientMain._id,
        doctor: doctorUser._id,
        appointmentDate: new Date(),
        slotTime: '10:00 AM',
        type: 'New Consultation',
        priority: 'Normal',
        consultationFee: 700
      }
    };
    const { result, res } = makeMockRes();
    await appointmentController.createAppointment(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.branch.toString(), mainBranch._id.toString());
  });

  // TEST 4: Main branch user booking appointment works seamlessly on Sub-branch
  it('TEST 4: Main branch user can book appointment on Sub-branch without error', async () => {
    const req = {
      tenantId: tenant._id.toString(),
      branchId: subBranch._id.toString(),
      user: mainUser,
      body: {
        patient: testPatientSub._id,
        doctor: doctorUser._id,
        appointmentDate: new Date(),
        slotTime: '11:00 AM',
        type: 'New Consultation',
        priority: 'Normal',
        consultationFee: 700
      }
    };
    const { result, res } = makeMockRes();
    await appointmentController.createAppointment(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.branch.toString(), subBranch._id.toString());
  });

  // TEST 5: Sub-branch user CANNOT access Main branch (403 Forbidden)
  it('TEST 5: Sub-branch user attempting to access Main branch is rejected with HTTP 403', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${subToken}`,
        'x-branch-id': mainBranch._id.toString()
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(result.code, 403);
    assert.match(result.data.error, /Sub-branch staff cannot access main branch/i);
  });

  // TEST 6: Sub-branch user only sees sub-branch in getBranches list
  it('TEST 6: Sub-branch user calling getBranches only sees their assigned branch, main is hidden', async () => {
    const req = {
      params: { id: tenant._id.toString() },
      user: subUser,
      isUserFromMainBranch: false
    };
    const { result, res } = makeMockRes();
    await tenantController.getBranches(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.count, 1);
    assert.strictEqual(result.data.data[0]._id.toString(), subBranch._id.toString());
    assert.strictEqual(result.data.data.some(b => b._id.toString() === mainBranch._id.toString()), false);
  });

  // TEST 7: Sub-branch user CANNOT see Main branch appointments ("wo main k kux data nhi dekh skte")
  it('TEST 7: Sub-branch user calling getAppointments only sees sub-branch appointments', async () => {
    const req = {
      tenantId: tenant._id.toString(),
      branchId: subBranch._id.toString(),
      isSubBranch: true,
      query: {}
    };
    const { result, res } = makeMockRes();
    await appointmentController.getAppointments(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.data.length >= 1, true);
    assert.strictEqual(result.data.data.every(a => a.branch._id.toString() === subBranch._id.toString()), true);
  });

  // TEST 8: Sub-branch user CANNOT see Main branch patients
  it('TEST 8: Sub-branch user calling getPatients only sees patients registered in sub-branch', async () => {
    const req = {
      tenantId: tenant._id.toString(),
      branchId: subBranch._id.toString(),
      isSubBranch: true,
      query: {}
    };
    const { result, res } = makeMockRes();
    await patientController.getPatients(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.data.length, 1);
    assert.strictEqual(result.data.data[0].fullName, 'Meera Iyer');
    assert.strictEqual(result.data.data.some(p => p.fullName === 'Aarav Sharma'), false);
  });

  // TEST 9: Sub-branch staff CANNOT create new branches (HTTP 403)
  it('TEST 9: Sub-branch user attempting to create a branch is rejected with HTTP 403', async () => {
    const req = {
      params: { id: tenant._id.toString() },
      user: subUser,
      isUserFromMainBranch: false,
      body: {
        name: 'Illegal Sub-Branch by Sub-Staff',
        code: 'ILLEGAL-1',
        branchType: 'Diagnostic Center'
      }
    };
    const { result, res } = makeMockRes();
    await tenantController.createBranch(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 403);
    assert.match(result.data.error, /Only the Main Branch administration can create or configure sub-branches/i);
  });

  // TEST 10: Main branch user CAN create new sub-branches
  it('TEST 10: Main branch user can create new sub-branches with parentBranch linkage', async () => {
    const req = {
      params: { id: tenant._id.toString() },
      user: mainUser,
      isUserFromMainBranch: true,
      body: {
        name: 'Apollo Apex Diagnostic Center',
        code: 'AP-DIAG1',
        branchType: 'Diagnostic Center'
      }
    };
    const { result, res } = makeMockRes();
    await tenantController.createBranch(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.isMain, false);
    assert.strictEqual(result.data.data.parentBranch.toString(), mainBranch._id.toString());
  });
});
