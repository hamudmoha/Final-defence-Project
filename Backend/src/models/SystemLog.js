const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  // Action classification
  action: { type: String, default: 'system' }, // e.g. 'warn_user', 'ban_user', 'approve_camp', 'send_alert', 'block_ip'
  level: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
  service: { type: String, default: 'api' },

  // Who did it
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName: { type: String },
  actorRole: { type: String },

  // Who/what was affected
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetName: { type: String },
  targetType: { type: String, enum: ['user', 'camp', 'booking', 'ip', 'system'], default: 'system' },

  // Human-readable summary & detail
  message: { type: String, required: true },
  reason: { type: String },       // ban reason, warning message, etc.
  details: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },

  // Legacy
  userId: { type: String },
  ip: { type: String },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

module.exports = mongoose.model('SystemLog', systemLogSchema);
