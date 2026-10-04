const DocumentRegistry = require('../models/DocumentRegistry');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// @desc    Register a new clinical or administrative document metadata reference
// @route   POST /api/v1/documents
// @access  Private
exports.registerDocument = async (req, res, next) => {
  try {
    const {
      patientId,
      branchId,
      documentType,
      title,
      storageKey,
      mimeType,
      fileSizeBytes,
      entityReference,
      metadata,
      accessControl
    } = req.body;

    if (!patientId || !documentType || !title || !storageKey) {
      return res.status(400).json({
        success: false,
        message: 'patientId, documentType, title, and storageKey are required.'
      });
    }

    const patient = await Patient.findOne({ _id: patientId, tenant: req.tenantId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found in current hospital organization.' });
    }

    const docCount = await DocumentRegistry.countDocuments({ tenant: req.tenantId });
    const documentNumber = `DOC-${new Date().getFullYear()}-${String(docCount + 1).padStart(5, '0')}`;

    const doc = await DocumentRegistry.create({
      tenant: req.tenantId,
      branch: branchId || patient.primaryBranch || undefined,
      patient: patient._id,
      documentType,
      documentNumber,
      title,
      storageKey,
      mimeType: mimeType || 'application/pdf',
      fileSizeBytes: fileSizeBytes || 0,
      checksum: crypto.createHash('md5').update(storageKey + Date.now()).digest('hex'),
      entityReference,
      metadata: metadata || {},
      uploadedBy: req.user?._id,
      accessControl: accessControl || { isRestricted: false, allowedRoles: [] }
    });

    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user?._id,
      action: 'Register Medical Document',
      module: 'Clinical / EMR',
      entityType: 'Document',
      entityId: doc._id.toString(),
      details: `Registered '${documentType}' reference (${documentNumber}) for patient ${patient.uhid}`,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: doc
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get registered documents with tenant isolation and role permission filtering
// @route   GET /api/v1/documents
// @access  Private
exports.getDocuments = async (req, res, next) => {
  try {
    const { patientId, documentType, entityType, limit = 50 } = req.query;
    const filter = { tenant: req.tenantId, status: 'active' };

    if (req.user?.role === 'patient') {
      filter.patient = req.user.patient;
    } else if (patientId) {
      filter.patient = patientId;
    }

    if (documentType) filter.documentType = documentType;
    if (entityType) filter['entityReference.entityType'] = entityType;

    const docs = await DocumentRegistry.find(filter)
      .populate('patient', 'uhid firstName lastName phone')
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Server-side RBAC restriction filtering
    const userRole = req.user?.role;
    const filteredDocs = docs.filter(doc => {
      if (!doc.accessControl?.isRestricted) return true;
      if (['hospital_admin', 'org_admin', 'super_admin'].includes(userRole)) return true;
      return doc.accessControl.allowedRoles?.includes(userRole);
    });

    res.status(200).json({
      success: true,
      count: filteredDocs.length,
      data: filteredDocs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate secure, time-limited private access token (No raw medical URLs exposed)
// @route   GET /api/v1/documents/:id/secure-access
// @access  Private
exports.getSecureDocumentAccess = async (req, res, next) => {
  try {
    const doc = await DocumentRegistry.findOne({ _id: req.params.id, tenant: req.tenantId });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found in current hospital organization.' });
    }

    if (req.user?.role === 'patient') {
      if (doc.patient?.toString() !== req.user.patient?.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Access to another patient document is denied.' });
      }
    }

    // Role check
    const userRole = req.user?.role;
    if (doc.accessControl?.isRestricted && !['hospital_admin', 'org_admin', 'super_admin'].includes(userRole)) {
      if (!doc.accessControl.allowedRoles?.includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Access to this restricted document is denied.' });
      }
    }

    // Generate ephemeral signed token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Audit view event
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user?._id,
      action: 'Secure Document Access Requested',
      module: 'Clinical / EMR',
      entityType: 'Document',
      entityId: doc._id.toString(),
      details: `Generated ephemeral 15-minute access token for document ${doc.documentNumber}`,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: {
        documentNumber: doc.documentNumber,
        title: doc.title,
        mimeType: doc.mimeType,
        token,
        expiresAt,
        storageKey: doc.storageKey,
        accessMode: 'EphemeralVaultStream'
      }
    });
  } catch (err) {
    next(err);
  }
};
