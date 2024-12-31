const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    companyLegalAddress: { type: String, required: true },
    companyOfficeAddress: { type: String, required: true },
    vat: { type: String, required: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    comments: { type: String } 
});

module.exports = mongoose.models.BecomePartner || mongoose.model('BecomePartner', PartnerSchema);
