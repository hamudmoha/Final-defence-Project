const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const moderationChatSchema = new mongoose.Schema({
  moderationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModerationRecord',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  isEscalated: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModerationChat', moderationChatSchema);
