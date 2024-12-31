const mongoose = require('mongoose');

const userRoles = ['admin', 'manager', 'customer', 'partner'];

const TransactionHistorySchema = new mongoose.Schema({
    type: { type: String, enum: ["earning", "spend", "withdrawal"], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
  });

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    timeZone:{type:String,},
    preferredLanguage: { type: String, enum: ['en', 'fr', 'de', 'it'], default: 'en' },
    licenseFront: { type: String },
    licenseBack: { type: String },
    idDocumentFront: { type: String },
    idDocumentBack: { type: String },
    referralCode: { type: String },
    earnings: { type: Number, default: 0 },
    transactionHistory: [TransactionHistorySchema],
    role: { type: String, enum: userRoles, default: 'customer' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('User', UserSchema);
