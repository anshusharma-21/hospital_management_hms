const mongoose = require('mongoose');

const barcodeReferenceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  referenceCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['PATIENT', 'LAB_SAMPLE', 'PHARMACY_ITEM', 'APPOINTMENT', 'DOCUMENT', 'WRISTBAND', 'INVOICE'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceModel: {
    type: String,
    enum: ['Patient', 'LabOrder', 'Medicine', 'Appointment', 'Invoice', 'DocumentTemplate'],
    required: true
  },
  displayCode: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

barcodeReferenceSchema.index({ tenant: 1, referenceCode: 1 }, { unique: true });
barcodeReferenceSchema.index({ tenant: 1, resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('BarcodeReference', barcodeReferenceSchema);
