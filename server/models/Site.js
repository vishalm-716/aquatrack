const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Site name is required'],
    unique: true,
    trim: true
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: [
      'Gulf of Mannar',
      'Gulf of Kachchh',
      'Lakshadweep',
      'Andaman & Nicobar Islands',
      'Other'
    ],
    default: 'Other'
  },
  stateOrUT: {
    type: String,
    trim: true,
    default: 'India'
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    }
  },
  depthRange: {
    min: { type: Number, default: 2, min: 0 },
    max: { type: Number, default: 30, min: 0 }
  },
  isMarineProtectedArea: {
    type: Boolean,
    default: true
  },
  isRestrictedCoordinates: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true,
    default: ''
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

siteSchema.index({ region: 1 });
siteSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('Site', siteSchema);
