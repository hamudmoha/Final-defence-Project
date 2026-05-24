const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, verifyTicketPayment } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createTicket)
  .get(protect, getMyTickets);

router.get('/verify/:tx_ref', protect, verifyTicketPayment);

module.exports = router;
