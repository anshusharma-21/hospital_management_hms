const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  name: {
    type: String,
    required: [true, 'Please provide medicine brand name'],
    trim: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Antibiotics / Antiviral',
      'Analgesics / Pain Relief',
      'Cardiovascular & Hypertension',
      'Endocrine & Antidiabetic',
      'Gastrointestinal',
      'Respiratory & Bronchodilators',
      'IV Fluids & Electrolytes',
      'Emergency & Resuscitation',
      'Surgical Consumables & Dressings'
    ],
    default: 'Analgesics / Pain Relief'
  },
  dosageForm: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection Vial', 'IV Infusion', 'Topical Ointment', 'Inhaler', 'Drops'],
    default: 'Tablet'
  },
  strength: {
    type: String,
    required: true
  },
  manufacturer: String,
  unitPrice: {
    type: Number,
    required: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 50
  },
  batches: [
    {
      batchNumber: { type: String, required: true },
      expiryDate: { type: Date, required: true },
      quantity: { type: Number, required: true },
      purchaseRate: Number,
      mrp: Number
    }
  ],
  taxPercent: {
    type: Number,
    default: 12
  },
  requiresPrescription: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'discontinued'],
    default: 'active'
  }
}, { timestamps: true });

medicineSchema.index({ tenant: 1, name: 1 });
medicineSchema.index({ tenant: 1, genericName: 1 });
medicineSchema.index({ tenant: 1, stockQuantity: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
