const express = require('express');
const {
  createPreAuthorization,
  capturePreAuthorization,
  cancelPreAuthorization,
  getAllPreAuthorizations,
} = require('../Controllers/preAuthorizationController');
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create-pre-authorization',authenticateToken, createPreAuthorization);
router.post('/capture-pre-authorization',authenticateToken,  authorizeAdmin, capturePreAuthorization);
router.post('/cancel-pre-authorization', authenticateToken,  authorizeAdmin, cancelPreAuthorization);
router.get('/all-pre-authorization', authenticateToken,  authorizeAdmin, getAllPreAuthorizations);

module.exports = router;
