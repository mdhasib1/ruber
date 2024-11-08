const mongoose = require('mongoose');

const userRoles = ['admin', 'manager', 'customer'];

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    preferredLanguage: { type: String, enum: ['en', 'fr', 'de', 'it'], default: 'en' },
    licenseFront: { type: String },
    licenseBack: { type: String },
    idDocumentFront: { type: String },
    idDocumentBack: { type: String },
    role: { type: String, enum: userRoles, default: 'customer' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
