const express = require('express');
const { getBookingSettings, updateBookingSettings } = require('../Controllers/bookingSettingsController');
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');

module.exports = (io) => {
  const router = express.Router();

  router.get('/booking-settings/:vanId',  (req, res) => getBookingSettings(req, res, io, req.query.socketId));
  router.put('/booking-settings/:vanId', authenticateToken, authorizeAdmin, (req, res) => updateBookingSettings(req, res, io));

  return router;
};
