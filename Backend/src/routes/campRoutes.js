const express = require('express');
const router = express.Router();
const { getCamps, getCampById, getMyCamps, createCamp, updateCamp, deleteCamp } = require('../controllers/campController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getCamps)
  .post(protect, managerOrAdmin, createCamp);

router.get('/my/camps', protect, managerOrAdmin, getMyCamps);

router.route('/:id')
  .get(getCampById)
  .put(protect, managerOrAdmin, upload.single('campImage'), updateCamp)
  .delete(protect, managerOrAdmin, deleteCamp);

module.exports = router;
