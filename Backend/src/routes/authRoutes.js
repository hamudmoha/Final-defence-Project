const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  verifyOTP,
  googleLogin,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  requestDeletionOTP,
  selfDeleteAccount,
  restoreManagerAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'govId', maxCount: 1 },
  { name: 'campImage', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]), registerUser);
router.post('/signup', upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'govId', maxCount: 1 },
  { name: 'campImage', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]), registerUser); // Alias
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/request-password-reset', forgotPassword); // Alias
router.post('/verify-reset-otp', verifyResetOTP);
router.put('/reset-password', resetPassword);

router.post('/deletion-otp', protect, requestDeletionOTP);
router.post('/self-delete', protect, selfDeleteAccount);
router.post('/restore-manager', protect, upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'govId', maxCount: 1 },
  { name: 'campImage', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]), restoreManagerAccount);

// Safe-guarded payload delivery handlers mapping to layout components
router.get('/me', protect, getUserProfile);
router.get('/profile', protect, getUserProfile); // Alias

module.exports = router;
