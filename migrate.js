const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Worker = require('./models/Worker');
const Admin = require('./models/Admin');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users in 'users' collection.`);

        // Sort users so we process professionals consistently (optional but good for debugging)
        // However, standard iteration is fine.

        // Initialize ID counter
        let lastWorker = await Worker.findOne({ workerId: { $exists: true } }).sort({ workerId: -1 });
        let nextIdCounter = 1;
        if (lastWorker && lastWorker.workerId) {
            const num = parseInt(lastWorker.workerId.replace('DF', ''), 10);
            if (!isNaN(num)) nextIdCounter = num + 1;
        }

        for (const user of users) {
            const userObj = user.toObject();
            const { _id, ...userData } = userObj;
            // We reuse _id

            let TargetModel;
            let finalUserData = { _id, ...userData };

            if (user.role === 'client') {
                TargetModel = Client;
            } else if (user.role === 'professional') {
                TargetModel = Worker;

                // Assign Worker ID if not exists (though User model doesn't have it, we generate it for the new Worker doc)
                const exists = await Worker.findById(_id);
                if (!exists) {
                    // Generate ID
                    const newId = `DF${String(nextIdCounter).padStart(3, '0')}`;
                    finalUserData.workerId = newId;
                    nextIdCounter++;
                    console.log(`Assigned ${newId} to ${user.email}`);
                }
            } else if (user.role === 'admin') {
                TargetModel = Admin;
            }

            if (TargetModel) {
                const exists = await TargetModel.findById(_id);
                if (!exists) {
                    await TargetModel.create(finalUserData);
                    console.log(`Migrated ${user.email} -> ${TargetModel.modelName}`);
                } else {
                    console.log(`Skipping ${user.email} (already exists in ${TargetModel.modelName})`);
                }
            } else {
                console.log(`Skipping ${user.email} (Unknown role: ${user.role})`);
            }
        }

        console.log('Migration Complete.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
};

migrate();
