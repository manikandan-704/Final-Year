const mongoose = require('mongoose');
require('dotenv').config();
const Worker = require('../server/models/Worker');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const email = 'vijay@gmail.com';
        console.log(`Searching for worker with email: ${email}`);

        try {
            const worker = await Worker.findOne({ email });
            if (worker) {
                const fs = require('fs');
                fs.writeFileSync('worker_details.json', JSON.stringify(worker, null, 2));
                console.log('Worker details saved to worker_details.json');
            } else {
                console.log(`Worker with email ${email} not found.`);
            }
        } catch (err) {
            console.error('Error querying database:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });
