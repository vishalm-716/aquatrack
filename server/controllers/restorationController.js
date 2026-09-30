const { validationResult } = require('express-validator');
const Restoration = require('../models/Restoration');

// GET /api/restoration
exports.getRestorations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Restoration.countDocuments();

    const restorations = await Restoration.find()
      .populate('loggedBy', 'name email')
      .populate('linkedSurvey', 'location date')
      .sort({ datePlanted: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      restorations,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get restorations error:', error);
    res.status(500).json({ message: 'Failed to fetch restoration records' });
  }
};

// POST /api/restoration
exports.createRestoration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = { ...req.body, loggedBy: req.user._id };

    if (req.files) {
      if (req.files.beforePhoto && req.files.beforePhoto[0]) {
        data.beforePhotoUrl = `/uploads/${req.files.beforePhoto[0].filename}`;
      }
      if (req.files.afterPhoto && req.files.afterPhoto[0]) {
        data.afterPhotoUrl = `/uploads/${req.files.afterPhoto[0].filename}`;
      }
    }

    const restoration = await Restoration.create(data);
    const populated = await restoration.populate('loggedBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create restoration error:', error);
    res.status(500).json({ message: 'Failed to create restoration record' });
  }
};

// PUT /api/restoration/:id
exports.updateRestoration = async (req, res) => {
  try {
    const restoration = await Restoration.findById(req.params.id);

    if (!restoration) {
      return res.status(404).json({ message: 'Restoration record not found' });
    }

    const updateData = { ...req.body };

    if (req.files) {
      if (req.files.beforePhoto && req.files.beforePhoto[0]) {
        updateData.beforePhotoUrl = `/uploads/${req.files.beforePhoto[0].filename}`;
      }
      if (req.files.afterPhoto && req.files.afterPhoto[0]) {
        updateData.afterPhotoUrl = `/uploads/${req.files.afterPhoto[0].filename}`;
      }
    }

    const updated = await Restoration.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('loggedBy', 'name email');

    res.json(updated);
  } catch (error) {
    console.error('Update restoration error:', error);
    res.status(500).json({ message: 'Failed to update restoration record' });
  }
};
