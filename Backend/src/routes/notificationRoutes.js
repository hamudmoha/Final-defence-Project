const express = require('express');
const router = express.Router();
const { getNotificationStats, getNotifications, getTemplates, getSettings, markAsRead } = require('../controllers/notificationController');
const { protect, managerOrAdmin, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SystemLog = require('../models/SystemLog');

const upload = require('../middleware/uploadMiddleware');

router.get('/stats', protect, managerOrAdmin, getNotificationStats);
router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.get('/templates', protect, managerOrAdmin, getTemplates);
router.get('/settings', protect, managerOrAdmin, getSettings);

// Appeal endpoint — available to banned/suspended users
router.post('/appeal', protect, upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'govId', maxCount: 1 }
]), async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;
    
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Appeal message is required' });

    // For managers, license and govId are required if suspended/banned
    if (user.role === 'camp_manager' && (!req.files?.license || !req.files?.govId)) {
      // If they already have them in profile, maybe it's fine? 
      // But the requirement says "Must upload", so we check if they are provided in this request
      if (!user.appealAttachments?.license && !req.files?.license) {
         return res.status(400).json({ success: false, message: 'Managers must upload Business License and Gov ID to appeal.' });
      }
    }

    const attachments = {
      license: req.files?.license?.[0]?.path || user.appealAttachments?.license,
      govId: req.files?.govId?.[0]?.path || user.appealAttachments?.govId,
    };

    // Identify who to notify: the person who changed the status, or all admins if none found
    let targetAdminIds = [];
    if (user.statusChangedBy) {
      targetAdminIds = [user.statusChangedBy];
    } else {
      const admins = await User.find({ role: { $in: ['admin', 'system_admin', 'super_admin'] }, status: 'active' }).select('_id');
      targetAdminIds = admins.map(a => a._id);
    }

    const notifications = targetAdminIds.map(adminId => ({
      userId: adminId,
      senderId: user._id,
      title: `Appeal Request from ${user.fullName}`,
      message: `${user.fullName} (${user.status}) has submitted an appeal: "${message}"`,
      category: 'Appeal',
      icon: 'AlertTriangle',
    }));
    
    if (notifications.length) await Notification.insertMany(notifications);

    // Log the appeal
    await SystemLog.create({
      action: 'appeal_submitted',
      level: 'info',
      service: 'admin',
      message: `${user.fullName} submitted an appeal (status: ${user.status})`,
      actorId: user._id,
      actorName: user.fullName,
      actorRole: user.role,
      reason: message,
    });

    // Update user state
    await User.findByIdAndUpdate(user._id, {
      hasAppeal: true,
      appealMessage: message,
      appealAttachments: attachments
    });

    res.json({ success: true, message: 'Appeal submitted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
