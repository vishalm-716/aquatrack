const express = require('express');
const { body } = require('express-validator');
const {
  getSurveys, getSurveyById, createSurvey, updateSurvey, deleteSurvey, verifySurvey
} = require('../controllers/surveyController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, getSurveys);
router.get('/:id', optionalAuth, getSurveyById);

router.post('/', protect, authorize('admin', 'researcher'), upload.single('photo'), [
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('gpsLat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('gpsLng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('depth').isFloat({ min: 0 }).withMessage('Valid depth required'),
  body('coralCoverPercent').isFloat({ min: 0, max: 100 }).withMessage('Coral cover must be 0-100'),
  body('bleachingPercent').isFloat({ min: 0, max: 100 }).withMessage('Bleaching must be 0-100')
], createSurvey);

router.put('/:id', protect, authorize('admin', 'researcher'), upload.single('photo'), updateSurvey);
router.put('/:id/verify', protect, authorize('admin'), verifySurvey);
router.delete('/:id', protect, authorize('admin'), deleteSurvey);

module.exports = router;
