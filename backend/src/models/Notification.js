const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['upload_success', 'share_invite', 'storage_warning', 'account', 'system', 'download', 'delete'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    icon: { type: String, default: 'bell' },
    actionUrl: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
