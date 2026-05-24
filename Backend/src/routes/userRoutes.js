const express = require('express');
const router = express.Router();
const { 
  getUserById, 
  updateUserProfile, 
  getCamperDetails,
  toggleFavorite,
  recordView,
  getRecommendations,
  getFavorites
} = require('../controllers/userController');
const { protect, managerOrAdmin, blockBanned } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/recommendations', protect, getRecommendations);
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:campId', protect, toggleFavorite);
router.post('/record-view/:campId', protect, recordView);

router.get('/camper/:id/details', protect, managerOrAdmin, getCamperDetails);

// Alias for /api/users/me -> updates their own profile
router.patch('/me', protect, blockBanned, upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'govId', maxCount: 1 }, { name: 'license', maxCount: 1 }]), (req, res, next) => {
  req.params.id = req.user._id;
  updateUserProfile(req, res, next);
});

router.route('/:id')
  .get(protect, getUserById)
  .patch(protect, blockBanned, upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'govId', maxCount: 1 }, { name: 'license', maxCount: 1 }]), updateUserProfile);

module.exports = router;
