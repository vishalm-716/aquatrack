const { validationResult } = require('express-validator');
const Survey = require('../models/Survey');

// GET /api/surveys
exports.getSurveys = async (req, res) => {
  try {
    const { location, sort, order, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
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
      .populate('surveyedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      surveys,
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
      .populate('surveyedBy', 'name email');

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    res.json(survey);
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

    const surveyData = {
      ...req.body,
      surveyedBy: req.user._id
    };

    if (req.file) {
      surveyData.photoUrl = `/uploads/${req.file.filename}`;
    }

    const survey = await Survey.create(surveyData);
    const populated = await survey.populate('surveyedBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({ message: 'Failed to create survey' });
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

    const updated = await Survey.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('surveyedBy', 'name email');

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
