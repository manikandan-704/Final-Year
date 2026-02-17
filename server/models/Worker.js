const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'professional'
    },
    mobile: {
        type: String
    },
    profession: {
        type: String
    },
    experience: {
        type: String
    },
    profilePic: {
        type: String // Base64 or URL
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'none'],
        default: 'none'
    },
    rating: {
        type: Number,
        default: 5.0
    },
    jobsCompleted: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    workerId: {
        type: String,
        unique: true
    }
});

module.exports = mongoose.model('Worker', WorkerSchema);
