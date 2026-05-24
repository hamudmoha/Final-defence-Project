const Booking = require('../models/Booking');
const Camp = require('../models/Camp');
const ModerationRecord = require('../models/ModerationRecord');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');
const SystemConfig = require('../models/SystemConfig');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res, next) => {
  const { campId, tentId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests, amount } = req.body;
  
  const camp = await Camp.findById(campId);
  if (!camp) return next(new ErrorResponse('Camp not found', 404));

  // 0. Check Tent Status (Maintenance/Occupied)
  if (tentId) {
    const Tent = require('../models/Tent');
    const tent = await Tent.findById(tentId);
    if (!tent) return next(new ErrorResponse('Tent not found', 404));
    if (tent.status !== 'Available') {
      return next(new ErrorResponse(`This tent is currently ${tent.status.toLowerCase()} and cannot be booked.`, 400));
    }
  }

  // Check if user is restricted by this camp's manager
  const localRestriction = await ModerationRecord.findOne({
    userId: req.user._id,
    actorId: camp.managerId,
    type: 'local',
    action: { $in: ['ban', 'suspend'] },
    status: 'active'
  });

  if (localRestriction) {
    return next(new ErrorResponse(`You have been restricted from booking at this manager's camps. Reason: ${localRestriction.reason}`, 403));
  }

  // CAPACITY CHECK: Granular check for Camp and specific Tent
  // CRITICAL: We only count PENDING bookings if they are less than 15 minutes old (The "Hold" window)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // 1. Check Specific Tent Availability
  if (tentId) {
    const overlappingTentBookings = await Booking.find({
      tentId,
      $and: [
        {
          $or: [
            { status: { $in: ['CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID', 'COMPLETED'] } },
            { status: 'PENDING', createdAt: { $gte: fifteenMinutesAgo } }
          ]
        },
        {
          $or: [
            { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
            { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } },
            { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gte: new Date(checkOut) } }
          ]
        }
      ]
    });

    if (overlappingTentBookings.length > 0) {
      return next(new ErrorResponse('This specific tent is already reserved or on hold for these dates.', 400));
    }
  }



  const user = await require('../models/User').findById(req.user._id);

  const totalAmount = amount; // Amount from frontend is total

  // Create unique reservation code
  let reservationCode;
  let isUnique = false;
  while (!isUnique) {
    reservationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await Booking.findOne({ reservationCode });
    if (!existing) isUnique = true;
  }
  
  // Get current commission rate
  const commissionConfig = await SystemConfig.findOne({ key: 'commission_rate' });
  const commissionRate = commissionConfig ? Number(commissionConfig.value) : 10;
  const commissionAmount = (totalAmount * commissionRate) / 100;
  const managerNet = totalAmount - commissionAmount;

  const booking = await Booking.create({
    userId: req.user._id,
    campId,
    tentId,
    guestName,
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    guests,
    totalAmount,
    balance_due: totalAmount,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    manager_net_payout: managerNet,
    reservationCode
  });

  res.status(201).json({ success: true, data: booking });

  // Async Email
  try {
    await sendEmail({
      email: booking.guestEmail,
      subject: `Booking Received - ${camp.name}`,
      html: emailTemplates.bookingConfirmation({
        guestName: booking.guestName,
        campName: camp.name,
        reservationCode: booking.reservationCode,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        amount: booking.totalAmount
      })
    });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ userId: req.user._id }).populate({
    path: 'campId',
    populate: { path: 'managerId', select: 'fullName email phone' }
  }).populate('tentId');

  const processedBookings = bookings.map(b => {
    const booking = b.toObject();
    const hasPaid = ['PARTIALLY_PAID', 'FULLY_PAID', 'COMPLETED'].includes(booking.status);
    
    if (!hasPaid && booking.campId) {
      // Redact sensitive info if not paid
      booking.campId.location = "Hidden until deposit/payment is confirmed";
      if (booking.campId.managerId) {
        booking.campId.managerId.phone = "Hidden";
        booking.campId.managerId.email = "Hidden";
      }
    }
    return booking;
  });

  res.json({ success: true, data: processedBookings });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Camper)
