const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
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
  admissionNumber: {
    type: String,
    required: true
  },
  attendingDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: Date,
  admissionType: {
    type: String,
    enum: ['Emergency', 'Elective', 'Day Care', 'Referral / Transfer'],
    default: 'Elective'
  },
  diagnosisAtAdmission: String,
  admittingRemarks: String,
  initialDeposit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Admitted', 'Transferred', 'Discharged', 'DAMA/LAMA', 'Deceased'],
    default: 'Admitted'
  },
  departmentClearances: {
    clinical: { cleared: { type: Boolean, default: false }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, clearedAt: Date },
    nursing: { cleared: { type: Boolean, default: false }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, clearedAt: Date },
    pharmacy: { cleared: { type: Boolean, default: false }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, clearedAt: Date },
    lab: { cleared: { type: Boolean, default: false }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, clearedAt: Date },
    billing: { cleared: { type: Boolean, default: false }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, clearedAt: Date }
  },
  dischargeSummary: {
    finalDiagnosis: String,
    treatmentCourse: String,
    conditionAtDischarge: {
      type: String,
      enum: ['Stable / Recovered', 'Improved', 'Unchanged', 'Guarded / Critical', 'Expired', 'Referred to Higher Center'],
      default: 'Stable / Recovered'
    },
    dischargeMedications: String,
    followUpDate: Date,
    followUpInstructions: String,
    emergencySignsToReport: String
  }
}, { timestamps: true });

admissionSchema.index({ tenant: 1, patient: 1 });
admissionSchema.index({ tenant: 1, admissionNumber: 1 }, { unique: true });
admissionSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
