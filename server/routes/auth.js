const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');

// @route   POST /api/auth/register
// @desc    Register a new user (Client, Worker, or Admin)
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, role, mobile, profession, experience } = req.body;

    try {
        let user;

        if (role === 'client') {
            // Check Client
            let exists = await Client.findOne({ email });
            if (exists) return res.status(400).json({ msg: 'User already exists' });

            user = new Client({
                name,
                email,
                password, // Hash in production
                role,
                mobile
            });

        } else if (role === 'professional') {
            // Check Worker
            let exists = await Worker.findOne({ email });
            if (exists) return res.status(400).json({ msg: 'User already exists' });

            // Restricted: Cannot register as Worker if already Client or Admin
            let clientEx = await Client.findOne({ email });
            let adminEx = await Admin.findOne({ email });
            if (clientEx || adminEx) {
                return res.status(400).json({ msg: 'Email is already registered as Client or Admin' });
            }

            // Generate Worker ID
            const lastWorker = await Worker.findOne({ workerId: { $exists: true } }).sort({ workerId: -1 });
            let newId = 'DF001';
            if (lastWorker && lastWorker.workerId) {
                const lastIdNum = parseInt(lastWorker.workerId.replace('DF', ''), 10);
                if (!isNaN(lastIdNum)) {
                    newId = `DF${String(lastIdNum + 1).padStart(3, '0')}`;
                }
            }

            user = new Worker({
                name,
                email,
                password,
                role,
                mobile,
                profession,
                experience,
                verificationStatus: 'none',
                workerId: newId
            });

        } else if (role === 'admin') {
            // Check Admin
            let exists = await Admin.findOne({ email });
            if (exists) return res.status(400).json({ msg: 'User already exists' });

            user = new Admin({
                name,
                email,
                password,
                role,
                mobile
            });
        } else {
            return res.status(400).json({ msg: 'Invalid Role' });
        }

        // Save to specific collection
        await user.save();

        res.status(201).json({
            msg: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    console.log('Login Attempt:', { email, password, role });

    try {
        // Hardcoded Admin Check (Legacy support - only if role is admin or unspecified)
        if ((!role || role === 'admin') && email.trim() === 'admin123' && password.trim() === 'host123') {
            return res.json({
                msg: 'Login successful',
                user: {
                    id: 'static_admin_id',
                    name: 'Admin',
                    email: 'admin123',
                    role: 'admin',
                    mobile: '0000000000'
                }
            });
        }

        let user = null;
        let dbRole = '';

        if (role) {
            // STRICT MODE: Check only the collection for the requested role
            if (role === 'client') {
                user = await Client.findOne({ email });
                dbRole = 'client';
            } else if (role === 'professional' || role === 'worker') {
                // Restricted: Cannot login as Worker if Client or Admin
                const clientEx = await Client.findOne({ email });
                const adminEx = await Admin.findOne({ email });
                if (clientEx || adminEx) {
                    return res.status(400).json({ msg: 'Access Denied: Registered as Client/Admin' });
                }

                user = await Worker.findOne({ email });
                dbRole = 'professional';
            } else if (role === 'admin') {
                user = await Admin.findOne({ email });
                dbRole = 'admin';
            } else {
                return res.status(400).json({ msg: 'Invalid Role Specified' });
            }

            if (!user) {
                // Return specific error helps debugging, but for security usually generic is better.
                // Here, specifically for the user request: "worker login only as profession"
                return res.status(400).json({ msg: 'User not found in this role' });
            }

        } else {
            // FALLBACK / LEGACY MODE (Sequential Check)

            // 1. Check Admin
            user = await Admin.findOne({ email });
            if (user) dbRole = 'admin';

            // 2. Check Worker
            if (!user) {
                user = await Worker.findOne({ email });
                if (user) dbRole = 'professional';
            }

            // 3. Check Client
            if (!user) {
                user = await Client.findOne({ email });
                if (user) dbRole = 'client';
            }
        }

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check password
        if (user.password !== password) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return user info
        res.json({
            msg: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || dbRole, // Ensure role is returned
                profession: user.profession,
                experience: user.experience,
                mobile: user.mobile,
                workerId: user.workerId // Send ID to frontend
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
