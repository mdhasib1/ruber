// models/Package.js
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    vanId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Van',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