const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));
  
  if (booking.userId.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    return next(new ErrorResponse(`Cannot cancel a ${booking.status} booking`, 400));
  }

  const user = await require('../models/User').findById(req.user._id);
  const camp = await Camp.findById(booking.campId);
  const Notification = require('../models/Notification');

  // LOGIC: If a trusted camper cancels a flex-pay booking, the 15% deposit is not refunded.
  // It remains in the system and is eventually split between platform and manager.
  // If it was a 100% payment, we refund everything minus a small gateway fee (simulated).
  
  let refundNote = "";
  if (booking.amount_paid_online > 0) {
    if (booking.deposit_amount > 0 && booking.amount_paid_online <= booking.deposit_amount) {
      // It was just the 15% deposit
      refundNote = "As per policy, the 15% deposit is non-refundable for cancellations.";
      booking.payout_status = 'READY'; // Move to ready so manager/admin can eventually split it
    } else {
      // It was a full payment or more than deposit
      refundNote = "A refund request (minus processing fees) has been initiated.";
      // In a real system, you would trigger the Chapa Refund API here.
    }
  }

  // Update user cancellations count
  if (user) {
    user.completed_bookings = Math.max(0, (user.completed_bookings || 0) - 1);
    user.successfulBookings = Math.max(0, (user.successfulBookings || 0) - 1);
    await user.save();
  }

  booking.status = 'CANCELLED';
  await booking.save();

  // Notify Manager
  if (camp) {
    await Notification.create({
      userId: camp.managerId,
      senderId: req.user._id,
      title: 'Booking Cancelled',
      message: `Booking ${booking.reservationCode} was cancelled by the camper. ${refundNote}`,
      category: 'System',
      icon: 'XCircle'
    });
  }

  res.json({ success: true, message: `Booking cancelled. ${refundNote}`, data: booking });

  try {
    await sendEmail({
      email: booking.guestEmail,
      subject: `Booking Cancelled - ${camp ? camp.name : 'EthioCampGround'}`,
      html: `
        <p>Your booking <strong>${booking.reservationCode}</strong> has been cancelled.</p>
        <p>${refundNote}</p>
      `
    });
  } catch (err) {
    console.error('Cancellation email failed:', err.message);
  }
});

// @desc    Get manager's camp bookings
// @route   GET /api/bookings/manager
// @access  Private (Manager)
const getManagerBookings = asyncHandler(async (req, res, next) => {
  const camps = await Camp.find({ managerId: req.user._id }).select('_id');
  const campIds = camps.map(camp => camp._id);

  // Get global rate fallback
  const SystemConfig = require('../models/SystemConfig');
  const commissionConfig = await SystemConfig.findOne({ key: 'commission_rate' });
  const globalRate = commissionConfig ? Number(commissionConfig.value) : 10;

  const bookings = await Booking.find({ campId: { $in: campIds } }).populate('campId tentId userId', 'name fullName email phone');
  
  // Ensure every booking has the split data for the dashboard
  const processed = bookings.map(b => {
    const booking = b.toObject();
    if (!booking.commission_amount || !booking.manager_net_payout) {
      const rate = booking.commission_rate || globalRate;
      booking.commission_amount = (booking.totalAmount * rate) / 100;
      booking.manager_net_payout = booking.totalAmount - booking.commission_amount;
    }
    return booking;
  });

  res.json({ success: true, data: processed });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Manager)
const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));

  const camp = await Camp.findById(booking.campId);
  if (!camp || camp.managerId.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (status.toUpperCase() === 'COMPLETED' && booking.status !== 'COMPLETED') {
    const camper = await require('../models/User').findById(booking.userId);
    if (camper) {
      camper.completed_bookings = (camper.completed_bookings || 0) + 1;
      camper.successfulBookings = (camper.successfulBookings || 0) + 1;
      await camper.save();
    }
  }

  booking.status = status.toUpperCase();

  // LOGIC: If a manager REJECTS a booking that has payments, trigger full refund alert
  if (booking.status === 'REJECTED' && booking.amount_paid_online > 0) {
    const admins = await require('../models/User').find({ role: 'system_admin' });
    const Notification = require('../models/Notification');
    
    // Alert System Admins to initiate refund
    const adminAlerts = admins.map(admin => ({
      userId: admin._id,
      senderId: req.user._id,
      title: 'Action Required: Refund Due',
      message: `Manager ${req.user.fullName} rejected paid booking ${booking.reservationCode}. Please initiate 100% refund.`,
      category: 'System',
      icon: 'AlertTriangle'
    }));
    await Notification.insertMany(adminAlerts);
  }

  await booking.save();
  res.json({ success: true, data: booking });

  try {
    await sendEmail({
      email: booking.guestEmail,
      subject: `Booking Update: ${status} - ${camp.name}`,
      html: emailTemplates.bookingStatusUpdate({
        guestName: booking.guestName,
        campName: camp.name,
        status,
        reservationCode: booking.reservationCode,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      })
    });
  } catch (err) {
    console.error('Status update email failed:', err.message);
  }
});

