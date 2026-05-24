const Notification = require('../models/Notification');

// @desc    Get alerts for manager
// @route   GET /api/alerts/manager
// @access  Private (Manager)
exports.getManagerAlerts = async (req, res) => {
  try {
    const alerts = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Map isRead to read for frontend compatibility
    const mappedAlerts = alerts.map(a => {
      const obj = a.toObject();
      obj.read = obj.isRead;
      return obj;
    });

    res.json({
      success: true,
      data: mappedAlerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark alert as read
// @route   PATCH /api/alerts/:id/read
// @access  Private
exports.markAlertRead = async (req, res) => {
  try {
    const alert = await Notification.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Ensure user owns this alert
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    alert.isRead = true; 
    await alert.save();

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
