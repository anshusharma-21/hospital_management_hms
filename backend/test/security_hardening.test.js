const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Ensure test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_hardening_suite_2026';

const connectDB = require('../src/config/db');
const { getJwtSecret, getJwtExpire } = require('../src/config/jwt');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const AuditLog = require('../src/models/AuditLog');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const Patient = require('../src/models/Patient');
const { protect } = require('../src/middleware/authMiddleware');
const billingController = require('../src/controllers/billingController');

describe('Hospital Vision Security Hardening Suite', () => {
  let sharedTenant;
  let sharedBranch;

  before(async () => {
    await connectDB();
    await Payment.init();

    sharedTenant = await Tenant.create({
      name: 'Hardening Test Hospital',
      slug: `hosp-test-${Date.now()}`
    });

    sharedBranch = await Branch.create({
      tenant: sharedTenant._id,
      name: 'Main Facility',
      code: `BR-${Date.now()}`
    });
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } catch (_) {}
    setTimeout(() => process.exit(0), 100);
  });

  describe('1. JWT Secret Security & Production Protection', () => {
    it('should throw fatal error in production when JWT_SECRET is unset or empty', () => {
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;

        assert.throws(
          () => getJwtSecret(),
          /JWT_SECRET must be explicitly defined in production/i,
          'getJwtSecret should throw when JWT_SECRET is missing in production'
        );
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it('should throw fatal error in production if placeholder dev secret is provided', () => {
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'hospital_vision_dev_jwt_secret_only_local_2026';

        assert.throws(
          () => getJwtSecret(),
          /JWT_SECRET must be explicitly defined in production/i,
          'getJwtSecret should throw when dev placeholder is used in production'
        );
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it('should return configured secret in production when valid', () => {
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'production_strong_super_secret_998877';

        const secret = getJwtSecret();
        assert.strictEqual(secret, 'production_strong_super_secret_998877');
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it('should use dev fallback in development/test when JWT_SECRET is empty', () => {
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'development';
        delete process.env.JWT_SECRET;

        const secret = getJwtSecret();
        assert.strictEqual(secret, 'hospital_vision_dev_jwt_secret_only_local_2026');
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it('User model should sign token that validates with getJwtSecret()', async () => {
      const testUser = new User({
        name: 'Dr. Hardening Test',
        email: `doc_test_${Date.now()}@hospitalvision.com`,
        password: 'Password123!',
        role: 'doctor'
      });
      const token = testUser.getSignedJwtToken();
      assert.ok(token, 'Token was generated');

      const decoded = jwt.verify(token, getJwtSecret());
      assert.strictEqual(decoded.id.toString(), testUser._id.toString());
      assert.strictEqual(decoded.role, 'doctor');
    });
  });

  describe('2. Super Admin Cross-Tenant Access Audit Logging', () => {
    it('should log an AuditLog entry when a super_admin / saas_admin passes x-tenant-id for another tenant', async () => {
      const targetTenant = await Tenant.create({
        name: 'Target Hospital Branch B',
        slug: `target-hosp-${Date.now()}`
      });

      const adminUser = await User.create({
        name: 'SaaS Platform Admin',
        email: `saas_admin_${Date.now()}@hospitalvision.com`,
        password: 'AdminPassword123!',
        role: 'saas_admin',
        tenant: sharedTenant._id,
        status: 'active'
      });

      const token = adminUser.getSignedJwtToken();

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
          'x-tenant-id': targetTenant._id.toString(),
          'x-forwarded-for': '192.168.1.100'
        },
        method: 'GET',
        originalUrl: '/api/v1/patients'
      };

      const res = {
        status: (code) => ({
          json: (data) => ({ statusCode: code, data })
        })
      };

      let nextCalled = false;
      await protect(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, 'Next middleware should have been called');
      assert.strictEqual(req.tenantId, targetTenant._id.toString(), 'Tenant ID should be switched to target tenant');
      assert.strictEqual(req.isCrossTenantAccess, true, 'isCrossTenantAccess flag should be true');

      // Wait a moment for async audit log insertion
      await new Promise(r => setTimeout(r, 200));

      const log = await AuditLog.findOne({
        user: adminUser._id,
        action: 'Super Admin Cross-Tenant Access',
        entityId: targetTenant._id.toString()
      });

      assert.ok(log, 'Audit log entry must exist for cross-tenant access');
      assert.strictEqual(log.module, 'SaaS Platform');
      assert.strictEqual(log.ipAddress, '192.168.1.100');
      assert.ok(log.details.includes('/api/v1/patients'), 'Details should include request path');
    });

    it('should NOT create cross-tenant audit log when request is within same tenant', async () => {
      const regularUser = await User.create({
        name: 'Regular Receptionist',
        email: `reception_${Date.now()}@hospitalvision.com`,
        password: 'ReceptionPassword123!',
        role: 'receptionist',
        tenant: sharedTenant._id,
        status: 'active'
      });

      const token = regularUser.getSignedJwtToken();

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        },
        method: 'GET',
        originalUrl: '/api/v1/patients'
      };

      const res = {
        status: (code) => ({
          json: (data) => ({ statusCode: code, data })
        })
      };

      let nextCalled = false;
      await protect(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.tenantId, sharedTenant._id.toString());
      assert.strictEqual(req.isCrossTenantAccess, undefined);

      await new Promise(r => setTimeout(r, 100));

      const log = await AuditLog.findOne({
        user: regularUser._id,
        action: 'Super Admin Cross-Tenant Access'
      });

      assert.strictEqual(log, null, 'No cross-tenant audit log should be recorded for same tenant requests');
    });
  });

  describe('3. Payment Idempotency Protection', () => {
    it('Payment model should have unique index with partialFilterExpression on { tenant: 1, idempotencyKey: 1 }', () => {
      const indexes = Payment.schema.indexes();
      const idempotencyIndex = indexes.find(
        idx => idx[0].tenant === 1 && idx[0].idempotencyKey === 1
      );

      assert.ok(idempotencyIndex, 'Index on tenant and idempotencyKey must exist');
      assert.strictEqual(idempotencyIndex[1].unique, true, 'Index must be unique');
      assert.deepStrictEqual(idempotencyIndex[1].partialFilterExpression, { idempotencyKey: { $type: 'string' } });
    });

    it('should handle duplicate payment requests idempotently and return existing record without double deduction', async () => {
      const cashier = await User.create({
        name: 'Idempotency Cashier',
        email: `cashier_idem_${Date.now()}@hospitalvision.com`,
        password: 'Password123!',
        role: 'billing_cashier',
        tenant: sharedTenant._id,
        branch: sharedBranch._id,
        status: 'active'
      });

      const patient = await Patient.create({
        tenant: sharedTenant._id,
        primaryBranch: sharedBranch._id,
        uhid: `UHID-IDEM-${Date.now()}`,
        firstName: 'Priya',
        lastName: 'Nair',
        gender: 'Female',
        phone: '9988776655'
      });

      const invoice = await Invoice.create({
        tenant: sharedTenant._id,
        branch: sharedBranch._id,
        invoiceNumber: `INV-IDEM-${Date.now()}`,
        patient: patient._id,
        items: [{
          description: 'Consultation Fee',
          quantity: 1,
          unitPrice: 1000,
          totalAmount: 1000
        }],
        subtotal: 1000,
        grandTotal: 1000,
        paidAmount: 0,
        balanceDue: 1000,
        status: 'Finalized'
      });

      const testKey = `idemp_key_${Date.now()}_abc123`;

      // Helper to simulate request
      const makeReq = () => ({
        tenantId: sharedTenant._id.toString(),
        user: cashier,
        body: {
          invoiceId: invoice._id.toString(),
          amount: 500,
          paymentMethod: 'Cash',
          paymentType: 'Bill Settlement',
          idempotencyKey: testKey
        },
        headers: {},
        get(header) { return this.headers[header.toLowerCase()]; }
      });

      let response1 = {};
      const res1 = {
        status: (code) => {
          response1.code = code;
          return {
            json: (data) => { response1.body = data; }
          };
        }
      };

      // First payment submission
      await billingController.collectPayment(makeReq(), res1, (err) => {
        if (err) throw err;
      });

      assert.strictEqual(response1.code, 201, 'First payment should return 201 Created');
      assert.strictEqual(response1.body.success, true);
      assert.strictEqual(response1.body.payment.amountPaid, 500);
      assert.strictEqual(response1.body.updatedInvoice.balanceDue, 500);

      const firstPaymentId = response1.body.payment._id.toString();

      // Second identical payment submission with same idempotencyKey
      let response2 = {};
      const res2 = {
        status: (code) => {
          response2.code = code;
          return {
            json: (data) => { response2.body = data; }
          };
        }
      };

      await billingController.collectPayment(makeReq(), res2, (err) => {
        if (err) throw err;
      });

      assert.strictEqual(response2.code, 200, 'Duplicate submission should return 200 OK');
      assert.strictEqual(response2.body.success, true);
      assert.strictEqual(response2.body.isDuplicate, true, 'isDuplicate flag should be true');
      assert.strictEqual(response2.body.payment._id.toString(), firstPaymentId, 'Should return identical payment');

      // Verify DB invoice totals were NOT deducted a second time
      const freshInvoice = await Invoice.findById(invoice._id);
      assert.strictEqual(freshInvoice.paidAmount, 500, 'Invoice paidAmount should remain 500');
      assert.strictEqual(freshInvoice.balanceDue, 500, 'Invoice balanceDue should remain 500');

      // Verify only 1 payment was created in the database for this key
      const paymentCount = await Payment.countDocuments({
        tenant: sharedTenant._id,
        idempotencyKey: testKey
      });
      assert.strictEqual(paymentCount, 1, 'Only one payment record should exist for idempotencyKey');
    });

    it('should allow multiple payments without idempotencyKey (cash/manual regression safety)', async () => {
      const cashier = await User.create({
        name: 'Standard Cashier',
        email: `cashier_reg_${Date.now()}@hospitalvision.com`,
        password: 'Password123!',
        role: 'billing_cashier',
        tenant: sharedTenant._id,
        branch: sharedBranch._id,
        status: 'active'
      });

      const patient = await Patient.create({
        tenant: sharedTenant._id,
        primaryBranch: sharedBranch._id,
        uhid: `UHID-REG-${Date.now()}`,
        firstName: 'Anil',
        lastName: 'Verma',
        gender: 'Male',
        phone: '9123456780'
      });

      const invoice = await Invoice.create({
        tenant: sharedTenant._id,
        branch: sharedBranch._id,
        invoiceNumber: `INV-REG-${Date.now()}`,
        patient: patient._id,
        items: [{
          description: 'Pharmacy Bill',
          quantity: 1,
          unitPrice: 800,
          totalAmount: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        balanceDue: 800,
        status: 'Finalized'
      });

      // Submit payment 1 without key
      let resData1 = {};
      await billingController.collectPayment({
        tenantId: sharedTenant._id.toString(),
        user: cashier,
        body: {
          invoiceId: invoice._id.toString(),
          amount: 300,
          paymentMethod: 'Cash'
        },
        headers: {},
        get(h) { return this.headers[h.toLowerCase()]; }
      }, {
        status: (code) => ({ json: (d) => { resData1 = { code, d }; } })
      }, (err) => { if (err) throw err; });

      assert.strictEqual(resData1.code, 201);
      assert.strictEqual(resData1.d.updatedInvoice.balanceDue, 500);

      // Submit payment 2 without key (legitimate second installment)
      let resData2 = {};
      await billingController.collectPayment({
        tenantId: sharedTenant._id.toString(),
        user: cashier,
        body: {
          invoiceId: invoice._id.toString(),
          amount: 200,
          paymentMethod: 'Cash'
        },
        headers: {},
        get(h) { return this.headers[h.toLowerCase()]; }
      }, {
        status: (code) => ({ json: (d) => { resData2 = { code, d }; } })
      }, (err) => { if (err) throw err; });

      assert.strictEqual(resData2.code, 201);
      assert.strictEqual(resData2.d.updatedInvoice.balanceDue, 300);

      const totalPayments = await Payment.countDocuments({ invoice: invoice._id });
      assert.strictEqual(totalPayments, 2, 'Two separate payments should exist for the two cash installments');
    });
  });
});
