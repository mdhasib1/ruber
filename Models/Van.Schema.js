const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
    en: { type: String, required: true },
    fr: { type: String },
    it: { type: String, required: true },
    de: { type: String }
}, { _id: false });

const DailyPricingSchema = new mongoose.Schema({
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
    pricePerHour: { type: Number, required: true },
    kilometers: { type: Number, required: true },
    extraPerKm: { type: Number, required: true }
}, { _id: false });

const VanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: LanguageSchema, required: true },
    description: { type: LanguageSchema, required: true },
    images: [{ type: String, required: true }],
    plateNumber: { type: String, required: true },
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
    trackingDevice: {
        type: { type: String, enum: ['fleet2track', 'other', 'NoDevice'], default: 'NoDevice' },
        customName: { type: String }
    },
    dailyPricing: { type: [DailyPricingSchema], default: [] },
    restrictedBookingHours: {
        Monday: { start: { type: String, default: null }, end: { type: String, default: null } },
        Tuesday: { start: { type: String, default: null }, end: { type: String, default: null } },
        Wednesday: { start: { type: String, default: null }, end: { type: String, default: null } },
        Thursday: { start: { type: String, default: null }, end: { type: String, default: null } },
        Friday: { start: { type: String, default: null }, end: { type: String, default: null } },
        Saturday: { start: { type: String, default: null }, end: { type: String, default: null } },
        Sunday: { start: { type: String, default: null }, end: { type: String, default: null } },
      },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Van', VanSchema);
