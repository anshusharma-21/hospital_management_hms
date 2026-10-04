const express = require('express');
const router = express.Router();
const {
  registerDocument,
  getDocuments,
  getSecureDocumentAccess
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(registerDocument)
  .get(getDocuments);

router.get('/:id/secure-access', getSecureDocumentAccess);

module.exports = router;
