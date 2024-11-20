const express = require('express');
const router = express.Router();

const isAdminRegistrationEnabled = true; 
router.get('/admin-registration-status', (req, res) => {
  res.json({ isEnabled: isAdminRegistrationEnabled });
});

module.exports = router;
