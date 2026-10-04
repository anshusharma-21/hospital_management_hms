const NotificationTemplate = require('../../models/NotificationTemplate');
const AuditLog = require('../../models/AuditLog');
const ConsoleNotificationAdapter = require('./adapters/ConsoleNotificationAdapter');
const MockNotificationAdapter = require('./adapters/MockNotificationAdapter');

// Default fallback templates for all 8 standard hospital events
const DEFAULT_TEMPLATES = {
  'Appointment Confirmation': {
    subject: 'Appointment Confirmed - {{hospitalName}}',
    message: 'Dear {{patientName}}, your appointment with {{doctorName}} is confirmed for {{appointmentDate}} at {{appointmentTime}} (Token #{{tokenNumber}}). - {{hospitalName}}'
  },
  'Appointment Reminder': {
    subject: 'Reminder: Upcoming Appointment - {{hospitalName}}',
    message: 'Reminder: Your appointment with {{doctorName}} is scheduled for {{appointmentDate}} at {{appointmentTime}}. Please arrive 15 minutes prior. - {{hospitalName}}'
  },
  'Lab Results Ready': {
    subject: 'Diagnostic Results Ready - {{hospitalName}}',
    message: 'Dear {{patientName}}, your lab diagnostic results for Order #{{orderNumber}} are now verified and ready. You may view them via the patient portal. - {{hospitalName}}'
  },
  'Critical Diagnostic Value Alert': {
    subject: 'URGENT: Critical Diagnostic Alert - {{hospitalName}}',
    message: 'CRITICAL VALUE ALERT: Urgent diagnostic findings reported for Patient {{patientName}} (UHID: {{uhid}}). Attending physician please review immediately.'
  },
  'Discharge Clearance Ready': {
    subject: 'Discharge Clearance Prepared - {{hospitalName}}',
    message: 'Dear {{patientName}}, discharge summary and billing clearance for IPD #{{admissionNumber}} have been prepared. - {{hospitalName}}'
  },
  'Invoice Generated': {
    subject: 'Invoice #{{invoiceNumber}} Generated - {{hospitalName}}',
    message: 'Invoice #{{invoiceNumber}} has been generated for ₹{{amountDue}} for patient {{patientName}}. - {{hospitalName}}'
  },
  'Payment Received Receipt': {
    subject: 'Payment Receipt #{{receiptNumber}} - {{hospitalName}}',
    message: 'Received payment of ₹{{amountPaid}} against Receipt #{{receiptNumber}} for Invoice #{{invoiceNumber}}. Thank you! - {{hospitalName}}'
  },
  'Admission Bed Confirmation': {
    subject: 'IPD Admission Bed Assigned - {{hospitalName}}',
    message: 'Bed {{bedNumber}} in {{wardName}} has been assigned for patient {{patientName}} (Admission #{{admissionNumber}}). - {{hospitalName}}'
  }
};

class NotificationService {
  constructor() {
    this.adapters = new Map();
    // Default registered adapters
    this.adapters.set('console', new ConsoleNotificationAdapter());
    this.adapters.set('mock', new MockNotificationAdapter());
  }

  /**
   * Register or override an adapter
   */
  registerAdapter(name, adapter) {
    this.adapters.set(name.toLowerCase(), adapter);
  }

  /**
   * Normalize channel to standard enum value
   */
  normalizeChannel(channel) {
    if (!channel) return null;
    const lower = channel.toString().toLowerCase().trim();
    if (lower === 'sms') return 'SMS';
    if (lower === 'whatsapp') return 'WhatsApp';
    if (lower === 'email') return 'Email';
    if (lower === 'in-app' || lower === 'in_app' || lower === 'in-app notification') return 'In-App Notification';
    return channel;
  }

  /**
   * Select appropriate provider adapter for a channel
   */
  resolveAdapter(channel) {
    const normChannel = this.normalizeChannel(channel);
    let providerKey = process.env.NOTIFICATION_ADAPTER || (process.env.NODE_ENV === 'test' ? 'mock' : 'console');

    // Check channel-specific provider override
    if (normChannel === 'SMS' && process.env.NOTIFICATION_SMS_PROVIDER) {
      providerKey = process.env.NOTIFICATION_SMS_PROVIDER;
    } else if (normChannel === 'WhatsApp' && process.env.NOTIFICATION_WHATSAPP_PROVIDER) {
      providerKey = process.env.NOTIFICATION_WHATSAPP_PROVIDER;
    } else if (normChannel === 'Email' && process.env.NOTIFICATION_EMAIL_PROVIDER) {
      providerKey = process.env.NOTIFICATION_EMAIL_PROVIDER;
    } else if (normChannel === 'In-App Notification' && process.env.NOTIFICATION_INAPP_PROVIDER) {
      providerKey = process.env.NOTIFICATION_INAPP_PROVIDER;
    }

    const adapter = this.adapters.get(providerKey.toLowerCase());
    if (!adapter) {
      throw new Error(`[NotificationService] No registered adapter found for provider: '${providerKey}'`);
    }

    if (!adapter.supportsChannel(normChannel)) {
      throw new Error(`[NotificationService] Adapter '${providerKey}' does not support channel: '${normChannel}'`);
    }

    return adapter;
  }

