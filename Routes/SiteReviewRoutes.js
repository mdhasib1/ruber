const express = require("express");
const { createReview,  checkPendingReview,getReviewsForBooking } = require("../Controllers/SiteReviewController");
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();


router.post("/create", authenticateToken, createReview);
router.get("/pending", authenticateToken, checkPendingReview);
router.get("/all", authenticateToken,authorizeAdmin, getReviewsForBooking);

module.exports = router;
