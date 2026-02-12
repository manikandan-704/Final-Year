const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allows us to parse JSON bodies (Limit increased for Base64 images)

// Serve Static Files
app.use(express.static(path.join(__dirname, '../client')));

// Database Connection
const connectDB = require('./config/db');

// Database Connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/bookings', require('./routes/bookings'));

// app.get('/', (req, res) => {
//     res.send('DutyFix IT Backend is Running!');
// });

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
