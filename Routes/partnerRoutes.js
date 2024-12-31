const express = require('express');
const router = express.Router();
const {
  createPartner,
  getAllPartners,
  deletePartner,
  MyBooking,
} = require('../Controllers/partnerController');




router.post('/partners', createPartner);
router.get('/partners', getAllPartners);
router.delete('/partners/:id', deletePartner);



module.exports = router;
