const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'batch1_test_secret_2026_super_secure';

const connectDB = require('../src/config/db');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const LabOrder = require('../src/models/LabOrder');
const BarcodeReference = require('../src/models/BarcodeReference');
const NotificationTemplate = require('../src/models/NotificationTemplate');

const notificationService = require('../src/services/notification/NotificationService');
const paymentService = require('../src/services/payment/PaymentService');
const barcodeReferenceService = require('../src/services/barcode/BarcodeReferenceService');
const billingController = require('../src/controllers/billingController');

describe('Hospital Vision Batch 1 — Foundational Services Test Suite', () => {
  let tenantA;
  let tenantB;
  let branchA;
  let cashierA;
  let doctorA;
  let labTechA;
  let patientA;
  let invoiceA;

  before(async () => {
    await connectDB();
    await Payment.init();
    await BarcodeReference.init();

    // Create Tenant A
    tenantA = await Tenant.create({
      name: 'City Care Hospital',
      slug: `city-care-${Date.now()}`
    });

    // Create Tenant B (for cross-tenant boundary testing)
    tenantB = await Tenant.create({
      name: 'Apex Health Systems',
      slug: `apex-health-${Date.now()}`
    });

    branchA = await Branch.create({
      tenant: tenantA._id,
      name: 'City Care Downtown',
      code: `CC-${Date.now()}`
    });

    cashierA = await User.create({
      name: 'Cashier Nina',
      email: `cashier_nina_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'billing_cashier',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });

    doctorA = await User.create({
      name: 'Dr. Suresh Rao',
      email: `dr_suresh_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'doctor',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });

    labTechA = await User.create({
      name: 'Tech Rajesh',
      email: `tech_rajesh_${Date.now()}@citycare.com`,
      password: 'Password123!',
      role: 'lab_tech',
      tenant: tenantA._id,
      branch: branchA._id,
      status: 'active'
    });

    patientA = await Patient.create({
      tenant: tenantA._id,
      primaryBranch: branchA._id,
      uhid: `UHID-BATCH1-${Date.now()}`,
      firstName: 'Kavita',
      lastName: 'Patel',
      gender: 'Female',
      phone: '9876540001'
    });

    invoiceA = await Invoice.create({
      tenant: tenantA._id,
      branch: branchA._id,
      invoiceNumber: `INV-B1-${Date.now()}`,
      patient: patientA._id,
      items: [{
        description: 'Comprehensive Health Screening',
        quantity: 1,
        unitPrice: 3500,
        totalAmount: 3500
      }],
      subtotal: 3500,
      grandTotal: 3500,
      paidAmount: 0,
      balanceDue: 3500,
      status: 'Finalized'
    });
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } catch (_) {}
    setTimeout(() => process.exit(0), 100);
  });

  // =========================================================================
  // 1. NOTIFICATION SERVICE & ADAPTER SUITE
  // =========================================================================
  describe('1. Notification Service / Adapter Boundary', () => {
    it('should select mock adapter in test environment and record delivery', async () => {
      const mockAdapter = notificationService.getMockAdapter();
      mockAdapter.clear();

      const result = await notificationService.sendNotification({
        tenantId: tenantA._id,
        eventName: 'Appointment Confirmation',
        channel: 'SMS',
        recipient: '9876540001',
        data: {
          patientName: 'Kavita Patel',
          doctorName: 'Dr. Suresh Rao',
          appointmentDate: '30/09/2026',
          appointmentTime: '11:00 AM',
          tokenNumber: 14,
          hospitalName: 'City Care Hospital'
        }
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'SMS');
      assert.strictEqual(result.provider, 'mock');

      const sent = mockAdapter.getSentNotifications({ tenantId: tenantA._id });
      assert.strictEqual(sent.length, 1);
      assert.strictEqual(sent[0].recipient, '9876540001');
      assert.ok(sent[0].message.includes('Kavita Patel'));
      assert.ok(sent[0].message.includes('Dr. Suresh Rao'));
      assert.ok(sent[0].message.includes('Token #14'));
    });

    it('should support direct sendWhatsApp, sendEmail, and sendInApp helpers', async () => {
      const mockAdapter = notificationService.getMockAdapter();
      mockAdapter.clear();

      // WhatsApp
      const waResult = await notificationService.sendWhatsApp({
        tenantId: tenantA._id,
        to: '9876540001',
        message: 'Your lab report is ready. Visit {{portal}}',
        data: { portal: 'https://portal.citycare.com' }
      });
      assert.strictEqual(waResult.success, true);

      // Email
      const emailResult = await notificationService.sendEmail({
        tenantId: tenantA._id,
        to: 'kavita@example.com',
        subject: 'Invoice #{{num}} Receipt',
        text: 'Thank you for your payment of ₹{{amt}}',
        data: { num: 'INV-101', amt: 3500 }
      });
      assert.strictEqual(emailResult.success, true);

      // In-App
      const inAppResult = await notificationService.sendInApp({
        tenantId: tenantA._id,
        userId: doctorA._id.toString(),
        title: 'New Patient Arrival: {{name}}',
        message: 'Patient {{name}} checked in for token #{{token}}',
        data: { name: 'Kavita Patel', token: 14 }
      });
      assert.strictEqual(inAppResult.success, true);

      assert.strictEqual(mockAdapter.sentNotifications.length, 3);
    });

    it('should fail safely when tenantId is missing (tenant context required)', async () => {
      await assert.rejects(
        () => notificationService.sendNotification({
          eventName: 'Appointment Confirmation',
          channel: 'SMS',
          recipient: '9876540001'
        }),
        /tenantId is required/i
      );
    });

    it('should fail safely when channel is unsupported', async () => {
      await assert.rejects(
        () => notificationService.sendNotification({
          tenantId: tenantA._id,
          eventName: 'Appointment Confirmation',
          channel: 'TELEPATHY',
          recipient: '9876540001'
        }),
        /Invalid or unsupported channel/i
      );
    });

    it('should use custom tenant template when available in database', async () => {
      const mockAdapter = notificationService.getMockAdapter();
      mockAdapter.clear();

      await NotificationTemplate.create({
        tenant: tenantA._id,
        eventName: 'Payment Received Receipt',
        channel: 'SMS',
        subject: 'Receipt Alert',
        messageTemplate: 'Custom Alert: ₹{{amountPaid}} received. Thanks from City Care!'
      });

      await notificationService.sendNotification({
        tenantId: tenantA._id,
        eventName: 'Payment Received Receipt',
        channel: 'SMS',
        recipient: '9876540001',
        data: { amountPaid: 1500 }
      });

      const sent = mockAdapter.getSentNotifications({ channel: 'SMS' });
      assert.strictEqual(sent.length, 1);
      assert.strictEqual(sent[0].message, 'Custom Alert: ₹1500 received. Thanks from City Care!');
    });
  });

  // =========================================================================
  // 2. PAYMENT GATEWAY SERVICE & ADAPTER SUITE
  // =========================================================================
  describe('2. Payment Gateway Service / Adapter Boundary', () => {
    it('should initiate gateway payment and return pending mock checkout with no auto-capture', async () => {
      const initResult = await paymentService.initiatePayment({
        tenantId: tenantA._id,
        invoiceId: invoiceA._id.toString(),
        amount: 2000,
        currency: 'INR',
        requestedBy: cashierA
      });

      assert.strictEqual(initResult.success, true);
      assert.strictEqual(initResult.isMock, true);
      assert.strictEqual(initResult.gatewayStatus, 'PENDING_CHECKOUT');
      assert.strictEqual(initResult.amount, 2000);
      assert.ok(initResult.orderId.startsWith('mock_order_'));
      assert.ok(initResult.mockSignatureToken);

      // Verify invoice balance was NOT modified upon initiation
      const freshInvoice = await Invoice.findById(invoiceA._id);
      assert.strictEqual(freshInvoice.balanceDue, 3500);
      assert.strictEqual(freshInvoice.paidAmount, 0);
    });

    it('should reject payment initiation for foreign tenant invoice (tenant isolation)', async () => {
      await assert.rejects(
        () => paymentService.initiatePayment({
          tenantId: tenantB._id, // Tenant B trying to access Tenant A's invoice
          invoiceId: invoiceA._id.toString(),
          amount: 500,
          requestedBy: cashierA
        }),
        /Invoice not found in the current tenant/i
      );
    });

    it('should verify payment signature and record receipt into existing Payment model with idempotency', async () => {
      const idempotencyKey = `idemp_gw_test_${Date.now()}`;

      // 1. Initiate order
      const initOrder = await paymentService.initiatePayment({
        tenantId: tenantA._id,
        invoiceId: invoiceA._id.toString(),
        amount: 1500,
        idempotencyKey,
        requestedBy: cashierA
      });

      // 2. Verify with valid mock signature
      const verifyResult = await paymentService.verifyAndRecordPayment({
        tenantId: tenantA._id,
        invoiceId: invoiceA._id.toString(),
        orderId: initOrder.orderId,
        gatewayPaymentId: `mock_pay_success_${Date.now()}`,
        gatewaySignature: initOrder.mockSignatureToken,
        idempotencyKey,
        collectedBy: cashierA,
        branchId: branchA._id
      });

      assert.strictEqual(verifyResult.success, true);
      assert.strictEqual(verifyResult.payment.amountPaid, 1500);
      assert.strictEqual(verifyResult.updatedInvoice.paidAmount, 1500);
      assert.strictEqual(verifyResult.updatedInvoice.balanceDue, 2000);
      assert.strictEqual(verifyResult.updatedInvoice.status, 'Partially Paid');

      // 3. Repeat verify with same idempotency key: must return existing payment (isDuplicate: true)
      const duplicateResult = await paymentService.verifyAndRecordPayment({
        tenantId: tenantA._id,
        invoiceId: invoiceA._id.toString(),
        orderId: initOrder.orderId,
        gatewayPaymentId: 'some_other_replay_id',
        gatewaySignature: initOrder.mockSignatureToken,
        idempotencyKey,
        collectedBy: cashierA,
        branchId: branchA._id
      });

      assert.strictEqual(duplicateResult.success, true);
      assert.strictEqual(duplicateResult.isDuplicate, true);
      assert.strictEqual(duplicateResult.payment._id.toString(), verifyResult.payment._id.toString());

      // DB invoice balance must NOT be deducted twice
      const freshInvoice = await Invoice.findById(invoiceA._id);
      assert.strictEqual(freshInvoice.paidAmount, 1500);
      assert.strictEqual(freshInvoice.balanceDue, 2000);
    });

    it('should validate webhook signature and reject unauthorized payload', async () => {
      // Invalid signature
      const invalidWebhook = await paymentService.handleWebhook({
        tenantId: tenantA._id,
        payload: { event: 'payment.captured', orderId: 'ord_123' },
        headers: { 'x-signature': 'invalid_forged_sig' }
      });
      assert.strictEqual(invalidWebhook.success, false);
      assert.strictEqual(invalidWebhook.verified, false);

      // Valid signature
      const validWebhook = await paymentService.handleWebhook({
        tenantId: tenantA._id,
        payload: { event: 'payment.captured', orderId: 'ord_123', amount: 1500 },
        headers: { 'x-signature': 'valid_mock_webhook_sig' }
      });
      assert.strictEqual(validWebhook.success, true);
      assert.strictEqual(validWebhook.verified, true);
      assert.strictEqual(validWebhook.event, 'payment.captured');
    });

    it('should process payment refund without corrupting invoice balance', async () => {
      const payments = await Payment.find({ invoice: invoiceA._id, status: 'Completed' });
      assert.ok(payments.length > 0);
      const targetPayment = payments[0];

      const refundResult = await paymentService.refundPayment({
        tenantId: tenantA._id,
        paymentId: targetPayment._id.toString(),
        refundAmount: 500,
        reason: 'Service consultation fee adjustment',
        approvedBy: cashierA
      });

      assert.strictEqual(refundResult.success, true);
      assert.strictEqual(refundResult.payment.status, 'Refunded');
      assert.strictEqual(refundResult.payment.refundRecord.refundAmount, 500);

      // Verify invoice balance was re-credited properly
      const freshInvoice = await Invoice.findById(invoiceA._id);
      assert.strictEqual(freshInvoice.paidAmount, 1000);
      assert.strictEqual(freshInvoice.balanceDue, 2500);
    });

    it('manual payment flow via billingController remains fully functional (Cash/Manual regression)', async () => {
      let response = {};
      const res = {
        status: (code) => {
          response.code = code;
          return { json: (data) => { response.data = data; } };
        }
      };

      await billingController.collectPayment({
        tenantId: tenantA._id.toString(),
        user: cashierA,
        body: {
          invoiceId: invoiceA._id.toString(),
          amount: 500,
          paymentMethod: 'Cash',
          paymentType: 'Bill Settlement'
        },
        headers: {},
        get(h) { return this.headers[h.toLowerCase()]; }
      }, res, (err) => { if (err) throw err; });

      assert.strictEqual(response.code, 201);
      assert.strictEqual(response.data.payment.paymentMethod, 'Cash');
      assert.strictEqual(response.data.updatedInvoice.paidAmount, 1500);
    });
  });

  // =========================================================================
  // 3. QR / BARCODE REFERENCE SERVICE SUITE
  // =========================================================================
  describe('3. QR / Barcode Reference Service Boundary', () => {
    it('should generate an opaque reference payload containing ZERO PHI', async () => {
      const refData = await barcodeReferenceService.generateReference({
        tenantId: tenantA._id,
        resourceType: 'PATIENT',
        resourceId: patientA._id,
        resourceModel: 'Patient',
        metadata: {
          department: 'Cardiology',
          zone: 'West Wing'
        },
        createdBy: cashierA
      });

      assert.ok(refData.referenceCode.startsWith('HVREF:PATIENT:'));
      assert.strictEqual(refData.barcodePayload, refData.referenceCode);
      assert.strictEqual(refData.qrPayload, refData.referenceCode);

      // Strict security check: payload must not contain patient personal info
      assert.strictEqual(refData.referenceCode.includes('Kavita'), false);
      assert.strictEqual(refData.referenceCode.includes('Patel'), false);
      assert.strictEqual(refData.referenceCode.includes('9876540001'), false);
    });

    it('should strictly reject attempts to encode clinical or PHI fields into reference metadata', async () => {
      await assert.rejects(
        () => barcodeReferenceService.generateReference({
          tenantId: tenantA._id,
          resourceType: 'PATIENT',
          resourceId: patientA._id,
          resourceModel: 'Patient',
          metadata: {
            diagnosis: 'Acute Myocardial Infarction', // Illegal PHI!
            prescription: 'Aspirin 75mg'
          },
          createdBy: cashierA
        }),
        /Forbidden PHI key 'diagnosis' detected/i
      );
    });

    it('should resolve reference with tenant isolation (Tenant B cannot resolve Tenant A reference)', async () => {
      const ref = await barcodeReferenceService.generateReference({
        tenantId: tenantA._id,
        resourceType: 'PATIENT',
        resourceId: patientA._id,
        resourceModel: 'Patient',
        createdBy: cashierA
      });

      // Tenant A can resolve
      const resolved = await barcodeReferenceService.resolveReference({
        tenantId: tenantA._id,
        referenceCode: ref.referenceCode,
        requestingUser: doctorA
      });
      assert.strictEqual(resolved.success, true);
      assert.strictEqual(resolved.resource.uhid, patientA.uhid);

      // Tenant B resolution MUST be rejected
      await assert.rejects(
        () => barcodeReferenceService.resolveReference({
          tenantId: tenantB._id, // Wrong tenant
          referenceCode: ref.referenceCode,
          requestingUser: doctorA
        }),
        /Reference code not found or inaccessible in current tenant context/i
      );
    });

    it('should reject unauthorized role from resolving patient reference (RBAC)', async () => {
      const ref = await barcodeReferenceService.generateReference({
        tenantId: tenantA._id,
        resourceType: 'PATIENT',
        resourceId: patientA._id,
        resourceModel: 'Patient',
        createdBy: cashierA
      });

      // An unauthorized role (e.g. 'maintenance_staff')
      await assert.rejects(
        () => barcodeReferenceService.resolveReference({
          tenantId: tenantA._id,
          referenceCode: ref.referenceCode,
          requestingUser: { _id: new mongoose.Types.ObjectId(), role: 'maintenance_staff' }
        }),
        /Role 'maintenance_staff' is not authorized to inspect patient references/i
      );
    });

    it('should preserve existing lab sample barcode format (BC-...) and resolve seamlessly', async () => {
      const labBarcode = barcodeReferenceService.generateLabBarcode('ORD-2026-999');
      assert.ok(labBarcode.startsWith('BC-2026999-'));

      const labOrder = await LabOrder.create({
        tenant: tenantA._id,
        branch: branchA._id,
        orderNumber: 'ORD-2026-999',
        patient: patientA._id,
        doctor: doctorA._id,
        sampleBarcode: labBarcode,
        overallStatus: 'Sample Collected',
        tests: [{ testName: 'Complete Blood Count (CBC)', status: 'Sample Collected' }]
      });

      const resolved = await barcodeReferenceService.resolveReference({
        tenantId: tenantA._id,
        referenceCode: labBarcode,
        requestingUser: labTechA
      });

      assert.strictEqual(resolved.success, true);
      assert.strictEqual(resolved.resourceType, 'LAB_SAMPLE');
      assert.strictEqual(resolved.resource.sampleBarcode, labBarcode);
      assert.strictEqual(resolved.resource.orderNumber, 'ORD-2026-999');
    });
  });
});
