const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (email) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
        message: 'Invalid email format.',
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    interest: {
      type: String,
      required: true,
    },
    recommendations: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Partner', partnerSchema);
