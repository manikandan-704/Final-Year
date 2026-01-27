const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipientId: { type: String, required: true }, // Worker ID or 'Admin'
    recipientRole: { type: String, enum: ['Worker', 'Admin'], required: true },
    message: { type: String, required: true },
    bookingId: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
