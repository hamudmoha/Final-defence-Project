const Notification = require('../models/Notification');

// @desc    Get mock notification stats
// @route   GET /api/notifications/stats
// @access  Private (Admin)
const getNotificationStats = async (req, res) => {
  res.json({
    total: 10,
    delivered: 8,
    pending: 2,
    failed: 0
  });
};

// @desc    Get real notifications list
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get mock notification templates
// @route   GET /api/notifications/templates
// @access  Private (Admin)
const getTemplates = async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Booking Confirmation', codeName: 'booking_confirmed', isActive: true }
    ]
  });
};

// @desc    Get mock settings
// @route   GET /api/notifications/settings
// @access  Private (Admin)
const getSettings = async (req, res) => {
  res.json({
    provider: 'SendGrid',
    smtp: 'smtp.ethiocamp.et',
    fromEmail: 'noreply@ethiocamp.et',
    port: 587
  });
};

module.exports = { getNotificationStats, getNotifications, getTemplates, getSettings, markAsRead };
