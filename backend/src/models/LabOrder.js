const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
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
  tests: [
    {
      testCode: String,
      testName: { type: String, required: true },
      category: {
        type: String,
        enum: ['Biochemistry', 'Hematology', 'Microbiology', 'Pathology', 'Serology', 'Immunology', 'Urinalysis'],
        default: 'Hematology'
      },
      sampleType: {
        type: String,
        default: 'Blood (Whole/Serum)'
      },
      resultValue: String,
      unit: String,
      referenceRange: String,
      isAbnormal: { type: Boolean, default: false },
      isCritical: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['Ordered', 'Sample Collected', 'Processing', 'Verified', 'Completed'],
        default: 'Ordered'
      }
    }
  ],
  sampleBarcode: String,
  sampleCollectedAt: Date,
  sampleCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  overallStatus: {
    type: String,
    enum: ['Ordered', 'Sample Collected', 'In-Processing', 'Completed', 'Cancelled'],
    default: 'Ordered'
  },
  criticalAlert: {
    type: Boolean,
    default: false
  },
  clinicalNotes: String,
  pathologistRemarks: String
}, { timestamps: true });

labOrderSchema.index({ tenant: 1, patient: 1 });
labOrderSchema.index({ tenant: 1, orderNumber: 1 }, { unique: true });
labOrderSchema.index({ tenant: 1, sampleBarcode: 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);
