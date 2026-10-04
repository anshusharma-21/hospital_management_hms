const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: [
      'super_admin',
      'saas_admin',
      'org_admin',
      'hospital_admin',
      'branch_admin',
      'doctor',
      'nurse',
      'receptionist',
      'lab_tech',
      'radiologist',
      'pharmacist',
      'billing_cashier',
      'patient'
    ],
    default: 'receptionist'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  doctorProfile: {
    specialty: String,
    qualification: String,
    registrationNumber: String,
    consultationFee: { type: Number, default: 500 },
    opdRoom: String,
    schedule: [
      {
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: String,
        endTime: String,
        slotDurationMinutes: { type: Number, default: 15 }
      }
    ]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const { getJwtSecret, getJwtExpire } = require('../config/jwt');

// Sign JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      tenant: this.tenant,
      branch: this.branch
    },
    getJwtSecret(),
    { expiresIn: getJwtExpire() }
  );
};

module.exports = mongoose.model('User', userSchema);
