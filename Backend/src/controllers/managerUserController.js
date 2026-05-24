const User = require('../models/User');
const Booking = require('../models/Booking');
const Camp = require('../models/Camp');
const Notification = require('../models/Notification');
const SystemLog = require('../models/SystemLog');
const ModerationRecord = require('../models/ModerationRecord');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');

// Helper to get user IDs who have booked manager's camps
const getManagerUserIds = async (managerId) => {
  const myCamps = await Camp.find({ managerId }).select('_id');
  const myCampIds = myCamps.map(c => c._id);
  const bookings = await Booking.find({ campId: { $in: myCampIds } }).select('userId');
  return [...new Set(bookings.map(b => b.userId.toString()))];
};

// @desc    Get users for manager
// @route   GET /api/manager/users
// @access  Private (Manager)
exports.getManagerUsers = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { includeBookings } = req.query;
    const userIds = await getManagerUserIds(managerId);

    let users = await User.find({ _id: { $in: userIds } }).select('-password');

    if (includeBookings === 'true') {
      const myCamps = await Camp.find({ managerId }).select('_id');
      const myCampIds = myCamps.map(c => c._id);

      // Enhance users with their bookings for this manager's camps
      users = await Promise.all(users.map(async (u) => {
        const bookings = await Booking.find({ 
          userId: u._id, 
          campId: { $in: myCampIds } 
        }).populate('campId', 'name');
        
        return {
          ...u.toObject(),
          totalBookings: bookings.length,
          lastBookingDate: bookings.length > 0 ? bookings[0].createdAt : null,
          bookings: bookings.map(b => ({
            id: b._id,
            campName: b.campId?.name,
            status: b.status
          }))
        };
      }));
    }

    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user stats for manager
