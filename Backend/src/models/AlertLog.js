const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipients: { type: String, enum: ['all', 'campers', 'managers', 'active'], default: 'all' },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
  type: { type: String, default: 'System Alert' },
  recipientsCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AlertLog', alertLogSchema);
