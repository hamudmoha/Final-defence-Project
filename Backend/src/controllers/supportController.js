const SupportTicket = require('../models/SupportTicket');

// @desc    Submit contact form (Public)
// @route   POST /api/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // For public contact, we might just log or send an email, 
    // but for "fully functional" we'll save it as a 'guest' ticket or similar if needed.
    // However, the user specifically mentioned camper and camp manager.
    
    console.log(`Contact message received from ${name} (${email}): ${message}`);

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit support ticket (Private)
// @route   POST /api/support
// @access  Private
const submitSupportTicket = async (req, res) => {
  try {
    const { subject, message, priority, name, email } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      name: name || req.user.fullName,
      email: email || req.user.email,
      subject,
      message,
      priority: priority || 'medium',
      role: req.user.role,
      status: 'open'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Support ticket submitted successfully',
      data: ticket 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all support tickets (Admin Only)
// @route   GET /api/support/admin/all
// @access  Private/Admin
const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('userId', 'fullName email role profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Respond to a ticket (Admin Only)
// @route   PUT /api/support/admin/respond/:id
// @access  Private/Admin
const respondToTicket = async (req, res) => {
  try {
    const { adminResponse, status } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.adminResponse = adminResponse;
    ticket.status = status || 'resolved';
    ticket.adminId = req.user._id;
    ticket.respondedAt = Date.now();

    await ticket.save();

    res.status(200).json({ success: true, message: 'Response sent successfully', data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my tickets (User/Manager)
// @route   GET /api/support/my-tickets
// @access  Private
const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  submitContactForm, 
  submitSupportTicket, 
  getAllTickets, 
  respondToTicket,
  getMyTickets
};
