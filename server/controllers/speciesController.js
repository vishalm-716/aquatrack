const { validationResult } = require('express-validator');
const Species = require('../models/Species');
const { sendNotification } = require('../utils/notify');

// GET /api/species
exports.getSpecies = async (req, res) => {
  try {
    const { type, location, search, status, page = 1, limit = 50 } = req.query;
    const filter = {
      isForeignLegacy: { $ne: true }
    };

    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (status) filter.status = status;

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
      .populate('recordedBy', 'name email role')
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

    const speciesData = {
      ...req.body,
      recordedBy: req.user ? req.user._id : null,
      status: req.user?.role === 'admin' ? 'verified' : 'pending'
    };

    const species = await Species.create(speciesData);
    const populated = await species.populate('recordedBy', 'name email role');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create species error:', error);
    res.status(500).json({ message: 'Failed to create species record' });
  }
};

// PUT /api/species/:id/verify (Admin approval/rejection)
exports.verifySpecies = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified, rejected, or pending' });
    }

    const species = await Species.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('recordedBy', 'name email role');

    if (!species) {
      return res.status(404).json({ message: 'Species record not found' });
    }

    if (species.recordedBy && ['verified', 'rejected'].includes(status)) {
      await sendNotification({
        recipient: species.recordedBy._id || species.recordedBy,
        sender: req.user._id,
        entityType: 'species',
        entityId: species._id,
        status,
        title: `Biodiversity Record ${status === 'verified' ? 'Approved' : 'Rejected'}`,
        message: `Your specimen sighting of "${species.name}" (${species.count} observed) at "${species.location}" has been ${status === 'verified' ? 'approved and cataloged' : 'rejected'} by Dr. Marina Reyes.`
      });
    }

    res.json(species);
  } catch (error) {
    console.error('Verify species error:', error);
    res.status(500).json({ message: 'Failed to update species status' });
  }
};

// DELETE /api/species/:id (Admin delete)
exports.deleteSpecies = async (req, res) => {
  try {
    const species = await Species.findById(req.params.id);

    if (!species) {
      return res.status(404).json({ message: 'Species record not found' });
    }

    await Species.findByIdAndDelete(req.params.id);
    res.json({ message: 'Species record deleted successfully' });
  } catch (error) {
    console.error('Delete species error:', error);
    res.status(500).json({ message: 'Failed to delete species record' });
  }
};
