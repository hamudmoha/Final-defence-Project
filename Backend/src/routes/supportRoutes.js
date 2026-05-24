const express = require('express');
const router = express.Router();
const { 
  submitContactForm, 
  submitSupportTicket,
  getAllTickets,
  respondToTicket,
  getMyTickets
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/contact', submitContactForm);
router.post('/support', protect, submitSupportTicket);
router.get('/support/my-tickets', protect, getMyTickets);

// Admin routes
router.get('/support/admin/all', protect, admin, getAllTickets);
router.put('/support/admin/respond/:id', protect, admin, respondToTicket);

module.exports = router;
