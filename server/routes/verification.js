const express = require('express');
const router = express.Router();
const VerificationRequest = require('../models/VerificationRequest');

// @route   POST /api/verification
// @desc    Submit a new verification request
// @access  Public (Worker)
router.post('/', async (req, res) => {
    try {
        const {
            name, email, mobile, profession, gender, idType, idNumber, city, pincode,
            certificate, certificateData, workerId,
            profilePhoto, profilePhotoData
        } = req.body;

        const newRequest = new VerificationRequest({
            workerId,
            name,
            email,
            mobile,
            profession,
            gender,
            idType,
            idNumber,
            city,
            pincode,
            certificate,
            certificateData,
            profilePhoto,
            profilePhotoData
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// @route   GET /api/verification
// @desc    Get all verification requests (with optional filtering)
// @access  Public (Worker/Client) or Private (Admin)
router.get('/', async (req, res) => {
    try {
        const { city, profession, status } = req.query;
        let query = {};

        if (status) query.status = status;
        if (city) query.city = { $regex: city, $options: 'i' }; // Case-insensitive
        if (profession) query.profession = { $regex: profession, $options: 'i' };

        const requests = await VerificationRequest.find(query).sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/verification/:id
// @desc    Update request status (Approve/Reject)
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;

        let request = await VerificationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        request.status = status;
        await request.save();

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/verification/status
// @desc    Get verification status for a specific user (by email)
// @access  Public (Worker)
router.get('/status', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ msg: 'Email is required' });

        const request = await VerificationRequest.findOne({ email });
        if (!request) return res.json({ status: 'Not Found' });

        res.json({
            status: request.status,
            data: request // Return full data
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
