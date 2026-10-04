const mongoose = require('mongoose');

const documentTemplateSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  templateType: {
    type: String,
    enum: [
      'Prescription (Rx)',
      'Laboratory Diagnostic Report',
      'Radiology Imaging Report',
      'IPD Discharge Summary',
      'Tax Invoice & Receipt',
      'Admission Consent Form',
      'Medical Certificate'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  headerHtml: String,
  bodyTemplate: String,
  footerHtml: String,
  showHospitalLogo: {
    type: Boolean,
    default: true
  },
  showDoctorSignature: {
    type: Boolean,
    default: true
  },
  showBarcode: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

documentTemplateSchema.index({ tenant: 1, templateType: 1 });

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
