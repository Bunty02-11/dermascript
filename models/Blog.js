const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    meta_title: {
        type: String,
        required: true
    },
    meta_description: {
        type: String,
        required: true
    },
    content: {
        type: JSON,
        required: true
    },
    banner: {
        type: String
    },
    image1: {
        type: String
    },
    image2: {
        type: String
    },
    author: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    slug: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('Blog', BlogSchema); 