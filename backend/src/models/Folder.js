const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    color: { type: String, default: '#7C3AED' },
    icon: { type: String, default: 'folder' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, isDeleted: 1 });
folderSchema.index({ owner: 1, parent: 1 });

module.exports = mongoose.model('Folder', folderSchema);
