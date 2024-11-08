const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