// @desc    Mark cash paid for booking balance
// @route   POST /api/bookings/:id/mark-cash-paid
// @access  Private (Manager)
const markCashPaid = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));

  const camp = await Camp.findById(booking.campId);
  if (!camp || camp.managerId.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (booking.is_balance_cleared) {
    return next(new ErrorResponse('Cash payment already verified for this booking', 400));
  }

  const cashCollected = booking.balance_due || 0;

  // Clear balance — manager physically collected the cash
  booking.balance_due = 0;
  booking.payment_method_for_balance = 'CASH';
  booking.is_balance_cleared = true;
  booking.status = 'COMPLETED';

  // Do not overwrite payout_status if there are online funds in escrow
  if (!booking.amount_paid_online || booking.amount_paid_online === 0) {
    booking.payout_status = 'CASH_SETTLED';
  }

  // Update manager's total_earnings to reflect the net they earned from this cash booking
  const manager = await require('../models/User').findById(camp.managerId);
  if (manager) {
    manager.total_earnings = (manager.total_earnings || 0) + cashCollected;
    await manager.save();
  }

  // Increment completed_bookings for the camper
  const camper = await require('../models/User').findById(booking.userId);
  if (camper) {
    camper.completed_bookings = (camper.completed_bookings || 0) + 1;
    camper.successfulBookings = (camper.successfulBookings || 0) + 1;
    await camper.save();
  }

  await booking.save();
  
  // BYPASS PREVENTION: Mandatory automated alert to BOTH Camper and System Admin.
  const admins = await require('../models/User').find({ role: 'system_admin' });
  const Notification = require('../models/Notification');
  
  const adminNotifications = admins.map(admin => ({
    userId: admin._id,
    senderId: req.user._id,
    title: 'Cash Payment Verified',
    message: `Manager ${req.user.fullName} confirmed receipt of ${booking.balance_due || 0} ETB in cash for ${booking.reservationCode}. Verification logged.`,
    category: 'System',
    icon: 'ShieldCheck'
  }));

  await Notification.insertMany(adminNotifications);

  // Camper Notification (Mobile/In-App)
  await Notification.create({
    userId: booking.userId,
    senderId: req.user._id,
    title: 'Cash Receipt Confirmed',
    message: `Your cash payment of ${booking.balance_due || 0} ETB was verified by the manager. Your booking is now COMPLETED.`,
    category: 'System',
    icon: 'CheckCircle'
  });

  res.json({ success: true, data: booking });

  try {
    await sendEmail({
      email: booking.guestEmail,
      subject: `Cash Payment Confirmed - ${camp.name}`,
      html: `
        <h3>Cash Payment Verified</h3>
        <p>Your cash payment for booking <strong>${booking.reservationCode}</strong> at <strong>${camp.name}</strong> has been verified by the camp manager.</p>
        <p>Your booking status is now COMPLETED. Thank you for staying with us!</p>
      `
    });
  } catch (err) {
    console.error('Cash verification email failed:', err.message);
  }
});