// @route   GET /api/manager/users/stats
// @access  Private (Manager)
exports.getManagerUserStats = async (req, res) => {
  try {
    const managerId = req.user._id;
    const userIds = await getManagerUserIds(managerId);

    const [total, active, banned, pendingAppeals] = await Promise.all([
      User.countDocuments({ _id: { $in: userIds } }),
      User.countDocuments({ _id: { $in: userIds }, status: 'active' }),
      User.countDocuments({ _id: { $in: userIds }, status: 'banned' }),
      ModerationRecord.countDocuments({ 
        actorId: managerId, 
        type: 'local',
        status: 'active',
        'firstAppeal.message': { $exists: true, $ne: '' }
      })
    ]);

    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);
    const totalBookings = await Booking.countDocuments({ campId: { $in: myCampIds } });

    res.json({
      success: true,
      stats: { total, active, banned, totalBookings, pendingAppeals }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user registration chart for manager
// @route   GET /api/manager/users/chart
// @access  Private (Manager)
exports.getManagerUserChart = async (req, res) => {
  try {
    // Return mock data for now
    const data = [
      { month: 'Jan', users: 12, bookings: 45 },
      { month: 'Feb', users: 15, bookings: 52 },
      { month: 'Mar', users: 18, bookings: 48 },
      { month: 'Apr', users: 22, bookings: 61 },
      { month: 'May', users: 25, bookings: 55 },
      { month: 'Jun', users: 30, bookings: 67 },
    ];
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// @desc    Warn user (from manager)
// @route   POST /api/manager/users/:id/warn
// @access  Private (Manager)
exports.warnUser = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.params.id;
    const managerId = req.user._id;

    // Verify this user has actually booked with this manager
    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);
    const hasBooking = await Booking.findOne({ userId, campId: { $in: myCampIds } });

    if (!hasBooking) {
      return res.status(403).json({ success: false, message: 'Not authorized to warn this user' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.warningCount = (user.warningCount || 0) + 1;
    await user.save();

    // Create notification for the user
    await Notification.create({
      userId: user._id,
      senderId: managerId,
      title: `Official Warning from ${req.user.fullName}`,
      message: `A manager has issued a warning regarding your recent activity: "${message}"`,
      category: 'Alert',
      icon: 'AlertTriangle'
    });

    await SystemLog.create({
      action: 'warn_user', 
      level: 'warning', 
      service: 'manager',
      message: `Camp Manager ${req.user.fullName} sent a warning to ${user.fullName}`,
      actorId: managerId, 
      actorName: req.user.fullName, 
      actorRole: 'camp_manager',
      targetId: user._id, 
      targetName: user.fullName, 
      targetType: 'user',
      reason: message
    });

    // Send Email Notification
    try {
      await sendEmail({
        email: user.email,
        subject: `Security Warning - EthioCamp`,
        message: `You have received a formal warning: ${message}`,
        html: emailTemplates.statusNotification({
          userName: user.fullName,
          type: 'warning',
          reason: message
        })
      });
    } catch (emailErr) {
      console.error('Failed to send warning email:', emailErr);
    }

    res.json({ success: true, message: 'Warning sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Ban user (from manager)
// @route   PATCH /api/manager/users/:id/ban
// @access  Private (Manager)
exports.banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.params.id;
    const managerId = req.user._id;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required for banning' });
    }

    // Verify this user has actually booked with this manager
    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);
    const hasBooking = await Booking.findOne({ userId, campId: { $in: myCampIds } });

    if (!hasBooking) {
      return res.status(403).json({ success: false, message: 'Not authorized to ban this user' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if already blacklisted by this manager
    const alreadyBlacklisted = user.blacklistedFrom?.find(b => b.managerId.toString() === managerId.toString());
    if (alreadyBlacklisted) {
      return res.status(400).json({ success: false, message: 'User is already banned from your camps' });
    }

    // Add to local blacklist instead of global status change
    user.blacklistedFrom.push({
      managerId: managerId,
      reason: reason,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Create Moderation Record
    await ModerationRecord.create({
      userId: user._id,
      actorId: managerId,
      action: 'ban',
      type: 'local',
      reason: reason
    });

    await SystemLog.create({
      action: 'ban_user',
      level: 'warning',
      service: 'manager',
      message: `Camp Manager ${req.user.fullName} banned ${user.fullName} from their camps`,
      actorId: managerId,
      actorName: req.user.fullName,
      actorRole: 'camp_manager',
      targetId: user._id,
      targetName: user.fullName,
      targetType: 'user',
      reason
    });

    // Send Email Notification
    try {
      await sendEmail({
        email: user.email,
        subject: `Account Restricted - EthioCamp`,
        message: `Your access to some camps has been restricted: ${reason}`,
        html: emailTemplates.statusNotification({
          userName: user.fullName,
          type: 'ban',
          reason: reason
        })
      });
    } catch (emailErr) {
      console.error('Failed to send ban email:', emailErr);
    }

    res.json({ success: true, message: 'User banned from your camps successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Suspend user (from manager)
// @route   PATCH /api/manager/users/:id/suspend
// @access  Private (Manager)
exports.suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.params.id;
    const managerId = req.user._id;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required for suspension' });
    }

    // Verify this user has actually booked with this manager
    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);
    const hasBooking = await Booking.findOne({ userId, campId: { $in: myCampIds } });

    if (!hasBooking) {
      return res.status(403).json({ success: false, message: 'Not authorized to suspend this user' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if already blacklisted/suspended by this manager
    const alreadyRestricted = user.blacklistedFrom?.find(b => b.managerId.toString() === managerId.toString());
    if (alreadyRestricted) {
      return res.status(400).json({ success: false, message: 'User is already restricted from your camps' });
    }

    // Add to local blacklist
    user.blacklistedFrom.push({
      managerId: managerId,
      reason: `Suspended: ${reason}`,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Create Moderation Record with action 'suspend'
    await ModerationRecord.create({
      userId: user._id,
      actorId: managerId,
      action: 'suspend',
      type: 'local',
      reason: reason
    });

    await SystemLog.create({
      action: 'suspend_user',
      level: 'warning',
      service: 'manager',
      message: `Camp Manager ${req.user.fullName} suspended ${user.fullName} from their camps`,
      actorId: managerId,
      actorName: req.user.fullName,
      actorRole: 'camp_manager',
      targetId: user._id,
      targetName: user.fullName,
      targetType: 'user',
      reason
    });

    // Send Email Notification (Treat suspension like a ban notification for simplicity or use specific one)
    try {
      await sendEmail({
        email: user.email,
        subject: `Access Suspended - EthioCamp`,
        message: `Your access to some camps has been suspended: ${reason}`,
        html: emailTemplates.statusNotification({
          userName: user.fullName,
          type: 'ban',
          reason: reason
        })
      });
    } catch (emailErr) {
      console.error('Failed to send suspension email:', emailErr);
    }

    res.json({ success: true, message: 'User suspended from your camps successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Unban user (remove from manager's local blacklist)
// @route   PATCH /api/manager/users/:id/unban
// @access  Private (Manager)
exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Remove from local blacklist
    user.blacklistedFrom = user.blacklistedFrom.filter(b => b.managerId.toString() !== managerId.toString());
    await user.save();

    // Resolve active records
    await ModerationRecord.updateMany(
      { userId: id, actorId: managerId, type: 'local', status: 'active' },
      { status: 'resolved' }
    );

    // Create Moderation Record for unban
    await ModerationRecord.create({
      userId: user._id,
      actorId: managerId,
      action: 'unban',
      type: 'local',
      reason: 'Restored access by Manager',
      status: 'closed'
    });

    await SystemLog.create({
      action: 'unban_user',
      level: 'info',
      service: 'manager',
      message: `${req.user.fullName} restored access for ${user.fullName} to their camps`,
      actorId: managerId,
      actorName: req.user.fullName,
      actorRole: 'camp_manager',
      targetId: user._id,
      targetName: user.fullName,
      targetType: 'user'
    });

    // Send Restoration Email
    try {
      await sendEmail({
        email: user.email,
        subject: `Account Restored - EthioCampGround`,
        html: emailTemplates.statusNotification({
          userName: user.fullName,
          type: 'active',
          reason: 'Access has been restored by the camp manager. You can now resume bookings at their properties.'
        })
      });
    } catch (emailErr) {
      console.error('Failed to send restoration email:', emailErr);
    }

    res.json({ success: true, message: 'User restored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user warnings (for manager)
// @route   GET /api/manager/users/:id/warnings
// @access  Private (Manager)
exports.getUserWarnings = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    // Verify this user has actually booked with this manager
    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);
    const hasBooking = await Booking.findOne({ userId: id, campId: { $in: myCampIds } });

    if (!hasBooking) {
      return res.status(403).json({ success: false, message: 'Not authorized to view warnings for this user' });
    }

    const warnings = await Notification.find({ 
      userId: id, 
      category: 'Alert' 
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: warnings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get moderation history for a user (local history only)
// @route   GET /api/manager/users/:id/history
// @access  Private (Manager)
exports.getModerationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    // Managers see:
    // 1. Their own local moderation actions on this user
    // 2. Global status (maybe? but let's stick to their own records for now as per "his history")
    const history = await ModerationRecord.find({ 
      userId: id,
      actorId: managerId
    }).populate('actorId', 'fullName role').sort({ createdAt: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Submit conflict appeal (Request for Appreciation)
// @route   POST /api/manager/users/:id/conflict-appeal
// @access  Private (Manager)
exports.submitConflictAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const managerId = req.user._id;

    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    const manager = await User.findById(managerId);
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    await User.findByIdAndUpdate(managerId, {
      $push: {
        conflictAppeals: {
          camperId: id,
          message: message,
          status: 'pending'
        }
      }
    });

    // Notify admins
    const admins = await User.find({ role: 'system_admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      senderId: managerId,
      title: 'New Conflict Appeal (Request for Appreciation)',
      message: `Manager ${manager.fullName} has submitted a conflict appeal regarding user ${targetUser.fullName}.`,
      category: 'Appeal',
      icon: 'Shield'
    }));
    await Notification.insertMany(notifications);

    res.json({ success: true, message: 'Conflict appeal submitted to system admins.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
