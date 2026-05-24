const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
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
  visitDate: {
    type: Date,
    required: true
  },
  ticketType: {
    type: String,
    enum: ['Adult', 'Child', 'Group'],
    default: 'Adult'
  },
  adultCount: {
    type: Number,
    default: 0
  },
  childCount: {
    type: Number,
    default: 0
  },
  infantCount: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  visitorType: {
    type: String,
    enum: ['Domestic', 'International'],
    default: 'Domestic'
  },
  currency: {
    type: String,
    enum: ['ETB', 'USD'],
    default: 'ETB'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'PayAtGate'],
    default: 'Pending'
  },
  tx_ref: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Used', 'Cancelled'],
    default: 'Pending'
  },
  qrCode: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
