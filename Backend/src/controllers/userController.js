const User = require('../models/User');
const Booking = require('../models/Booking');
const Camp = require('../models/Camp');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('favorites')
    .populate('recentlyViewed');
  
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.json({ success: true, data: user });
});

// @desc    Update user profile
// @route   PATCH /api/users/:id
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));

  if (user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  user.fullName = req.body.fullName !== undefined ? req.body.fullName : user.fullName;
  user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
  user.businessName = req.body.businessName !== undefined ? req.body.businessName : user.businessName;
  user.email = req.body.email !== undefined ? req.body.email : user.email;
  user.location = req.body.location !== undefined ? req.body.location : user.location;
  
  // Handle single file (profilePicture legacy) or multiple fields
  if (req.file && req.file.fieldname === 'profilePicture') {
    user.profilePicture = req.file.path;
  } else if (req.files && req.files.profilePicture) {
    user.profilePicture = req.files.profilePicture[0].path;
  } else if (req.body.profilePicture) {
    user.profilePicture = req.body.profilePicture;
  }

  let complianceUpdated = false;

  if (req.files && req.files.govId) {
    user.govId = req.files.govId[0].path;
    complianceUpdated = true;
  }
  
  if (req.files && req.files.license) {
    user.license = req.files.license[0].path;
    complianceUpdated = true;
  }
  
  if (req.body.languagePreference) user.languagePreference = req.body.languagePreference;
  
  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  // Create alert for system admin if compliance docs changed
  if (complianceUpdated) {
    const systemAdmins = await User.find({ role: 'system_admin' });
    const notifications = systemAdmins.map(admin => ({
      userId: admin._id,
      senderId: req.user._id,
      title: 'Compliance Documents Updated',
      message: `Camp Manager ${user.fullName} (${user.businessName || 'N/A'}) has updated their compliance documents.`,
      category: 'Alert',
      icon: 'FileText',
      status: 'Pending',
      isRead: false
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  res.json({ success: true, data: updatedUser });
});

// @desc    Toggle favorite camp
// @route   POST /api/users/favorites/:campId
// @access  Private
const toggleFavorite = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const campId = req.params.campId;

  const index = user.favorites.indexOf(campId);
  if (index === -1) {
    user.favorites.push(campId);
  } else {
    user.favorites.splice(index, 1);
  }

  await user.save();
  res.json({ success: true, data: user.favorites });
});

// @desc    Record recently viewed camp
// @route   POST /api/users/recently-viewed/:campId
// @access  Private
const recordView = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const campId = req.params.campId;

  // Filter out the current campId if it exists, then add to front
  user.recentlyViewed = [
    campId,
    ...user.recentlyViewed.filter(id => id.toString() !== campId.toString())
  ].slice(0, 5); // Keep last 5

  await user.save();
  res.json({ success: true, data: user.recentlyViewed });
});

// @desc    Get recommendations
// @route   GET /api/users/recommendations
// @access  Private
const getRecommendations = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('recentlyViewed');
  
  let recommendations = [];
  
  if (user.recentlyViewed && user.recentlyViewed.length > 0) {
    // If has recently viewed, show those first
    recommendations = user.recentlyViewed;
  } else {
    // If new user, show top 5 most booked camps
    recommendations = await Booking.aggregate([
      { $group: { _id: '$campId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'camps', localField: '_id', foreignField: '_id', as: 'camp' } },
      { $unwind: '$camp' },
      { $replaceRoot: { newRoot: '$camp' } }
    ]);
  }

  res.json({ success: true, data: recommendations });
});

// @desc    Get camper details for manager preview
// @route   GET /api/users/camper/:id/details
// @access  Private (Manager/Admin)
const getCamperDetails = asyncHandler(async (req, res, next) => {
  const camper = await User.findById(req.params.id).select('-password');
  if (!camper) return next(new ErrorResponse('Camper not found', 404));

  const { campId } = req.query;
  const totalBookings = await Booking.countDocuments({ userId: req.params.id });

  let pastStaysAtThisCamp = [];
  if (campId) {
    const stays = await Booking.find({ 
      userId: req.params.id, 
      campId: campId 
    }).sort({ createdAt: -1 });
    
    pastStaysAtThisCamp = stays.map(stay => ({
      dates: `${new Date(stay.checkIn).toLocaleDateString()} - ${new Date(stay.checkOut).toLocaleDateString()}`,
      status: stay.status
    }));
  }

  res.json({
    success: true,
    data: {
      ...camper.toObject(),
      trustRating: '★★★★☆',
      totalBookings,
      pastStaysAtThisCamp
    }
  });
});

const getFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.json({ success: true, data: user.favorites });
});

module.exports = { 
  getUserById, 
  updateUserProfile, 
  getCamperDetails, 
  toggleFavorite, 
  recordView, 
  getRecommendations,
  getFavorites
};
