const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');

// Helper to find user across collections
async function findUserInCollections(id) {
    let user = await Client.findById(id).select('-password');
    if (user) return { user, model: Client, type: 'Client' };

    user = await Worker.findById(id).select('-password');
    if (user) return { user, model: Worker, type: 'Worker' };

    user = await Admin.findById(id).select('-password');
    if (user) return { user, model: Admin, type: 'Admin' };

    return null;
}

// @route   GET /api/profile/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const result = await findUserInCollections(req.params.id);
        if (!result) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(result.user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/profile/:id
// @desc    Update user profile
// @access  Public
router.put('/:id', async (req, res) => {
    const { name, mobile, dob, gender, address, profession, experience } = req.body;

    // fields common to all
    const commonFields = {};
    if (name) commonFields.name = name;
    if (mobile) commonFields.mobile = mobile;

    // Client specific
    const clientFields = {};
    if (dob) clientFields.dob = dob;
    if (gender) clientFields.gender = gender;
    if (address) clientFields.address = address;

    // Worker specific
    const workerFields = {};
    if (profession) workerFields.profession = profession;
    if (experience) workerFields.experience = experience;

    try {
        const result = await findUserInCollections(req.params.id);

        if (!result) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const { model, type } = result;
        let updateData = { ...commonFields };

        if (type === 'Client') {
            updateData = { ...updateData, ...clientFields };
        } else if (type === 'Worker') {
            updateData = { ...updateData, ...workerFields };
        }

        const updatedUser = await model.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.json(updatedUser);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/profile/:id
// @desc    Delete user profile
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const result = await findUserInCollections(req.params.id);

        if (!result) {
            return res.status(404).json({ msg: 'User not found' });
        }

        await result.model.findByIdAndDelete(req.params.id);

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
