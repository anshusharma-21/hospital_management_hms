const express = require('express');
const router = express.Router();
const { login, patientLogin, sendPatientOTP, getMe, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/send-patient-otp', sendPatientOTP);
router.post('/patient-login', patientLogin);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
