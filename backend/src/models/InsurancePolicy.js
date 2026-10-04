const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  insuranceProvider: {
    type: String,
    required: true
  },
  tpaName: {
    type: String,
    default: 'Direct Insurance'
  },
  policyNumber: {
    type: String,
    required: true
  },
  policyHolderName: String,
  relationshipToPatient: {
    type: String,
    enum: ['Self', 'Spouse', 'Father', 'Mother', 'Child', 'Corporate Employee'],
    default: 'Self'
  },
  sumInsuredLimit: {
    type: Number,
    default: 500000
  },
  validTill: Date,
  preAuthRequests: [
    {
      preAuthNumber: String,
      requestedAmount: Number,
      approvedAmount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['Pending Review', 'Approved in Full', 'Partially Approved', 'Query Raised by TPA', 'Rejected'],
        default: 'Pending Review'
      },
      tpaRemarks: String,
      requestDate: { type: Date, default: Date.now },
      approvalDate: Date
    }
  ],
  claims: [
    {
      claimNumber: String,
      invoiceNumber: String,
      billAmount: Number,
      claimedAmount: Number,
      settledAmount: { type: Number, default: 0 },
      patientCoPay: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['Draft', 'Submitted to TPA', 'Query Response Submitted', 'Claim Approved & Disbursed', 'Claim Repudiated'],
        default: 'Submitted to TPA'
      },
      settlementDate: Date,
      notes: String
    }
  ]
}, { timestamps: true });

insurancePolicySchema.index({ tenant: 1, patient: 1 });
insurancePolicySchema.index({ tenant: 1, policyNumber: 1 });

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
