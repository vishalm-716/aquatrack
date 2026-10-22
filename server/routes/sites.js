const express = require('express');
const { getSites, getSiteById, createSite } = require('../controllers/siteController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getSites);
router.get('/:id', optionalAuth, getSiteById);
router.post('/', protect, authorize('admin', 'researcher'), createSite);

module.exports = router;
