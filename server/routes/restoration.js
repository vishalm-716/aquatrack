const express = require('express');
const { body } = require('express-validator');
const {
  getRestorations, createRestoration, updateRestoration
} = require('../controllers/restorationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getRestorations);

router.post('/', protect, authorize('admin', 'researcher'),
  upload.fields([
    { name: 'beforePhoto', maxCount: 1 },
    { name: 'afterPhoto', maxCount: 1 }
  ]),
  [
    body('siteName').trim().notEmpty().withMessage('Site name is required'),
    body('coralSpecies').trim().notEmpty().withMessage('Coral species is required'),
    body('datePlanted').notEmpty().withMessage('Planting date is required'),
    body('survivalRatePercent').isFloat({ min: 0, max: 100 }).withMessage('Survival rate must be 0-100')
  ],
  createRestoration
);

router.put('/:id', protect, authorize('admin', 'researcher'),
  upload.fields([
    { name: 'beforePhoto', maxCount: 1 },
    { name: 'afterPhoto', maxCount: 1 }
  ]),
  updateRestoration
);

module.exports = router;
