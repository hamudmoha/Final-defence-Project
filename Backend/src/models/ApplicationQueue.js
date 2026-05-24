const mongoose = require('mongoose');

const applicationQueueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  businessName: {
    type: String,
  },
  location: {
    type: String,
  },
  description: {
    type: String,
  },
  phone: {
    type: String,
  },
  govId: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  license: {
    type: String,
  },
  coverPhotos: [{
    type: String
  }],
  rejectionReason: {
    type: String,
  },
  rejectionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ApplicationQueue', applicationQueueSchema);
