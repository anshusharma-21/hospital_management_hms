const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  requestType: {
    type: String,
    enum: ['Billing Discount', 'Fee Waiver', 'Payment Refund', 'Privileged Record Amendment', 'Bed Transfer Override'],
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approverRole: {
    type: String,
    default: 'hospital_admin'
  },
  amount: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  decisionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  decisionNotes: String,
  decisionDate: Date,
  entityReference: {
    entityType: String,
    entityId: String
  }
}, { timestamps: true });

approvalRequestSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
