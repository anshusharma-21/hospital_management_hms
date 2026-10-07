const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'subscription_capacity_test_secret_2026';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const tenantController = require('../src/controllers/tenantController');
const {
  SUBSCRIPTION_PLANS,
  normalizePlan,
  getPlanDefaultBeds
} = require('../src/constants/subscriptionPlans');

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

describe('Hospital Vision — Subscription Plan & Bed Capacity Verification Suite', () => {
  const createdTenantIds = [];

  before(async () => {
    await connectDB();
  });

  after(async () => {
    try {
      if (createdTenantIds.length > 0) {
        await Promise.allSettled([
          Tenant.deleteMany({ _id: { $in: createdTenantIds } }),
          Branch.deleteMany({ tenant: { $in: createdTenantIds } }),
          User.deleteMany({ tenant: { $in: createdTenantIds } })
        ]);
      }
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(0);
  });

  // =========================================================================
  // TEST 1: STARTER SELECTION -> NO ENUM ERROR
  // =========================================================================
  it('TEST 1: Starter selection (both canonical and legacy "Up to 30 Beds") produces no enum error and assigns default 25 beds', async () => {
    // 1A. Test with legacy onboarding string "Starter (Up to 30 Beds)"
    const slug1 = `test-starter-legacy-${Date.now()}`;
    const reqLegacy = {
      body: {
        name: 'Starter Care Clinic Legacy',
        slug: slug1,
        adminEmail: `admin.${slug1}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Starter (Up to 30 Beds)',
          status: 'active'
        },
        initialBranch: {
          name: 'Starter Clinic Main',
          code: 'MAIN',
          bedCapacity: 25
        }
      }
    };
    const { result: resLegacy, res: mockResLegacy } = makeMockRes();
    await tenantController.createTenant(reqLegacy, mockResLegacy, (err) => { throw err; });

    assert.strictEqual(resLegacy.code, 201, `Failed to create tenant with legacy starter: ${JSON.stringify(resLegacy.data)}`);
    assert.strictEqual(resLegacy.data.success, true);
    assert.strictEqual(resLegacy.data.data.tenant.subscription.plan, 'Starter (Up to 25 Beds)');
    assert.strictEqual(resLegacy.data.data.tenant.subscription.maxBeds, 25);
    createdTenantIds.push(resLegacy.data.data.tenant._id);

    // 1B. Test with canonical string "Starter (Up to 25 Beds)"
    const slug2 = `test-starter-canon-${Date.now()}`;
    const reqCanon = {
      body: {
        name: 'Starter Care Clinic Canonical',
        slug: slug2,
        adminEmail: `admin.${slug2}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Starter (Up to 25 Beds)',
          maxBeds: 25,
          status: 'active'
        },
        initialBranch: {
          name: 'Starter Clinic Main',
          code: 'MAIN',
          bedCapacity: 20
        }
      }
    };
    const { result: resCanon, res: mockResCanon } = makeMockRes();
    await tenantController.createTenant(reqCanon, mockResCanon, (err) => { throw err; });

    assert.strictEqual(resCanon.code, 201);
    assert.strictEqual(resCanon.data.success, true);
    assert.strictEqual(resCanon.data.data.tenant.subscription.plan, 'Starter (Up to 25 Beds)');
    assert.strictEqual(resCanon.data.data.tenant.subscription.maxBeds, 25);
    createdTenantIds.push(resCanon.data.data.tenant._id);
  });

  // =========================================================================
  // TEST 2: PROFESSIONAL SELECTION -> NO ENUM ERROR
  // =========================================================================
  it('TEST 2: Professional selection produces no enum error and assigns configured capacity', async () => {
    const slug = `test-prof-${Date.now()}`;
    const req = {
      body: {
        name: 'Professional Hospital Test',
        slug,
        adminEmail: `admin.${slug}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Professional (Up to 100 Beds)',
          maxBeds: 100,
          status: 'active'
        },
        initialBranch: {
          name: 'Professional Hospital Main',
          code: 'MAIN',
          bedCapacity: 80
        }
      }
    };
    const { result, res } = makeMockRes();
    await tenantController.createTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(result.data.data.tenant.subscription.plan, 'Professional (Up to 100 Beds)');
    assert.strictEqual(result.data.data.tenant.subscription.maxBeds, 100);
    createdTenantIds.push(result.data.data.tenant._id);
  });

  // =========================================================================
  // TEST 3: ENTERPRISE SELECTION -> NO ENUM ERROR
  // =========================================================================
  it('TEST 3: Enterprise selection (both "Up to 500 Beds" and "500+ Beds") produces no enum error', async () => {
    // 3A. Legacy onboarding string "Enterprise (Up to 500 Beds)"
    const slug1 = `test-ent-legacy-${Date.now()}`;
    const reqLegacy = {
      body: {
        name: 'Enterprise Medical Group Legacy',
        slug: slug1,
        adminEmail: `admin.${slug1}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Enterprise (Up to 500 Beds)',
          status: 'active'
        },
        initialBranch: {
          name: 'Enterprise Central Hospital',
          code: 'MAIN',
          bedCapacity: 300
        }
      }
    };
    const { result: resLegacy, res: mockResLegacy } = makeMockRes();
    await tenantController.createTenant(reqLegacy, mockResLegacy, (err) => { throw err; });

    assert.strictEqual(resLegacy.code, 201, `Failed to create enterprise tenant: ${JSON.stringify(resLegacy.data)}`);
    assert.strictEqual(resLegacy.data.success, true);
    assert.strictEqual(resLegacy.data.data.tenant.subscription.plan, 'Enterprise (500+ Beds)');
    assert.strictEqual(resLegacy.data.data.tenant.subscription.maxBeds, 500);
    createdTenantIds.push(resLegacy.data.data.tenant._id);

    // 3B. Canonical string "Enterprise (500+ Beds)"
    const slug2 = `test-ent-canon-${Date.now()}`;
    const reqCanon = {
      body: {
        name: 'Enterprise Medical Group Canon',
        slug: slug2,
        adminEmail: `admin.${slug2}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Enterprise (500+ Beds)',
          maxBeds: 500,
          status: 'active'
        },
        initialBranch: {
          name: 'Enterprise Central Hospital',
          code: 'MAIN',
          bedCapacity: 200
        }
      }
    };
    const { result: resCanon, res: mockResCanon } = makeMockRes();
    await tenantController.createTenant(reqCanon, mockResCanon, (err) => { throw err; });

    assert.strictEqual(resCanon.code, 201);
    assert.strictEqual(resCanon.data.success, true);
    assert.strictEqual(resCanon.data.data.tenant.subscription.plan, 'Enterprise (500+ Beds)');
    assert.strictEqual(resCanon.data.data.tenant.subscription.maxBeds, 500);
    createdTenantIds.push(resCanon.data.data.tenant._id);
  });

  // =========================================================================
  // TEST 4: PROFESSIONAL LICENSED CAPACITY = CONFIGURED PROFESSIONAL CAPACITY
  // =========================================================================
  it('TEST 4: Professional licensed capacity equals configured Professional capacity (100 beds)', async () => {
    assert.strictEqual(SUBSCRIPTION_PLANS.professional.defaultBeds, 100);
    assert.strictEqual(getPlanDefaultBeds('Professional (Up to 100 Beds)'), 100);
    assert.strictEqual(getPlanDefaultBeds('professional'), 100);

    const slug = `test-prof-quota-${Date.now()}`;
    const req = {
      body: {
        name: 'Professional Quota Hospital',
        slug,
        adminEmail: `admin.${slug}@test.com`,
        adminPassword: 'Password123!',
        subscriptionPlan: 'Professional (Up to 100 Beds)'
      }
    };
    const { result, res } = makeMockRes();
    await tenantController.createTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.data.tenant.subscription.maxBeds, 100);
    createdTenantIds.push(result.data.data.tenant._id);
  });

  // =========================================================================
  // TEST 5: ENTERPRISE LICENSED CAPACITY FOLLOWS CANONICAL CONFIGURATION (500)
  // =========================================================================
  it('TEST 5: Enterprise licensed capacity follows existing canonical Enterprise configuration (500 beds)', async () => {
    assert.strictEqual(SUBSCRIPTION_PLANS.enterprise.defaultBeds, 500);
    assert.strictEqual(getPlanDefaultBeds('Enterprise (500+ Beds)'), 500);
    assert.strictEqual(getPlanDefaultBeds('Enterprise (Up to 500 Beds)'), 500);
    assert.strictEqual(getPlanDefaultBeds('enterprise'), 500);

    const slug = `test-ent-quota-${Date.now()}`;
    const req = {
      body: {
        name: 'Enterprise Quota Hospital',
        slug,
        adminEmail: `admin.${slug}@test.com`,
        adminPassword: 'Password123!',
        subscriptionPlan: 'Enterprise (500+ Beds)'
      }
    };
    const { result, res } = makeMockRes();
    await tenantController.createTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.data.tenant.subscription.maxBeds, 500);
    createdTenantIds.push(result.data.data.tenant._id);
  });

  // =========================================================================
  // TEST 6: PROFESSIONAL + BRANCH CAPACITY 80
  // -> TENANT LICENSE REMAINS 100
  // -> BRANCH REMAINS 80
  // =========================================================================
  it('TEST 6: Professional + branch capacity 80 decouples correctly: tenant license remains 100, branch remains 80', async () => {
    const slug = `test-decouple-${Date.now()}`;
    const req = {
      body: {
        name: 'Decoupled Bed Hospital',
        slug,
        adminEmail: `admin.${slug}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Professional (Up to 100 Beds)',
          maxBeds: 100,
          status: 'active'
        },
        initialBranch: {
          name: 'Main Medical Center',
          code: 'MAIN',
          bedCapacity: 80,
          hasEmergency: true,
          hasICU: true
        }
      }
    };
    const { result, res } = makeMockRes();
    await tenantController.createTenant(req, res, (err) => { throw err; });

    assert.strictEqual(result.code, 201);
    assert.strictEqual(result.data.data.tenant.subscription.maxBeds, 100, 'tenant.subscription.maxBeds must remain 100');
    assert.strictEqual(result.data.data.branch.bedCapacity, 80, 'branch.bedCapacity must remain 80');
    createdTenantIds.push(result.data.data.tenant._id);

    // Re-verify from database directly
    const dbTenant = await Tenant.findById(result.data.data.tenant._id);
    const dbBranch = await Branch.findById(result.data.data.branch._id);

    assert.strictEqual(dbTenant.subscription.maxBeds, 100, 'Persisted tenant.subscription.maxBeds must be 100');
    assert.strictEqual(dbBranch.bedCapacity, 80, 'Persisted branch.bedCapacity must be 80');
  });

  // =========================================================================
  // TEST 7: LICENSED 100 -> BRANCH A 80 -> BRANCH B 20 -> ALLOWED
  // =========================================================================
  it('TEST 7: Licensed 100 -> Branch A 80 -> Branch B 20 -> allowed (Total = 100)', async () => {
    const slug = `test-capacity-valid-${Date.now()}`;
    const reqTenant = {
      body: {
        name: 'Valid Multi-Branch Hospital',
        slug,
        adminEmail: `admin.${slug}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Professional (Up to 100 Beds)',
          maxBeds: 100,
          maxBranches: 3,
          status: 'active'
        },
        initialBranch: {
          name: 'Branch A',
          code: 'BR-A',
          bedCapacity: 80
        }
      }
    };
    const { result: resTenant, res: mockResTenant } = makeMockRes();
    await tenantController.createTenant(reqTenant, mockResTenant, (err) => { throw err; });

    assert.strictEqual(resTenant.code, 201);
    const tenantId = resTenant.data.data.tenant._id;
    const adminUser = await User.findOne({ tenant: tenantId, role: 'hospital_admin' });
    createdTenantIds.push(tenantId);

    // Add Branch B with 20 beds (Total 80 + 20 = 100 == maxBeds 100)
    const reqBranchB = {
      params: { id: tenantId.toString() },
      user: adminUser,
      body: {
        name: 'Branch B',
        code: 'BR-B',
        branchType: 'Satellite Clinic',
        bedCapacity: 20
      }
    };
    const { result: resBranchB, res: mockResBranchB } = makeMockRes();
    await tenantController.createBranch(reqBranchB, mockResBranchB, (err) => { throw err; });

    assert.strictEqual(resBranchB.code, 201, `Branch B should be allowed: ${JSON.stringify(resBranchB.data)}`);
    assert.strictEqual(resBranchB.data.success, true);
    assert.strictEqual(resBranchB.data.data.bedCapacity, 20);
  });

  // =========================================================================
  // TEST 8: LICENSED 100 -> BRANCH A 80 -> BRANCH B 40 -> REJECTED
  // =========================================================================
  it('TEST 8: Licensed 100 -> Branch A 80 -> Branch B 40 -> rejected with HTTP 400 (Total = 120)', async () => {
    const slug = `test-capacity-exceed-${Date.now()}`;
    const reqTenant = {
      body: {
        name: 'Capacity Check Hospital',
        slug,
        adminEmail: `admin.${slug}@test.com`,
        adminPassword: 'Password123!',
        subscription: {
          plan: 'Professional (Up to 100 Beds)',
          maxBeds: 100,
          maxBranches: 3,
          status: 'active'
        },
        initialBranch: {
          name: 'Branch A',
          code: 'BR-A',
          bedCapacity: 80
        }
      }
    };
    const { result: resTenant, res: mockResTenant } = makeMockRes();
    await tenantController.createTenant(reqTenant, mockResTenant, (err) => { throw err; });

    assert.strictEqual(resTenant.code, 201);
    const tenantId = resTenant.data.data.tenant._id;
    const adminUser = await User.findOne({ tenant: tenantId, role: 'hospital_admin' });
    createdTenantIds.push(tenantId);

    // Attempt to add Branch B with 40 beds (Total 80 + 40 = 120 > maxBeds 100)
    const reqBranchB = {
      params: { id: tenantId.toString() },
      user: adminUser,
      body: {
        name: 'Branch B Exceeding',
        code: 'BR-B-EXC',
        branchType: 'Satellite Clinic',
        bedCapacity: 40
      }
    };
    const { result: resBranchB, res: mockResBranchB } = makeMockRes();
    await tenantController.createBranch(reqBranchB, mockResBranchB, (err) => { throw err; });

    assert.strictEqual(resBranchB.code, 400, 'Exceeding total bed capacity must return HTTP 400');
    assert.strictEqual(resBranchB.data.success, false);
    assert.ok(resBranchB.data.error.includes('exceeds tenant licensed capacity'), `Error message expected to mention exceeding capacity, got: ${resBranchB.data.error}`);
  });
});
