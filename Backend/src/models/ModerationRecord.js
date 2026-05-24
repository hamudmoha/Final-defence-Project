const mongoose = require('mongoose');

const moderationRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['ban', 'unban', 'suspend', 'unsuspend', 'warn'],
    required: true
  },
  type: {
    type: String,
    enum: ['global', 'local'],
    required: true
  },
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp'
  },
  reason: {
    type: String,
    required: true
  },
  firstAppeal: {
    message: String,
    timestamp: Date,
    attachments: {
      license: String,
      govId: String
    }
  },
  chatRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModerationChat'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModerationRecord', moderationRecordSchema);
