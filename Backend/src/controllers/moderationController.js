const User = require('../models/User');
const ModerationRecord = require('../models/ModerationRecord');
const ModerationChat = require('../models/ModerationChat');
const Notification = require('../models/Notification');
const SystemLog = require('../models/SystemLog');

// @desc    Submit initial appeal or send message in existing chat
// @route   POST /api/moderation/appeal
// @access  Private (Banned/Suspended users can access)
exports.submitAppeal = async (req, res) => {
  try {
    const { message, managerId } = req.body;
    const user = req.user;
    
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    // Find the latest active moderation record for this user
    const query = { 
      userId: user._id, 
      action: { $in: ['ban', 'suspend'] },
      status: 'active' 
    };

    if (managerId) {
      query.actorId = managerId;
      query.type = 'local';
    } else {
      query.type = 'global';
    }

    let moderation = await ModerationRecord.findOne(query).sort({ createdAt: -1 });

    if (!moderation) {
      return res.status(404).json({ success: false, message: 'No active ban or suspension found to appeal.' });
    }

    // Check if chat already exists
    let chat = await ModerationChat.findOne({ moderationId: moderation._id });

    if (!chat) {
      // First appeal
      const attachments = {
        license: req.files?.license?.[0]?.path || null,
        govId: req.files?.govId?.[0]?.path || null,
      };

      moderation.firstAppeal = {
        message: message,
        timestamp: new Date(),
        attachments: attachments
      };
      
      // Create chat
      chat = await ModerationChat.create({
        moderationId: moderation._id,
        participants: [user._id, moderation.actorId],
        messages: [{
          senderId: user._id,
          content: message,
          attachments: [attachments.license, attachments.govId].filter(Boolean)
        }]
      });

      moderation.chatRef = chat._id;
      await moderation.save();

      // Update user state
      await User.findByIdAndUpdate(user._id, { hasAppeal: true });

      // Notify the actor (Admin or Manager)
      await Notification.create({
        userId: moderation.actorId,
        senderId: user._id,
        title: `Appeal Request from ${user.fullName}`,
        message: `${user.fullName} has submitted an appeal for their ${moderation.type} ${moderation.action}.`,
        category: 'Appeal',
        icon: 'AlertTriangle'
      });

      return res.json({ success: true, message: 'Appeal submitted successfully', isNewChat: true });
    } else {
      // Subsequent message
      chat.messages.push({
        senderId: user._id,
        content: message,
        attachments: [req.files?.license?.[0]?.path, req.files?.govId?.[0]?.path].filter(Boolean)
      });

      if (chat.messages.filter(m => m.senderId.toString() === user._id.toString()).length > 1) {
        chat.isEscalated = true;
      }

      await chat.save();

      return res.json({ success: true, message: 'Message sent successfully', isEscalated: chat.isEscalated });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat for a moderation record
// @route   GET /api/moderation/chat/:moderationId
exports.getChat = async (req, res) => {
  try {
    const chat = await ModerationChat.findOne({ moderationId: req.params.moderationId })
      .populate('participants', 'fullName role profilePicture')
      .populate('messages.senderId', 'fullName role');
    
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    // Authorization check
    const isParticipant = chat.participants.some(p => p._id.toString() === req.user._id.toString());
    const isAdmin = ['admin', 'system_admin', 'super_admin'].includes(req.user.role);

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Manager reply to appeal
// @route   POST /api/moderation/reply/:moderationId
exports.replyToAppeal = async (req, res) => {
  try {
    const { message } = req.body;
    const { moderationId } = req.params;

    const chat = await ModerationChat.findOne({ moderationId });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    chat.messages.push({
      senderId: req.user._id,
      content: message
    });

    chat.isEscalated = true; // Any reply from admin/manager usually escalates to chat mode
    await chat.save();

    // Notify the user
    const moderation = await ModerationRecord.findById(moderationId);
    await Notification.create({
      userId: moderation.userId,
      senderId: req.user._id,
      title: 'Reply to your appeal',
      message: `${req.user.fullName} has replied to your appeal. You can now chat to resolve this.`,
      category: 'System',
      icon: 'MessageSquare'
    });

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active moderation and chat for the logged in user
// @route   GET /api/moderation/my-status
exports.getMyModerationStatus = async (req, res) => {
  try {
    const user = req.user;
    const moderation = await ModerationRecord.findOne({ 
      userId: user._id, 
      action: { $in: ['ban', 'suspend'] },
      status: 'active' 
    }).sort({ createdAt: -1 }).populate('actorId', 'fullName role');

    if (!moderation) return res.json({ success: true, data: null });

    const chat = await ModerationChat.findOne({ moderationId: moderation._id });

    res.json({ 
      success: true, 
      data: {
        moderation,
        chat: chat ? {
          _id: chat._id,
          isEscalated: chat.isEscalated,
          messageCount: chat.messages.length,
          messages: chat.isEscalated ? chat.messages : [chat.messages[0]] // Only show first message if not escalated? Or all?
        } : null
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
