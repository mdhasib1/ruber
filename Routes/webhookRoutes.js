// routes/webhookRoutes.js
const express = require('express');
const { handlePaymentCompletion, handlePreAuthorizationCapture } = require('../helpers/webhookController');

const router = express.Router();
router.post('/webhook/payment-complete', express.raw({ type: 'application/json' }), handlePaymentCompletion);

router.post('/webhook/pre-authorization', express.raw({ type: 'application/json' }), handlePreAuthorizationCapture);

module.exports = router;
