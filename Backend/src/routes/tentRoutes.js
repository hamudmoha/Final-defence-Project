const express = require('express');
const router = express.Router();
const { getTents, getTentsByCamp, addTent, updateTent, checkTentAvailability } = require('../controllers/tentController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getTents);
router.get('/camp/:campId', getTentsByCamp);
router.get('/availability/:campId', checkTentAvailability);
router.post('/camp/:campId', protect, managerOrAdmin, upload.array('images', 10), addTent);
router.put('/:id', protect, managerOrAdmin, upload.array('images', 10), updateTent);

module.exports = router;
