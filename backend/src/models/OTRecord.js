const mongoose = require('mongoose');

const otRecordSchema = new mongoose.Schema({
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
  otBookingNumber: {
    type: String,
    required: true
  },
  theatreRoom: {
    type: String,
    enum: ['OT-1 (Major Cardiac / Neuro)', 'OT-2 (Orthopedic / Joint Replacement)', 'OT-3 (General & Laparoscopy)', 'OT-4 (Obstetrics & Gynecology)', 'OT-5 (Ophthalmology & Minor)'],
    default: 'OT-3 (General & Laparoscopy)'
  },
  procedureName: {
    type: String,
    required: true
  },
  leadSurgeon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  anaesthetist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scrubNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  anaesthesiaType: {
    type: String,
    enum: ['General Anaesthesia (GA)', 'Spinal / Regional Anaesthesia', 'Epidural Anaesthesia', 'Local Anaesthesia (LA)', 'MAC / Sedation'],
    default: 'General Anaesthesia (GA)'
  },
  preOpChecklist: {
    consentSigned: { type: Boolean, default: true },
    fastingVerified: { type: Boolean, default: true },
    pacFitnessCleared: { type: Boolean, default: true },
    bloodCrossmatchedUnits: { type: Number, default: 0 },
    siteMarkingDone: { type: Boolean, default: true }
  },
  implantsAndConsumables: [
    {
      itemName: String,
      serialLotNumber: String,
      quantity: Number,
      cost: Number
    }
  ],
  surgicalTechniqueNotes: String,
  postOpRecoveryStatus: String,
  status: {
    type: String,
    enum: ['Scheduled', 'Pre-Op Holding', 'Under Surgery', 'PACU Recovery', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  }
}, { timestamps: true });

otRecordSchema.index({ tenant: 1, otBookingNumber: 1 }, { unique: true });
otRecordSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('OTRecord', otRecordSchema);
