const User = require('../models/User');
const Camp = require('../models/Camp');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const emailTemplates = require('../utils/emailTemplates');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not defined in environment variables! Using insecure fallback for development only.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_key_123', {
    expiresIn: '30d', // 🌟 Fixed this option name!
  });
};

// Helper: Ensure manager has a camp record
const ensureManagerHasCamp = async (user) => {
  if (user.role === 'manager' || user.role === 'camp_manager') {
    let camp = await Camp.findOne({ managerId: user._id });
    if (!camp) {
      try {
        camp = await Camp.create({
          name: user.businessName || `${user.fullName}'s Camp`,
          description: user.description || 'No description provided yet.',
          location: user.location || 'No location provided yet.',
          managerId: user._id,
          status: 'active',
          businessStatus: 'pending'
        });
      } catch (e) {
        console.error('Camp creation failed:', e.message);
      }
    }
    return camp;
  }
  return null;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone, role, businessName, location, description } = req.body;
  const finalEmail = email || req.body.contactEmail;

  const userExists = await User.findOne({ email: finalEmail });
  if (userExists) {
    return next(new ErrorResponse('User already exists', 400));
  }

  let licenseUrl = '';
  let govIdUrl = '';
  let campImageUrl = '';
  let profilePictureUrl = '';
  if (req.files) {
    if (req.files.license?.[0]) licenseUrl = req.files.license[0].path;
    if (req.files.govId?.[0]) govIdUrl = req.files.govId[0].path;
    if (req.files.campImage?.[0]) campImageUrl = req.files.campImage[0].path;
    if (req.files.profilePicture?.[0]) profilePictureUrl = req.files.profilePicture[0].path;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    fullName,
    email: finalEmail,
    password,
    phone,
    role: role || 'camper',
    status: (role === 'camp_manager' || role === 'manager') ? 'pending' : 'active',
    businessName,
    location,
    description,
    license: licenseUrl,
    govId: govIdUrl,
    profilePicture: profilePictureUrl,
    otp,
    otpExpire
  });

  if (user.role === 'camp_manager' || user.role === 'manager') {
    await Camp.create({
      name: businessName || `${fullName}'s Camp`,
      description: description || 'No description provided yet.',
      location: location || 'No location provided yet.',
      managerId: user._id,
      status: 'active',
      businessStatus: 'pending',
      images: campImageUrl ? [campImageUrl] : []
    });
  }

  console.log(`[DEVELOPMENT] OTP for ${user.email} is: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'EthioCamp - Verify Your Account',
      message: `Your EthioCamp verification OTP is: ${otp}`,
      html: emailTemplates.otpVerification({ otp })
    });
  } catch (error) {
    console.error('Email failed to send during registration:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Verify your email with OTP.',
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    }
  });
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const identifier = req.body.identifier || req.body.email;
  const { password } = req.body;

  if (!identifier || !password) {
    return next(new ErrorResponse('Please provide identifier and password', 400));
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });

  if (!user || !(await user.matchPassword(password))) {
    return next(new ErrorResponse('Invalid email or password', 401));
  }

  if (!user.isVerified) {
    return next(new ErrorResponse('Please verify your email first', 401));
  }

  // Handle soft_deleted users
  if (user.status === 'soft_deleted') {
    if (user.role === 'manager' || user.role === 'camp_manager') {
      const gracePeriodDays = 15;
      const msInDay = 24 * 60 * 60 * 1000;
      const daysSinceDeletion = user.deletedAt ? (Date.now() - new Date(user.deletedAt).getTime()) / msInDay : 16;
      
      if (daysSinceDeletion <= gracePeriodDays) {
        // Within grace period: require restoration
        return res.status(403).json({
          success: false,
          requires_restoration: true,
          message: 'Account is deleted but within the 15-day grace period. You must restore your account to continue.',
          data: {
            _id: user._id,
            email: user.email,
            token: generateToken(user._id) // Issue a token specifically for the restore endpoint
          }
        });
      } else {
        // Grace period expired! Scramble credentials if they aren't already scrambled
        if (!user.email.startsWith('deleted_user_')) {
          user.email = `deleted_user_${user._id}@archived.ethio`;
          user.fullName = 'Archived Manager';
          user.password = '';
          user.phone = '';
          user.profilePicture = '';
          user.businessName = user.businessName ? `Archived Business ${user._id}` : '';
          await user.save({ validateBeforeSave: false });
        }
      }
    }
    // Campers or Managers past 15 days
    return next(new ErrorResponse('Account has been permanently deactivated', 403));
  }

  const camp = await ensureManagerHasCamp(user);

  res.json({
    success: true,
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      token: generateToken(user._id),
      campId: camp?._id,
      businessName: camp?.name || user.businessName,
      profilePicture: user.profilePicture,
      net_payout: user.net_payout,
      pending_earnings: user.pending_earnings,
      total_earnings: user.total_earnings
    }
  });
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('favorites');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const camp = await ensureManagerHasCamp(user);

  res.json({
    success: true,
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      businessName: camp?.name || user.businessName,
      location: user.location,
      description: user.description,
      profilePicture: user.profilePicture,
      favorites: user.favorites,
      campId: camp?._id,
      net_payout: user.net_payout,
      pending_earnings: user.pending_earnings,
      total_earnings: user.total_earnings
    }
  });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res, next) => {
  const identifier = req.body.email || req.body.target;
  const otp = req.body.otp || req.body.code;

  if (!identifier || !otp) {
    return next(new ErrorResponse('Please provide target and code', 400));
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.isVerified) {
    return next(new ErrorResponse('User already verified', 400));
  }

  if (user.otp !== otp || user.otpExpire < Date.now()) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: `Welcome to EthioCampGround, ${user.fullName}!`,
      html: emailTemplates.welcomeEmail({ userName: user.fullName })
    });
  } catch (e) {
    console.error('Welcome email failed:', e.message);
  }

  const camp = await ensureManagerHasCamp(user);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id),
      campId: camp?._id,
      businessName: camp?.name || user.businessName,
      net_payout: user.net_payout,
      pending_earnings: user.pending_earnings,
      total_earnings: user.total_earnings
    }
  });
});

// @desc    Google Login
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = asyncHandler(async (req, res, next) => {
  const { credential, role } = req.body;
  if (!credential) {
    return next(new ErrorResponse('Google credential is required', 400));
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { email, name, picture, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (!user) {
    const userRole = role || 'camper';
    user = await User.create({
      fullName: name,
      email,
      password: Math.random().toString(36).slice(-10),
      role: userRole,
      isVerified: true,
      isEmailVerified: true,
      profilePicture: picture,
      status: (userRole === 'camp_manager' || userRole === 'manager') ? 'pending' : 'active'
    });

    if (userRole === 'camp_manager' || userRole === 'manager') {
      await Camp.create({
        name: `${name}'s Camp`,
        description: 'No description provided yet. Please update your profile.',
        location: 'No location provided yet.',
        managerId: user._id,
        status: 'active',
        businessStatus: 'pending'
      });
    }

    console.log(`Auto-registered new Google user: ${email} as ${userRole}`);
  }

  const camp = await ensureManagerHasCamp(user);

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
      campId: camp?._id,
      businessName: camp?.name || user.businessName,
      net_payout: user.net_payout,
      pending_earnings: user.pending_earnings,
      total_earnings: user.total_earnings
    }
  });
});

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const identifier = req.body.email || req.body.target;

  if (!identifier) {
    return next(new ErrorResponse('Please provide email or phone number', 400));
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });

  if (!user) {
    return next(new ErrorResponse('There is no account matching that identifier', 404));
  }

  // Allow all system roles to reset password
  const allowedRoles = ['camper', 'manager', 'camp_manager', 'admin', 'system_admin', 'super_admin', 'ticket_officer', 'security_officer', 'event_manager'];
  if (!allowedRoles.includes(user.role)) {
    return next(new ErrorResponse('Password reset not available for this account type', 403));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpire = new Date(Date.now() + 3 * 60 * 1000);

  user.otp = otp;
  user.otpExpire = otpExpire;
  await user.save({ validateBeforeSave: false });

  console.log(`[PASSWORD RESET] OTP for ${user.email} is: ${otp}`);

  if (user.role === 'manager' || user.role === 'camp_manager') {
    try {
      const Notification = require('../models/Notification');
      const admins = await User.find({ role: { $in: ['admin', 'system_admin', 'super_admin'] } });

      const adminNotifs = admins.map(admin => ({
        userId: admin._id,
        senderId: user._id,
        title: 'Security Alert: Manager Password Reset',
        message: `Manager ${user.fullName} (${user.email}) has requested a password reset code.`,
        category: 'Security',
        icon: 'ShieldAlert',
        isRead: false
      }));

      await Notification.insertMany(adminNotifs);
      console.log('Security alert sent to admins for manager password reset.');
    } catch (e) {
      console.error('Failed to send security alert:', e.message);
    }
  }

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP',
      message: `Your 6-digit verification code for password reset is: ${otp}. It expires in 3 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>You requested a password reset. Please use the following 6-digit code to verify your identity:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This code will expire in <strong>3 minutes</strong>. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'OTP sent to email', devOtp: otp });
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Verify Reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyResetOTP = asyncHandler(async (req, res, next) => {
  const identifier = (req.body.email || req.body.target || '').trim();
  const otp = (req.body.otp || req.body.code || '').trim();

  if (!identifier || !otp) {
    return next(new ErrorResponse('Please provide identifier and reset code', 400));
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
    otp,
    otpExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    role: user.role
  });
});

// @desc    Reset Password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const identifier = (req.body.email || req.body.target || '').trim();
  const otp = (req.body.otp || req.body.code || '').trim();
  const password = req.body.password || req.body.newPassword;

  if (!identifier || !otp || !password) {
    return next(new ErrorResponse('Please provide identifier, code, and new password', 400));
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
    otp,
    otpExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  user.password = password;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

// @desc    Request Deletion OTP
// @route   POST /api/auth/deletion-otp
// @access  Private
const requestDeletionOTP = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpire = otpExpire;
  await user.save({ validateBeforeSave: false });

  console.log(`[DELETION] OTP for ${user.email} is: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Account Deletion Verification Code',
      message: `Your 6-digit verification code to delete your account is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d32f2f; text-align: center;">Account Deletion Request</h2>
          <p>You have requested to delete your account. Please use the following 6-digit code to verify your identity:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d32f2f; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please change your password immediately.</p>
        </div>
      `
    });
    res.status(200).json({ success: true, message: 'Deletion OTP sent to email' });
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Self Delete Account
// @route   POST /api/auth/self-delete
// @access  Private
const selfDeleteAccount = asyncHandler(async (req, res, next) => {
  const { otp, password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role === 'manager' || user.role === 'camp_manager') {
    if (!password) {
      return next(new ErrorResponse('Password is required for managers to delete account', 400));
    }
    if (!(await user.matchPassword(password))) {
      return next(new ErrorResponse('Invalid password', 401));
    }
  }

  if (!otp || user.otp !== otp || user.otpExpire < Date.now()) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  // Guardrails
  const Booking = require('../models/Booking');
  if (user.role === 'camper') {
    const activeBookings = await Booking.find({
      userId: user._id,
      status: { $in: ['PENDING', 'CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'] },
      checkIn: { $gte: new Date() }
    });
    if (activeBookings.length > 0) {
      return next(new ErrorResponse('Cannot delete account with active or upcoming reservations', 400));
    }
  } else if (user.role === 'manager' || user.role === 'camp_manager') {
    const myCamps = await Camp.find({ managerId: user._id });
    const myCampIds = myCamps.map(c => c._id);

    const activeBookings = await Booking.find({
      campId: { $in: myCampIds },
      status: { $in: ['PENDING', 'CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'] },
      checkIn: { $gte: new Date() }
    });
    
    if (activeBookings.length > 0) {
      return next(new ErrorResponse('Cannot delete account: You have active or upcoming camper reservations', 400));
    }

    const Payout = require('../models/Payout');
    const unresolvedPayouts = await Payout.find({
      managerId: user._id,
      status: { $in: ['PENDING', 'PROCESSING'] }
    });

    if (unresolvedPayouts.length > 0) {
      return next(new ErrorResponse('Cannot delete account: You have unresolved financial payouts', 400));
    }

    // Cascade Camp Status
    await Camp.updateMany({ managerId: user._id }, { status: 'archived', businessStatus: 'suspended' });
  }

  // PII Anonymization - only for Camper immediately, NOT for Manager (Manager has 15-day grace period)
  if (user.role === 'camper') {
    user.email = `deleted_user_${user._id}@archived.ethio`;
    user.fullName = 'Archived Camper';
    user.password = '';
    user.phone = '';
    user.profilePicture = '';
    user.businessName = '';
  }

  user.status = 'soft_deleted';
  user.deletedAt = Date.now();
  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Account successfully soft-deleted' });
});

