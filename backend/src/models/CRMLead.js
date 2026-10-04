const mongoose = require('mongoose');

const crmLeadSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  prospectName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: String,
  interestCategory: {
    type: String,
    enum: [
      'Comprehensive Health Checkup Package',
      'Cardiac Wellness Screening',
      'Diabetes & Metabolic Health',
      'Orthopedic Joint Consult',
      'Maternity / Birthing Package',
      'Corporate Employee Camp'
    ],
    default: 'Comprehensive Health Checkup Package'
  },
  source: {
    type: String,
    enum: ['Website Form', 'Direct Phone Call', 'Health Camp', 'Referral / Walk-in', 'Corporate Drive'],
    default: 'Website Form'
  },
  status: {
    type: String,
    enum: ['New Inquiry', 'Contacted / Follow-up', 'Appointment Scheduled', 'Converted to Patient', 'Lost / Disqualified'],
    default: 'New Inquiry'
  },
  assignedExecutive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, { timestamps: true });

crmLeadSchema.index({ tenant: 1, phone: 1 });
crmLeadSchema.index({ tenant: 1, status: 1 });

module.exports = mongoose.model('CRMLead', crmLeadSchema);
