const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['camper', 'manager', 'camp_manager', 'admin', 'system_admin', 'super_admin', 'ticket_officer', 'security_officer', 'event_manager'],
    default: 'camper'
  },
  businessName: String,
  location: String,
  description: String,
  license: String,
  govId: String,
  status: {
    type: String,
    enum: ['active', 'banned', 'pending', 'suspended', 'restricted', 'soft_deleted'],
    default: 'active'
  },
  banReason: { type: String },
  statusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  forceDeletedReason: { type: String },
  hasAppeal: { type: Boolean, default: false },
  appealMessage: { type: String },
  warningCount: { type: Number, default: 0 },
  blacklistedFrom: [{
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }],
  conflictAppeals: [{
    camperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['pending', 'reviewed', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  appealAttachments: {
    license: String,
    govId: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: String,
  otpExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  profilePicture: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Camp' }],
  recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Camp' }],
  successfulBookings: { type: Number, default: 0 },
  cancellations: { type: Number, default: 0 },
  completed_bookings: { type: Number, default: 0 },
  trust_score: { type: Number, default: 100 },
  totalRatings: { type: Number, default: 0 },
  net_payout: { type: Number, default: 0 }, // Ready for request
  total_earnings: { type: Number, default: 0 }, // Already paid by admin
  pending_earnings: { type: Number, default: 0 }, // In 24h escrow
  // Bank Details for Payouts
  bank_name: String,
  bank_account_number: String,
  bank_code: String, // SWIFT or Chapa Bank Code
  isInternal: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  mustResetPassword: { type: Boolean, default: false },
  languagePreference: { type: String, enum: ['en', 'am', 'om'], default: 'en' }
}, {

  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
