const mongoose = require('mongoose');

const speciesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Species name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['coral', 'fish', 'invertebrate'],
    required: [true, 'Species type is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  sightingDate: {
    type: Date,
    required: [true, 'Sighting date is required'],
    default: Date.now
  },
  count: {
    type: Number,
    required: [true, 'Count is required'],
    min: 1
  },
  linkedSurvey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    default: null
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    default: null
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  isForeignLegacy: {
    type: Boolean,
    default: false
  },
  country: {
    type: String,
    default: 'India'
  }
}, {
  timestamps: true
});

speciesSchema.index({ type: 1 });
speciesSchema.index({ location: 1 });
speciesSchema.index({ isForeignLegacy: 1 });
speciesSchema.index({ name: 'text', location: 'text' });

module.exports = mongoose.model('Species', speciesSchema);
