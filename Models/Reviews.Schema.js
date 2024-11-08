// Models/Reviews.Schema.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    author_name: {
        type: String,
        required: true,
    },
    author_url: {
        type: String,
        required: false,
    },
    rating: {
        type: Number,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: true,
        default: Date.now,
    },
    language: {
        type: String,
        required: false,
    },
    place_id: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
