const mongoose = require('mongoose');

const emergencyEncounterSchema = new mongoose.Schema({
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
  emergencyNumber: {
    type: String,
    required: true
  },
  triageLevel: {
    type: String,
    enum: [
      'Level 1: Red (Immediate Resuscitation)',
      'Level 2: Yellow (Urgent / High Risk)',
      'Level 3: Green (Stable / Non-Urgent)'
    ],
    default: 'Level 2: Yellow (Urgent / High Risk)'
  },
  arrivalTime: {
    type: Date,
    default: Date.now
  },
  modeOfArrival: {
    type: String,
    enum: ['Ambulance (108 / EMS)', 'Private Vehicle', 'Walk-in', 'Wheelchair', 'Stretcher'],
    default: 'Walk-in'
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  glasgowComaScale: {
    type: Number,
    min: 3,
    max: 15,
    default: 15
  },
  attendingPhysician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Triage Completed', 'Under Resuscitation', 'Stabilized / Observing', 'Admitted', 'Discharged', 'Transferred'],
    default: 'Triage Completed'
  },
  disposition: {
    type: String,
    enum: ['Pending Assessment', 'Admit to ICU', 'Admit to Ward', 'Emergency OT', 'Discharge with Prescriptions', 'Refer to Higher Specialty', 'DAMA/LAMA'],
    default: 'Pending Assessment'
  },
  dispositionNotes: String,
  dispositionTimestamp: Date
}, { timestamps: true });

emergencyEncounterSchema.index({ tenant: 1, emergencyNumber: 1 }, { unique: true });
emergencyEncounterSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('EmergencyEncounter', emergencyEncounterSchema);
