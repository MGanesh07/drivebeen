const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'upload', 'download', 'delete', 'restore', 'rename',
        'move', 'share', 'unshare', 'favorite', 'unfavorite',
        'folder_create', 'folder_delete', 'folder_rename',
        'login', 'register', 'profile_update', 'password_change',
        'archive', 'unarchive', 'permanent_delete',
      ],
    },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ action: 1 });

module.exports = mongoose.model('Activity', activitySchema);
