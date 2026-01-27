const mongoose = require('mongoose');
const Client = require('./models/Client');
const Worker = require('./models/Worker');
const Admin = require('./models/Admin');
require('dotenv').config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const clients = await Client.find({});
        console.log(`\n--- Clients (${clients.length}) ---`);
        clients.forEach(c => console.log(`${c.email} (${c._id})`));

        const workers = await Worker.find({});
        console.log(`\n--- Workers (${workers.length}) ---`);
        workers.forEach(w => console.log(`${w.email} (${w._id})`));

        const admins = await Admin.find({});
        console.log(`\n--- Admins (${admins.length}) ---`);
        admins.forEach(a => console.log(`${a.email} (${a._id})`));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    }
};

checkDB();
