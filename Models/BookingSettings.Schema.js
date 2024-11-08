const mongoose = require('mongoose');

const BookingSettingsSchema = new mongoose.Schema({
    van: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Van',
        required: true,
        unique: true 
    },
    freeHours: {
        type: Number,
        required: true,
        default: 0
    },
    minimumPaidHours: {
        type: Number,
        required: true,
        default: 0
    },
    freePeriodStart: {
        type: String,
        required: true,
        default: '21:00'
    },
    blockedDateHours: [
        {
            date: { type: Date, required: true },
            hours: {
                type: [String], // Ensure `hours` is defined as an array of strings
                validate: {
                    validator: function(value) {
                        return value.length > 0; // Ensure that `hours` array is never empty
                    },
                    message: "At least one hour must be specified."
                }
            }
        }
    ],
    bookingEnabled: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('BookingSettings', BookingSettingsSchema);
