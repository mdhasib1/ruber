const mongoose = require('mongoose');

const PreAuthorizationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  authorizedAmount: { 
    type: Number, 
    required: true 
  },
  capturedAmount: { 
    type: Number, 
    default: 0 
  },
  holdDurationDays: { 
    type: Number, 
    default: 7 
  }, 
  preAuthPaymentIntentId: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Captured', 'Canceled'], 
    default: 'Pending' 
  },
  preAuthorization: { 
    type: Boolean, 
    default: false 
  },
  emailSent: { 
    type: Boolean, 
    default: false 
  },
  stripecreated: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PreAuthorization', PreAuthorizationSchema);
