const express = require('express');
const router = express.Router();
const { getCamps, getCampById, searchCamps } = require('../controllers/campController');

router.get('/all', getCamps);
router.get('/search', searchCamps);
router.get('/:id', getCampById);

module.exports = router;
