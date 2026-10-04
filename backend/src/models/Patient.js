const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  primaryBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  uhid: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  dob: Date,
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
    default: 'Single'
  },
  phone: {
    type: String,
    required: [true, 'Please provide primary phone number'],
    trim: true
  },
  alternatePhone: String,
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  nationalId: {
    type: String,
    trim: true
  },
  abhaId: {
    type: String,
    trim: true
  },
  allergies: [{
    allergen: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical'], default: 'Moderate' },
    reaction: String
  }],
  chronicConditions: [String],
  insuranceDetails: {
    provider: String,
    policyNumber: String,
    tpaName: String,
    validUntil: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deceased'],
    default: 'active'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isMerged: {
    type: Boolean,
    default: false
  },
  mergedInto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  mergedAt: Date,
  mergedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mergeReason: String,
  mergedFrom: [{
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    uhid: String,
    mergedAt: { type: Date, default: Date.now },
    mergedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String
  }]
}, { timestamps: true });

// Auto-build fullName and derived age if dob given
patientSchema.pre('save', function(next) {
  this.fullName = `${this.firstName} ${this.lastName || ''}`.trim();
  if (this.dob && !this.age) {
    const diffMs = Date.now() - new Date(this.dob).getTime();
    const ageDate = new Date(diffMs);
    this.age = Math.abs(ageDate.getUTCFullYear() - 1970);
  }
  next();
});

patientSchema.index({ tenant: 1, uhid: 1 }, { unique: true });
patientSchema.index({ tenant: 1, phone: 1 });
patientSchema.index({ tenant: 1, fullName: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
