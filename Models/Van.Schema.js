const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
    en: { type: String, requiredq: true },
    fr: { type: String},
    it: { type: String, required: true },
    de: { type: String}
}, { _id: false });

const VanSchema = new mongoose.Schema({
    name: { type: LanguageSchema, required: true },
    description: { type: LanguageSchema, required: true },
    images: [{ type: String, required: true }],
    plateNumber: { type: String, required: true },
    availableDate: { type: Date, required: true },
    availableTime: { type: String, required: true },
    pricePerHour: { type: Number, required: true },
    externalDimensions: {
        length: { type: String },
        width: { type: String },
        height: { type: String }
    },
    internalDimensions: {
        length: { type: String },
        width: { type: String },
        height: { type: String }
    },
    weight: {
        empty: { type: String },
        maxLoad: { type: String }
    },
    location: {
        address: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    optionalFeatures: {
        roofRack: { type: Boolean, default: false },
        airConditioning: { type: Boolean, default: false },
        towingHook: { type: Boolean, default: false },
        parkingSensors: { type: Boolean, default: false }
    },
    contractImages: [{
        damageType: { type: String, required: true }, 
        description: { type: String },
        image: { type: String, required: true }
    }],
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'], default: 'Petrol' },
    transmissionType: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Van', VanSchema);
