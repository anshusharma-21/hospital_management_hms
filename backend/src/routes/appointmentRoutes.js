const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  getLiveQueue
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(enforceTenant);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

router.route('/queue')
  .get(getLiveQueue);

router.route('/:id/status')
  .put(updateAppointmentStatus);

module.exports = router;
