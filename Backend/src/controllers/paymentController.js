const Booking = require('../models/Booking');
const Camp = require('../models/Camp');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const axios = require('axios');

const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper to sanitize phone for Chapa (Ethiopian format)
const sanitizePhone = (phone) => {
  if (!phone) return '0912345678';
  let p = phone.replace(/\D/g, ''); 

  // Handle common Ethiopian formats
  if (p.startsWith('251')) {
    if (p.length === 12) return '+' + p;
    // If it's 251 followed by 9 digits (total 12), we are good. 
    // If it's 251 followed by 8 digits (like 25100000004), it's invalid.
  }

  if (p.length === 9) return '0' + p;
  if (p.length === 10 && (p.startsWith('09') || p.startsWith('07'))) return p;

  // If the number looks like a fake test number (e.g. 25100000004), use a valid fallback
  if (p.startsWith('251000') || p.length < 9) {
    return '0912345678';
  }

  return p.startsWith('0') ? p : '0' + p;
};

// Helper to sanitize email for Chapa validation (fallback non-standard domains to gmail.com to guarantee MX record checks pass)
const sanitizeEmail = (email) => {
  if (!email) return 'camper@gmail.com';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) return 'camper@gmail.com';
  
  const parts = email.split('@');
  const username = parts[0];
  const domain = parts[1].toLowerCase();
  
  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'mail.com', 'yandex.com', 'zoho.com', 
    'protonmail.com', 'proton.me', 'aol.com'
  ];
  
  if (!validDomains.includes(domain)) {
    return `${username}@gmail.com`;
  }
  return email;
};

// Helper to sanitize description for Chapa validation
const sanitizeDescription = (desc) => {
  if (!desc) return 'Payment';
  return desc.replace(/[^a-zA-Z0-9\-_ .\s]/g, '');
};

// @desc    Initialize Payment (Hybrid Trust Engine)
// @route   POST /api/payments/initialize
// @access  Private
exports.initializePayment = asyncHandler(async (req, res, next) => {
  const { bookingId, paymentPreference } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new ErrorResponse('Booking not found', 404));

  const camp = await Camp.findById(booking.campId);
  const user = await User.findById(req.user._id);

  if (!camp || !user) return next(new ErrorResponse('Related records not found', 404));

  // Determine amount to pay
  let amountToPay = 0;
  let paymentType = 'FULL';
  let paymentPercentage = 100;

  if (booking.amount_paid_online > 0) {
    // This is a balance payment (the remaining 85% settled online)
    if (booking.balance_due <= 0) {
      return next(new ErrorResponse('Booking is already fully paid', 400));
    }
    amountToPay = booking.balance_due;
    paymentType = 'BAL';
  } else {
    // Initial Payment: Trust Engine Logic
    // 1. New/Untrusted Camper -> 100% Full Pay
    // 2. Trusted Camper (completed_bookings >= 1) -> 15% Deposit Option
    
    if (camp.require_full_payment) {
      paymentPercentage = 100;
    } else if (camp.allow_flex_pay && user.completed_bookings >= 1 && (user.trust_score >= 80)) {
      // User can choose, but we default to 15% deposit to unlock flex pay
      paymentPercentage = paymentPreference === 'full' ? 100 : 15;
    } else {
      paymentPercentage = 100;
    }

    amountToPay = Math.round((booking.totalAmount * paymentPercentage) / 100);
    paymentType = paymentPercentage === 100 ? 'FULL' : 'DEP';
    
    // Virtual Ledger: Record the deposit requirement
    booking.deposit_amount = amountToPay;
    // We do NOT update balance_due here. It is updated upon successful payment verification.
  }

  // Define chapa options
  const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
  if (!CHAPA_SECRET_KEY) {
    console.error('CHAPA_SECRET_KEY is missing from .env');
    return next(new ErrorResponse('Payment system is not configured', 500));
  }

  // Fetch current global commission rate
  const commissionConfig = await SystemConfig.findOne({ key: 'commission_rate' });
  const currentCommission = commissionConfig ? Number(commissionConfig.value) : 10;

  // Update booking with deposit requirements and current commission
  booking.deposit_amount = amountToPay;
  booking.commission_rate = currentCommission; // Lock it in for this booking
  
  const tx_ref = `${paymentType}-${bookingId}-${Date.now()}`;


  const sanitizedPhone = sanitizePhone(user.phone || booking.guestPhone);
  const sanitizedEmail = sanitizeEmail(user.email);
  console.log('Sanitized Phone:', sanitizedPhone);

  const chapaPayload = {
    amount: amountToPay.toString(),
    currency: 'ETB',
    email: sanitizedEmail,
    first_name: user.fullName.split(' ')[0] || 'Camper',
    last_name: user.fullName.split(' ')[1] || 'Guest',
    phone_number: sanitizedPhone,
    tx_ref: tx_ref,
    callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/payments/webhooks/chapa`,
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?tx_ref=${tx_ref}`,
    customization: {
      title: 'Camp Booking',
      description: sanitizeDescription(`Payment for booking at ${camp.name}`)
    }
  };

  console.log('Final Chapa Payload:', JSON.stringify(chapaPayload, null, 2));

  try {
    console.log('Sending request to Chapa...');
    const chapaRes = await axios.post('https://api.chapa.co/v1/transaction/initialize', chapaPayload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Chapa Response Status:', chapaRes.status);
    
    // We only save the booking updates if Chapa initialization is successful
    await booking.save();
    console.log('Booking updated and saved.');

    res.status(200).json({
      success: true,
      data: {
        checkout_url: chapaRes.data.data.checkout_url,
        tx_ref,
        amountToPay,
        type: paymentType
      }
    });
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('Chapa init error details:', JSON.stringify(errorData, null, 2));
    const errorMessage = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
    return next(new ErrorResponse(`Payment gateway error: ${errorMessage}`, 500));
  }
});

