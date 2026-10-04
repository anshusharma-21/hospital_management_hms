const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  slotTime: {
    type: String,
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['New Consultation', 'Follow-up', 'Routine Checkup', 'Procedure', 'Walk-in'],
    default: 'New Consultation'
  },
  priority: {
    type: String,
    enum: ['Normal', 'Urgent', 'Senior Citizen', 'Emergency'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'Checked-In', 'In-Consultation', 'Completed', 'Cancelled', 'No-Show'],
    default: 'Scheduled'
  },
  reasonForVisit: String,
  consultationFee: {
    type: Number,
    default: 500
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Waived'],
    default: 'Pending'
  },
  checkInTime: Date,
  consultationStartTime: Date,
  consultationEndTime: Date,
  notes: String,
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

appointmentSchema.index({ tenant: 1, doctor: 1, appointmentDate: 1, slotTime: 1 });
appointmentSchema.index({ tenant: 1, appointmentDate: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
