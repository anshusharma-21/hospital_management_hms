const mongoose = require('mongoose');

const encounterSchema = new mongoose.Schema({
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  encounterNumber: {
    type: String,
    required: true
  },
  encounterType: {
    type: String,
    enum: ['OPD', 'IPD', 'Emergency', 'Follow-up', 'Procedure', 'Diagnostic'],
    default: 'OPD'
  },
  chiefComplaint: String,
  historyOfPresentIllness: String,
  examinationFindings: String,
  systemicReview: String,
  clinicalNotes: String,
  followUpDate: Date,
  followUpInstructions: String,
  status: {
    type: String,
    enum: ['In-Progress', 'Completed', 'Cancelled'],
    default: 'In-Progress'
  },
  finalizedAt: Date
}, { timestamps: true });

encounterSchema.index({ tenant: 1, patient: 1 });
encounterSchema.index({ tenant: 1, encounterNumber: 1 });

module.exports = mongoose.model('Encounter', encounterSchema);