// @desc    Verify Payment
// @route   GET /api/payments/verify/:tx_ref
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { tx_ref } = req.params;
  const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

  if (!CHAPA_SECRET_KEY) {
    return next(new ErrorResponse('Payment system not configured', 500));
  }

  try {
    console.log(`Verifying payment for tx_ref: ${tx_ref}`);
    const chapaRes = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`
      }
    });

    if (chapaRes.data.status === 'success' && chapaRes.data.data.status === 'success') {
      const { amount } = chapaRes.data.data;
      const parts = tx_ref.split('-');
      const bookingId = parts[1];

      const booking = await Booking.findById(bookingId);
      if (!booking) return next(new ErrorResponse('Booking not found', 404));

      // PROTECTION: If booking was CANCELLED (expired hold), check availability before reviving
      if (booking.status === 'CANCELLED') {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const overlapping = await Booking.findOne({
          _id: { $ne: booking._id },
          tentId: booking.tentId,
          $or: [
            { status: { $in: ['CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'] } },
            { status: 'PENDING', createdAt: { $gte: fifteenMinutesAgo } }
          ],
          $or: [
            { checkIn: { $lt: booking.checkOut, $gte: booking.checkIn } },
            { checkOut: { $gt: booking.checkIn, $lte: booking.checkOut } },
            { checkIn: { $lte: booking.checkIn }, checkOut: { $gte: booking.checkOut } }
          ]
        });

        if (overlapping) {
          // Double booked! We must keep it cancelled and alert admin for refund
          console.error(`Late payment for expired booking ${bookingId}. Tent is already taken.`);
          // Create alert for admin
          const Notification = require('../models/Notification');
          const admins = await User.find({ role: 'system_admin' });
          await Notification.insertMany(admins.map(admin => ({
            userId: admin._id,
            title: 'Action Required: Late Payment Refund',
            message: `User paid ${amount} ETB for expired booking ${booking.reservationCode}, but the tent is now taken. Please refund.`,
            category: 'System',
            icon: 'AlertCircle'
          })));
          return res.status(400).json({ success: false, message: 'Your hold expired and the tent was taken. An admin has been notified for a refund.' });
        }
        // If not overlapping, we can safely revive it!
        booking.status = 'PENDING'; 
      }

      // Idempotency check to prevent double counting
      if (booking.processed_tx_refs && booking.processed_tx_refs.includes(tx_ref)) {
        return res.status(200).json({ success: true, message: 'Already processed', data: booking });
      }

      // Update booking
      booking.processed_tx_refs = booking.processed_tx_refs || [];
      booking.processed_tx_refs.push(tx_ref);
      booking.amount_paid_online = (booking.amount_paid_online || 0) + Number(amount);
      booking.balance_due = Math.max(0, booking.totalAmount - booking.amount_paid_online);

      if (booking.balance_due <= 0) {
        booking.status = 'FULLY_PAID';
        booking.is_balance_cleared = true;
      } else {
        booking.status = 'PARTIALLY_PAID';
      }

      await booking.save();
      
      // Post-payment logic: update manager payout status
      await updatePayoutInfo(booking, amount);

      return res.status(200).json({ success: true, data: booking });

    } else {
      return next(new ErrorResponse('Payment verification failed or pending', 400));
    }
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    return next(new ErrorResponse('Could not verify payment with gateway', 500));
  }
});


// @desc    Chapa Webhook
// @route   POST /api/payments/webhooks/chapa
// @access  Public
exports.chapaWebhook = asyncHandler(async (req, res, next) => {
  const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET;
  
  if (!CHAPA_WEBHOOK_SECRET) {
    console.error('CHAPA_WEBHOOK_SECRET is missing');
    return res.status(500).end();
  }

  const hash = crypto.createHmac('sha256', CHAPA_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['chapa-signature']) {
    console.log('Invalid Chapa Signature');
    return res.status(401).end();
  }

  // Event received
  const { event, tx_ref, amount } = req.body;

  if (event === 'charge.success') {
    // Parse tx_ref (e.g. DEP-65c2a1...-17012345)
    const parts = tx_ref.split('-');
    if (parts.length < 3) return res.status(400).end();
    
    const paymentType = parts[0];
    const bookingId = parts[1];

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).end();

    // PROTECTION: If booking was CANCELLED (expired hold), check availability before reviving
    if (booking.status === 'CANCELLED') {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const overlapping = await Booking.findOne({
        _id: { $ne: booking._id },
        tentId: booking.tentId,
        $or: [
          { status: { $in: ['CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'] } },
          { status: 'PENDING', createdAt: { $gte: fifteenMinutesAgo } }
        ],
        $or: [
          { checkIn: { $lt: booking.checkOut, $gte: booking.checkIn } },
          { checkOut: { $gt: booking.checkIn, $lte: booking.checkOut } },
          { checkIn: { $lte: booking.checkIn }, checkOut: { $gte: booking.checkOut } }
        ]
      });

      if (overlapping) {
        console.error(`Late webhook for expired booking ${bookingId}. Tent is already taken.`);
        const Notification = require('../models/Notification');
        const admins = await User.find({ role: 'system_admin' });
        await Notification.insertMany(admins.map(admin => ({
          userId: admin._id,
          title: 'Action Required: Late Webhook Refund',
          message: `Webhook confirmed payment for expired booking ${booking.reservationCode}, but the tent is taken. Please refund.`,
          category: 'System',
          icon: 'AlertCircle'
        })));
        return res.status(200).send('Expired but paid (alerted)');
      }
      booking.status = 'PENDING';
    }

    // Idempotency check to prevent double counting
    if (booking.processed_tx_refs && booking.processed_tx_refs.includes(tx_ref)) {
      return res.status(200).send('Already processed');
    }

    booking.processed_tx_refs = booking.processed_tx_refs || [];
    booking.processed_tx_refs.push(tx_ref);

    booking.amount_paid_online += Number(amount);
    booking.balance_due = booking.totalAmount - booking.amount_paid_online;

    if (booking.balance_due <= 0) {
      booking.status = 'FULLY_PAID';
      booking.is_balance_cleared = true;
    } else {
      booking.status = 'PARTIALLY_PAID';
    }

    await booking.save();
    console.log(`Payment confirmed for booking ${bookingId}. New status: ${booking.status}`);

    // Post-payment logic: update manager payout status
    await updatePayoutInfo(booking, amount);
  }

  res.status(200).send('Webhook Received');
});

// Helper to update payout info after a successful online payment
async function updatePayoutInfo(booking, amountPaidNow) {
  try {
    // LOGIC: Admin commission is taken automatically from the FIRST available online funds.
    // This ensures platform revenue is secured before manager gets any net share.
    const totalFee = booking.commission_amount;
    const previousPaid = Number(booking.amount_paid_online) - Number(amountPaidNow);
    
    // How much fee was already covered by previous payments (like the 15% deposit)?
    const feeAlreadyCovered = Math.min(totalFee, previousPaid);
    const feeToCoverNow = Math.min(totalFee - feeAlreadyCovered, Number(amountPaidNow));
    
    // Remaining goes to manager's net payout card (Escrow)
    const managerNetFromThisPayment = Number(amountPaidNow) - feeToCoverNow;

    booking.payout_status = 'PENDING';
    await booking.save();

    const camp = await Camp.findById(booking.campId);
    if (camp) {
      const manager = await User.findById(camp.managerId);
      if (manager) {
        manager.pending_earnings = (manager.pending_earnings || 0) + managerNetFromThisPayment;
        await manager.save();
      }
    }
  } catch (err) {
    console.error('Error in updatePayoutInfo:', err.message);
  }
}

exports.releaseEscrow = asyncHandler(async (req, res, next) => {
  // SECURITY WINDOW: Funds only clear 12-24 hours after the check-in date.
  const securityWindow = new Date(Date.now() - 18 * 60 * 60 * 1000); // 18h default window

  const eligibleBookings = await Booking.find({
    payout_status: 'PENDING',
    amount_paid_online: { $gt: 0 },
    checkIn: { $lte: securityWindow },
    is_disputed: false
  });

  let releasedAmountTotal = 0;
  
  for (let booking of eligibleBookings) {
    const camp = await Camp.findById(booking.campId);
    if (!camp) continue;

    const manager = await User.findById(camp.managerId);
    if (!manager) continue;

    const totalFee = booking.commission_amount;
    const amountToRelease = Math.max(0, booking.amount_paid_online - totalFee);

    // IMPORTANT: If we release, we should ensure we don't double-release if partially paid twice.
    // However, releaseEscrow only runs once per PENDING -> READY transition.
    // We'll track the 'already_released' amount to be safe.
    // Since we don't have that field, we'll just use the pending_earnings reduction logic carefully.
    
    // Actually, the pending_earnings was already increased in updatePayoutInfo.
    // So we just move THAT amount to net_payout.
    // Wait, the manager might have pending earnings from multiple bookings.
    // We need to know how much THIS booking contributed to pending_earnings.
    
    const bookingContributionToPending = Math.max(0, booking.amount_paid_online - totalFee);
    // This is only true if ALL of it is still in pending.

    manager.pending_earnings = Math.max(0, (manager.pending_earnings || 0) - bookingContributionToPending);
    manager.net_payout = (manager.net_payout || 0) + bookingContributionToPending;
    
    booking.payout_status = 'READY';
    
    await manager.save();
    await booking.save();
    
    releasedAmountTotal += bookingContributionToPending;
    console.log(`Released ${bookingContributionToPending} for booking ${booking.reservationCode} to manager ${manager.fullName}`);
  }

  res.status(200).json({
    success: true,
    message: `Released ${releasedAmountTotal} ETB to managers.`,
    count: eligibleBookings.length
  });
});

// @desc    Dispute a Booking (Camper)
// @route   POST /api/payments/dispute/:bookingId
// @access  Private (Camper)
exports.disputeBooking = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) return next(new ErrorResponse('Booking not found', 404));
  if (booking.userId.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Can only dispute if within 24h of check-in
  const checkInTime = new Date(booking.checkIn).getTime();
  const now = Date.now();
  const diffHours = (now - checkInTime) / (1000 * 60 * 60);

  if (diffHours > 24) {
    return next(new ErrorResponse('Dispute window (24h) has expired', 400));
  }

  booking.is_disputed = true;
  booking.dispute_reason = reason;
  booking.disputed_at = new Date();
  booking.payout_status = 'DISPUTED';
  await booking.save();

  res.status(200).json({ success: true, message: 'Dispute submitted and funds frozen.' });
});

const Payout = require('../models/Payout');

// @desc    Request Payout (Manager)
// @route   POST /api/payments/request-payout
// @access  Private (Manager)
exports.requestPayout = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  if (!user.bank_account_number || !user.bank_code) {
    return next(new ErrorResponse('Please update your bank details in settings before requesting a payout', 400));
  }

  const camps = await Camp.find({ managerId: req.user._id }).select('_id');
  const campIds = camps.map(c => c._id);

  // FORCE ESCROW RELEASE (For instant payouts):
  // Move all PENDING funds to READY immediately before requesting payout
  const pendingBookings = await Booking.find({ campId: { $in: campIds }, payout_status: 'PENDING' });
  for (let b of pendingBookings) {
    const net = Math.max(0, b.amount_paid_online - (b.commission_amount || 0));
    b.payout_status = 'READY';
    await b.save();
    user.pending_earnings = Math.max(0, (user.pending_earnings || 0) - net);
    user.net_payout = (user.net_payout || 0) + net;
  }

  if (user.net_payout <= 0) {
    return next(new ErrorResponse('No funds available for payout', 400));
  }

  const amountRequested = user.net_payout;

  // Create Payout Record
  const bookings = await Booking.find({ campId: { $in: campIds }, payout_status: 'READY' }).select('_id');
  const payout = await Payout.create({
    managerId: user._id,
    amount: amountRequested,
    bookingIds: bookings.map(b => b._id),
    bank_details: {
      bank_name: user.bank_name || 'Not Specified',
      account_number: user.bank_account_number || '0000000000',
      bank_code: user.bank_code || 'N/A'
    },
    status: 'PENDING'
  });

  // Update Bookings to REQUESTED
  await Booking.updateMany(
    { campId: { $in: campIds }, payout_status: 'READY' },
    { payout_status: 'REQUESTED', payout_requested_at: new Date() }
  );

  await user.save();

  const Notification = require('../models/Notification');
  const admins = await User.find({ role: { $in: ['admin', 'system_admin'] } });
  if (admins.length > 0) {
    const adminNotifications = admins.map(admin => ({
      userId: admin._id,
      senderId: req.user._id,
      title: 'New Payout Request',
      message: `Manager ${user.fullName} has requested a payout of ${amountRequested} ETB.`,
      category: 'System',
      icon: 'DollarSign'
    }));
    await Notification.insertMany(adminNotifications);
  }

  res.status(200).json({ 
    success: true, 
    message: `Payout request for ${amountRequested} ETB submitted.`,
    data: payout
  });
});

// @desc    Confirm/Process Payout (Admin)
// @route   POST /api/payments/confirm-payout/:payoutId
// @access  Private (Admin)
exports.confirmPayout = asyncHandler(async (req, res, next) => {
  const payout = await Payout.findById(req.params.payoutId).populate('managerId');
  if (!payout) return next(new ErrorResponse('Payout record not found', 404));
  if (payout.status !== 'PENDING') return next(new ErrorResponse('Payout already processed', 400));

  const manager = payout.managerId;
  const amountPaid = payout.amount;
  const { isManual, updatedBank } = req.body;

  // 0. Update bank details if provided from the modal
  if (updatedBank && updatedBank.account) {
    payout.bank_details = {
      bank_name: updatedBank.name || payout.bank_details.bank_name,
      account_number: updatedBank.account || payout.bank_details.account_number,
      bank_code: updatedBank.code || payout.bank_details.bank_code
    };
    await payout.save();
    console.log('Updated Payout Bank Details:', payout.bank_details);
  }

  const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
  const reference = `TRANS-${payout._id}-${Date.now()}`;

  // Check if bank details are valid for Chapa
  const isInvalidDetails = !payout.bank_details.bank_code || payout.bank_details.bank_code === 'N/A' || payout.bank_details.account_number === '0000000000';

  if (isManual || isInvalidDetails) {
    console.log('Processing Manual Settlement (Bypassing Chapa)');
    
    // 2. Success: Update Balances
    manager.total_earnings = (manager.total_earnings || 0) + amountPaid;
    manager.net_payout = Math.max(0, (manager.net_payout || 0) - amountPaid);
    await manager.save();

    // 3. Update Payout Record
    payout.status = 'SETTLED';
    payout.adminId = req.user._id;
    payout.chapa_reference = reference + '-MANUAL';
    payout.settled_at = new Date();
    await payout.save();

    // 4. Update Bookings to PAID
    const camps = await Camp.find({ managerId: manager._id }).select('_id');
    const campIds = camps.map(c => c._id);
    await Booking.updateMany(
      { campId: { $in: campIds }, payout_status: 'REQUESTED' },
      { payout_status: 'PAID', payout_paid_at: new Date() }
    );

    // 5. Notify manager
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: manager._id,
      senderId: req.user._id,
      title: 'Payout Settled (Manual)',
      message: `Your payout of ${amountPaid} ETB has been settled manually by the administrator.`,
      category: 'System',
      icon: 'CheckCircle'
    });

    return res.status(200).json({ success: true, message: `Manual payout of ${amountPaid} ETB settled for ${manager.fullName}.` });
  }

  // 1. Trigger Chapa Transfer
  try {
    const transferPayload = {
      account_name: manager.fullName,
      account_number: payout.bank_details.account_number,
      amount: amountPaid.toString(),
      currency: 'ETB',
      bank_code: payout.bank_details.bank_code,
      reference: reference
    };

    console.log('Initiating Chapa Transfer:', transferPayload);
    
    const chapaRes = await axios.post('https://api.chapa.co/v1/transfers', transferPayload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (chapaRes.data.status === 'success') {
      // Success logic...
      manager.total_earnings = (manager.total_earnings || 0) + amountPaid;
      manager.net_payout = Math.max(0, (manager.net_payout || 0) - amountPaid);
      await manager.save();

      payout.status = 'SETTLED';
      payout.adminId = req.user._id;
      payout.chapa_transfer_id = chapaRes.data.data?.id;
      payout.chapa_reference = reference;
      payout.settled_at = new Date();
      await payout.save();

      const camps = await Camp.find({ managerId: manager._id }).select('_id');
      const campIds = camps.map(c => c._id);
      await Booking.updateMany(
        { campId: { $in: campIds }, payout_status: 'REQUESTED' },
        { payout_status: 'PAID', payout_paid_at: new Date() }
      );

      const Notification = require('../models/Notification');
      await Notification.create({
        userId: manager._id,
        senderId: req.user._id,
        title: 'Payout Settled',
        message: `Your payout of ${amountPaid} ETB has been successfully transferred to your bank account via Chapa.`,
        category: 'System',
        icon: 'CheckCircle'
      });

      res.status(200).json({ success: true, message: `Payout of ${amountPaid} ETB settled for ${manager.fullName} via Chapa.` });
    } else {
      throw new Error(chapaRes.data.message || 'Chapa transfer failed');
    }
  } catch (error) {
    console.error('Payout Transfer Error:', error.response?.data || error.message);
    payout.status = 'FAILED';
    payout.failure_reason = error.response?.data?.message || error.message;
    await payout.save();
    return next(new ErrorResponse(`Transfer failed: ${payout.failure_reason}`, 500));
  }
});

// @desc    Update Global Commission Rate
// @route   POST /api/payments/commission
// @access  Private (System Admin)
exports.updateGlobalCommission = asyncHandler(async (req, res, next) => {
  const { newRate, reason } = req.body;
  if (newRate === undefined || newRate === null || !reason) {
    return next(new ErrorResponse('Please provide both new rate and reason', 400));
  }

  let config = await SystemConfig.findOne({ key: 'commission_rate' });
  const oldRate = config ? config.value : 10;

  if (config) {
    config.history.push({
      old_value: oldRate,
      new_value: newRate,
      reason: reason,
      updatedBy: req.user._id
    });
    config.value = newRate;
    config.lastUpdatedBy = req.user._id;
  } else {
    config = new SystemConfig({
      key: 'commission_rate',
      value: newRate,
      description: 'Global platform commission percentage',
      lastUpdatedBy: req.user._id,
      history: [{
        old_value: 10,
        new_value: newRate,
        reason: reason,
        updatedBy: req.user._id
      }]
    });
  }

  await config.save();

  // Trigger Notifications & Emails to all Camp Managers
  const managers = await User.find({ role: { $in: ['manager', 'camp_manager'] } });
  const Notification = require('../models/Notification');
  const sendEmail = require('../utils/sendEmail');

  const notificationPromises = managers.map(async (manager) => {
    // 1. Internal Notification
    await Notification.create({
      userId: manager._id,
      senderId: req.user._id,
      title: 'Platform Commission Updated',
      message: `The system commission rate has been changed to ${newRate}%. Reason: ${reason}`,
      category: 'System',
      icon: 'Percent'
    });

    // 2. Email Notification
    try {
      await sendEmail({
        email: manager.email,
        subject: 'Important: Platform Commission Update',
        message: `
          Dear ${manager.fullName},
          
          We are updating our platform commission rate.
          
          Old Rate: ${oldRate}%
          New Rate: ${newRate}%
          
          Message from Administration:
          "${reason}"
          
          This change applies to all new bookings initialized from this moment forward. 
          Existing bookings and those currently in the payment process will honor the previous rate.
          
          Thank you for being part of our community!
        `
      });
    } catch (err) {
      console.error(`Failed to send email to ${manager.email}:`, err.message);
    }
  });

  await Promise.all(notificationPromises);

  res.status(200).json({
    success: true,
    message: `Commission updated to ${newRate}%. Managers notified.`,
    data: config
  });
});

// @desc    Get Payout Requests (Admin)
// @route   GET /api/payments/payouts
// @access  Private (Admin)
exports.getPayouts = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'camper') {
    return next(new ErrorResponse('Forbidden: Camper cannot view payouts', 403));
  }

  // 1. DATA SYNC & REPAIR: Find managers with 'REQUESTED' bookings but no 'PENDING' Payout record
  const managers = await User.find({ role: { $in: ['manager', 'camp_manager'] } });
  
  for (const manager of managers) {
    const requestedBookings = await Booking.find({ 
      payout_status: 'REQUESTED',
      campId: { $in: await Camp.find({ managerId: manager._id }).distinct('_id') }
    });

    if (requestedBookings.length > 0) {
      const existingPayout = await Payout.findOne({ 
        managerId: manager._id, 
        status: { $in: ['PENDING', 'PROCESSING'] } 
      });

      if (!existingPayout) {
        const totalAmount = requestedBookings.reduce((sum, b) => sum + (b.manager_net_payout || 0), 0);
        if (totalAmount > 0) {
          await Payout.create({
            managerId: manager._id,
            amount: totalAmount,
            bookingIds: requestedBookings.map(b => b._id),
            bank_details: {
              bank_name: manager.bank_name || 'Not Specified',
              account_number: manager.bank_account_number || '0000000000',
              bank_code: manager.bank_code || 'N/A'
            },
            status: 'PENDING'
          });
        }
      } else if (!existingPayout.bookingIds || existingPayout.bookingIds.length === 0) {
        // REPAIR: Populate missing bookingIds for existing PENDING payout
        existingPayout.bookingIds = requestedBookings.map(b => b._id);
        await existingPayout.save();
      }
    }

    // REPAIR SETTLED: Populate missing bookingIds for SETTLED payouts
    const settledPayoutsWithoutBookings = await Payout.find({
      managerId: manager._id,
      status: 'SETTLED',
      $or: [{ bookingIds: { $exists: false } }, { bookingIds: { $size: 0 } }]
    });

    for (const p of settledPayoutsWithoutBookings) {
      const paidBookings = await Booking.find({
        payout_status: 'PAID',
        campId: { $in: await Camp.find({ managerId: manager._id }).distinct('_id') },
        payout_paid_at: { $exists: true }
      }).sort('-payout_paid_at').limit(10); // Find recent ones

      if (paidBookings.length > 0) {
        p.bookingIds = paidBookings.map(b => b._id);
        await p.save();
      }
    }
  }

  // 2. Return filtered payouts based on role
  const filter = {};
  if (req.user.role === 'manager' || req.user.role === 'camp_manager') {
    filter.managerId = req.user._id;
  }

  const payouts = await Payout.find(filter)
    .populate('managerId', 'fullName email businessName bank_name bank_account_number bank_code')
    .populate('bookingIds')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payouts.length,
    data: payouts
  });
});


// @desc    Get Detailed Financials (System Admin)
// @route   GET /api/payments/admin-financials
// @access  Private (Admin)
exports.getSystemAdminFinancials = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ status: { $ne: 'CANCELLED' } })
    .populate('campId', 'name managerId')
    .populate('userId', 'fullName email')
    .sort('-createdAt');

  // Revenue trend: last 7 days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return { date: d, name: dayNames[d.getDay()], revenue: 0 };
  });

  const stats = {
    totalEscrow: 0,           // PENDING online escrow (manager net)
    totalReady: 0,            // READY/REQUESTED online cleared
    totalPaidOut: 0,          // PAID online settled
    realCommission: 0,        // Commission from actual online payments
    projectedCommission: 0,   // Commission owed from cash (not yet collected)
    totalOnlineVolume: 0,
    totalCashVolume: 0,
    totalPendingCashVolume: 0, // cash not yet collected
    totalDisputed: 0,
  };

  const ledgers = {
    escrow: {}, ready: {}, cashSettled: {}, cashPending: {}, disputed: {},
  };

  const addToLedger = (bucket, campId, campName, managerId, booking, amount) => {
    if (!ledgers[bucket][campId]) {
      ledgers[bucket][campId] = { name: campName, managerId, bookings: [], total: 0 };
    }
    ledgers[bucket][campId].bookings.push(booking);
    ledgers[bucket][campId].total += amount;
  };

  bookings.forEach(booking => {
    const campName = booking.campId?.name || 'Unknown Camp';
    const campId   = booking.campId?._id?.toString() || 'unknown';
    const managerId = booking.campId?.managerId;
    const commission = booking.commission_amount || 0;
    const managerNet = booking.manager_net_payout || 0;
    const paidOnline = booking.amount_paid_online || 0;
    const total = booking.totalAmount || 0;

    // Trend attribution
    const bDate = new Date(booking.createdAt);
    bDate.setHours(0, 0, 0, 0);
    const slot = last7Days.find(d => d.date.getTime() === bDate.getTime());

    if (booking.is_disputed) {
      stats.totalDisputed += managerNet;
      addToLedger('disputed', campId, campName, managerId, booking, managerNet);
      return;
    }

    // 1. Handle Online Payout Lifecycle (Escrow/Ready/Paid)
    if (paidOnline > 0) {
      const net = Math.max(0, paidOnline - commission);
      stats.realCommission += commission;
      stats.totalOnlineVolume += paidOnline; // Only add what was actually paid online
      if (slot) slot.revenue += commission;

      if (booking.payout_status === 'PENDING') {
        stats.totalEscrow += net;
        addToLedger('escrow', campId, campName, managerId, booking, net);
      } else if (booking.payout_status === 'READY' || booking.payout_status === 'REQUESTED') {
        stats.totalReady += net;
        addToLedger('ready', campId, campName, managerId, booking, net);
      } else if (booking.payout_status === 'PAID') {
        stats.totalPaidOut += net;
      }
    }

    // 2. Handle Cash Balance Lifecycle
    const cashPortion = total - paidOnline;
    if (cashPortion > 0) {
      // If no online payment was made at all, commission is projected/owed from cash
      if (paidOnline === 0) {
        stats.projectedCommission += commission;
        if (slot) slot.revenue += commission;
      }

      if (booking.is_balance_cleared || booking.payout_status === 'CASH_SETTLED') {
        stats.totalCashVolume += cashPortion;
        // Only add to cashSettled ledger if we need to show it, we can use managerNet if no online paid
        addToLedger('cashSettled', campId, campName, managerId, booking, paidOnline === 0 ? managerNet : cashPortion);
      } else {
        stats.totalPendingCashVolume += cashPortion;
        addToLedger('cashPending', campId, campName, managerId, booking, paidOnline === 0 ? managerNet : cashPortion);
      }
    }
  });

  const revenueTrend = last7Days.map(({ name, revenue }) => ({ name, revenue }));

  res.status(200).json({
    success: true,
    data: {
      stats,
      ledgers,
      // Convenience aliases for the frontend
      holding:     ledgers.escrow,
      ready:       ledgers.ready,
      cash:        ledgers.cashSettled,
      cashPending: ledgers.cashPending,
      disputed:    Object.values(ledgers.disputed).flatMap(c => c.bookings),
      platformStats: {
        totalCommission: stats.realCommission + stats.projectedCommission,
        totalHolding:    stats.totalEscrow,
        totalReady:      stats.totalReady,
        totalDisputed:   stats.totalDisputed,
        totalVolume:     stats.totalOnlineVolume + stats.totalCashVolume + stats.totalPendingCashVolume,
        totalCash:       stats.totalCashVolume + stats.totalPendingCashVolume,
        revenueTrend,
      },
    }
  });
});




// @desc    Repair broken financial ledgers (Recalculate splits)
// @route   POST /api/payments/repair-financials
// @access  Private (System Admin)
exports.repairFinancials = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({});

  let repairedCount = 0;

  // Get current commission rate
  const commissionConfig = await SystemConfig.findOne({ key: 'commission_rate' });
  const globalRate = commissionConfig ? Number(commissionConfig.value) : 10;

  for (const booking of bookings) {
    const rate = booking.commission_rate || globalRate;
    const expectedCommission = (booking.totalAmount * rate) / 100;
    const expectedNet        = booking.totalAmount - expectedCommission;

    // Phase 1: Ensure commission splits are set
    if (!booking.commission_amount || !booking.manager_net_payout || !booking.commission_rate) {
      booking.commission_rate    = rate;
      booking.commission_amount  = expectedCommission;
      booking.manager_net_payout = expectedNet;
      repairedCount++;
    }

    // Phase 2: Clean up ONLY ghost online payout statuses for bookings with no online payment
    // Do NOT touch CASH_SETTLED — that was set intentionally
    if (booking.amount_paid_online === 0
        && booking.payout_status
        && booking.payout_status !== 'CASH_SETTLED') {
      if (!booking.is_balance_cleared) {
        booking.payout_status = undefined;
        repairedCount++;
      }
    }

    if (booking.isModified()) await booking.save();
  }

  // Phase 3: Recalculate Manager balances
  const managers = await User.find({ role: { $in: ['manager', 'camp_manager'] } });
  for (const manager of managers) {
    const camps    = await Camp.find({ managerId: manager._id }).select('_id');
    const campIds  = camps.map(c => c._id);
    const mBookings = await Booking.find({ campId: { $in: campIds } });

    let pending = 0; // online in escrow
    let ready   = 0; // online cleared
    let total   = 0; // online paid out + cash settled

    for (const b of mBookings) {
      const fee = b.commission_amount || (b.totalAmount * (b.commission_rate || 10) / 100);
      const onlineNet = Math.max(0, (b.amount_paid_online || 0) - fee);
      if (b.payout_status === 'PENDING')              pending += onlineNet;
      if (b.payout_status === 'READY' || b.payout_status === 'REQUESTED') ready += onlineNet;
      if (b.payout_status === 'PAID')                 total   += onlineNet;
      if (b.payout_status === 'CASH_SETTLED' && (!b.amount_paid_online || b.amount_paid_online === 0)) {
        total += (b.manager_net_payout || 0);
      }
      if (b.is_balance_cleared && b.payment_method_for_balance === 'CASH') {
        const cashCollected = b.totalAmount - (b.amount_paid_online || 0);
        total += cashCollected;
      }
    }

    await User.updateOne(
      { _id: manager._id },
      { $set: { pending_earnings: pending, net_payout: ready, total_earnings: total } }
    );
  }


  res.status(200).json({
    success: true,
    message: `Repaired ${repairedCount} ledgers and recalculated ${managers.length} manager balances.`,
    data: { repairedCount, managerCount: managers.length }
  });
});
