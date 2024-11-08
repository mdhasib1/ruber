const Van = require('../Models/Van.Schema.js');


const getAllVans = async (req, res) => {
    try {
        const vans = await Van.find();
        res.status(200).json(vans);
    } catch (error) {
        console.error("Error fetching vans:", error);
        res.status(500).json({ message: "Failed to fetch vans." });
    }
};


const getVanById = async (req, res) => {
    const { id } = req.params;

    try {
        const van = await Van.findById(id);
        if (!van) {
            return res.status(404).json({ message: "Van not found" });
        }
        res.status(200).json(van);
    } catch (error) {
        console.error("Error fetching van by ID:", error);
        res.status(500).json({ message: "Failed to fetch van." });
    }
};

const addVan = async (req, res) => {
    console.log('Request body:', req.body);
    const {
        name,
        description,
        images,
        plateNumber,
        pricePerHour,
        externalDimensions,
        internalDimensions,
        weight,
        location,
        optionalFeatures,
        contractImages,
        fuelType,
        transmissionType
    } = req.body;

    if (!name?.en || !description?.en || !name?.it || !description?.it) {
        return res.status(400).json({
            message: "Nome e descrizione in inglese e in italiano sono obbligatori."
        });
    }


    const availableDate = new Date();
    availableDate.setHours(0, 0, 0, 0); 
    const availableTime = new Date();
    availableTime.setMinutes(0, 0, 0);
    availableTime.setHours(availableTime.getHours() + 1);
    const formattedContractImages = contractImages?.map((image) => ({
        damageType: image.damaged || image.damageType,
        description: image.description,
        image: image.image
    })) || [];

    const newVan = new Van({
        name,
        description,
        images,
        plateNumber,
        availableDate,
        availableTime,
        pricePerHour,
        externalDimensions,
        internalDimensions,
        weight,
        location,
        optionalFeatures,
        contractImages: formattedContractImages,
        fuelType,
        transmissionType
    });

    try {
        const savedVan = await newVan.save();
        console.log('Van saved successfully:', savedVan);
        res.status(201).json(savedVan);
    } catch (error) {
        console.error("Error saving van:", error);
        res.status(400).json({ message: "Impossibile salvare il furgone." });
    }
};



// Update a van by ID
const updateVan = async (req, res) => {
    const { id } = req.params;

    try {
        const updatedVan = await Van.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedVan) {
            return res.status(404).json({ message: "Van not found" });
        }
        res.status(200).json(updatedVan);
    } catch (error) {
        console.error("Error updating van:", error);
        res.status(400).json({ message: "Failed to update van." });
    }
};

// Delete a van by ID
const deleteVan = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedVan = await Van.findByIdAndDelete(id);
        if (!deletedVan) {
            return res.status(404).json({ message: "Van not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting van:", error);
        res.status(400).json({ message: "Failed to delete van." });
    }
};

const addContractImages = async (req, res) => {
    const { id } = req.params;
    const contractImages = req.body; // Expecting this to be an array of contract image objects

    if (!Array.isArray(contractImages) || !contractImages.length) {
        return res.status(400).json({ message: "Invalid or empty contract images array" });
    }

    try {
        const van = await Van.findById(id);
        if (!van) {
            return res.status(404).json({ message: "Van not found" });
        }

        // Append new images to existing contract images
        van.contractImages = [...van.contractImages, ...contractImages];
        await van.save();

        res.status(200).json(van.contractImages);
    } catch (error) {
        console.error("Error adding contract images:", error);
        res.status(400).json({ message: "Failed to add contract images." });
    }
};


const removeContractImage = async (req, res) => {
    const { id } = req.params;
    const { imageId } = req.body;

    try {
        const van = await Van.findById(id);
        if (!van) {
            return res.status(404).json({ message: "Van not found" });
        }
        van.contractImages = van.contractImages.filter(
            (contractImage) => contractImage.image !== imageId
        );

        await van.save();
        res.status(200).json({ message: "Contract image removed successfully", contractImages: van.contractImages });
    } catch (error) {
        console.error("Error removing contract image:", error);
        res.status(400).json({ message: "Failed to remove contract image." });
    }
};

module.exports = {
    getAllVans,
    addVan,
    updateVan,
    getVanById,
    deleteVan,
    addContractImages,
    removeContractImage
};
