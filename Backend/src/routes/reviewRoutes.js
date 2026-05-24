const express = require('express');
const router = express.Router();
const { rateCamp, rateCamper } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/camp', protect, rateCamp);
router.post('/camper', protect, rateCamper);

module.exports = router;
