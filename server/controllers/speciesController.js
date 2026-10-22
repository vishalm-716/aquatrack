const { validationResult } = require('express-validator');
const Species = require('../models/Species');

// GET /api/species
exports.getSpecies = async (req, res) => {
  try {
    const { type, location, search, page = 1, limit = 20 } = req.query;
    const filter = {
      isForeignLegacy: { $ne: true }
    };

    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (search) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Species.countDocuments(filter);

    const species = await Species.find(filter)
      .populate('linkedSurvey', 'location date')
      .sort({ sightingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      species,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get species error:', error);
    res.status(500).json({ message: 'Failed to fetch species records' });
  }
};

// POST /api/species
exports.createSpecies = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const species = await Species.create(req.body);
    res.status(201).json(species);
  } catch (error) {
    console.error('Create species error:', error);
    res.status(500).json({ message: 'Failed to create species record' });
  }
};
