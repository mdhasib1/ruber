const express = require('express');
const {
    addVan,
    deleteVan,
    getAllVans,
    updateVan,
    getVanById,
    addContractImages,
    removeContractImage,
    getBookedSlotsForVan,
    approveVan,
    rejectVan,
    MyVans,
    addVanPartner,
    getAllVansAdmin
} = require('../Controllers/vanController.js');
const { authenticateToken,  authorizeRoles } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllVans);
router.post('/',authenticateToken, authorizeRoles('admin', 'partner'), addVan); 
router.delete('/:id',authenticateToken, authorizeRoles('admin', 'partner'), deleteVan); 
router.post('/:id/contracts',authenticateToken, authorizeRoles('admin', 'partner'), addContractImages);
router.get('/:vanId/booked-slots', getBookedSlotsForVan);
router.get('/my-vans', authenticateToken, authorizeRoles('admin', 'partner'), MyVans);
router.get('/:id', getVanById);
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), getAllVansAdmin);
router.post('/add-van-partner', authenticateToken, authorizeRoles('partner'), addVanPartner);

router.delete('/:id/contracts',authenticateToken, authorizeRoles('admin', 'partner'), removeContractImage);
router.put('/:id',authenticateToken, authorizeRoles('admin', 'partner'), updateVan);
router.put('/:id/approve', authenticateToken, authorizeRoles('admin'), approveVan);
router.put('/:id/reject', authenticateToken, authorizeRoles('admin'), rejectVan);

module.exports = router;
