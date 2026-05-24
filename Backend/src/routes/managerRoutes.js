const express = require('express');
const router = express.Router();
const { 
  getManagerUsers, 
  getManagerUserStats, 
  getManagerUserChart, 
  warnUser, 
  banUser, 
  suspendUser,
  unbanUser,
  getUserWarnings,
  submitConflictAppeal,
  getModerationHistory
} = require('../controllers/managerUserController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

router.use(protect, managerOrAdmin);

router.get('/users', getManagerUsers);
router.get('/users/stats', getManagerUserStats);
router.get('/users/chart', getManagerUserChart);
router.post('/users/:id/warn', warnUser);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/unban', unbanUser);
router.get('/users/:id/warnings', getUserWarnings);
router.post('/users/:id/conflict-appeal', submitConflictAppeal);
router.get('/users/:id/history', getModerationHistory);

module.exports = router;
