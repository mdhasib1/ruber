const mongoose = require("mongoose");

const EarningsSettingsSchema = new mongoose.Schema({
  adminpercentage: {
    type: Number,
    required: true,
    default: 10, 
  },
  partnerpercentage: {
    type: Number,
    required: true,
    default: 20, 
  },
  referralpercentage: {
    type: Number,
    required: true,
    default: 5,
  },
  userpercentage: {
    type: Number,
    required: true,
    default: 65,
  },
});

module.exports = mongoose.model("EarningsSettings", EarningsSettingsSchema);
