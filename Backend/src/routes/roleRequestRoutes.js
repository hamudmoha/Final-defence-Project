const express = require('express');
const router = express.Router();
const {
  saveDraft,
  submitApplication,
  getMyApplication,
  getApplications,
  reviewApplication
} = require('../controllers/roleRequestController');

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Camper routes
router.post('/draft', protect, upload.fields([
  { name: 'govId', maxCount: 1 }, 
  { name: 'license', maxCount: 1 }, 
  { name: 'profilePicture', maxCount: 1 },
  { name: 'coverPhotos', maxCount: 5 }
]), saveDraft);
router.post('/submit', protect, submitApplication);
router.get('/my-request', protect, getMyApplication);

// Admin routes
router.get('/', protect, admin, getApplications);
router.put('/:id/review', protect, admin, reviewApplication);

module.exports = router;
