const mongoose = require('mongoose');

const restorationSchema = new mongoose.Schema({
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true
  },
  coralSpecies: {
    type: String,
    required: [true, 'Coral species is required'],
    trim: true
  },
  datePlanted: {
    type: Date,
    required: [true, 'Planting date is required']
  },
  survivalRatePercent: {
    type: Number,
    required: [true, 'Survival rate is required'],
    min: 0,
    max: 100
  },
  beforePhotoUrl: {
    type: String,
    default: ''
  },
  afterPhotoUrl: {
    type: String,
    default: ''
  },
  linkedSurvey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    default: null
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Restoration', restorationSchema);
