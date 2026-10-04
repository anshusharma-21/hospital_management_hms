const express = require('express');
const router = express.Router();
const {
  getLabOrders,
  createLabOrder,
  collectSample,
  enterResults,
  getRadiologyOrders,
  getRadiologyOrderById,
  createRadiologyOrder,
  finalizeRadiologyReport
} = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(enforceTenant);

// Lab endpoints
router.route('/lab-orders')
  .get(getLabOrders)
  .post(createLabOrder);

router.put('/lab-orders/:id/collect-sample', collectSample);
router.put('/lab-orders/:id/results', enterResults);
router.put('/lab-orders/:id', enterResults);

// Radiology endpoints
router.route('/radiology-orders')
  .get(getRadiologyOrders)
  .post(createRadiologyOrder);

router.get('/radiology-orders/:id', getRadiologyOrderById);
router.put('/radiology-orders/:id/report', finalizeRadiologyReport);

module.exports = router;
