const mongoose = require('mongoose');

const campSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  pricePerNight: {
    type: Number,
    required: false
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 4
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 4
  },
  totalBookings: { type: Number, default: 0 },
  rejectionReason: { type: String },
  warnMessage: { type: String },
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked', 'banned', 'rejected'],
    default: 'active'
  },
  businessStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allow_flex_pay: {
    type: Boolean,
    default: false
  },
  require_full_payment: {
    type: Boolean,
    default: false
  },
  policy: {
    type: String,
    default: 'No specific policy defined yet.'
  },
  sessionTimeout: {
    type: Number,
    default: 30
  },
  loginNotifications: {
    type: Boolean,
    default: true
  },
  limitSessions: {
    type: Boolean,
    default: false
  },
  policyHistory: [{
    text: String,
    date: { type: Date, default: Date.now }
  }],
  minStay: {
    type: Number,
    default: 1
  },
  maxStay: {
    type: Number,
    default: 30
  },
  advanceBooking: {
    type: Number,
    default: 90
  },
  autoApprove: {
    type: Boolean,
    default: true
  },
  allowSameDay: {
    type: Boolean,
    default: false
  },
  currency: {
    type: String,
    default: 'ETB'
  },
  depositPercentage: {
    type: Number,
    default: 30
  },
  acceptedPaymentMethods: {
    type: [String],
    default: ['Credit Card', 'Bank Transfer', 'Mobile Money', 'Cash']
  },
  cancellationWindow: {
    type: Number,
    default: 7
  },
  refundPercentage: {
    type: Number,
    default: 80
  },
  fullRefundPolicy: {
    type: Boolean,
    default: true
  },
  partialRefundPolicy: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Camp', campSchema);
