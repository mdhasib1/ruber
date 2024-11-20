const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{2}-\d{2}-\d{4}$/.test(v), // DD-MM-YYYY format
        message: (props) => `${props.value} is not a valid European date format (DD-MM-YYYY)!`,
      },
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{2}:\d{2}$/.test(v), // HH:MM format
        message: (props) => `${props.value} is not a valid time format!`,
      },
    },
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null, 
    },
    selectedSlots: {
      type: [TimeSlotSchema],
      required: true,
      validate: [(val) => val.length > 0, 'At least one time slot is required.'],
    },
    startDate: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{2}-\d{2}-\d{4}$/.test(v), // DD-MM-YYYY format
        message: (props) => `${props.value} is not a valid European date format (DD-MM-YYYY)!`,
      },
    },
    endDate: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{2}-\d{2}-\d{4}$/.test(v), // DD-MM-YYYY format
        message: (props) => `${props.value} is not a valid European date format (DD-MM-YYYY)!`,
      },
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'canceled'],
      default: 'pending',
    },
    amountCaptured: {
      type: Number,
      default: 0,
      min: [0, 'Captured amount cannot be negative'],
    },
    timeZone:{type:String, required: true,},
    extensionRequested: {
      startDate: {
        type: String,
        validate: {
          validator: (v) => !v || /^\d{2}-\d{2}-\d{4}$/.test(v),
          message: (props) => `${props.value} is not a valid European date format (DD-MM-YYYY)!`,
        },
      },
      endDate: {
        type: String,
        validate: {
          validator: (v) => !v || /^\d{2}-\d{2}-\d{4}$/.test(v),
          message: (props) => `${props.value} is not a valid European date format (DD-MM-YYYY)!`,
        },
      },
      startTime: { type: Date },
      endTime: { type: Date },
      selectedSlots: [TimeSlotSchema],
    },
    extensionStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    alternateVanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
    },
    preAuthorization: {
      type: Boolean,
      default: false,
    },
    reminderSent: { type: Boolean, default: false },
    startingReminderSent: { type: Boolean, default: false },
    endingReminderSent: { type: Boolean, default: false },
    canceledReminderSent: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', BookingSchema);
