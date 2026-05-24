const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'ETB'
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SETTLED', 'FAILED'],
    default: 'PENDING'
  },
  bank_details: {
    bank_name: String,
    account_number: String,
    bank_code: String
  },
  chapa_transfer_id: String,
  chapa_reference: String,
  failure_reason: String,
  settled_at: Date,
  bookingIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  requested_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payout', payoutSchema);
