const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  type: { type: String, enum: ['full', 'incremental'], required: true },
  database: { type: String, default: 'MongoDB' },
  size: { type: String, default: 'N/A' },
  status: { type: String, enum: ['completed', 'failed', 'in_progress', 'scheduled'], default: 'scheduled' },
  environment: { type: String, enum: ['production', 'test', 'staging'], default: 'production' },
  changes: { type: String },      // for incremental only
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isTest: { type: Boolean, default: false },
  testResult: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
  duration: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Backup', backupSchema);
