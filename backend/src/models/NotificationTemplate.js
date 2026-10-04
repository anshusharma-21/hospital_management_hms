const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  eventName: {
    type: String,
    enum: [
      'Appointment Confirmation',
      'Appointment Reminder',
      'Lab Results Ready',
      'Critical Diagnostic Value Alert',
      'Discharge Clearance Ready',
      'Invoice Generated',
      'Payment Received Receipt',
      'Admission Bed Confirmation'
    ],
    required: true
  },
  channel: {
    type: String,
    enum: ['SMS', 'WhatsApp', 'Email', 'In-App Notification'],
    required: true
  },
  subject: String,
  messageTemplate: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

notificationTemplateSchema.index({ tenant: 1, eventName: 1, channel: 1 });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
