const express = require('express');
const router = express.Router();
const {
  getMedicines,
  createMedicine,
  updateMedicineStock,
  dispensePrescription,
  getPrescriptions
} = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(enforceTenant);

router.get('/prescriptions', getPrescriptions);

router.route('/medicines')
  .get(getMedicines)
  .post(createMedicine);

router.put('/medicines/:id/stock', updateMedicineStock);
router.post('/dispense', dispensePrescription);

module.exports = router;
