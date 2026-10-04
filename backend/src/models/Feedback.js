const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'Doctor Consultation',
      'Nursing Care',
      'Cleanliness / Hygiene',
      'Billing & Cashier',
      'Lab / Diagnostics',
      'General Feedback',
      'Support Request'
    ],
    default: 'General Feedback'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  feedbackText: {
    type: String,
    required: [true, 'Feedback text is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Resolved'],
    default: 'Submitted'
  },
  response: {
    type: String,
    default: null
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

feedbackSchema.index({ tenant: 1, patient: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
