const mongoose = require('mongoose');
const { ALLOWED_PLAN_ENUMS, normalizePlan } = require('../constants/subscriptionPlans');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide tenant/hospital organization name'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  legalName: { type: String, trim: true },
  hospitalType: {
    type: String,
    enum: [
      'General Hospital',
      'Multi-Specialty',
      'Super-Specialty',
      'Clinic',
      'Nursing Home',
      'Diagnostic Center',
      'Daycare Surgical',
      'Daycare Surgery Center',
      'Day Care Center'
    ],
    default: 'Multi-Specialty'
  },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  branding: {
    logoUrl: String,
    primaryColor: { type: String, default: '#0d9488' },
    accentColor: { type: String, default: '#0f766e' },
    letterheadHeader: String,
    letterheadFooter: String
  },
  subscription: {
    plan: {
      type: String,
      set: (val) => normalizePlan(val),
      enum: ALLOWED_PLAN_ENUMS,
      default: 'Professional (Up to 100 Beds)'
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'renewal', 'grace_period', 'read_only', 'past_due', 'suspended', 'cancelled'],
      default: 'active'
    },
    maxBeds: { type: Number, default: 100 },
    maxBranches: { type: Number, default: 3 },
    maxUsers: { type: Number, default: 50 },
    billingCycle: { type: String, enum: ['monthly', '6-month', 'semi-annual', 'annual'], default: 'annual' },
    startDate: { type: Date, default: Date.now },
    renewalDate: { type: Date, default: () => new Date(Date.now() + 365*24*60*60*1000) }
  },
  settings: {
    currency: { type: String, default: 'INR (₹)' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    uhidPrefix: { type: String, default: 'HV' },
    invoicePrefix: { type: String, default: 'INV' }
  },
  status: {
    type: String,
    enum: ['active', 'grace_period', 'read_only', 'suspended', 'onboarding', 'offboarded', 'deletion_eligible'],
    default: 'active'
  },
  offboardingMetadata: {
    initiatedAt: Date,
    gracePeriodEndsAt: Date,
    retentionEndsAt: Date,
    deletionEligibleAt: Date,
    reason: String,
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
