const notificationService = require('./notification/NotificationService');
const paymentService = require('./payment/PaymentService');
const barcodeReferenceService = require('./barcode/BarcodeReferenceService');
const bulkImportService = require('./import/BulkImportService');
const hrmsService = require('./hrms/HRMSService');
const fhirConverterService = require('./interop/FHIRConverterService');
const tenantLifecycleService = require('./privacy/TenantLifecycleService');
const aiService = require('./ai/AIService');

module.exports = {
  notificationService,
  paymentService,
  barcodeReferenceService,
  bulkImportService,
  hrmsService,
  fhirConverterService,
  tenantLifecycleService,
  aiService
};

