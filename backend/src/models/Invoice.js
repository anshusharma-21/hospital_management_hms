const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  encounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter'
  },
  admission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  billingType: {
    type: String,
    enum: ['OPD Consultation', 'IPD Stay & Treatment', 'Pharmacy POS', 'Laboratory Diagnostics', 'Radiology Imaging', 'Emergency Triage', 'Package / Surgery'],
    default: 'OPD Consultation'
  },
  items: [
    {
      description: { type: String, required: true },
      department: String,
      serviceCategory: {
        type: String,
        enum: ['Consultation', 'Lab Test', 'Radiology Scan', 'Bed Charges', 'Nursing Care', 'Pharmacy / Drugs', 'OT & Surgical', 'Procedure Fee', 'Equipment / Consumable'],
        default: 'Consultation'
      },
      quantity: { type: Number, default: 1 },
      unitPrice: { type: Number, required: true },
      discountAmount: { type: Number, default: 0 },
      taxPercent: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  discountReason: String,
  discountApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalTax: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    required: true
  },
  payerType: {
    type: String,
    enum: ['Self-Pay (Cash / UPI / Card)', 'Insurance / TPA Corporate', 'Government Scheme / Ayushman', 'Charity / Concession'],
    default: 'Self-Pay (Cash / UPI / Card)'
  },
  status: {
    type: String,
    enum: ['Draft', 'Finalized', 'Partially Paid', 'Fully Paid', 'Cancelled', 'Refunded'],
    default: 'Finalized'
  },
  isImmutable: {
    type: Boolean,
    default: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

invoiceSchema.index({ tenant: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenant: 1, patient: 1 });
invoiceSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