// @desc    Cleanup expired pending bookings (Runs in background)
const cleanupExpiredBookings = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  try {
    const expiredBookings = await Booking.find({
      status: 'PENDING',
      createdAt: { $lt: fifteenMinutesAgo }
    });

    if (expiredBookings.length > 0) {
      console.log(`Cleaning up ${expiredBookings.length} expired bookings...`);
      
      for (const booking of expiredBookings) {
        booking.status = 'CANCELLED';
        await booking.save();

        // Notify user about expired hold
        try {
          await sendEmail({
            email: booking.guestEmail,
            subject: 'Booking Hold Expired',
            html: `
              <h3>Your hold has expired</h3>
              <p>The 15-minute hold for your booking <strong>${booking.reservationCode}</strong> has expired because payment was not received.</p>
              <p>The dates are now available for others to book. If you still wish to stay with us, please start a new booking.</p>
            `
          });
        } catch (emailErr) {
          console.error(`Failed to send expiration email to ${booking.guestEmail}`);
        }
      }
    }
  } catch (err) {
    console.error('Booking cleanup failed:', err.message);
  }
};

// @desc    Manual occupation by manager (Offline booking)
// @route   POST /api/bookings/manual-occupy
// @access  Private (Manager)
const manualOccupy = asyncHandler(async (req, res, next) => {
  const { tentId, checkIn, checkOut, guestName, guestEmail, guestPhone, guests, totalAmount, amountPaid, paymentType } = req.body;

  const Tent = require('../models/Tent');
  const tent = await Tent.findById(tentId);
  if (!tent) return next(new ErrorResponse('Tent not found', 404));

  const camp = await Camp.findById(tent.campId);
  if (!camp) return next(new ErrorResponse('Camp not found', 404));

  // Verify manager owns this camp
  if (camp.managerId.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Check for overlaps
  const overlapping = await Booking.findOne({
    tentId,
    status: { $in: ['PENDING', 'CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID', 'COMPLETED'] },
    $or: [
      { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
      { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } },
      { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gte: new Date(checkOut) } }
    ]
  });

  if (overlapping) {
    return next(new ErrorResponse('This tent is already booked or on hold for these dates.', 400));
  }

  // Create unique reservation code
  let reservationCode;
  let isUnique = false;
  while (!isUnique) {
    reservationCode = 'OFF-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const existing = await Booking.findOne({ reservationCode });
    if (!existing) isUnique = true;
  }

  const amt = Number(totalAmount) || 0;
  const paid = Number(amountPaid) || 0;
  const bal = Math.max(0, amt - paid);

  let bookingStatus = 'CONFIRMED';
  let amtPaidOnline = 0;
  let isBalanceCleared = false;
  let paymentMethodForBalance = undefined;

  if (paymentType === 'ONLINE') {
    amtPaidOnline = paid;
    bookingStatus = bal === 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';
  } else if (paymentType === 'CASH') {
    isBalanceCleared = bal === 0;
    paymentMethodForBalance = 'CASH';
    bookingStatus = bal === 0 ? 'COMPLETED' : 'CONFIRMED';
  }

  const booking = await Booking.create({
    userId: req.user._id, // Manager is the "user" for manual entries
    campId: camp._id,
    tentId,
    guestName: guestName || 'Manual Entry',
    guestEmail: guestEmail || 'manual@offline.com',
    guestPhone: guestPhone || 'N/A',
    checkIn,
    checkOut,
    guests: guests || 1,
    totalAmount: amt,
    amount_paid_online: amtPaidOnline,
    balance_due: bal,
    is_balance_cleared: isBalanceCleared,
    payment_method_for_balance: paymentMethodForBalance,
    status: bookingStatus,
    isManual: true,
    reservationCode
  });

  res.status(201).json({ success: true, data: booking });
});


module.exports = { createBooking, getMyBookings, cancelBooking, getManagerBookings, updateBookingStatus, markCashPaid, cleanupExpiredBookings, manualOccupy };
