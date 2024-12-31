const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
  paymentReceipt: { type: String },
  rejectionReason: { type: String },
});

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
