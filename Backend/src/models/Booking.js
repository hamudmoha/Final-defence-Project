const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true
  },
  tentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tent',
    required: false
  },
  guestName: {
    type: String,
    required: true
  },
  guestEmail: {
    type: String,
    required: true
  },
  guestPhone: {
    type: String
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deposit_amount: { type: Number, default: 0 },
  amount_paid_online: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  payment_method_for_balance: {
    type: String,
    enum: ['ONLINE', 'CASH']
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PARTIALLY_PAID', 'FULLY_PAID'],
    default: 'PENDING'
  },
  is_balance_cleared: { type: Boolean, default: false },
  processed_tx_refs: [String],
  reservationCode: {
    type: String,
    unique: true
  },
  commission_rate: { type: Number, default: 10 }, // Percentage
  commission_amount: { type: Number, default: 0 },
  manager_net_payout: { type: Number, default: 0 },
  payout_status: {
    type: String,
    enum: ['PENDING', 'READY', 'REQUESTED', 'PAID', 'DISPUTED', 'CASH_SETTLED']
  },
  is_disputed: { type: Boolean, default: false },
  dispute_reason: String,
  disputed_at: Date,
  payout_requested_at: Date,
  payout_paid_at: Date,
  isRatedByCamper: { type: Boolean, default: false },
  isRatedByManager: { type: Boolean, default: false },
  isManual: { type: Boolean, default: false }
}, {

  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
