const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking, getManagerBookings, updateBookingStatus, markCashPaid, manualOccupy } = require('../controllers/bookingController');
const { protect, managerOrAdmin, blockBanned } = require('../middleware/authMiddleware');

router.post('/', protect, blockBanned, createBooking);
router.post('/manual-occupy', protect, managerOrAdmin, manualOccupy);
router.get('/my-bookings', protect, getMyBookings);
router.put('/:id/cancel', protect, blockBanned, cancelBooking);
router.get('/manager-bookings', protect, managerOrAdmin, getManagerBookings);
router.put('/:id/status', protect, managerOrAdmin, updateBookingStatus);
router.patch('/:id/status', protect, managerOrAdmin, updateBookingStatus);
router.post('/:id/mark-cash-paid', protect, managerOrAdmin, markCashPaid);

module.exports = router;
