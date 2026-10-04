const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: String,
  userRole: String,
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: [
      'Auth / Security',
      'Patients',
      'Appointments',
      'Clinical / EMR',
      'Pharmacy',
      'Diagnostics (Lab/Rad)',
      'IPD / Wards',
      'Billing & Cashier',
      'Insurance & TPA',
      'SaaS Platform',
      'Settings & Config'
    ],
    required: true
  },
  entityType: String,
  entityId: String,
  details: String,
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

auditLogSchema.index({ tenant: 1, timestamp: -1 });
auditLogSchema.index({ module: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
