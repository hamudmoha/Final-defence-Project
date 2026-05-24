const mongoose = require('mongoose');
const Booking  = require('./src/models/Booking');
const User     = require('./src/models/User');
const Camp     = require('./src/models/Camp');
const SystemConfig = require('./src/models/SystemConfig');

const MONGO_URI = 'mongodb+srv://mrabdihakim1_db_user:hamud12moha@base.igkxuby.mongodb.net/?appName=Base';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const commissionConfig = await SystemConfig.findOne({ key: 'commission_rate' });
  const globalRate = commissionConfig ? Number(commissionConfig.value) : 10;
  console.log('Global commission rate:', globalRate);

  const bookings = await Booking.find({ status: { $ne: 'CANCELLED' } });
  let fixed = 0;

  for (const b of bookings) {
    const rate = b.commission_rate || globalRate;
    const commission = (b.totalAmount * rate) / 100;
    const net        = b.totalAmount - commission;
    let changed = false;

    if (!b.commission_amount || !b.manager_net_payout || !b.commission_rate) {
      b.commission_rate    = rate;
      b.commission_amount  = commission;
      b.manager_net_payout = net;
      changed = true;
      fixed++;
    }

    // If cash booking that is cleared but missing CASH_SETTLED
    if (b.is_balance_cleared && !b.amount_paid_online && b.payout_status !== 'CASH_SETTLED') {
      b.payout_status = 'CASH_SETTLED';
      changed = true;
      fixed++;
    }

    if (changed) await b.save();
  }
  console.log(`Fixed ${fixed} bookings`);

  // Recalculate manager balances
  const managers = await User.find({ role: { $in: ['manager', 'camp_manager'] } });
  for (const m of managers) {
    const camps    = await Camp.find({ managerId: m._id }).select('_id');
    const campIds  = camps.map(c => c._id);
    const mBs      = await Booking.find({ campId: { $in: campIds } });

    let pending = 0, ready = 0, total = 0;
    for (const b of mBs) {
      const fee       = b.commission_amount || 0;
      const onlineNet = Math.max(0, (b.amount_paid_online || 0) - fee);
      if (b.payout_status === 'PENDING')                          pending += onlineNet;
      if (['READY','REQUESTED'].includes(b.payout_status))        ready   += onlineNet;
      if (b.payout_status === 'PAID')                             total   += onlineNet;
      if (b.payout_status === 'CASH_SETTLED' || b.is_balance_cleared)
                                                                  total   += (b.manager_net_payout || 0);
    }

    await User.updateOne({ _id: m._id }, { $set: { pending_earnings: pending, net_payout: ready, total_earnings: total } });
    console.log(`Manager ${m.email}: pending=${pending}, ready=${ready}, total=${total}`);
  }

  console.log('Done');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
