const mongoose = require('mongoose');

const nursingRecordSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  admission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  nurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shift: {
    type: String,
    enum: ['Morning Shift (07:00 - 15:00)', 'Evening Shift (15:00 - 23:00)', 'Night Shift (23:00 - 07:00)'],
    required: true
  },
  medicationAdministration: [
    {
      medicationName: String,
      dosage: String,
      scheduledTime: String,
      administeredTime: String,
      status: {
        type: String,
        enum: ['Administered', 'Held / Omitted', 'Refused by Patient', 'Pending'],
        default: 'Administered'
      },
      nurseInitials: String,
      remarks: String
    }
  ],
  intakeOutput: {
    oralFluidsMl: { type: Number, default: 0 },
    ivFluidsMl: { type: Number, default: 0 },
    urineOutputMl: { type: Number, default: 0 },
    drainOutputMl: { type: Number, default: 0 },
    balanceMl: { type: Number, default: 0 }
  },
  nursingNotes: String,
  carePlanTasks: [
    {
      task: String,
      isCompleted: { type: Boolean, default: false },
      completedAt: Date
    }
  ],
  shiftHandoverNotes: String,
  doctorInstructionsAck: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

nursingRecordSchema.index({ tenant: 1, admission: 1, createdAt: -1 });

module.exports = mongoose.model('NursingRecord', nursingRecordSchema);
