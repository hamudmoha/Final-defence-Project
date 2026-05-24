const mongoose = require('mongoose');

const tentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camp',
    required: true
  },
  description: {
    type: String
  },
  capacity: {
    type: Number,
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  size: {
    type: String
  },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Occupied', 'Maintenance'],
    default: 'Available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tent', tentSchema);
