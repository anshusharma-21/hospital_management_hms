const express = require('express');
const router = express.Router();
const {
  createOrGetEncounter,
  getEncounterById,
  updateEncounter,
  getEncounters,
  recordVitals,
  getPatientVitals,
  createPrescription,
  getPrescriptions
} = require('../controllers/clinicalController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(enforceTenant);

router.route('/encounters')
  .get(getEncounters)
  .post(createOrGetEncounter);

router.route('/encounters/:id')
  .get(getEncounterById)
  .put(updateEncounter);

router.post('/vitals', recordVitals);
router.get('/vitals/:patientId', getPatientVitals);

router.route('/prescriptions')
  .get(getPrescriptions)
  .post(createPrescription);

module.exports = router;
