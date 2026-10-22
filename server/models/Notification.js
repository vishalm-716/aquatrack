const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: [
      'survey_approved',
      'survey_rejected',
      'species_approved',
      'species_rejected',
      'restoration_approved',
      'restoration_rejected',
      'general'
    ],
    default: 'general'
  },
  entityType: {
    type: String,
    enum: ['survey', 'species', 'restoration'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['verified', 'rejected'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
