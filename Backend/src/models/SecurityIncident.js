const mongoose = require('mongoose');

const securityIncidentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  user: { type: String },          // email or identifier
  ip: { type: String },
  status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SecurityIncident', securityIncidentSchema);
