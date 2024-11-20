const express = require("express");
const {
  createBooking,
  getCurrentBooking,
  getBookingHistory,
  requestBookingExtension,
  confirmExtension,
  switchVan,
  cancelBooking,
  getPendingBookings,
  getBookingById,
  completePendingPayment,
  getBookingMonitoringData,
} = require("../Controllers/BookingControllers");
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');

module.exports = (io) => {
  const router = express.Router();
  router.post('/create-booking', (req, res) => createBooking(req, res, io));

  router.get("/current",authenticateToken, (req, res) => getCurrentBooking(req, res, io));
  router.get("/history", authenticateToken, (req, res) => getBookingHistory(req, res, io));
  router.post("/extend/:bookingId", (req, res) => requestBookingExtension(req, res, io));
  router.post("/extend/confirm/:id", (req, res) => confirmExtension(req, res, io));
  router.post("/:id/switch-van", (req, res) => switchVan(req, res, io));
  router.post("/cancel", authenticateToken, (req, res) => cancelBooking(req, res, io));
  router.get("/pending", authenticateToken, (req, res) => getPendingBookings(req, res, io));
  router.post("/complete-payment", (req, res) => completePendingPayment(req, res, io));
  router.get("/monitoring", authenticateToken, (req, res) => getBookingMonitoringData(req, res, io));
  // router.get("/:id", (req, res) => getBookingById(req, res, io));

  return router;
};
