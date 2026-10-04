const mongoose = require('mongoose');

const corporateAccountSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: String,
  email: String,
  phone: String,
  creditLimit: {
    type: Number,
    default: 1000000
  },
  currentOutstanding: {
    type: Number,
    default: 0
  },
  agreedDiscountPercent: {
    type: Number,
    default: 10
  },
  creditPeriodDays: {
    type: Number,
    default: 30
  },
  mouValidTill: Date,
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired'],
    default: 'active'
  }
}, { timestamps: true });

corporateAccountSchema.index({ tenant: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('CorporateAccount', corporateAccountSchema);
