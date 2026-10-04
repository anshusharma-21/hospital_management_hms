const Payment = require('../../models/Payment');
const Invoice = require('../../models/Invoice');
const AuditLog = require('../../models/AuditLog');
const MockPaymentGatewayAdapter = require('./adapters/MockPaymentGatewayAdapter');
const notificationService = require('../notification/NotificationService');

class PaymentService {
  constructor() {
    this.adapters = new Map();
    // Register mock adapter as default sandbox provider
    this.adapters.set('mock', new MockPaymentGatewayAdapter());
  }

  /**
   * Register a custom gateway provider
   */
  registerAdapter(name, adapter) {
    this.adapters.set(name.toLowerCase(), adapter);
  }

  /**
   * Resolve configured gateway adapter
   */
  resolveAdapter() {
    const providerKey = process.env.PAYMENT_GATEWAY_PROVIDER || 'mock';
    const adapter = this.adapters.get(providerKey.toLowerCase());
    if (!adapter) {
      throw new Error(`[PaymentService] No registered gateway adapter found for provider: '${providerKey}'`);
    }
    return adapter;
  }

  /**
   * Initiate an online gateway payment for an invoice
   */
  async initiatePayment({ tenantId, invoiceId, amount, currency = 'INR', patientId, customerDetails = {}, callbackUrl, idempotencyKey, requestedBy }) {
    if (!tenantId) {
      throw new Error('[PaymentService] tenantId is required for tenant isolation.');
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, tenant: tenantId }).populate('patient');
    if (!invoice) {
      throw new Error('[PaymentService] Invoice not found in the current tenant.');
    }

    const payAmount = Number(amount || invoice.balanceDue);
    if (payAmount <= 0) {
      throw new Error('[PaymentService] Payment amount must be greater than zero.');
    }
    if (payAmount > invoice.balanceDue) {
      throw new Error(`[PaymentService] Payment amount ₹${payAmount} exceeds outstanding balance of ₹${invoice.balanceDue}.`);
    }

    // Check existing payment idempotency
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({
        tenant: tenantId,
        idempotencyKey: idempotencyKey.toString().trim()
      }).populate('patient');

