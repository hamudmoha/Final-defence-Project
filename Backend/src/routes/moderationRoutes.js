const express = require('express');
const router = express.Router();
const { 
  submitAppeal, 
  getChat, 
  replyToAppeal, 
  getMyModerationStatus 
} = require('../controllers/moderationController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// User routes (Banned users can access 'protect' but may be restricted by other middleware, 
// so we ensure they can reach these)
router.post('/appeal', protect, upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'govId', maxCount: 1 }
]), submitAppeal);

router.get('/my-status', protect, getMyModerationStatus);

// Chat routes
router.get('/chat/:moderationId', protect, getChat);
router.post('/reply/:moderationId', protect, replyToAppeal);

module.exports = router;
