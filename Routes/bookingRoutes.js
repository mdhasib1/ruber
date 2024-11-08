const express = require('express');
const { confirmExtension, createBooking, extendBookingRequest, switchVan } = require('../Controllers/BookingControllers.js');

const router = express.Router();

router.post('/', createBooking);
router.post('/:id/extend', extendBookingRequest);
router.post('/:id/extend/confirm', confirmExtension);
router.post('/:id/switch-van', switchVan);

module.exports = router;
