const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  moduleKey: {
    type: String,
    enum: [
      'module_laboratory',
      'module_lab',
      'module_radiology',
      'module_pharmacy',
      'module_ipd_wards',
      'module_icu',
      'module_emergency',
      'module_ot',
      'module_ot_surgery',
      'module_insurance_tpa',
      'module_insurance',
      'module_patient_portal',
      'module_ai_assistant',
      'module_ai_copilot',
      'module_crm_corporate',
      'module_crm'
    ],
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  configurationJson: {
    type: String,
    default: '{}'
  }
}, { timestamps: true });

featureFlagSchema.index({ tenant: 1, moduleKey: 1 }, { unique: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
