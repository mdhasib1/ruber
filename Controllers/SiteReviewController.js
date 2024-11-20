const Review = require("../Models/Reviews.Schema");
const Booking = require("../Models/Booking.Schema");
const mongoose = require("mongoose");

const createReview = async (req, res) => {
  try {
    const { bookingId, vanId, rating, comment } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== userId) {
      return res.status(404).json({ error: "Booking not found or unauthorized." });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Cannot review an incomplete booking." });
    }

    const existingReview = await Review.findOne({ bookingId, userId });
    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this booking." });
    }

    const review = new Review({
      bookingId,
      vanId,
      userId,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({ message: "Review submitted successfully.", review });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review." });
  }
};


const checkPendingReview = async (req, res) => {
    try {
      const userId = req.user._id;
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID." });
      }
  
      const completedBookings = await Booking.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: "completed",
      })
        .populate("vanId", "name  plateNumber") 
        .lean();
  
      if (!completedBookings || completedBookings.length === 0) {
        return res.status(200).json([]); 
      }
  
      const bookingIds = completedBookings.map((booking) => booking._id);
  
      const reviewedBookings = await Review.find({
        bookingId: { $in: bookingIds },
      })
        .select("bookingId")
        .lean();
  
      const reviewedBookingIds = reviewedBookings.map(
        (review) => review.bookingId.toString()
      );
      const pendingReviews = completedBookings.filter(
        (booking) => !reviewedBookingIds.includes(booking._id.toString())
      );
  
      res.status(200).json(pendingReviews); 
    } catch (error) {
      console.error("Error checking pending reviews:", error);
      res.status(500).json({ error: "Failed to check pending reviews." });
    }
  };

  const getReviewsForBooking = async (req, res) => {
    try {
  
      const reviews = await Review.find()
        .populate("userId", "firstName lastName email") // Include user details
        .populate("vanId", "name plateNumber images") // Include van details
        .lean();
  
      if (!reviews || reviews.length === 0) {
        return res.status(404).json({ message: "No reviews found for this booking." });
      }
  
      res.status(200).json(reviews);
    } catch (error) {
      console.error("Error fetching reviews for booking:", error);
      res.status(500).json({ error: "Failed to fetch reviews for booking." });
    }
  };
  
  

module.exports = { createReview,  checkPendingReview,getReviewsForBooking };
