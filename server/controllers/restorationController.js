const { validationResult } = require('express-validator');
const Restoration = require('../models/Restoration');
const { sendNotification } = require('../utils/notify');

// GET /api/restoration
exports.getRestorations = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { isForeignLegacy: { $ne: true } };

    if (status) {
      if (status === 'pending') {
        filter.$or = [{ status: 'pending' }, { status: { $exists: false } }, { status: null }];
      } else {
        filter.status = status;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Restoration.countDocuments(filter);

    const restorations = await Restoration.find(filter)
      .populate('loggedBy', 'name email role')
      .populate('linkedSurvey', 'location date')
      .populate('siteId', 'name region')
      .sort({ datePlanted: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Sanitize for public / unauthenticated users
    const sanitized = restorations.map(r => {
      const doc = r.toObject();
      if (!req.user || req.user.role === 'public') {
        if (doc.loggedBy) {
          doc.loggedBy = { _id: doc.loggedBy._id, name: doc.loggedBy.name };
        }
      }
      return doc;
    });

    res.json({
      restorations: sanitized,
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

    const data = {
      ...req.body,
      loggedBy: req.user._id,
      status: req.user?.role === 'admin' ? 'verified' : 'pending'
    };

    if (req.files) {
      if (req.files.beforePhoto && req.files.beforePhoto[0]) {
        data.beforePhotoUrl = `/uploads/${req.files.beforePhoto[0].filename}`;
      }
      if (req.files.afterPhoto && req.files.afterPhoto[0]) {
        data.afterPhotoUrl = `/uploads/${req.files.afterPhoto[0].filename}`;
      }
    }

    const restoration = await Restoration.create(data);
    const populated = await restoration.populate('loggedBy', 'name email role');

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
    }).populate('loggedBy', 'name email role');

    res.json(updated);
  } catch (error) {
    console.error('Update restoration error:', error);
    res.status(500).json({ message: 'Failed to update restoration record' });
  }
};

// PUT /api/restoration/:id/verify (Admin approval/rejection)
exports.verifyRestoration = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified, rejected, or pending' });
    }

    const restoration = await Restoration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('loggedBy', 'name email role');

    if (!restoration) {
      return res.status(404).json({ message: 'Restoration record not found' });
    }

    if (restoration.loggedBy && ['verified', 'rejected'].includes(status)) {
      await sendNotification({
        recipient: restoration.loggedBy._id || restoration.loggedBy,
        sender: req.user._id,
        entityType: 'restoration',
        entityId: restoration._id,
        status,
        title: `Restoration Plot ${status === 'verified' ? 'Approved' : 'Rejected'}`,
        message: `Your restoration outplant plot "${restoration.siteName}" (${restoration.coralSpecies}) has been ${status === 'verified' ? 'verified and approved' : 'rejected'} by Dr. Marina Reyes.`
      });
    }

    res.json(restoration);
  } catch (error) {
    console.error('Verify restoration error:', error);
    res.status(500).json({ message: 'Failed to update restoration status' });
  }
};

// DELETE /api/restoration/:id (Admin delete)
exports.deleteRestoration = async (req, res) => {
  try {
    const restoration = await Restoration.findById(req.params.id);

    if (!restoration) {
      return res.status(404).json({ message: 'Restoration record not found' });
    }

    await Restoration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restoration plot record deleted successfully' });
  } catch (error) {
    console.error('Delete restoration error:', error);
    res.status(500).json({ message: 'Failed to delete restoration record' });
  }
};
