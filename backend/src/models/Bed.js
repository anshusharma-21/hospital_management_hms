const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
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
  building: {
    type: String,
    default: 'Main Tower'
  },
  floor: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
  },
  wardType: {
    type: String,
    enum: ['General Male', 'General Female', 'Semi-Private', 'Private Deluxe', 'ICU', 'NICU', 'Emergency', 'Post-Op / Recovery'],
    default: 'General Male'
  },
  roomNumber: {
    type: String,
    required: true
  },
  bedNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance', 'Blocked'],
    default: 'Available'
  },
  ratePerDay: {
    type: Number,
    default: 1500
  },
  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  currentAdmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  lastSanitizedAt: Date
}, { timestamps: true });

bedSchema.index({ tenant: 1, branch: 1, bedNumber: 1 }, { unique: true });
bedSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('Bed', bedSchema);
