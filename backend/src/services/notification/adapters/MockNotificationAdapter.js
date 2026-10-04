const NotificationProviderAdapter = require('./NotificationProviderAdapter');

class MockNotificationAdapter extends NotificationProviderAdapter {
  constructor() {
    super('mock');
    this.sentNotifications = [];
  }

  supportsChannel(channel) {
    return ['SMS', 'WhatsApp', 'Email', 'In-App Notification'].includes(channel);
  }

  async send({ channel, to, subject, message, tenantId, metadata }) {
    const timestamp = new Date();
    const messageId = `mock_notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const record = {
      messageId,
      provider: 'mock',
      channel,
      recipient: to,
      subject: subject || null,
      message,
      tenantId: tenantId ? tenantId.toString() : null,
      metadata: metadata || {},
      timestamp
    };

    this.sentNotifications.push(record);

    return {
      success: true,
      messageId,
      provider: 'mock',
      channel,
      recipient: to,
      timestamp
    };
  }

  getSentNotifications(filter = {}) {
    return this.sentNotifications.filter(item => {
      if (filter.channel && item.channel !== filter.channel) return false;
      if (filter.recipient && item.recipient !== filter.recipient) return false;
      if (filter.tenantId && item.tenantId !== filter.tenantId.toString()) return false;
      return true;
    });
  }

  clear() {
    this.sentNotifications = [];
  }
}

module.exports = MockNotificationAdapter;
