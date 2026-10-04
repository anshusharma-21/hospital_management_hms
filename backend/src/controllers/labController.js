const LabOrder = require('../models/LabOrder');
const RadiologyOrder = require('../models/RadiologyOrder');
const AuditLog = require('../models/AuditLog');

// ==================== LABORATORY ====================

// @desc    Get lab orders workbench
// @route   GET /api/v1/diagnostics/lab-orders
// @access  Private
exports.getLabOrders = async (req, res, next) => {
  try {
    const { status, criticalOnly } = req.query;
    const query = { tenant: req.tenantId };

    if (req.branchId) {
      query.$or = [{ branch: req.branchId }, { branch: null }, { branch: { $exists: false } }];
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    if (status && status !== 'all') {
      query.overallStatus = status;
    }

    if (criticalOnly === 'true') {
      query.criticalAlert = true;
    }

    const orders = await LabOrder.find(query)
      .populate('patient', 'uhid fullName age gender phone')
      .populate('doctor', 'name doctorProfile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create lab order
// @route   POST /api/v1/diagnostics/lab-orders
// @access  Private
exports.createLabOrder = async (req, res, next) => {
  try {
    const { patient, encounter, tests, clinicalNotes } = req.body;

    const count = await LabOrder.countDocuments({ tenant: req.tenantId });
    const orderSeq = String(count + 1).padStart(4, '0');
    const orderNumber = `LAB-${new Date().getFullYear()}-${orderSeq}`;

    const labOrder = await LabOrder.create({
      tenant: req.tenantId,
      branch: req.user.branch,
      patient,
      encounter,
      doctor: req.user._id,
      orderNumber,
      tests: tests || [],
      clinicalNotes,
      overallStatus: 'Ordered'
    });

    const populated = await LabOrder.findById(labOrder._id)
      .populate('patient', 'uhid fullName age gender')
      .populate('doctor', 'name');

    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Collect sample and generate barcode
// @route   PUT /api/v1/diagnostics/lab-orders/:id/collect-sample
// @access  Private
exports.collectSample = async (req, res, next) => {
  try {
    const labOrder = await LabOrder.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });

    if (!labOrder) {
      return res.status(404).json({ success: false, error: 'Lab order not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, labOrder.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to access lab records from another branch.'
      });
    }

    const barcodeReferenceService = require('../services/barcode/BarcodeReferenceService');
    const barcode = barcodeReferenceService.generateLabBarcode(labOrder.orderNumber);

    labOrder.sampleBarcode = barcode;
    labOrder.sampleCollectedAt = new Date();
    labOrder.sampleCollectedBy = req.user._id;
    labOrder.overallStatus = 'Sample Collected';

    labOrder.tests.forEach(t => {
      t.status = 'Sample Collected';
    });

    await labOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sample collected & barcode assigned',
      barcode,
      data: labOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Enter test results & verify
// @route   PUT /api/v1/diagnostics/lab-orders/:id/results
// @access  Private
exports.enterResults = async (req, res, next) => {
  try {
    // If request contains sample collection payload, delegate seamlessly
    if (req.body.status === 'sample_collected' || req.body.specimen) {
      return exports.collectSample(req, res, next);
    }

    const { tests, pathologistRemarks, pathologistNotes, isVerified, status, isCritical } = req.body;

    const labOrder = await LabOrder.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });

    if (!labOrder) {
      return res.status(404).json({ success: false, error: 'Lab order not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, labOrder.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to access lab records from another branch.'
      });
    }

    const verifiedFlag = Boolean(isVerified || status === 'verified' || status === 'Completed');
    let hasCritical = Boolean(isCritical);

    if (tests && Array.isArray(tests)) {
      labOrder.tests = tests.map(t => {
        if (t.isCritical || t.flag === 'CRITICAL' || t.flag === 'HIGH') hasCritical = true;
        return {
          ...t,
          status: verifiedFlag ? 'Verified' : 'Processing'
        };
      });
    }

    labOrder.criticalAlert = hasCritical;
    labOrder.pathologistRemarks = pathologistRemarks || pathologistNotes || labOrder.pathologistRemarks;

    if (verifiedFlag) {
      labOrder.overallStatus = 'Completed';
      labOrder.verifiedBy = req.user._id;
      labOrder.verifiedAt = new Date();
    } else {
      labOrder.overallStatus = 'In-Processing';
    }

    await labOrder.save();

    res.status(200).json({
      success: true,
      message: verifiedFlag ? 'Lab report verified & finalized' : 'Results updated in workbench',
      data: labOrder
    });
  } catch (err) {
    next(err);
  }
};

// ==================== RADIOLOGY ====================

// @desc    Get radiology worklist
// @route   GET /api/v1/diagnostics/radiology-orders
// @access  Private
exports.getRadiologyOrders = async (req, res, next) => {
  try {
    const { modality, status } = req.query;
    const query = { tenant: req.tenantId };

    if (req.branchId) {
      query.$or = [{ branch: req.branchId }, { branch: null }, { branch: { $exists: false } }];
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    if (modality && modality !== 'all') {
      query.modality = modality;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await RadiologyOrder.find(query)
      .populate('patient', 'uhid fullName age gender phone')
      .populate('doctor', 'name doctorProfile')
      .populate('radiologist', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single radiology order with study details
// @route   GET /api/v1/diagnostics/radiology-orders/:id
// @access  Private
exports.getRadiologyOrderById = async (req, res, next) => {
  try {
    const order = await RadiologyOrder.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    })
      .populate('patient', 'uhid fullName age gender phone allergies chronicConditions')
      .populate('doctor', 'name doctorProfile department')
      .populate('radiologist', 'name');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Radiology order not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, order.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to view radiology records from another branch.'
      });
    }

    if (req.user?.role === 'patient' && order.patient?._id.toString() !== req.user.patient?.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied: You can only view your own radiology records' });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create radiology order
// @route   POST /api/v1/diagnostics/radiology-orders
// @access  Private
exports.createRadiologyOrder = async (req, res, next) => {
  try {
    const { patient, encounter, modality, bodyPart, clinicalIndication, priority } = req.body;

    const count = await RadiologyOrder.countDocuments({ tenant: req.tenantId });
    const radSeq = String(count + 1).padStart(4, '0');
    const orderNumber = `RAD-${new Date().getFullYear()}-${radSeq}`;

    const order = await RadiologyOrder.create({
      tenant: req.tenantId,
      branch: req.user.branch,
      patient,
      encounter,
      doctor: req.user._id,
      orderNumber,
      modality,
      bodyPart,
      clinicalIndication,
      priority: priority || 'Routine',
      status: 'Ordered'
    });

    const populated = await RadiologyOrder.findById(order._id)
      .populate('patient', 'uhid fullName age gender')
      .populate('doctor', 'name');

    res.status(201).json({
      success: true,
      message: 'Radiology requisition booked',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Radiology reporting & finalization
// @route   PUT /api/v1/diagnostics/radiology-orders/:id/report
// @access  Private
exports.finalizeRadiologyReport = async (req, res, next) => {
  try {
    const { findings, impression, criticalFinding, criticalAlertRemarks, pacViewerUrl } = req.body;

    const order = await RadiologyOrder.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Radiology order not found' });
    }

    order.findings = findings || order.findings;
    order.impression = impression || order.impression;
    order.criticalFinding = criticalFinding || false;
    order.criticalAlertRemarks = criticalAlertRemarks;
    order.pacViewerUrl = pacViewerUrl || order.pacViewerUrl;
    order.radiologist = req.user._id;
    order.reportedAt = new Date();
    order.status = 'Finalized';

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Radiology report signed and finalized',
      data: order
    });
  } catch (err) {
    next(err);
  }
};
