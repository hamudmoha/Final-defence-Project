const express = require('express');
const router = express.Router();
const { getManagerAlerts, markAlertRead } = require('../controllers/alertController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

router.get('/manager', protect, managerOrAdmin, getManagerAlerts);
router.patch('/:id/read', protect, markAlertRead);

module.exports = router;
