const mongoose = require('mongoose');

const VerificationRequestSchema = new mongoose.Schema({
    workerId: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    profession: String,
    gender: String,
    idType: String,
    idNumber: String,
    city: String,
    pincode: String,
    certificate: {
        type: String, // Filename
        default: 'No file'
    },
    certificateData: {
        type: String, // Base64 Data
        default: null
    },
    profilePhoto: {
        type: String,
        default: null
    },
    profilePhotoData: {
        type: String, // Base64 Data
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VerificationRequest', VerificationRequestSchema);
