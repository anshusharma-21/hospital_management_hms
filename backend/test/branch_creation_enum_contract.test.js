const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'branch_contract_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
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

describe('Hospital Vision — Branch Creation Enum Contract & Validation Test Suite', () => {
  let greenValleyTenant;
  let greenValleyMainBranch;
  let greenValleyAdmin;
  let otherTenant;

  before(async () => {
    await connectDB();

    // 1. Setup Green Valley tenant and primary Main Campus
    greenValleyTenant = await Tenant.findOne({ slug: 'green-valley-hospital' });
    if (!greenValleyTenant) {
      greenValleyTenant = await Tenant.create({
        name: 'Green Valley Multispeciality Hospital',
        slug: 'green-valley-hospital',
        legalName: 'Green Valley Healthcare Pvt Ltd',
        hospitalType: 'Multi-Specialty',
        email: 'contact@greenvalleyhospital.com',
        phone: '9876543210',
        subscription: { plan: 'Professional (Up to 100 Beds)', maxBeds: 100, maxBranches: 10, status: 'active' }
      });
    }

    greenValleyMainBranch = await Branch.findOne({ tenant: greenValleyTenant._id, code: 'GV-MAIN' });
    if (!greenValleyMainBranch) {
      greenValleyMainBranch = await Branch.create({
        tenant: greenValleyTenant._id,
        name: 'Green Valley Main Campus',
        code: 'GV-MAIN',
        branchType: 'Main Hospital',
        bedCapacity: 100,
        hasEmergency: true,
        hasICU: true,
        hasOT: true
      });
    }

    greenValleyAdmin = await User.findOne({ tenant: greenValleyTenant._id, role: 'hospital_admin' });
    if (!greenValleyAdmin) {
      greenValleyAdmin = await User.create({
        tenant: greenValleyTenant._id,
        branch: greenValleyMainBranch._id,
        name: 'Green Valley Admin',
        email: `admin@greenvalleyhospital.com`,
        password: 'Password123!',
        role: 'hospital_admin',
        status: 'active'
      });
    }

    // Setup another tenant for isolation checks
    otherTenant = await Tenant.create({
      name: 'Independent City Clinic',
      slug: `ind-city-clinic-${Date.now()}`
    });
  });

  // =========================================================================
  // TEST 1: CREATE "Green Valley City Center" WITH CANONICAL SATELLITE CLINIC
  // =========================================================================
  let createdBranchId = null;

  it('1. Should create "Green Valley City Center" with valid canonical branchType (HTTP 201)', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: greenValleyTenant._id.toString() },
      user: greenValleyAdmin,
      body: {
        name: 'Green Valley City Center',
        code: 'GVC1',
        branchType: 'Satellite Clinic',
        phone: '9876543211',
        email: 'citycenter@greenvalleyhospital.com',
        address: {
          street: 'City Center, Green Valley',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        bedCapacity: 50,
        hasEmergency: true,
        hasICU: true
      }
    };

    let nextError = null;
    await tenantController.createBranch(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.name, 'Green Valley City Center');
    assert.strictEqual(result.data.data.code, 'GVC1');
    assert.strictEqual(result.data.data.branchType, 'Satellite Clinic');
    assert.strictEqual(result.data.data.bedCapacity, 50);
    assert.strictEqual(result.data.data.hasEmergency, true);
    assert.strictEqual(result.data.data.hasICU, true);
    assert.strictEqual(result.data.data.tenant.toString(), greenValleyTenant._id.toString());

    createdBranchId = result.data.data._id;
  });

  // =========================================================================
  // TEST 2: VERIFY PERSISTENCE ACROSS RE-FETCH
  // =========================================================================
  it('2. Should verify created branch persists on re-fetch and Main Campus remains unchanged', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: greenValleyTenant._id.toString() },
      user: greenValleyAdmin
    };

    let nextError = null;
    await tenantController.getBranches(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 200);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.count >= 2, true);

    const mainBranch = result.data.data.find(b => b.code === 'GV-MAIN');
    assert.ok(mainBranch, 'Main Campus branch must exist');
    assert.strictEqual(mainBranch.name, 'Green Valley Main Campus');
    assert.strictEqual(mainBranch.branchType, 'Main Hospital');
    assert.strictEqual(mainBranch.bedCapacity, 100);

    const cityBranch = result.data.data.find(b => b.code === 'GVC1');
    assert.ok(cityBranch, 'Newly created City Center branch must exist');
    assert.strictEqual(cityBranch.name, 'Green Valley City Center');
    assert.strictEqual(cityBranch.branchType, 'Satellite Clinic');
    assert.strictEqual(cityBranch.bedCapacity, 50);
    assert.strictEqual(cityBranch.hasEmergency, true);
    assert.strictEqual(cityBranch.hasICU, true);
  });

  // =========================================================================
  // TEST 3: LEGACY "Tertiary Care Center" NORMALIZATION TO SATELLITE CLINIC
  // =========================================================================
  it('3. Should normalize legacy/errant "Tertiary Care Center" payload to canonical "Satellite Clinic"', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: greenValleyTenant._id.toString() },
      user: greenValleyAdmin,
      body: {
        name: 'Green Valley North Annex',
        code: 'GVN1',
        branchType: 'Tertiary Care Center', // legacy errant default from old form state
        phone: '9876543219',
        email: 'northannex@greenvalleyhospital.com',
        bedCapacity: 30,
        hasEmergency: false,
        hasICU: false
      }
    };

    let nextError = null;
    await tenantController.createBranch(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.branchType, 'Satellite Clinic');
  });

  // =========================================================================
  // TEST 4: DERIVE DEFAULT branchType WHEN OMITTED
  // =========================================================================
  it('4. Should safely derive "Satellite Clinic" when branchType is omitted and Main Hospital exists', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: greenValleyTenant._id.toString() },
      user: greenValleyAdmin,
      body: {
        name: 'Green Valley South OPD Hub',
        code: 'GVS1',
        // branchType omitted completely
        bedCapacity: 25
      }
    };

    let nextError = null;
    await tenantController.createBranch(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.data.branchType, 'Satellite Clinic');
  });

  // =========================================================================
  // TEST 5: REJECT EXPLICIT INVALID branchType WITH HTTP 400
  // =========================================================================
  it('5. Should cleanly reject invalid branchType with HTTP 400 before MongoDB is reached', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: greenValleyTenant._id.toString() },
      user: greenValleyAdmin,
      body: {
        name: 'Invalid Type Branch',
        code: 'INVAL1',
        branchType: 'RandomNonExistentType',
        bedCapacity: 10
      }
    };

    let nextError = null;
    await tenantController.createBranch(req, res, (err) => { nextError = err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('is not a valid branch type'));

    // Verify it was NOT saved to MongoDB
    const notSaved = await Branch.findOne({ code: 'INVAL1' });
    assert.strictEqual(notSaved, null);
  });

  // =========================================================================
  // TEST 6: REJECT DUPLICATE BRANCH CODE WITHIN TENANT
  // =========================================================================
  it('6. Should reject duplicate branch code within the same hospital tenant with HTTP 400', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: greenValleyTenant._id.toString() },
      user: greenValleyAdmin,
      body: {
        name: 'Duplicate Code Branch',
        code: 'GVC1', // Already exists in Green Valley
        bedCapacity: 20
      }
    };

    let nextError = null;
    await tenantController.createBranch(req, res, (err) => { nextError = err; });

    assert.strictEqual(result.code, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.error.includes('already exists for this hospital'));
  });

  // =========================================================================
  // TEST 7: TENANT ISOLATION OF BRANCHES
  // =========================================================================
  it('7. Should enforce tenant isolation on branches', async () => {
    const { result, res } = makeMockRes();

    const req = {
      params: { id: otherTenant._id.toString() }
    };

    let nextError = null;
    await tenantController.getBranches(req, res, (err) => { nextError = err; });

    assert.strictEqual(nextError, null);
    assert.strictEqual(result.code, 200);
    // Other tenant should not see any Green Valley branches
    const hasGreenValley = result.data.data.some(b => b.code === 'GVC1' || b.code === 'GV-MAIN');
    assert.strictEqual(hasGreenValley, false);
  });

  after(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(0);
  });
});
