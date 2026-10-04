// Abstract Base Adapter for Notification Providers

class NotificationProviderAdapter {
  constructor(name) {
    if (new.target === NotificationProviderAdapter) {
      throw new TypeError('Cannot construct NotificationProviderAdapter instances directly.');
    }
    this.name = name;
  }

  /**
   * Send a notification payload
   * @param {Object} options
   * @param {string} options.channel - SMS, WhatsApp, Email, In-App Notification
   * @param {string} options.to - Recipient phone, email, or user identifier
   * @param {string} [options.subject] - Subject line for email/in-app
   * @param {string} options.message - Formatted message body
   * @param {Object} [options.data] - Template replacement data
   * @param {string} options.tenantId - Tenant ID for isolation
   * @param {Object} [options.metadata] - Additional routing metadata
   * @returns {Promise<{success: boolean, messageId: string, provider: string, timestamp: Date}>}
   */
  async send(options) {
    throw new Error('Method send() must be implemented by notification provider adapter.');
  }

  /**
   * Check if adapter supports the requested channel
   * @param {string} channel
   * @returns {boolean}
   */
  supportsChannel(channel) {
    return false;
  }
}

module.exports = NotificationProviderAdapter;
