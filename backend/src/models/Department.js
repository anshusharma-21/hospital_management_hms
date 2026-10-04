const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  name: {
    type: String,
    required: [true, 'Please provide department name'],
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  departmentType: {
    type: String,
    enum: ['Clinical', 'Diagnostic', 'Nursing', 'Administrative', 'Support'],
    default: 'Clinical'
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  floor: String,
  wing: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

departmentSchema.index({ tenant: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
