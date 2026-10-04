// Abstract Base Class for Payment Gateway Providers

class PaymentGatewayAdapter {
  constructor(name) {
    if (new.target === PaymentGatewayAdapter) {
      throw new TypeError('Cannot construct PaymentGatewayAdapter instances directly.');
    }
    this.name = name;
  }

  /**
   * Initiate a gateway payment (order / checkout session creation)
   */
  async initiatePayment(options) {
    throw new Error('Method initiatePayment() must be implemented by payment gateway adapter.');
  }

  /**
   * Verify signature and status of completed gateway transaction
   */
  async verifyPayment(options) {
    throw new Error('Method verifyPayment() must be implemented by payment gateway adapter.');
  }

  /**
   * Handle incoming gateway webhook notification
   */
  async handleWebhook(options) {
    throw new Error('Method handleWebhook() must be implemented by payment gateway adapter.');
  }

  /**
   * Process refund through gateway
   */
  async refundPayment(options) {
    throw new Error('Method refundPayment() must be implemented by payment gateway adapter.');
  }

  /**
   * Query status / reconcile transaction
   */
  async reconcilePayment(options) {
    throw new Error('Method reconcilePayment() must be implemented by payment gateway adapter.');
  }
}

module.exports = PaymentGatewayAdapter;
