import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});


export const OTP = mongoose.model('OTP', OTPSchema);
