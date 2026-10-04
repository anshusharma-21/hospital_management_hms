const express = require('express');
const router = express.Router();
const { login, patientLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/patient-login', patientLogin);
router.get('/me', protect, getMe);

module.exports = router;
