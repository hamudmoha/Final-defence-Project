require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/SystemLog');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const logs = await SystemLog.find({ timestamp: { $gte: today } }).sort({ timestamp: -1 }).limit(10);
        console.log(JSON.stringify(logs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
