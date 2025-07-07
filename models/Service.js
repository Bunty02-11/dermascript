const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    meta_title: {
        type: String,
        // required: true
    },
    meta_description: {
        type: String,
        // required: true
    },
    heading: {
        type: String,
        // required: true
    },
    introduction: {
        type: String,
        // required: true
    },
    content: {
        type: Object,
        // required: true
    },
    faqs: {
        type: Object,
        // required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
});

module.exports = mongoose.model('Service', ServiceSchema);
