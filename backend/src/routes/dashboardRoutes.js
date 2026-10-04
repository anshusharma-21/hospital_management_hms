const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  globalSearch,
  getBranchOverview,
  getHospitalReports
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/search', globalSearch);
router.get('/branch/:branchId/overview', getBranchOverview);
router.get('/reports', getHospitalReports);

module.exports = router;

