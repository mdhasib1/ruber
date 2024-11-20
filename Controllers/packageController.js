const Package = require('../Models/Package');
const Van = require('../Models/Van.Schema');

exports.createPackage = async (req, res) => {
    try {
        const { vanId, title, description, duration, price } = req.body;
        const van = await Van.findById(vanId);
        if (!van) {
            return res.status(400).json({ message: 'Invalid vanId: Van does not exist' });
        }

        const newPackage = new Package({ vanId, title, description, duration, price });
        await newPackage.save();
        res.status(201).json({ message: 'Package created successfully', data: newPackage });
    } catch (error) {
        console.error("Error creating package:", error);
        res.status(500).json({ message: 'Error creating package', error: error.message });
    }
};


exports.getAllPackages = async (req, res) => {
    try {
        const packages = await Package.find().populate('vanId');
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving packages', error: error.message });
    }
};


// Get a single package by ID
exports.getPackageById = async (req, res) => {
    try {
        const package = await Package.findById(req.params.id).populate('vanId', 'name');
        if (!package) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.status(200).json(package);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving package', error: error.message });
    }
};

// Update a package by ID
exports.updatePackage = async (req, res) => {
    try {
        const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.status(200).json({ message: 'Package updated successfully', data: updatedPackage });
    } catch (error) {
        res.status(500).json({ message: 'Error updating package', error: error.message });
    }
};

// Delete a package by ID
exports.deletePackage = async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(req.params.id);
        if (!deletedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting package', error: error.message });
    }
};