      if (existingPayment) {
        return {
          success: true,
          isDuplicate: true,
          message: 'Payment already processed with this idempotency key',
          payment: existingPayment,
          updatedInvoice: invoice
        };
      }
    }

    const adapter = this.resolveAdapter();
    const initiationResult = await adapter.initiatePayment({
      tenantId,
      invoiceId: invoice._id.toString(),
      amount: payAmount,
      currency,
      patientId: patientId || invoice.patient?._id?.toString(),
      customerDetails,
      callbackUrl,
      idempotencyKey
    });

    // Record audit log for gateway initiation
    AuditLog.create({
      tenant: tenantId,
      user: requestedBy?._id,
      userName: requestedBy?.name || 'System Gateway',
      userRole: requestedBy?.role || 'billing_cashier',
      action: 'Initiate Gateway Payment',
      module: 'Billing & Cashier',
      entityId: invoice._id.toString(),
      entityType: 'Invoice',
      details: `Initiated ${initiationResult.provider} gateway payment order ${initiationResult.orderId} for ₹${payAmount} (Invoice #${invoice.invoiceNumber})`,
      timestamp: new Date()
    }).catch(auditErr => console.warn('[PaymentService AuditLog Warning]:', auditErr.message));

    return initiationResult;
  }

  /**
   * Verify completed gateway transaction and record payment against invoice
   */
  async verifyAndRecordPayment({ tenantId, invoiceId, orderId, gatewayPaymentId, gatewaySignature, idempotencyKey, collectedBy, branchId, amountPaid }) {
    if (!tenantId) {
      throw new Error('[PaymentService] tenantId is required.');
    }

    const clientKey = idempotencyKey ? idempotencyKey.toString().trim() : null;

    // Check idempotency first before touching database or invoice
    if (clientKey) {
      const existingPayment = await Payment.findOne({
        tenant: tenantId,
        idempotencyKey: clientKey
      }).populate('patient');

      if (existingPayment) {
        const currentInvoice = await Invoice.findOne({ _id: existingPayment.invoice, tenant: tenantId }).populate('patient');
        return {
          success: true,
          isDuplicate: true,
          message: 'Payment already processed with this idempotency key',
          payment: existingPayment,
          updatedInvoice: currentInvoice
        };
      }
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, tenant: tenantId }).populate('patient');
    if (!invoice) {
      throw new Error('[PaymentService] Invoice not found.');
    }

    // Verify through gateway adapter
    const adapter = this.resolveAdapter();
    const verification = await adapter.verifyPayment({
      tenantId,
      orderId,
      gatewayPaymentId,
      gatewaySignature,
      amountPaid: amountPaid ? Number(amountPaid) : undefined
    });

    if (!verification.verified) {
      throw new Error(`[PaymentService] Gateway verification failed: ${verification.error || 'Signature mismatch'}`);
    }

    const capturedAmount = Number(verification.amountPaid);
    if (capturedAmount <= 0 || capturedAmount > invoice.balanceDue) {
      throw new Error(`[PaymentService] Verified amount ₹${capturedAmount} is invalid for balance ₹${invoice.balanceDue}.`);
    }

    // Generate receipt number
    const count = await Payment.countDocuments({ tenant: tenantId });
    const recSeq = String(count + 1).padStart(4, '0');
    const receiptNumber = `REC-${new Date().getFullYear()}-${recSeq}`;

    // Create payment record
    const payment = await Payment.create({
      tenant: tenantId,
      branch: branchId || invoice.branch,
      receiptNumber,
      invoice: invoice._id,
      patient: invoice.patient?._id,
      amountPaid: capturedAmount,
      paymentMethod: verification.paymentMethod || 'UPI / QR Code',
      paymentType: 'Bill Settlement',
      transactionReference: verification.gatewayPaymentId || orderId,
      idempotencyKey: clientKey || undefined,
      collectedBy: collectedBy?._id || collectedBy,
      status: 'Completed'
    });

    // Update invoice balance
    invoice.paidAmount += capturedAmount;
    invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.paidAmount);
    invoice.status = invoice.balanceDue === 0 ? 'Fully Paid' : 'Partially Paid';
    await invoice.save();

    // Audit log
    AuditLog.create({
      tenant: tenantId,
      user: collectedBy?._id || collectedBy,
      userName: collectedBy?.name || 'Gateway System',
      userRole: collectedBy?.role || 'billing_cashier',
      action: 'Collect Gateway Payment',
      module: 'Billing & Cashier',
      entityId: payment._id.toString(),
      entityType: 'Payment',
      details: `Captured ₹${amountPaid} via ${verification.isMock ? 'Mock ' : ''}Gateway (${verification.gatewayPaymentId}). New balance: ₹${invoice.balanceDue} (Receipt #${receiptNumber})`,
      timestamp: new Date()
    }).catch(auditErr => console.warn('[PaymentService AuditLog Warning]:', auditErr.message));

    // Send receipt notification
    if (invoice.patient?.phone) {
      notificationService.sendNotification({
        tenantId,
        eventName: 'Payment Received Receipt',
        channel: 'SMS',
        recipient: invoice.patient.phone,
        data: {
          patientName: invoice.patient.fullName || invoice.patient.firstName || 'Patient',
          receiptNumber,
          invoiceNumber: invoice.invoiceNumber,
          amountPaid,
          hospitalName: 'Hospital Vision'
        }
      }).catch(notifErr => console.warn('[Payment Notification Error]:', notifErr.message));
    }

    return {
      success: true,
      message: 'Payment verified and receipt recorded',
      payment,
      updatedInvoice: invoice
    };
  }

  /**
   * Handle incoming webhook notification
   */
  async handleWebhook({ tenantId, payload, headers, signature }) {
    const adapter = this.resolveAdapter();
    const webhookResult = await adapter.handleWebhook({ tenantId, payload, headers, signature });
    return webhookResult;
  }

  /**
   * Process refund with balance protection
   */
  async refundPayment({ tenantId, paymentId, refundAmount, reason, approvedBy }) {
    if (!tenantId) {
      throw new Error('[PaymentService] tenantId is required.');
    }

    const payment = await Payment.findOne({ _id: paymentId, tenant: tenantId }).populate('invoice');
    if (!payment) {
      throw new Error('[PaymentService] Payment record not found.');
    }

    if (payment.status === 'Refunded') {
      throw new Error('[PaymentService] Payment has already been refunded.');
    }

    const amountToRefund = Number(refundAmount || payment.amountPaid);
    if (amountToRefund <= 0 || amountToRefund > payment.amountPaid) {
      throw new Error(`[PaymentService] Invalid refund amount ₹${amountToRefund}. Max refundable is ₹${payment.amountPaid}.`);
    }

    // If external gateway was used, request gateway refund
    const adapter = this.resolveAdapter();
    let gatewayRefundData = null;
    if (payment.transactionReference) {
      try {
        gatewayRefundData = await adapter.refundPayment({
          tenantId,
          gatewayPaymentId: payment.transactionReference,
          amount: amountToRefund,
          reason
        });
      } catch (gwErr) {
        console.warn(`[PaymentService] Gateway refund call failed: ${gwErr.message}. Proceeding with ledger update.`);
      }
    }

    // Update payment record
    payment.status = 'Refunded';
    payment.refundRecord = {
      refundAmount: amountToRefund,
      refundReason: reason || 'Patient requested refund',
      refundedAt: new Date(),
      approvedBy: approvedBy?._id || approvedBy
    };
    await payment.save();

    // Adjust invoice balance
    const invoice = await Invoice.findOne({ _id: payment.invoice?._id || payment.invoice, tenant: tenantId });
    if (invoice) {
      invoice.paidAmount = Math.max(0, invoice.paidAmount - amountToRefund);
      invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.paidAmount);
      invoice.status = invoice.paidAmount === 0 ? 'Finalized' : 'Partially Paid';
      await invoice.save();
    }

    // Audit log
    AuditLog.create({
      tenant: tenantId,
      user: approvedBy?._id || approvedBy,
      userName: approvedBy?.name || 'Admin',
      userRole: approvedBy?.role || 'hospital_admin',
      action: 'Process Payment Refund',
      module: 'Billing & Cashier',
      entityId: payment._id.toString(),
      entityType: 'Payment',
      details: `Refunded ₹${amountToRefund} for Receipt #${payment.receiptNumber}. Reason: ${reason || 'N/A'}${gatewayRefundData ? ` (Gateway Refund ID: ${gatewayRefundData.refundId})` : ''}`,
      timestamp: new Date()
    }).catch(auditErr => console.warn('[PaymentService AuditLog Warning]:', auditErr.message));

    return {
      success: true,
      message: 'Payment refunded successfully',
      payment,
      updatedInvoice: invoice,
      gatewayRefund: gatewayRefundData
    };
  }

  /**
   * Reconcile payment status
   */
  async reconcilePayment({ tenantId, orderId }) {
    if (!tenantId) throw new Error('[PaymentService] tenantId is required.');
    const adapter = this.resolveAdapter();
    return adapter.reconcilePayment({ tenantId, orderId });
  }

  /**
   * Helper to retrieve mock adapter
   */
  getMockAdapter() {
    return this.adapters.get('mock');
  }
}

// Singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;
