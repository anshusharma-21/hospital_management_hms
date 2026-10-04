const mongoose = require('mongoose');

const radiologyOrderSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
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
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  modality: {
    type: String,
    enum: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Echocardiogram', 'Mammography', 'Fluoroscopy'],
    required: true
  },
  bodyPart: {
    type: String,
    required: true
  },
  clinicalIndication: String,
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT (Emergency)'],
    default: 'Routine'
  },
  status: {
    type: String,
    enum: ['Ordered', 'Worklist', 'In-Acquisition', 'Acquired', 'Reported', 'Finalized'],
    default: 'Ordered'
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acquiredAt: Date,
  radiologist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedAt: Date,
  findings: String,
  impression: String,
  criticalFinding: {
    type: Boolean,
    default: false
  },
  criticalAlertRemarks: String,
  dicomAccessionNumber: String,
  pacViewerUrl: String
}, { timestamps: true });

radiologyOrderSchema.index({ tenant: 1, patient: 1 });
radiologyOrderSchema.index({ tenant: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('RadiologyOrder', radiologyOrderSchema);
