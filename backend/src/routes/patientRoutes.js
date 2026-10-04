const express = require('express');
const router = express.Router();
const {
  getPatients,
  createPatient,
  getPatientById,
  updatePatient,
  getPatientTimeline,
  getPatientMe,
  mergePatients,
  submitFeedback,
  getPatientFeedback
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(enforceTenant);

router.route('/')
  .get(getPatients)
  .post(createPatient);

router.get('/me', getPatientMe);
router.route('/feedback')
  .get(getPatientFeedback)
  .post(submitFeedback);
router.post('/merge', authorize('hospital_admin', 'org_admin', 'super_admin'), mergePatients);

router.route('/:id')
  .get(getPatientById)
  .put(updatePatient);

router.route('/:id/timeline')
  .get(getPatientTimeline);

module.exports = router;
