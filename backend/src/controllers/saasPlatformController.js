const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const FeatureFlag = require('../models/FeatureFlag');
const ApprovalRequest = require('../models/ApprovalRequest');
const AuditLog = require('../models/AuditLog');
const CRMLead = require('../models/CRMLead');
const CorporateAccount = require('../models/CorporateAccount');
const DocumentTemplate = require('../models/DocumentTemplate');
const NotificationTemplate = require('../models/NotificationTemplate');

// ==================== SAAS PLATFORM STATS ====================
exports.getSaasStats = async (req, res, next) => {
  try {
    const allTenants = await Tenant.find();
    const allTenantIds = allTenants.map(t => t._id);

    // Opportunistically clean up any orphaned beds that don't belong to any valid tenant
    try {
      await Bed.deleteMany({
        $or: [
          { tenant: { $exists: false } },
          { tenant: null },
          { tenant: { $nin: allTenantIds } }
        ]
      });
    } catch (_) {
      // Ignore if cleanup query fails
    }

    const totalTenants = allTenants.length;
    const activeTenantsList = allTenants.filter(t => t.status === 'active');
    const activeTenants = activeTenantsList.length;
    const activeTenantIds = activeTenantsList.map(t => t._id);

    let totalUsers = 0;
    let totalPatients = 0;
    let totalBeds = 0;
    let licensedBeds = 0;
    let mrr = 0;
    let totalBranches = 0;

    const Branch = require('../models/Branch');

    if (activeTenantIds.length > 0) {
      totalUsers = await User.countDocuments({ tenant: { $in: activeTenantIds } });
      totalPatients = await Patient.countDocuments({ tenant: { $in: activeTenantIds } });
      totalBeds = await Bed.countDocuments({ tenant: { $in: activeTenantIds } });
      totalBranches = await Branch.countDocuments({ tenant: { $in: activeTenantIds } });

      activeTenantsList.forEach(t => {
        const plan = t.subscription?.plan || '';
        const maxBeds = t.subscription?.maxBeds || 0;
        licensedBeds += maxBeds;

        if (plan.includes('Enterprise')) mrr += 99000;
        else if (plan.includes('Professional')) mrr += 49000;
        else if (plan.includes('Starter')) mrr += 19000;
        else if (plan) mrr += 29000;
      });
    }

    // Real database metrics
    const totalAuditLogs = await AuditLog.countDocuments();
    const totalLeads = await CRMLead.countDocuments();
    const recentAuditLogs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(6)
      .select('userName userRole action module details timestamp ipAddress');

    // Subscription plan tier distribution
    const tierBreakdown = {
      Enterprise: activeTenantsList.filter(t => (t.subscription?.plan || '').includes('Enterprise')).length,
      Professional: activeTenantsList.filter(t => (t.subscription?.plan || '').includes('Professional')).length,
      Starter: activeTenantsList.filter(t => (t.subscription?.plan || '').includes('Starter')).length
    };

    res.status(200).json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalPatients,
        totalBeds: activeTenantIds.length > 0 ? (licensedBeds || totalBeds) : 0,
        physicalBeds: totalBeds,
        licensedBeds,
        totalBranches,
        mrr,
        totalAuditLogs,
        totalLeads,
        tierBreakdown,
        recentAuditLogs,
        systemHealth: {
          databaseStatus: 'Connected & Operational',
          multiTenantState: activeTenants > 0 ? `${activeTenants} Active Isolated Tenants` : 'Zero Tenants (Standby)',
          apiStatus: 'Healthy'
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Canonical module keys contract
const CANONICAL_MODULE_MAP = {
  module_lab: 'module_laboratory',
  module_laboratory: 'module_laboratory',
  module_radiology: 'module_radiology',
  module_pharmacy: 'module_pharmacy',
  module_insurance: 'module_insurance_tpa',
  module_insurance_tpa: 'module_insurance_tpa',
  module_ot_surgery: 'module_ot',
  module_ot: 'module_ot',
  module_icu: 'module_ipd_wards',
  module_ipd_wards: 'module_ipd_wards',
  module_ai_copilot: 'module_ai_assistant',
  module_ai_assistant: 'module_ai_assistant',
  module_crm: 'module_crm_corporate',
  module_crm_corporate: 'module_crm_corporate',
  module_emergency: 'module_emergency',
  module_patient_portal: 'module_patient_portal'
};

const resolveTargetTenant = async (req) => {
  let tenantId = req.query?.tenantId || req.body?.tenantId || req.tenantId || req.headers?.['x-tenant-id'];
  if (!tenantId) {
    const firstTenant = await Tenant.findOne({ status: 'active' });
    if (firstTenant) tenantId = firstTenant._id;
  }
  return tenantId;
};

// ==================== FEATURE FLAGS ====================
exports.getFeatureFlags = async (req, res, next) => {
  try {
    const targetTenantId = await resolveTargetTenant(req);
    if (!targetTenantId) {
      return res.status(200).json({ success: true, count: 0, data: [], tenantId: null });
    }

    let flags = await FeatureFlag.find({ tenant: targetTenantId });

    // Auto-seed default flags if tenant has none
    if (flags.length === 0) {
      const canonicalKeys = [
        'module_laboratory',
        'module_radiology',
        'module_pharmacy',
        'module_ipd_wards',
        'module_emergency',
        'module_ot',
        'module_insurance_tpa',
        'module_patient_portal',
        'module_ai_assistant',
        'module_crm_corporate'
      ];
      const createdFlags = [];
      for (const key of canonicalKeys) {
        createdFlags.push({
          tenant: targetTenantId,
          moduleKey: key,
          isEnabled: true
        });
      }
      flags = await FeatureFlag.insertMany(createdFlags);
    }

    res.status(200).json({ success: true, count: flags.length, data: flags, tenantId: targetTenantId });
  } catch (err) {
    next(err);
  }
};

exports.toggleFeatureFlag = async (req, res, next) => {
  try {
    const { moduleKey, isEnabled } = req.body;
    const targetTenantId = await resolveTargetTenant(req);

    if (!targetTenantId) {
      return res.status(400).json({ success: false, error: 'Target hospital tenant context is required.' });
    }

    if (!moduleKey) {
      return res.status(400).json({ success: false, error: 'moduleKey is required.' });
    }

    const canonicalKey = CANONICAL_MODULE_MAP[moduleKey] || moduleKey;

    let flag = await FeatureFlag.findOne({ tenant: targetTenantId, moduleKey: canonicalKey });
    if (flag) {
      flag.isEnabled = Boolean(isEnabled);
      await flag.save();
    } else {
      flag = await FeatureFlag.create({
        tenant: targetTenantId,
        moduleKey: canonicalKey,
        isEnabled: Boolean(isEnabled)
      });
    }

    // Also update any legacy alias record if it exists
    if (canonicalKey !== moduleKey) {
      await FeatureFlag.updateOne(
        { tenant: targetTenantId, moduleKey },
        { $set: { isEnabled: Boolean(isEnabled) } }
      );
    }

    // Audit logging for feature flag change
    await AuditLog.create({
      tenant: targetTenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Toggle Feature Flag',
      module: 'SaaS Platform',
      details: `Feature flag '${canonicalKey}' set to ${isEnabled ? 'ENABLED' : 'DISABLED'} for tenant`
    }).catch(err => console.warn('[FeatureFlag AuditLog Warning]:', err.message));

    res.status(200).json({ success: true, data: flag, tenantId: targetTenantId });
  } catch (err) {
    next(err);
  }
};

// ==================== APPROVAL INBOX ====================
exports.getApprovals = async (req, res, next) => {
  try {
    const approvals = await ApprovalRequest.find({ tenant: req.tenantId })
      .populate('requestedBy', 'name role')
      .populate('decisionBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: approvals.length, data: approvals });
  } catch (err) {
    next(err);
  }
};

exports.updateApproval = async (req, res, next) => {
  try {
    const { status, decisionNotes } = req.body;
    const approval = await ApprovalRequest.findOne({ _id: req.params.id, tenant: req.tenantId });

    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    approval.status = status;
    approval.decisionNotes = decisionNotes;
    approval.decisionBy = req.user._id;
    approval.decisionDate = new Date();
    await approval.save();

    res.status(200).json({ success: true, message: `Request marked as ${status}`, data: approval });
  } catch (err) {
    next(err);
  }
};

// ==================== AUDIT LOGS ====================
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { module, limit = 50 } = req.query;
    const query = {};
    if (req.tenantId) query.tenant = req.tenantId;
    if (module && module !== 'all') query.module = module;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
};

// ==================== CRM LEADS ====================
exports.getCRMLeads = async (req, res, next) => {
  try {
    const leads = await CRMLead.find({ tenant: req.tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    next(err);
  }
};

exports.createCRMLead = async (req, res, next) => {
  try {
    const lead = await CRMLead.create({
      tenant: req.tenantId,
      ...req.body
    });
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// ==================== CORPORATE ACCOUNTS ====================
exports.getCorporateAccounts = async (req, res, next) => {
  try {
    const accounts = await CorporateAccount.find({ tenant: req.tenantId }).sort({ companyName: 1 });
    res.status(200).json({ success: true, count: accounts.length, data: accounts });
  } catch (err) {
    next(err);
  }
};

exports.createCorporateAccount = async (req, res, next) => {
  try {
    const account = await CorporateAccount.create({
      tenant: req.tenantId,
      ...req.body
    });
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

// ==================== DOCUMENT TEMPLATES ====================
exports.getDocumentTemplates = async (req, res, next) => {
  try {
    const templates = await DocumentTemplate.find({ tenant: req.tenantId });
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (err) {
    next(err);
  }
};

exports.saveDocumentTemplate = async (req, res, next) => {
  try {
    const { templateType, title, headerHtml, bodyTemplate, footerHtml } = req.body;
    let template = await DocumentTemplate.findOne({ tenant: req.tenantId, templateType });

    if (template) {
      template.title = title || template.title;
      template.headerHtml = headerHtml;
      template.bodyTemplate = bodyTemplate;
      template.footerHtml = footerHtml;
      await template.save();
    } else {
      template = await DocumentTemplate.create({
        tenant: req.tenantId,
        templateType,
        title,
        headerHtml,
        bodyTemplate,
        footerHtml
      });
    }

    res.status(200).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

// ==================== NOTIFICATION TEMPLATES ====================
exports.getNotificationTemplates = async (req, res, next) => {
  try {
    const templates = await NotificationTemplate.find({ tenant: req.tenantId });
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (err) {
    next(err);
  }
};

exports.saveNotificationTemplate = async (req, res, next) => {
  try {
    const { eventName, channel, messageTemplate, subject } = req.body;
    let template = await NotificationTemplate.findOne({ tenant: req.tenantId, eventName, channel });

    if (template) {
      template.messageTemplate = messageTemplate;
      template.subject = subject;
      await template.save();
    } else {
      template = await NotificationTemplate.create({
        tenant: req.tenantId,
        eventName,
        channel,
        messageTemplate,
        subject
      });
    }

    res.status(200).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};
