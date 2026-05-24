const express = require('express');
const router = express.Router();
const { getBackupData, createBackup, generateReport, restoreBackup } = require('../controllers/backupController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are admin or manager
router.use(protect);
// Removed strict admin middleware to allow managers to control their own settings backups

router.get('/history', getBackupData);
router.post('/create', createBackup);
router.get('/report', generateReport);
router.post('/restore', restoreBackup);

module.exports = router;
