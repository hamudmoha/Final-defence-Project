/**
 * One-time migration script to reset passwords for accounts that may have been double-hashed.
 * Usage: node Backend/scripts/resetPasswords.js --dry-run
 */
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const sendEmail = require('../src/utils/sendEmail');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
}

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run') || argv.includes('-d');

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Filter: skip system_admin
        const query = { role: { $ne: 'system_admin' } };
        const users = await User.find(query);
        console.log(`Found ${users.length} users to examine`);

        let processed = 0;
        for (const user of users) {
            if (!user.email) continue;
            if (user.mustResetPassword) continue;

            const temp = crypto.randomBytes(6).toString('hex') + 'A1!';

            if (dryRun) {
                console.log(`[dry] would reset ${user.email}`);
                processed++;
                continue;
            }

            user.password = temp; // model pre-save will hash
            user.mustResetPassword = true;
            
            await user.save();

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Account Security Update',
                    message: `Hello ${user.fullName}, your password has been reset. Temporary password: ${temp}`,
                    html: `<p>Hello ${user.fullName},</p><p>Your password has been reset as a precaution. Temporary password: <strong>${temp}</strong></p><p>Please login and change your password immediately.</p>`
                });
            } catch (e) {
                console.error('Failed sending email to', user.email);
            }

            processed++;
            console.log(`Reset and emailed: ${user.email}`);
            await new Promise(r => setTimeout(r, 100)); // Throttling
        }

        console.log(`Successfully processed ${processed} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration error', err);
        process.exit(1);
    }
};

run();
