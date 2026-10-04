const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');
const barcodeReferenceService = require('../services/barcode/BarcodeReferenceService');

router.use(protect);
router.use(enforceTenant);

// @desc    Generate an opaque QR / barcode reference for a resource (Zero PHI)
// @route   POST /api/v1/references/generate
// @access  Private
router.post('/generate', async (req, res, next) => {
  try {
    const { resourceType, resourceId, resourceModel, format, metadata, expiresAt } = req.body;

    let result;
    if (format === 'QR_CODE') {
      result = await barcodeReferenceService.generateQRCodeData({
        tenantId: req.tenantId,
        resourceType,
        resourceId,
        resourceModel,
        metadata,
        createdBy: req.user
      });
    } else {
      result = await barcodeReferenceService.generateBarcodeData({
        tenantId: req.tenantId,
        resourceType,
        resourceId,
        resourceModel,
        metadata,
        createdBy: req.user
      });
    }

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Resolve an opaque reference code or lab barcode back to authorized data
// @route   POST /api/v1/references/resolve
// @access  Private
router.post('/resolve', async (req, res, next) => {
  try {
    const { referenceCode } = req.body;

    const result = await barcodeReferenceService.resolveReference({
      tenantId: req.tenantId,
      referenceCode,
      requestingUser: req.user
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
