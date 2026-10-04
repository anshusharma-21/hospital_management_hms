const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide branch name'],
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  branchType: {
    type: String,
    enum: ['Main Hospital', 'Satellite Clinic', 'Diagnostic Center', 'Day Care Center'],
    default: 'Main Hospital'
  },
  isMain: {
    type: Boolean,
    default: false
  },
  parentBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  bedCapacity: {
    type: Number,
    default: 50
  },
  hasEmergency: {
    type: Boolean,
    default: true
  },
  hasICU: {
    type: Boolean,
    default: true
  },
  hasOT: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

branchSchema.pre('save', function (next) {
  if (this.branchType === 'Main Hospital' || this.code === 'MAIN') {
    this.isMain = true;
  }
  next();
});

branchSchema.index({ tenant: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
