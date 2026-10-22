const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', optionalAuth, getDashboardSummary);

module.exports = router;
