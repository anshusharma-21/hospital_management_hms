const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
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
  prescriptionNumber: {
    type: String,
    required: true
  },
  diagnosis: String,
  medications: [
    {
      medicineName: { type: String, required: true },
      genericName: String,
      dosage: { type: String, required: true },
      form: {
        type: String,
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Inhaler', 'Drops', 'Other'],
        default: 'Tablet'
      },
      route: {
        type: String,
        enum: ['Oral', 'Intravenous (IV)', 'Intramuscular (IM)', 'Subcutaneous', 'Topical', 'Inhalation'],
        default: 'Oral'
      },
      frequency: {
        type: String,
        enum: ['Once daily (OD)', 'Twice daily (BD)', 'Thrice daily (TDS)', 'Four times daily (QID)', 'As needed (SOS)', 'At bedtime (HS)'],
        default: 'Twice daily (BD)'
      },
      duration: { type: String, default: '5 Days' },
      quantity: { type: Number, default: 10 },
      instructions: {
        type: String,
        default: 'After Food',
        set: v => (v && typeof v === 'string' && v.trim() ? v.trim() : 'After Food')
      },
      dispensedStatus: {
        type: String,
        enum: ['Pending', 'Partially Dispensed', 'Fully Dispensed'],
        default: 'Pending'
      }
    }
  ],
  dietAdvice: String,
  generalAdvice: String,
  isFinalized: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  signedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

prescriptionSchema.index({ tenant: 1, patient: 1 });
prescriptionSchema.index({ tenant: 1, prescriptionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
