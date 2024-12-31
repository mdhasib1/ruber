const express = require('express');
const { getBookingSettings, updateBookingSettings, updateEarningsSettings,getEarningsSettings,ValidedreferralCode } = require('../Controllers/bookingSettingsController');
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');
const EarningsSettings = require('../Models/EarningsSettings.Schema');

module.exports = (io) => {
  const router = express.Router();
  router.get("/earnings-settings", authenticateToken, authorizeAdmin, (req, res) => getEarningsSettings(req, res, io, req.query.socketId));
  router.put("/earnings-settings", authenticateToken, authorizeAdmin, (req, res) => updateEarningsSettings(req, res, io));
  router.get('/booking-settings/:vanId',  (req, res) => getBookingSettings(req, res, io, req.query.socketId));
  router.put('/booking-settings/:vanId', authenticateToken, authorizeAdmin, (req, res) => updateBookingSettings(req, res, io));
  router.post('/valid-referral-code', authenticateToken, (req, res) => ValidedreferralCode(req, res));


  return router;
};
