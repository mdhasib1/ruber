const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Van', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'completed', 'canceled'], default: 'pending' },
    paymentIntentId: { type: String, required: true },
    amountCaptured: { type: Number, default: 0 },
    extensionRequested: {
        startDate: { type: Date },
        endDate: { type: Date },
        startTime: { type: Date },
        endTime: { type: Date }
    },
    extensionStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    alternateVanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Van' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Booking', BookingSchema);