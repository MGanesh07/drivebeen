const Notification = require('../models/Notification');
const { asyncHandler } = require('../utils/helpers');

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = await Notification.countDocuments({ user: req.user._id });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  const notifications = await Notification.find({ user: req.user._id })
    .populate('relatedFile', 'name mimeType').populate('relatedUser', 'name avatar')
    .sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
  res.json({ success: true, notifications, total, unreadCount, page: parseInt(page) });
});

// PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true }, { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, notification });
});

// PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Notification deleted.' });
});

// DELETE /api/notifications/clear-all
const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ success: true, message: 'All notifications cleared.' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications };
