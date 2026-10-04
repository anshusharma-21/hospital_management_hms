const NotificationProviderAdapter = require('./NotificationProviderAdapter');

class ConsoleNotificationAdapter extends NotificationProviderAdapter {
  constructor() {
    super('console');
  }

  supportsChannel(channel) {
    // Console adapter safely supports all standard channels for local dev
    return ['SMS', 'WhatsApp', 'Email', 'In-App Notification'].includes(channel);
  }

  async send({ channel, to, subject, message, tenantId, metadata }) {
    const timestamp = new Date();
    const messageId = `console_notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`[Notification Delivery (${channel})] To: ${to} | Tenant: ${tenantId}`);
    if (subject) {
      console.log(`  Subject: ${subject}`);
    }
    console.log(`  Message: ${message}`);

    return {
      success: true,
      messageId,
      provider: 'console',
      channel,
      recipient: to,
      timestamp
    };
  }
}

module.exports = ConsoleNotificationAdapter;
