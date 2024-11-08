const express = require('express');
const {
    addVan,
    deleteVan,
    getAllVans,
    updateVan,
    getVanById,
    addContractImages,
    removeContractImage
} = require('../Controllers/vanController.js');

const router = express.Router();

router.get('/', getAllVans);
router.get('/:id', getVanById);
router.post('/', addVan); 
router.put('/:id', updateVan);
router.delete('/:id', deleteVan); 
router.post('/:id/contracts', addContractImages);

router.delete('/:id/contracts', removeContractImage);

module.exports = router;
