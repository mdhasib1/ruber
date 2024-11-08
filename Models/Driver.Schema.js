const mongoose = require('mongoose');
const DriverSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    licenseFront: { type: String, required: true },
    licenseBack: { type: String, required: true },
    idDocumentFront: { type: String, required: true },
    idDocumentBack: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
