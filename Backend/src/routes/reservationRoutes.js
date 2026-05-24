const express = require('express');
const router = express.Router();
const { getReservationStats, getReservationCharts, getReservations } = require('../controllers/reservationController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

router.use(protect, managerOrAdmin);

router.get('/stats', getReservationStats);
router.get('/charts', getReservationCharts);
router.get('/', getReservations);

module.exports = router;
