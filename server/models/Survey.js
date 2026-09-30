const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  location: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true
  },
  gpsLat: {
    type: Number,
    required: [true, 'GPS latitude is required'],
    min: -90,
    max: 90
  },
  gpsLng: {
    type: Number,
    required: [true, 'GPS longitude is required'],
    min: -180,
    max: 180
  },
  depth: {
    type: Number,
    required: [true, 'Depth is required'],
    min: 0,
    max: 300
  },
  coralCoverPercent: {
    type: Number,
    required: [true, 'Coral cover percentage is required'],
    min: 0,
    max: 100
  },
  bleachingPercent: {
    type: Number,
    required: [true, 'Bleaching percentage is required'],
    min: 0,
    max: 100
  },
  photoUrl: {
    type: String,
    default: ''
  },
  surveyedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

surveySchema.index({ location: 1, date: -1 });
surveySchema.index({ surveyedBy: 1 });

module.exports = mongoose.model('Survey', surveySchema);