  /**
   * Render template string with data values
   */
  interpolate(templateString, data = {}) {
    if (!templateString) return '';
    return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
    });
  }

  /**
   * Core method to send an event-based notification
   */
  async sendNotification({ tenantId, eventName, channel, recipient, data = {}, metadata = {} }) {
    if (!tenantId) {
      throw new Error('[NotificationService] tenantId is required for tenant isolation.');
    }

    const normChannel = this.normalizeChannel(channel);
    const validChannels = ['SMS', 'WhatsApp', 'Email', 'In-App Notification'];
    if (!validChannels.includes(normChannel)) {
      throw new Error(`[NotificationService] Invalid or unsupported channel '${channel}'. Must be one of: ${validChannels.join(', ')}`);
    }

    if (!recipient) {
      throw new Error('[NotificationService] Recipient identifier (phone, email, or user ID) is required.');
    }

    // Resolve template from DB or fallback
    let subject = '';
    let messageTemplate = '';

    try {
      const customTemplate = await NotificationTemplate.findOne({
        tenant: tenantId,
        eventName,
        channel: normChannel,
        isActive: true
      });

      if (customTemplate) {
        subject = customTemplate.subject || '';
        messageTemplate = customTemplate.messageTemplate;
      }
    } catch (err) {
      console.warn(`[NotificationService] Could not query custom template: ${err.message}. Using default.`);
    }

    // Use default fallback if not found in database
    if (!messageTemplate) {
      const fallback = DEFAULT_TEMPLATES[eventName];
      if (fallback) {
        subject = fallback.subject || '';
        messageTemplate = fallback.message || '';
      } else {
        messageTemplate = data.message || `Notification regarding: ${eventName}`;
      }
    }

    const renderedSubject = this.interpolate(subject, data);
    const renderedMessage = this.interpolate(messageTemplate, data);

    const adapter = this.resolveAdapter(normChannel);
    const result = await adapter.send({
      channel: normChannel,
      to: recipient,
      subject: renderedSubject,
      message: renderedMessage,
      tenantId,
      data,
      metadata: { ...metadata, eventName }
    });

    // Asynchronously record delivery audit log without blocking
    AuditLog.create({
      tenant: tenantId,
      action: 'Send Notification',
      module: 'Settings & Config',
      entityType: 'Notification',
      entityId: result.messageId,
      details: `Dispatched ${normChannel} notification for event '${eventName}' via ${result.provider} adapter`,
      timestamp: new Date()
    }).catch(auditErr => {
      console.warn('[NotificationService AuditLog Warning]:', auditErr.message);
    });

    return {
      success: true,
      messageId: result.messageId,
      provider: result.provider,
      channel: normChannel,
      eventName,
      recipient,
      deliveredAt: result.timestamp
    };
  }

  /**
   * Helper: Send SMS directly
   */
  async sendSMS({ tenantId, to, message, data = {}, metadata = {} }) {
    if (!tenantId) throw new Error('[NotificationService] tenantId is required.');
    const adapter = this.resolveAdapter('SMS');
    const rendered = this.interpolate(message, data);
    return adapter.send({
      channel: 'SMS',
      to,
      message: rendered,
      tenantId,
      data,
      metadata
    });
  }

  /**
   * Helper: Send WhatsApp directly
   */
  async sendWhatsApp({ tenantId, to, message, data = {}, metadata = {} }) {
    if (!tenantId) throw new Error('[NotificationService] tenantId is required.');
    const adapter = this.resolveAdapter('WhatsApp');
    const rendered = this.interpolate(message, data);
    return adapter.send({
      channel: 'WhatsApp',
      to,
      message: rendered,
      tenantId,
      data,
      metadata
    });
  }

  /**
   * Helper: Send Email directly
   */
  async sendEmail({ tenantId, to, subject, html, text, data = {}, metadata = {} }) {
    if (!tenantId) throw new Error('[NotificationService] tenantId is required.');
    const adapter = this.resolveAdapter('Email');
    const renderedSubject = this.interpolate(subject, data);
    const renderedBody = this.interpolate(html || text, data);
    return adapter.send({
      channel: 'Email',
      to,
      subject: renderedSubject,
      message: renderedBody,
      tenantId,
      data,
      metadata
    });
  }

  /**
   * Helper: Send In-App notification
   */
  async sendInApp({ tenantId, userId, title, message, link, data = {}, metadata = {} }) {
    if (!tenantId) throw new Error('[NotificationService] tenantId is required.');
    const adapter = this.resolveAdapter('In-App Notification');
    const renderedTitle = this.interpolate(title, data);
    const renderedMessage = this.interpolate(message, data);
    return adapter.send({
      channel: 'In-App Notification',
      to: userId,
      subject: renderedTitle,
      message: renderedMessage,
      tenantId,
      data,
      metadata: { ...metadata, link }
    });
  }

  /**
   * Access the mock adapter (useful for testing)
   */
  getMockAdapter() {
    return this.adapters.get('mock');
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
