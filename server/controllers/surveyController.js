const { validationResult } = require('express-validator');
const Survey = require('../models/Survey');
const Site = require('../models/Site');

// GET /api/surveys
exports.getSurveys = async (req, res) => {
  try {
    const {
      location,
      siteId,
      region,
      minBleaching,
      maxBleaching,
      startDate,
      endDate,
      sort,
      order,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {
      isForeignLegacy: { $ne: true }
    };

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (siteId) {
      filter.siteId = siteId;
    }
    if (region && region !== 'all') {
      filter.region = region;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.surveyedBy) {
      filter.surveyedBy = req.query.surveyedBy;
    }
    if (minBleaching !== undefined && minBleaching !== '') {
      filter.bleachingPercent = { ...(filter.bleachingPercent || {}), $gte: parseFloat(minBleaching) };
    }
    if (maxBleaching !== undefined && maxBleaching !== '') {
      filter.bleachingPercent = { ...(filter.bleachingPercent || {}), $lte: parseFloat(maxBleaching) };
    }
    if (startDate) {
      filter.date = { ...(filter.date || {}), $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.date = { ...(filter.date || {}), $lte: new Date(endDate) };
    }

    const sortObj = {};
    if (sort) {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    } else {
      sortObj.date = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Survey.countDocuments(filter);

    const surveys = await Survey.find(filter)
      .populate('surveyedBy', 'name email role')
      .populate('siteId', 'name region coordinates')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Redact surveyor email for public
    const sanitized = surveys.map(s => {
      const doc = s.toObject();
      if (!req.user || req.user.role === 'public') {
        if (doc.surveyedBy) {
          doc.surveyedBy = { _id: doc.surveyedBy._id, name: doc.surveyedBy.name };
        }
      }
      return doc;
    });

    res.json({
      surveys: sanitized,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({ message: 'Failed to fetch surveys' });
  }
};

// GET /api/surveys/:id
exports.getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('surveyedBy', 'name email role')
      .populate('siteId', 'name region coordinates');

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    const doc = survey.toObject();
    if (!req.user || req.user.role === 'public') {
      if (doc.surveyedBy) {
        doc.surveyedBy = { _id: doc.surveyedBy._id, name: doc.surveyedBy.name };
      }
    }

    res.json(doc);
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ message: 'Failed to fetch survey' });
  }
};

// POST /api/surveys
exports.createSurvey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      location,
      gpsLat,
      gpsLng,
      depth,
      coralCoverPercent,
      bleachingPercent,
      date,
      siteId,
      region
    } = req.body;

    const lat = parseFloat(gpsLat);
    const lng = parseFloat(gpsLng);
    const depthVal = parseFloat(depth);
    const coralVal = parseFloat(coralCoverPercent);
    const bleachVal = parseFloat(bleachingPercent);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'Latitude must be between -90 and 90' });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Longitude must be between -180 and 180' });
    }
    if (isNaN(depthVal) || depthVal < 0) {
      return res.status(400).json({ message: 'Depth must be a non-negative number' });
    }
    if (isNaN(coralVal) || coralVal < 0 || coralVal > 100) {
      return res.status(400).json({ message: 'Coral cover must be between 0 and 100%' });
    }
    if (isNaN(bleachVal) || bleachVal < 0 || bleachVal > 100) {
      return res.status(400).json({ message: 'Bleaching must be between 0 and 100%' });
    }

    let linkedSiteId = siteId || null;
    let siteRegion = region || '';

    // If siteId provided, verify it
    if (linkedSiteId) {
      const existingSite = await Site.findById(linkedSiteId);
      if (existingSite) {
        siteRegion = existingSite.region;
      } else {
        linkedSiteId = null;
      }
    }

    // If no siteId, attempt to link by name or create a new Site
    if (!linkedSiteId && location) {
      let matchedSite = await Site.findOne({ name: location.trim() });
      if (!matchedSite) {
        // Find by close proximity (~0.05 deg / ~5km)
        matchedSite = await Site.findOne({
          'coordinates.lat': { $gte: lat - 0.05, $lte: lat + 0.05 },
          'coordinates.lng': { $gte: lng - 0.05, $lte: lng + 0.05 }
        });
      }

      if (matchedSite) {
        linkedSiteId = matchedSite._id;
        siteRegion = matchedSite.region;
      } else {
        // Automatically create a Site so the new survey appears immediately on the India Map
        // Determine plausible region from coordinates if in India
        let detectedRegion = 'Other';
        let detectedState = 'India';

        if (lat >= 8.5 && lat <= 10.0 && lng >= 78.5 && lng <= 80.0) {
          detectedRegion = 'Gulf of Mannar';
          detectedState = 'Tamil Nadu';
        } else if (lat >= 22.0 && lat <= 23.5 && lng >= 69.0 && lng <= 70.8) {
          detectedRegion = 'Gulf of Kachchh';
          detectedState = 'Gujarat';
        } else if (lat >= 9.5 && lat <= 12.5 && lng >= 71.5 && lng <= 74.5) {
          detectedRegion = 'Lakshadweep';
          detectedState = 'Lakshadweep';
        } else if (lat >= 6.5 && lat <= 14.0 && lng >= 92.0 && lng <= 94.5) {
          detectedRegion = 'Andaman & Nicobar Islands';
          detectedState = 'Andaman & Nicobar Islands';
        }

        const newSite = await Site.create({
          name: location.trim(),
          region: region || detectedRegion,
          stateOrUT: detectedState,
          coordinates: { lat, lng },
          depthRange: { min: Math.max(1, depthVal - 2), max: depthVal + 5 },
          description: `Site created from field transect survey: ${location}`
        });

        linkedSiteId = newSite._id;
        siteRegion = newSite.region;
      }
    }

    const surveyData = {
      location: location.trim(),
      gpsLat: lat,
      gpsLng: lng,
      depth: depthVal,
      coralCoverPercent: coralVal,
      bleachingPercent: bleachVal,
      date: date ? new Date(date) : new Date(),
      siteId: linkedSiteId,
      region: siteRegion,
      surveyedBy: req.user._id,
      status: req.user?.role === 'admin' ? 'verified' : 'pending',
      isForeignLegacy: false,
      country: 'India'
    };

    if (req.file) {
      surveyData.photoUrl = `/uploads/${req.file.filename}`;
    }

    const survey = await Survey.create(surveyData);
    const populated = await survey.populate([
      { path: 'surveyedBy', select: 'name email role' },
      { path: 'siteId', select: 'name region coordinates' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({ message: 'Failed to create survey: ' + error.message });
  }
};

// PUT /api/surveys/:id
exports.updateSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Only admin or the original surveyor can update
    if (req.user.role !== 'admin' && survey.surveyedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this survey' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.photoUrl = `/uploads/${req.file.filename}`;
    }

    if (updateData.gpsLat) updateData.gpsLat = parseFloat(updateData.gpsLat);
    if (updateData.gpsLng) updateData.gpsLng = parseFloat(updateData.gpsLng);
    if (updateData.depth) updateData.depth = parseFloat(updateData.depth);
    if (updateData.coralCoverPercent) updateData.coralCoverPercent = parseFloat(updateData.coralCoverPercent);
    if (updateData.bleachingPercent) updateData.bleachingPercent = parseFloat(updateData.bleachingPercent);

    const updated = await Survey.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('surveyedBy', 'name email role').populate('siteId', 'name region coordinates');

    res.json(updated);
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ message: 'Failed to update survey' });
  }
};

// DELETE /api/surveys/:id
exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    await Survey.findByIdAndDelete(req.params.id);
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({ message: 'Failed to delete survey' });
  }
};

// PUT /api/surveys/:id/verify (Admin verification action)
exports.verifySurvey = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified, rejected, or pending' });
    }

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('surveyedBy', 'name email role').populate('siteId', 'name region coordinates');

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    res.json(survey);
  } catch (error) {
    console.error('Verify survey error:', error);
    res.status(500).json({ message: 'Failed to update survey verification status' });
  }
};

