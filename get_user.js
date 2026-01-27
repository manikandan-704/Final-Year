const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const fs = require('fs');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const email = 'isac@gmail.com';
        const user = await User.findOne({ email });
        if (user) {
            fs.writeFileSync('user_details.json', JSON.stringify(user, null, 2));
            console.log('User details saved to user_details.json');
        } else {
            console.log(`User with email ${email} not found.`);
        }
        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
