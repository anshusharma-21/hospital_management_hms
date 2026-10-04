const express = require('express');
const router = express.Router();
const {
  getSaasStats,
  getFeatureFlags,
  toggleFeatureFlag,
  getApprovals,
  updateApproval,
  getAuditLogs,
  getCRMLeads,
  createCRMLead,
  getCorporateAccounts,
  createCorporateAccount,
  getDocumentTemplates,
  saveDocumentTemplate,
  getNotificationTemplates,
  saveNotificationTemplate
} = require('../controllers/saasPlatformController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// SaaS Executive Stats
router.get('/stats', getSaasStats);

// Feature Flags
router.route('/feature-flags')
  .get(getFeatureFlags)
  .put(toggleFeatureFlag);

// Approvals Inbox
router.route('/approvals')
  .get(getApprovals);
router.put('/approvals/:id', updateApproval);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// CRM & Corporate
router.route('/crm')
  .get(getCRMLeads)
  .post(createCRMLead);

router.route('/corporate-accounts')
  .get(getCorporateAccounts)
  .post(createCorporateAccount);

// Templates
router.route('/document-templates')
  .get(getDocumentTemplates)
  .post(saveDocumentTemplate);

router.route('/notification-templates')
  .get(getNotificationTemplates)
  .post(saveNotificationTemplate);

module.exports = router;
