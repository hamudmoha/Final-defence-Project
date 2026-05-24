const Booking = require('../models/Booking');

const fixFinancialData = async () => {
  try {
    console.log('Starting global financial data repair...');
    const bookings = await Booking.find({});
    let updatedCount = 0;

    for (const booking of bookings) {
      let needsUpdate = false;

      // 0. FIX STATUS CASING (Crucial for validation)
      if (booking.status && booking.status !== booking.status.toUpperCase()) {
        const oldStatus = booking.status.toUpperCase();
        // Check if the uppercase version is in our new valid enum
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PARTIALLY_PAID', 'FULLY_PAID'];
        if (validStatuses.includes(oldStatus)) {
          booking.status = oldStatus;
        } else {
          booking.status = 'PENDING'; // Fallback for invalid statuses
        }
        needsUpdate = true;
      }

      // 1. Consolidate legacy fields
      if (booking.paidAmount !== undefined && (booking.amount_paid_online === 0 || !booking.amount_paid_online)) {
        if (!booking.totalAmount && booking.paidAmount > 0) {
           booking.totalAmount = booking.paidAmount;
           needsUpdate = true;
        }
      }

      if (booking.totalAmount === undefined || booking.totalAmount === null || booking.totalAmount === 0) {
        booking.totalAmount = booking.totalPrice || booking.paidAmount || 2000;
        needsUpdate = true;
      }

      // 2. Recalculate balance_due correctly
      if (!booking.balance_due && booking.pendingBalance > 0) {
        booking.balance_due = booking.pendingBalance;
        needsUpdate = true;
      }

      const correctBalance = Math.max(0, (booking.totalAmount || 0) - (booking.amount_paid_online || 0));
      
      if (booking.balance_due !== correctBalance && !booking.is_balance_cleared) {
        booking.balance_due = correctBalance;
        needsUpdate = true;
      }

      // 3. Fix status desync
      if (booking.balance_due === 0 && (booking.status === 'PENDING' || booking.status === 'CONFIRMED')) {
        if (booking.amount_paid_online > 0 || booking.paidAmount > 0) {
          booking.status = 'FULLY_PAID';
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        try {
          // Use validateBeforeSave: false to handle legacy documents that might miss required fields
          await booking.save({ validateBeforeSave: false });
          updatedCount++;
        } catch (saveErr) {
          console.error(`Could not repair booking ${booking._id}:`, saveErr.message);
        }
      }
    }

    console.log(`Financial data repair complete. Updated ${updatedCount} bookings.`);
  } catch (err) {
    console.error('Data repair failed:', err.message);
  }
};

module.exports = fixFinancialData;
