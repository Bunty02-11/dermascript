const mongoose = require('mongoose');

const DiscountServiceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true
    },
    description: {
        type: JSON,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    discountedPrice: {
        type: Number,
        required: true
    },
    // validUntil: {
    //     type: Date,
    //     required: true
    // },
    image: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('DiscountService', DiscountServiceSchema); 