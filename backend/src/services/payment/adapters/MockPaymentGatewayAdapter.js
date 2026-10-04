const crypto = require('crypto');
const PaymentGatewayAdapter = require('./PaymentGatewayAdapter');

class MockPaymentGatewayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super('mock');
    this.mockOrders = new Map();
  }

  /**
   * Initiate a mock checkout session (does not mark payment completed)
   */
  async initiatePayment({ tenantId, invoiceId, amount, currency = 'INR', patientId, customerDetails = {}, callbackUrl, idempotencyKey }) {
    const timestamp = new Date();
    const orderId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const paymentReference = `PAY-MOCK-${Date.now()}`;
    const expectedSignature = crypto
      .createHmac('sha256', 'mock_gateway_sandbox_secret')
      .update(`${orderId}|${amount}|${tenantId}`)
      .digest('hex');

    const orderData = {
      orderId,
      paymentReference,
      tenantId: tenantId ? tenantId.toString() : null,
      invoiceId: invoiceId ? invoiceId.toString() : null,
      patientId: patientId ? patientId.toString() : null,
      amount: Number(amount),
      currency,
      status: 'PENDING_CHECKOUT',
      expectedSignature,
      idempotencyKey: idempotencyKey || null,
      createdAt: timestamp
    };

    this.mockOrders.set(orderId, orderData);

    return {
      success: true,
      provider: 'mock',
      isMock: true,
      gatewayStatus: 'PENDING_CHECKOUT',
      orderId,
      paymentReference,
      amount: Number(amount),
      currency,
      checkoutUrl: `/mock-checkout?orderId=${orderId}&token=${expectedSignature}`,
      mockSignatureToken: expectedSignature,
      createdAt: timestamp
    };
  }

  /**
   * Verify signature and status of completed gateway transaction
   */
  async verifyPayment({ tenantId, orderId, gatewayPaymentId, gatewaySignature, amountPaid }) {
    const order = this.mockOrders.get(orderId);

    // If order was registered in mock store, verify signature
    if (order) {
      if (order.tenantId && tenantId && order.tenantId !== tenantId.toString()) {
        return {
          verified: false,
          error: 'Tenant mismatch on payment verification'
        };
      }

      if (gatewaySignature !== order.expectedSignature && gatewaySignature !== 'valid_mock_signature_for_test') {
        return {
          verified: false,
          error: 'Invalid mock gateway signature'
        };
      }

      order.status = 'COMPLETED';
      order.gatewayPaymentId = gatewayPaymentId || `mock_txn_${Date.now()}`;

      return {
        verified: true,
        isMock: true,
        gatewayPaymentId: order.gatewayPaymentId,
        orderId: order.orderId,
        paymentReference: order.paymentReference,
        amountPaid: (amountPaid !== undefined && amountPaid !== null) ? Number(amountPaid) : order.amount,
        paymentMethod: 'UPI / QR Code',
        status: 'Completed'
      };
    }

    // Direct mock verification check for test assertions
    if (gatewaySignature === 'valid_mock_signature_for_test') {
      return {
        verified: true,
        isMock: true,
        gatewayPaymentId: gatewayPaymentId || `mock_txn_${Date.now()}`,
        orderId,
        paymentReference: `PAY-MOCK-${Date.now()}`,
        amountPaid: Number(amountPaid || 0),
        paymentMethod: 'UPI / QR Code',
        status: 'Completed'
      };
    }

    return {
      verified: false,
      error: 'Mock order not found or invalid mock signature'
    };
  }

  /**
   * Handle incoming gateway webhook notification
   */
  async handleWebhook({ tenantId, payload = {}, headers = {} }) {
    const signature = headers['x-mock-signature'] || headers['x-signature'];
    const { event, orderId, gatewayPaymentId, amount } = payload;

    if (!signature || (signature !== 'valid_mock_webhook_sig' && signature !== 'sandbox_test_webhook')) {
      return {
        success: false,
        verified: false,
        error: 'Invalid webhook signature'
      };
    }

    return {
      success: true,
      verified: true,
      isMock: true,
      event: event || 'payment.captured',
      orderId,
      gatewayPaymentId,
      amount: Number(amount || 0),
      processedAt: new Date()
    };
  }

  /**
   * Process refund through gateway
   */
  async refundPayment({ tenantId, gatewayPaymentId, amount, reason }) {
    const refundId = `mock_rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      isMock: true,
      refundId,
      gatewayPaymentId,
      refundAmount: Number(amount),
      status: 'REFUNDED',
      reason: reason || 'Patient requested refund',
      refundedAt: new Date()
    };
  }

  /**
   * Reconcile payment status
   */
  async reconcilePayment({ tenantId, orderId }) {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      return { found: false, status: 'NOT_FOUND' };
    }
    return {
      found: true,
      isMock: true,
      orderId: order.orderId,
      status: order.status,
      amount: order.amount,
      paymentReference: order.paymentReference
    };
  }
}

module.exports = MockPaymentGatewayAdapter;
