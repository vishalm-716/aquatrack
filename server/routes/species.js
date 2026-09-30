const express = require('express');
const { body } = require('express-validator');
const { getSpecies, createSpecies } = require('../controllers/speciesController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSpecies);

router.post('/', protect, authorize('admin', 'researcher'), [
  body('name').trim().notEmpty().withMessage('Species name is required'),
  body('type').isIn(['coral', 'fish', 'invertebrate']).withMessage('Type must be coral, fish, or invertebrate'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('count').isInt({ min: 1 }).withMessage('Count must be at least 1'),
  body('sightingDate').notEmpty().withMessage('Sighting date is required')
], createSpecies);

module.exports = router;
