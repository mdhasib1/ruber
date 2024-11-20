const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      en: { type: String, required: true },
      it: { type: String, required: true },
      de: { type: String, required: true },
      fr: { type: String, required: true },
    },
    answer: {
      en: { type: String, required: true },
      it: { type: String, required: true },
      de: { type: String, required: true },
      fr: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FAQ', faqSchema);
