const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    permission: { type: String, enum: ['viewer', 'editor', 'owner'], default: 'viewer' },
    shareLink: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    accessCount: { type: Number, default: 0 },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

sharedFileSchema.index({ file: 1 });
sharedFileSchema.index({ sharedBy: 1 });
sharedFileSchema.index({ sharedWith: 1 });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
