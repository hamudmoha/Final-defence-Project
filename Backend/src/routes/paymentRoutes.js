const express = require('express');
const { initializePayment, verifyPayment, chapaWebhook, releaseEscrow, disputeBooking, requestPayout, confirmPayout, getPayouts, getSystemAdminFinancials, updateGlobalCommission, repairFinancials } = require('../controllers/paymentController');



const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/initialize', protect, initializePayment);
router.get('/verify/:tx_ref', protect, verifyPayment);
router.post('/webhooks/chapa', chapaWebhook);

// Payout and Escrow
router.post('/release-escrow', protect, releaseEscrow);
router.post('/dispute/:bookingId', protect, disputeBooking);
router.post('/request-payout', protect, requestPayout);
router.post('/confirm-payout/:payoutId', protect, confirmPayout);
router.get('/payouts', protect, getPayouts);
router.get('/admin-financials', protect, getSystemAdminFinancials);
router.post('/commission', protect, updateGlobalCommission);
router.post('/repair-financials', protect, repairFinancials);

module.exports = router;



