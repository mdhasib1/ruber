const express = require('express');
const router = express.Router();
const reviewController = require('../Controllers/reviewController');

router.get('/reviews', reviewController.getReviews);

module.exports = router;
