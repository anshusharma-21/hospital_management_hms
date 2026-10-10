const express = require('express');
const router = express.Router();
const {
  getBeds,
  createBed,
  updateBedStatus,
  getAdmissions,
  getAdmissionById,
  admitPatient,
  transferBed,
  getNursingRecords,
  createNursingRecord,
  updateClearance,
  finalizeDischarge,
  getEmergencyQueue,
  createEmergencyEncounter,
  getOTSchedule,
  createOTRecord
} = require('../controllers/ipdController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(enforceTenant);

// Beds
router.route('/beds')
  .get(getBeds)
  .post(createBed);
router.put('/beds/:id/status', updateBedStatus);

// Admissions
router.route('/admissions')
  .get(getAdmissions)
  .post(admitPatient);

router.get('/admissions/:id', getAdmissionById);
router.put('/admissions/:id/transfer-bed', transferBed);
router.put('/admissions/:id/clearance', updateClearance);
router.post('/admissions/:id/discharge', finalizeDischarge);
router.put('/admissions/:id/discharge', finalizeDischarge);

// Nursing
router.route('/nursing-records')
  .post(createNursingRecord);
router.get('/nursing-records/:admissionId', getNursingRecords);

// Emergency
router.route('/emergency')
  .get(getEmergencyQueue)
  .post(createEmergencyEncounter);

// Operation Theatre
router.route('/ot')
  .get(getOTSchedule)
  .post(createOTRecord);

module.exports = router;
