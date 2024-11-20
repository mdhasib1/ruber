const mongoose = require('mongoose');

const ContractRuleSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    de: { type: String },
    fr: { type: String },
    it: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ContractRule', ContractRuleSchema);
