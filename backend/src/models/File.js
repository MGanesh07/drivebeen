const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true }, // Local path or S3 key
    storageUrl: { type: String, default: null },   // Public URL (S3) or null for local
    category: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'other'],
      default: 'other',
    },
    extension: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    tags: [{ type: String }],
    downloadCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null },
    thumbnail: { type: String, default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes for performance
fileSchema.index({ owner: 1, isDeleted: 1 });
fileSchema.index({ owner: 1, folder: 1 });
fileSchema.index({ owner: 1, isFavorite: 1 });
fileSchema.index({ owner: 1, isArchived: 1 });
fileSchema.index({ name: 'text', originalName: 'text' });

// Determine file category from MIME type
fileSchema.pre('save', function (next) {
  const mime = this.mimeType || '';
  if (mime.startsWith('image/')) this.category = 'image';
  else if (mime.startsWith('video/')) this.category = 'video';
  else if (mime.startsWith('audio/')) this.category = 'audio';
  else if (
    mime.includes('pdf') || mime.includes('word') || mime.includes('document') ||
    mime.includes('spreadsheet') || mime.includes('presentation') || mime.includes('text')
  ) this.category = 'document';
  else this.category = 'other';
  next();
});

module.exports = mongoose.model('File', fileSchema);
