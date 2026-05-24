const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
  migrationId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  logs: [{ type: String }],
  affectedCollections: [{ type: String }],
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Migration', migrationSchema);
