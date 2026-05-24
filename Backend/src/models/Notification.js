const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Booking', 'System', 'Alert', 'Appeal'],
    default: 'System'
  },
  icon: {
    type: String,
    default: 'Bell'
  },
  status: {
    type: String,
    enum: ['Pending', 'Delivered', 'Failed'],
    default: 'Pending'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
