const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const VerificationRequest = require('../models/VerificationRequest');
const Notification = require('../models/Notification');

// Create a new booking
router.post('/', async (req, res) => {
    try {
        const {
            clientName,
            clientEmail,
            service,
            subService,
            contact,
            date,
            time,
            location,
            workerId,
            workerName,
            workerPhone,
            profession
        } = req.body;

        console.log('Received booking request:', JSON.stringify(req.body, null, 2));

        const newBooking = new Booking({
            bookingId: 'BK-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100), // Simple unique ID
            clientName: clientName || 'Guest User',
            clientEmail,
            service,
            subService,
            contact,
            date,
            time,
            location,
            workerId,
            workerName: workerName || 'Any Professional',
            workerPhone,
            profession
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get worker dashboard stats
router.get('/dashboard/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;

        // 1. Get Completed Bookings
        const completedBookings = await Booking.find({
            workerId: workerId,
            status: 'Completed'
        });

        // 2. Calculate Total Earnings (Assuming fixed price for simplicity for now, or sum 'amount' if exists)
        // Since 'amount' field isn't in schema yet, we'll placeholder it or count count * rate
        // Let's assume a base rate per job for now, or 0 if not defined.
        // TODO: Add 'amount' to Booking Schema for accurate calculation.
        // For now, let's mock it: 500 per completed job.
        const totalEarnings = completedBookings.length * 500;

        // 3. Jobs Done
        const jobsDone = completedBookings.length;

        // 4. Calculate Rating
        // Since 'rating' field isn't in Booking schema yet, we'll return a placeholder or calculate if it existed.
        // For now, returning a static good rating or random if real data missing.
        // Let's default to 0.0 for now until Rating system is fully implemented.
        const rating = 0.0;

        res.json({
            totalEarnings,
            jobsDone,
            rating
        });

    } catch (err) {
        console.error('Error fetching worker stats:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get bookings for a specific worker
router.get('/worker/:workerId', async (req, res) => {
    try {
        const bookings = await Booking.find({ workerId: req.params.workerId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching worker bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get bookings for a client (by email) - for client-page logic if needed
// Get bookings for a client (by email) - for client-page logic if needed
router.get('/client/:email', async (req, res) => {
    try {
        // Use lean() to get plain JS objects we can modify
        let bookings = await Booking.find({ clientEmail: req.params.email }).sort({ createdAt: -1 }).lean();

        // Populate workerName for old bookings where it is missing but workerId exists
        // const VerificationRequest = require('../models/VerificationRequest'); // Already imported at top
        // const Worker = require('../models/Worker'); // Already imported at top

        for (let booking of bookings) {
            if (booking.workerId && !booking.workerName) {
                const searchId = booking.workerId.trim();

                // Try to find in VerificationRequest first
                let workerData = await VerificationRequest.findOne({
                    workerId: { $regex: new RegExp("^" + searchId + "$", "i") }
                }).select('name mobile');

                // If not found in verification, try the main Worker collection
                if (!workerData) {
                    workerData = await Worker.findOne({
                        workerId: { $regex: new RegExp("^" + searchId + "$", "i") }
                    }).select('name mobile');
                }

                if (workerData) {
                    booking.workerName = workerData.name;
                    booking.workerPhone = workerData.mobile;
                }
                // if still not found, booking.workerName remains undefined, and frontend shows ID fallback
            }
        }

        res.json(bookings);
    } catch (err) {
        console.error('Error fetching client bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update booking status (Accept/Reject)
router.put('/:id', async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        if (rejectionReason) {
            booking.rejectionReason = rejectionReason;
        }
        if (req.body.cancellationReason) {
            booking.cancellationReason = req.body.cancellationReason;
        }
        if (req.body.paymentScreenshot) {
            booking.paymentScreenshot = req.body.paymentScreenshot;
        }

        await booking.save();

        // Notification Logic for 'Completed' status
        if (status === 'Completed') {
            // Notify Worker
            if (booking.workerId) {
                const workerNotification = new Notification({
                    recipientId: booking.workerId,
                    recipientRole: 'Worker',
                    message: `Booking ${booking.bookingId} has been marked as Completed by the client.`,
                    bookingId: booking._id
                });
                await workerNotification.save();
            }

            // Notify Admin
            const adminNotification = new Notification({
                recipientId: 'Admin',
                recipientRole: 'Admin',
                message: `Booking ${booking.bookingId} has been marked as Completed by the client.`,
                bookingId: booking._id
            });
            await adminNotification.save();
        }

        res.json(booking);
    } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all bookings (for Admin Dashboard)
router.get('/all', async (req, res) => {
    try {
        let bookings = await Booking.find().sort({ createdAt: -1 }).lean();

        // Populate workerName for old bookings
        for (let booking of bookings) {
            if (booking.workerId && !booking.workerName) {
                const searchId = booking.workerId.trim();

                let workerData = await VerificationRequest.findOne({
                    workerId: { $regex: new RegExp("^" + searchId + "$", "i") }
                }).select('name mobile');

                if (!workerData) {
                    workerData = await Worker.findOne({
                        workerId: { $regex: new RegExp("^" + searchId + "$", "i") }
                    }).select('name mobile');
                }

                if (workerData) {
                    booking.workerName = workerData.name;
                    booking.workerPhone = workerData.mobile;
                }
            }
        }

        res.json(bookings);
    } catch (err) {
        console.error('Error fetching all bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
