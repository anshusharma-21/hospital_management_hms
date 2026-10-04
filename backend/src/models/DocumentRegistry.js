const mongoose = require('mongoose');

const documentRegistrySchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant is required for document registry'],
    index: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required for medical document'],
    index: true
  },
  documentType: {
    type: String,
    enum: [
      'Prescription',
      'Lab report',
      'Radiology report',
      'Invoice',
      'Payment receipt',
      'Registration receipt',
      'Admission form',
      'Consent form',
      'Discharge summary',
      'Medical certificate',
      'Estimate',
      'Insurance documents'
    ],
    required: [true, 'Document type is required'],
    index: true
  },
  documentNumber: {
    type: String,
    required: [true, 'Unique document reference number is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  // Secure private reference key - NEVER a public URL
  storageKey: {
    type: String,
    required: [true, 'Private storage key / vault reference is required'],
    trim: true
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  fileSizeBytes: {
    type: Number,
    default: 0
  },
  checksum: {
    type: String,
    default: null
  },
  entityReference: {
    entityType: { type: String }, // e.g. 'Prescription', 'LabOrder', 'Invoice', 'Admission'
    entityId: { type: String }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  accessControl: {
    isRestricted: { type: Boolean, default: false },
    allowedRoles: [{ type: String }]
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'revoked'],
    default: 'active'
  }
}, { timestamps: true });

documentRegistrySchema.index({ tenant: 1, patient: 1, documentType: 1 });
documentRegistrySchema.index({ tenant: 1, documentNumber: 1 });

module.exports = mongoose.model('DocumentRegistry', documentRegistrySchema);
