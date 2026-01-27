const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    houseNo: String,
    street: String,
    city: String,
    pincode: String,
    type: String
}, { _id: false });

const BookingSchema = new mongoose.Schema({
    bookingId: { type: String, unique: true }, // Custom ID (e.g., BK-170123)
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    service: { type: String, required: true },
    subService: { type: String, required: true },
    contact: { type: String, required: false }, // Added contact field
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true },
    location: {
        type: LocationSchema,
        required: true
    },
    workerId: { type: String }, // Can be specific worker ID or null
    workerName: { type: String }, // NEW: Store worker name for display
    workerPhone: { type: String }, // NEW: Store worker phone number for display
    profession: { type: String }, // To match if workerId is null
    status: { type: String, default: 'Pending' }, // Pending, Accepted, Rejected, Completed
    rejectionReason: { type: String },
    cancellationReason: { type: String },
    paymentScreenshot: { type: String }, // Base64 or URL
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
