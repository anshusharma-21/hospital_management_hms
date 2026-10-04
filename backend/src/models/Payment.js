const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  receiptNumber: {
    type: String,
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI / QR Code', 'Credit Card', 'Debit Card', 'Net Banking', 'Insurance TPA Direct', 'Cheque / DD'],
    default: 'Cash'
  },
  paymentType: {
    type: String,
    enum: ['Advance Deposit', 'Bill Settlement', 'Partial Installment', 'Pharmacy Instant'],
    default: 'Bill Settlement'
  },
  transactionReference: String,
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Void / Reversal'],
    default: 'Completed'
  },
  idempotencyKey: {
    type: String,
    trim: true
  },
  refundRecord: {
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, { timestamps: true });

paymentSchema.index({ tenant: 1, receiptNumber: 1 }, { unique: true });
paymentSchema.index(
  { tenant: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
paymentSchema.index({ tenant: 1, invoice: 1 });
paymentSchema.index({ tenant: 1, patient: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
