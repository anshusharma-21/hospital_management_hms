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
  bloodPressureSystolic: {
    type: Number,
    min: [50, 'Systolic blood pressure cannot be lower than 50 mmHg'],
    max: [260, 'Systolic blood pressure cannot exceed 260 mmHg']
  },
  bloodPressureDiastolic: {
    type: Number,
    min: [30, 'Diastolic blood pressure cannot be lower than 30 mmHg'],
    max: [160, 'Diastolic blood pressure cannot exceed 160 mmHg']
  },
  pulse: {
    type: Number,
    min: [30, 'Heart rate/pulse cannot be lower than 30 bpm'],
    max: [250, 'Heart rate/pulse cannot exceed 250 bpm']
  },
  temperature: {
    type: Number,
    min: [85, 'Temperature cannot be lower than 85°F'],
    max: [112, 'Temperature cannot exceed 112°F']
  },
  respiratoryRate: {
    type: Number,
    min: [4, 'Respiratory rate cannot be lower than 4 breaths/min'],
    max: [80, 'Respiratory rate cannot exceed 80 breaths/min']
  },
  spo2: {
    type: Number,
    min: [50, 'SpO2 oxygen saturation cannot be lower than 50%'],
    max: [100, 'SpO2 oxygen saturation cannot exceed 100%']
  },
  height: {
    type: Number, // in cm
    min: [30, 'Height cannot be lower than 30 cm'],
    max: [280, 'Height cannot exceed 280 cm']
  },
  weight: {
    type: Number, // in kg
    min: [0.5, 'Weight cannot be lower than 0.5 kg'],
    max: [400, 'Weight cannot exceed 400 kg']
  },
  bmi: Number,
  bloodSugarRandom: {
    type: Number,
    min: [20, 'Blood sugar cannot be lower than 20 mg/dL'],
    max: [1000, 'Blood sugar cannot exceed 1000 mg/dL']
  },
  bloodSugarFasting: {
    type: Number,
    min: [20, 'Fasting blood sugar cannot be lower than 20 mg/dL'],
    max: [1000, 'Fasting blood sugar cannot exceed 1000 mg/dL']
  },
  painScore: {
    type: Number,
    min: [0, 'Pain score cannot be less than 0'],
    max: [10, 'Pain score cannot exceed 10'],
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
