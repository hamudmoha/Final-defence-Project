const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const User = require('./src/models/User');

async function check() {
  await mongoose.connect('mongodb+srv://mrabdihakim1_db_user:hamud12moha@base.igkxuby.mongodb.net/?appName=Base');
  const total = await Booking.countDocuments();
  const paidOnline = await Booking.countDocuments({ amount_paid_online: { $gt: 0 } });
  const hasPayout = await Booking.countDocuments({ payout_status: { $exists: true } });
  const disputed = await Booking.countDocuments({ is_disputed: true });
  const sample = await Booking.findOne({}).select('amount_paid_online payout_status is_disputed commission_amount manager_net_payout');
  
  console.log(JSON.stringify({ 
    total, 
    paidOnline, 
    hasPayout, 
    disputed,
    sample 
  }, null, 2));
  process.exit();
}
check();
