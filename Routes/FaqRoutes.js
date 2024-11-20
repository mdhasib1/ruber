const express = require('express');
const router = express.Router();
const faqController = require('../Controllers/FaqControllers');

router.get('/faqs', faqController.getAllFAQs);
router.post('/faqs', faqController.addFAQ);
router.delete('/faqs/:id', faqController.deleteFAQ);

module.exports = router;
