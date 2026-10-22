const Notification = require('../models/Notification');

exports.sendNotification = async ({ recipient, sender, entityType, entityId, status, title, message, type }) => {
  try {
    if (!recipient) return null;
    if (sender && recipient.toString() === sender.toString()) return null;

    const notif = await Notification.create({
      recipient,
      sender: sender || null,
      type: type || `${entityType}_${status === 'verified' ? 'approved' : 'rejected'}`,
      entityType,
      entityId: entityId || null,
      status,
      title,
      message,
      read: false
    });
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};
