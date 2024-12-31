const express = require('express');
const router = express.Router();
const partnerController = require('../Controllers/PartnerControllers');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');


router.post('/partner/register', partnerController.createPartner);
router.get('/partner', partnerController.getAllPartners);
router.get('/partner/:id', partnerController.getPartnerById);
router.put('/partner/approve/:id', partnerController.approvePartner);
router.put('/partner/reject/:id', partnerController.rejectPartner);
router.get('/getDashboardData',authenticateToken, partnerController.getPartnerDashboardStats);

module.exports = router;