// @desc    Restore Manager Account
// @route   POST /api/auth/restore-manager
// @access  Private (Needs specific token from soft_deleted login)
const restoreManagerAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user || user.status !== 'soft_deleted' || !(user.role === 'manager' || user.role === 'camp_manager')) {
    return next(new ErrorResponse('Not eligible for restoration', 403));
  }

  const gracePeriodDays = 15;
  const msInDay = 24 * 60 * 60 * 1000;
  const daysSinceDeletion = user.deletedAt ? (Date.now() - new Date(user.deletedAt).getTime()) / msInDay : 16;
  
  if (daysSinceDeletion > gracePeriodDays) {
    return next(new ErrorResponse('Grace period expired. Account permanently deactivated', 403));
  }

  let licenseUrl = '';
  let govIdUrl = '';
  let campImageUrl = '';
  let profilePictureUrl = '';
  
  if (req.files) {
    if (req.files.license?.[0]) licenseUrl = req.files.license[0].path;
    if (req.files.govId?.[0]) govIdUrl = req.files.govId[0].path;
    if (req.files.campImage?.[0]) campImageUrl = req.files.campImage[0].path;
    if (req.files.profilePicture?.[0]) profilePictureUrl = req.files.profilePicture[0].path;
  }

  if (!licenseUrl || !govIdUrl || !profilePictureUrl) {
    return next(new ErrorResponse('Please upload all required compliance documents to request restoration', 400));
  }

  // Re-enable account to pending
  user.status = 'pending';
  user.license = licenseUrl;
  user.govId = govIdUrl;
  user.profilePicture = profilePictureUrl;
  if (req.body.email) user.email = req.body.email;
  if (req.body.phone) user.phone = req.body.phone;
  if (req.body.fullName) user.fullName = req.body.fullName;
  if (req.body.businessName) user.businessName = req.body.businessName;
  if (req.body.password) {
     const bcrypt = require('bcryptjs');
     const salt = await bcrypt.genSalt(10);
     user.password = await bcrypt.hash(req.body.password, salt);
  }
  
  user.deletedAt = undefined;
  
  await user.save({ validateBeforeSave: false });

  if (campImageUrl) {
    await Camp.updateMany({ managerId: user._id }, { 
      $push: { images: campImageUrl },
      status: 'active',
      businessStatus: 'pending' 
    });
  } else {
    // just update status back to pending
    await Camp.updateMany({ managerId: user._id }, { 
      status: 'active',
      businessStatus: 'pending' 
    });
  }

  // Notify admins
  const Notification = require('../models/Notification');
  const admins = await User.find({ role: { $in: ['admin', 'system_admin', 'super_admin'] } });
  const adminNotifs = admins.map(admin => ({
    userId: admin._id,
    senderId: user._id,
    title: 'Account Restoration Request',
    message: `Manager ${user.fullName} has requested account restoration and uploaded new compliance documents.`,
    category: 'Security',
    icon: 'Shield',
    isRead: false
  }));
  await Notification.insertMany(adminNotifs);

  res.status(200).json({ success: true, message: 'Restoration request submitted. Please wait for admin approval.' });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  verifyOTP,
  googleLogin,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  requestDeletionOTP,
  selfDeleteAccount,
  restoreManagerAccount
};