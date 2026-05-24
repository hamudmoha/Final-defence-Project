const express = require('express');
const router = express.Router();
const { getStats, getRecentBookings, getCampDistribution, getRevenueData, getCamperStats } = require('../controllers/dashboardController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

router.use(protect, managerOrAdmin);

router.get('/stats', getStats);
router.get('/manager/recent-bookings', getRecentBookings);

router.get('/charts/camp-distribution', getCampDistribution);
router.get('/charts/revenue', getRevenueData);
router.get('/camper/:camperId/stats', getCamperStats);

module.exports = router;
