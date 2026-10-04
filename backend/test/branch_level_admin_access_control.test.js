const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'branch_access_control_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Bed = require('../src/models/Bed');
const Invoice = require('../src/models/Invoice');

const { protect } = require('../src/middleware/authMiddleware');
const tenantController = require('../src/controllers/tenantController');
const billingController = require('../src/controllers/billingController');
const appointmentController = require('../src/controllers/appointmentController');
const ipdController = require('../src/controllers/ipdController');

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

describe('Hospital Vision — Branch-Level Admin & Access Control Test Suite', () => {
  let apcTenant;
  let blrBranch;
  let bkrBranch;
  let otherTenant;
  let otherBranch;

  let hospitalAdminUser;
  let hospitalAdminToken;

  let blrBranchAdmin;
  let blrAdminToken;

  let bkrBranchAdmin;
  let bkrAdminToken;

  let blrStaffNurse;
  let blrNurseToken;

  let testPatient;
  let bkrInvoice;
  let bkrAppointment;
  let bkrBed;

  before(async () => {
    try {
      await connectDB();

    // Clean existing test entities if any to avoid dirty state
    await User.deleteMany({ email: { $in: ['admin@apchealthcare.com', 'blr.admin@apchealthcare.com', 'bkr.admin@apchealthcare.com', 'blr.nurse@apchealthcare.com'] } });
    await Branch.deleteMany({ code: { $in: ['APC-BLR', 'APC-BKR', 'MTR-1', 'APC-KOR'] } });
    await Tenant.deleteMany({ slug: { $in: ['apc-healthcare', 'metro-health'] } });

    // 1. Setup APC Healthcare Tenant
    apcTenant = await Tenant.create({
      name: 'APC Healthcare',
      slug: 'apc-healthcare',
      legalName: 'APC Healthcare Enterprises Pvt Ltd',
      hospitalType: 'Multi-Specialty',
      email: 'admin@apchealthcare.com',
      phone: '9888812345',
      subscription: {
        plan: 'Professional',
        maxBranches: 3,
        maxBeds: 250,
        status: 'active'
      }
    });

    // 2. Setup Bengaluru Branch
    blrBranch = await Branch.create({
      tenant: apcTenant._id,
      name: 'Bengaluru Branch',
      code: 'APC-BLR',
      branchType: 'Main Hospital',
      bedCapacity: 120,
      hasEmergency: true,
      address: { street: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' }
    });

    // 3. Setup Bokaro Branch
    bkrBranch = await Branch.create({
      tenant: apcTenant._id,
      name: 'Bokaro Branch',
      code: 'APC-BKR',
      branchType: 'Satellite Clinic',
      bedCapacity: 60,
      hasEmergency: false,
      address: { street: 'Sector 4', city: 'Bokaro', state: 'Jharkhand', pincode: '827004' }
    });

    // 4. Setup Other Tenant & Branch
    otherTenant = await Tenant.create({
      name: 'Metro Health Care',
      slug: 'metro-health',
      legalName: 'Metro Health Pvt Ltd',
      hospitalType: 'General Hospital',
      email: 'info@metrohealth.com',
      phone: '9777712345',
      subscription: { plan: 'Basic', maxBranches: 2, maxBeds: 50, status: 'active' }
    });

    otherBranch = await Branch.create({
      tenant: otherTenant._id,
      name: 'Metro City Center',
      code: 'MTR-1',
      branchType: 'Satellite Clinic',
      bedCapacity: 50,
      address: { street: 'Main Rd', city: 'Pune', state: 'Maharashtra', pincode: '411001' }
    });

    // 5. Setup Users
    // Hospital Admin (Org-level)
    hospitalAdminUser = await User.findOne({ email: 'admin@apchealthcare.com' });
    if (!hospitalAdminUser) {
      hospitalAdminUser = await User.create({
        tenant: apcTenant._id,
        branch: blrBranch._id,
        name: 'Hospital Admin Owner',
        email: 'admin@apchealthcare.com',
        password: 'Password123!',
        role: 'hospital_admin',
        status: 'active'
      });
    }
    hospitalAdminToken = hospitalAdminUser.getSignedJwtToken();

    // Bengaluru Branch Admin
    blrBranchAdmin = await User.findOne({ email: 'blr.admin@apchealthcare.com' });
    if (!blrBranchAdmin) {
      blrBranchAdmin = await User.create({
        tenant: apcTenant._id,
        branch: blrBranch._id,
        name: 'Bengaluru Branch Administrator',
        email: 'blr.admin@apchealthcare.com',
        password: 'Password123!',
        role: 'branch_admin',
        status: 'active'
      });
    }
    blrAdminToken = blrBranchAdmin.getSignedJwtToken();

    // Bokaro Branch Admin
    bkrBranchAdmin = await User.findOne({ email: 'bkr.admin@apchealthcare.com' });
    if (!bkrBranchAdmin) {
      bkrBranchAdmin = await User.create({
        tenant: apcTenant._id,
        branch: bkrBranch._id,
        name: 'Bokaro Branch Administrator',
        email: 'bkr.admin@apchealthcare.com',
        password: 'Password123!',
        role: 'branch_admin',
        status: 'active'
      });
    }
    bkrAdminToken = bkrBranchAdmin.getSignedJwtToken();

    // Bengaluru Staff Nurse
    blrStaffNurse = await User.findOne({ email: 'blr.nurse@apchealthcare.com' });
    if (!blrStaffNurse) {
      blrStaffNurse = await User.create({
        tenant: apcTenant._id,
        branch: blrBranch._id,
        name: 'Nurse Priya (Bengaluru)',
        email: 'blr.nurse@apchealthcare.com',
        password: 'Password123!',
        role: 'nurse',
        status: 'active'
      });
    }
    blrNurseToken = blrStaffNurse.getSignedJwtToken();

    // 6. Setup Global Patient & Bokaro Operational Data
    testPatient = await Patient.findOne({ tenant: apcTenant._id, uhid: 'APC-P-001' });
    if (!testPatient) {
      testPatient = await Patient.create({
        tenant: apcTenant._id,
        uhid: 'APC-P-001',
        firstName: 'Suresh',
        lastName: 'Kumar',
        phone: '9898989898',
        gender: 'Male',
        dateOfBirth: new Date('1985-05-15'),
        bloodGroup: 'B+'
      });
    }

    // Bokaro Invoice
    bkrInvoice = await Invoice.findOne({ tenant: apcTenant._id, branch: bkrBranch._id });
    if (!bkrInvoice) {
      bkrInvoice = await Invoice.create({
        tenant: apcTenant._id,
        branch: bkrBranch._id,
        patient: testPatient._id,
        invoiceNumber: 'INV-BKR-001',
        billingType: 'OPD Consultation',
        items: [{
          description: 'Consultation',
          department: 'General Medicine',
          quantity: 1,
          unitPrice: 500,
          taxPercent: 0,
          totalAmount: 500
        }],
        subtotal: 500,
        totalDiscount: 0,
        totalTax: 0,
        grandTotal: 500,
        paidAmount: 0,
        balanceDue: 500,
        status: 'Finalized'
      });
    }

    // Bokaro Appointment
    bkrAppointment = await Appointment.findOne({ tenant: apcTenant._id, branch: bkrBranch._id });
    if (!bkrAppointment) {
      bkrAppointment = await Appointment.create({
        tenant: apcTenant._id,
        branch: bkrBranch._id,
        patient: testPatient._id,
        doctor: hospitalAdminUser._id,
        appointmentNumber: 'APT-BKR-001',
        appointmentDate: new Date(),
        slotTime: '10:00 AM',
        tokenNumber: 1,
        timeSlot: { start: '10:00', end: '10:15' },
        status: 'Scheduled',
        consultationFee: 500
      });
    }

    // Bokaro Bed
    bkrBed = await Bed.findOne({ tenant: apcTenant._id, branch: bkrBranch._id });
    if (!bkrBed) {
      bkrBed = await Bed.create({
        tenant: apcTenant._id,
        branch: bkrBranch._id,
        bedNumber: 'BKR-BED-101',
        ward: 'General Ward',
        roomNumber: 'GW-1',
        floor: '1st Floor',
        bedType: 'Standard General',
        status: 'Available',
        ratePerDay: 800
      });
    }
    } catch (err) {
      console.error('SETUP ERROR OCCURRED:', err);
      throw err;
    }
  });

  // TEST 1 — Hospital Admin
  it('TEST 1: Hospital Admin has org-wide access across Bengaluru & Bokaro branches and can switch freely', async () => {
    // 1. Hospital Admin without x-branch-id defaults to assigned branch
    const req1 = {
      headers: { authorization: `Bearer ${hospitalAdminToken}` },
      get: (h) => (h.toLowerCase() === 'authorization' ? `Bearer ${hospitalAdminToken}` : null)
    };
    const { res: res1 } = makeMockRes();
    let nextCalled1 = false;
    await protect(req1, res1, () => { nextCalled1 = true; });
    assert.strictEqual(nextCalled1, true);
    assert.strictEqual(req1.tenantId.toString(), apcTenant._id.toString());

    // 2. Hospital Admin sends x-branch-id for Bokaro branch -> switch successful
    const req2 = {
      headers: {
        authorization: `Bearer ${hospitalAdminToken}`,
        'x-branch-id': bkrBranch._id.toString()
      },
      get: (h) => {
        if (h.toLowerCase() === 'authorization') return `Bearer ${hospitalAdminToken}`;
        if (h.toLowerCase() === 'x-branch-id') return bkrBranch._id.toString();
        return null;
      }
    };
    const { res: res2 } = makeMockRes();
    let nextCalled2 = false;
    await protect(req2, res2, () => { nextCalled2 = true; });
    assert.strictEqual(nextCalled2, true);
    assert.strictEqual(req2.branchId.toString(), bkrBranch._id.toString());
    assert.strictEqual(req2.activeBranch.code, 'APC-BKR');

    // 3. Hospital Admin lists branches of APC Healthcare
    const reqBranches = {
      params: { id: apcTenant._id.toString() },
      user: hospitalAdminUser,
      tenantId: apcTenant._id
    };
    const { result: resB, res: mockResB } = makeMockRes();
    await tenantController.getBranches(reqBranches, mockResB, (err) => { throw err; });
    assert.strictEqual(resB.code, 200);
    assert.strictEqual(resB.data.success, true);
    const codes = resB.data.data.map(b => b.code);
    assert.ok(codes.includes('APC-BLR'), 'Should include Bengaluru branch');
    assert.ok(codes.includes('APC-BKR'), 'Should include Bokaro branch');
  });

  // TEST 2 — Bengaluru Branch Admin
  it('TEST 2: Bengaluru Branch Admin is strictly scoped to Bengaluru branch and cannot access Bokaro', async () => {
    const req = {
      headers: { authorization: `Bearer ${blrAdminToken}` },
      get: (h) => (h.toLowerCase() === 'authorization' ? `Bearer ${blrAdminToken}` : null)
    };
    const { res } = makeMockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.branchId.toString(), blrBranch._id.toString());
    assert.strictEqual(req.user.role, 'branch_admin');
  });

  // TEST 3 — Bokaro Branch Admin
  it('TEST 3: Bokaro Branch Admin is strictly scoped to Bokaro branch and cannot access Bengaluru', async () => {
    const req = {
      headers: { authorization: `Bearer ${bkrAdminToken}` },
      get: (h) => (h.toLowerCase() === 'authorization' ? `Bearer ${bkrAdminToken}` : null)
    };
    const { res } = makeMockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.branchId.toString(), bkrBranch._id.toString());
    assert.strictEqual(req.user.role, 'branch_admin');
  });

  // TEST 4 — x-branch-id attack
  it('TEST 4: x-branch-id attack — Bengaluru Branch Admin sending Bokaro x-branch-id is strictly rejected with HTTP 403', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${blrAdminToken}`,
        'x-branch-id': bkrBranch._id.toString()
      },
      get: (h) => {
        if (h.toLowerCase() === 'authorization') return `Bearer ${blrAdminToken}`;
        if (h.toLowerCase() === 'x-branch-id') return bkrBranch._id.toString();
        return null;
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Next should NOT be called on branch ID spoofing attempt');
    assert.strictEqual(result.code, 403);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('Access denied'));
  });

  // TEST 5 — Direct resource attack (IDOR)
  it('TEST 5: Direct resource attack — Bengaluru Branch Admin accessing Bokaro invoice/appointment/bed by ID is rejected with HTTP 403', async () => {
    // 5A: Access Bokaro Invoice directly by ID
    const reqInv = {
      params: { id: bkrInvoice._id.toString() },
      tenantId: apcTenant._id,
      branchId: blrBranch._id,
      user: blrBranchAdmin
    };
    const { result: resInv, res: mockResInv } = makeMockRes();
    await billingController.getInvoiceById(reqInv, mockResInv, (err) => { throw err; });
    assert.strictEqual(resInv.code, 403, 'Should reject direct invoice access from another branch with 403');
    assert.strictEqual(resInv.data.success, false);

    // 5B: Update Bokaro Appointment status directly by ID
    const reqApt = {
      params: { id: bkrAppointment._id.toString() },
      body: { status: 'In-Consultation' },
      tenantId: apcTenant._id,
      branchId: blrBranch._id,
      user: blrBranchAdmin
    };
    const { result: resApt, res: mockResApt } = makeMockRes();
    await appointmentController.updateAppointmentStatus(reqApt, mockResApt, (err) => { throw err; });
    assert.strictEqual(resApt.code, 403, 'Should reject direct appointment update from another branch with 403');

    // 5C: Update Bokaro Bed status directly by ID
    const reqBed = {
      params: { id: bkrBed._id.toString() },
      body: { status: 'Maintenance' },
      tenantId: apcTenant._id,
      branchId: blrBranch._id,
      user: blrBranchAdmin
    };
    const { result: resBed, res: mockResBed } = makeMockRes();
    await ipdController.updateBedStatus(reqBed, mockResBed, (err) => { throw err; });
    assert.strictEqual(resBed.code, 403, 'Should reject direct bed status update from another branch with 403');
  });

  // TEST 6 — Branch creation attack
  it('TEST 6: Branch creation attack — Branch Admin calling branch creation endpoint is strictly rejected with HTTP 403', async () => {
    const req = {
      params: { id: apcTenant._id.toString() },
      body: {
        name: 'Unauthorized Malicious Branch',
        code: 'MAL-01',
        branchType: 'Satellite Clinic',
        city: 'Kolkata'
      },
      user: blrBranchAdmin,
      tenantId: apcTenant._id
    };
    const { result, res } = makeMockRes();
    await tenantController.createBranch(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 403);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('not authorized to create or manage branches'));
  });

  // TEST 7 — Hospital Admin branch creation & subscription limit
  it('TEST 7: Hospital Admin creates a branch successfully within limit, and subscription limit is strictly enforced', async () => {
    // Current branches under APC Healthcare: 2 (Bengaluru, Bokaro). Max allowed: 3.
    // 7A: Create 3rd branch within limit
    const reqCreate = {
      params: { id: apcTenant._id.toString() },
      body: {
        name: 'Ranchi Speciality Branch',
        code: 'APC-RNC',
        branchType: 'Diagnostic Center',
        city: 'Ranchi',
        state: 'Jharkhand',
        pincode: '834001',
        bedCapacity: 40
      },
      user: hospitalAdminUser,
      tenantId: apcTenant._id
    };
    const { result: resCreate, res: mockResCreate } = makeMockRes();
    await tenantController.createBranch(reqCreate, mockResCreate, (err) => { throw err; });

    assert.strictEqual(resCreate.code, 201);
    assert.strictEqual(resCreate.data.success, true);
    assert.strictEqual(resCreate.data.data.code, 'APC-RNC');

    // 7B: Attempt to create 4th branch (exceeding maxBranches: 3)
    const reqExceed = {
      params: { id: apcTenant._id.toString() },
      body: {
        name: 'Patna Super Branch',
        code: 'APC-PAT',
        branchType: 'Satellite Clinic',
        city: 'Patna'
      },
      user: hospitalAdminUser,
      tenantId: apcTenant._id
    };
    const { result: resExceed, res: mockResExceed } = makeMockRes();
    await tenantController.createBranch(reqExceed, mockResExceed, (err) => { throw err; });

    assert.strictEqual(resExceed.code, 400);
    assert.strictEqual(resExceed.data.success, false);
    assert.ok(resExceed.data.error.includes('subscription limit'));
  });

  // TEST 8 — Staff branch assignment
  it('TEST 8: Hospital Admin assigns a new staff member to Bengaluru branch correctly', async () => {
    const req = {
      params: { id: apcTenant._id.toString() },
      body: {
        name: 'Dr. Neha Sen (Bengaluru OPD)',
        email: 'dr.neha.blr@apchealthcare.com',
        phone: '9888877766',
        password: 'Password123!',
        role: 'doctor',
        branch: blrBranch._id.toString(),
        doctorProfile: {
          specialty: 'Pediatrics',
          consultationFee: 700,
          opdRoom: 'OPD-105'
        }
      },
      user: hospitalAdminUser,
      tenantId: apcTenant._id
    };
    const { result, res } = makeMockRes();
    await tenantController.createTenantUser(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.branch.toString(), blrBranch._id.toString());
  });

  // TEST 9 — Cross-tenant branch assignment
  it('TEST 9: Attempting to assign an APC Healthcare user to a branch belonging to another tenant is strictly rejected', async () => {
    const req = {
      params: { id: apcTenant._id.toString() },
      body: {
        name: 'Hacker Staff',
        email: 'hacker.staff@apchealthcare.com',
        password: 'Password123!',
        role: 'receptionist',
        branch: otherBranch._id.toString() // From otherTenant!
      },
      user: hospitalAdminUser,
      tenantId: apcTenant._id
    };
    const { result, res } = makeMockRes();
    await tenantController.createTenantUser(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('does not belong to this hospital organization'));
  });

  // TEST 10 — Normal branch-scoped staff
  it('TEST 10: Normal branch-scoped nurse attempting to spoof x-branch-id to another branch is strictly denied (HTTP 403)', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${blrNurseToken}`,
        'x-branch-id': bkrBranch._id.toString()
      },
      get: (h) => {
        if (h.toLowerCase() === 'authorization') return `Bearer ${blrNurseToken}`;
        if (h.toLowerCase() === 'x-branch-id') return bkrBranch._id.toString();
        return null;
      }
    };
    const { result, res } = makeMockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Branch staff must NOT bypass assigned branch');
    assert.strictEqual(result.code, 403);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('Access denied'));
  });
});
