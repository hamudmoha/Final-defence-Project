const express = require('express');
const router = express.Router();
const { getDatabaseData, createIndex, runMigration, validateIntegrity } = require('../controllers/databaseController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are admin only
router.use(protect);
router.use(admin);

router.get('/stats', getDatabaseData);
router.post('/indexes', createIndex);
router.post('/migrations', runMigration);
router.get('/validate', validateIntegrity);

module.exports = router;
