const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
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
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bloodPressureSystolic: Number,
  bloodPressureDiastolic: Number,
  pulse: Number,
  temperature: Number,
  respiratoryRate: Number,
  spo2: Number,
  height: Number, // in cm
  weight: Number, // in kg
  bmi: Number,
  bloodSugarRandom: Number,
  bloodSugarFasting: Number,
  painScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  consciousnessLevel: {
    type: String,
    enum: ['Alert', 'Verbal Response', 'Pain Response', 'Unresponsive'],
    default: 'Alert'
  },
  remarks: String
}, { timestamps: true });

// Auto calculate BMI if height and weight present
vitalSchema.pre('save', function(next) {
  if (this.height && this.weight && this.height > 0) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

vitalSchema.index({ tenant: 1, patient: 1, createdAt: -1 });

module.exports = mongoose.model('Vital', vitalSchema);
