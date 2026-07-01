const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const storageService = require('../services/storageService');
const { asyncHandler, formatBytes } = require('../utils/helpers');

// POST /api/files/upload
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided.' });

  const { folder } = req.body;
  const { storageKey, storageUrl } = await storageService.uploadFile(req.file);
  const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();

  const file = await File.create({
    name: req.file.originalname,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey,
    storageUrl,
    extension: ext,
    owner: req.user._id,
    folder: folder || null,
  });

  // Update user storage
  await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: req.file.size } });

  await Activity.create({ user: req.user._id, action: 'upload', file: file._id, metadata: { name: file.name, size: req.file.size } });
  await Notification.create({
    user: req.user._id, type: 'upload_success',
    title: 'File uploaded successfully',
    message: `"${file.name}" (${formatBytes(file.size)}) has been uploaded to your drive.`,
    relatedFile: file._id, icon: 'upload',
  });

  res.status(201).json({ success: true, file });
});

// GET /api/files
const getFiles = asyncHandler(async (req, res) => {
  const { folder, sort = '-createdAt', page = 1, limit = 50, category } = req.query;
  const query = { owner: req.user._id, isDeleted: false, isArchived: false };
  if (folder === 'root') query.folder = null;
  else if (folder) query.folder = folder;
  if (category) query.category = category;

  const total = await File.countDocuments(query);
  const files = await File.find(query)
    .populate('folder', 'name color')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, files, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// GET /api/files/:id
const getFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id }).populate('folder', 'name');
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });
  res.json({ success: true, file });
});

// GET /api/files/:id/download
const downloadFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  const stream = await storageService.getFileStream(file.storageKey);
  file.downloadCount += 1;
  file.lastAccessedAt = new Date();
  await file.save();
  await Activity.create({ user: req.user._id, action: 'download', file: file._id, metadata: { name: file.name } });

  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', file.mimeType);
  stream.pipe(res);
});

// GET /api/files/serve/:userId/:filename
const serveFile = asyncHandler(async (req, res) => {
  const { userId, filename } = req.params;
  const storageKey = path.resolve(process.env.UPLOAD_PATH || 'uploads', userId, filename);
  const file = await File.findOne({ storageKey, owner: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });
  const stream = await storageService.getFileStream(file.storageKey);
  res.setHeader('Content-Type', file.mimeType);
  stream.pipe(res);
});

// PUT /api/files/:id
const updateFile = asyncHandler(async (req, res) => {
  const { name, folder, tags, description } = req.body;
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  const oldName = file.name;
  if (name) file.name = name;
  if (folder !== undefined) file.folder = folder || null;
  if (tags) file.tags = tags;
  if (description !== undefined) file.description = description;
  await file.save();

  if (name && name !== oldName) {
    await Activity.create({ user: req.user._id, action: 'rename', file: file._id, metadata: { oldName, newName: name } });
  }
  if (folder !== undefined) {
    await Activity.create({ user: req.user._id, action: 'move', file: file._id, metadata: { folder } });
  }

  res.json({ success: true, file });
});

// DELETE /api/files/:id (soft delete → move to trash)
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();

  // Reduce storage immediately so the sidebar & Storage page reflect the change
  await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });

  await Activity.create({ user: req.user._id, action: 'delete', file: file._id, metadata: { name: file.name } });

  res.json({ success: true, message: 'File moved to trash.' });
});

// POST /api/files/:id/favorite
const toggleFavorite = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });
  file.isFavorite = !file.isFavorite;
  await file.save();
  await Activity.create({ user: req.user._id, action: file.isFavorite ? 'favorite' : 'unfavorite', file: file._id });
  res.json({ success: true, isFavorite: file.isFavorite });
});

// GET /api/files/favorites
const getFavorites = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id, isFavorite: true, isDeleted: false })
    .populate('folder', 'name color').sort('-updatedAt');
  res.json({ success: true, files });
});

// GET /api/files/recent
const getRecentFiles = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id, isDeleted: false })
    .populate('folder', 'name color').sort('-createdAt').limit(20);
  res.json({ success: true, files });
});

// POST /api/files/:id/archive
const toggleArchive = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });
  file.isArchived = !file.isArchived;
  await file.save();
  await Activity.create({ user: req.user._id, action: file.isArchived ? 'archive' : 'unarchive', file: file._id });
  res.json({ success: true, isArchived: file.isArchived });
});

// GET /api/files/archived
const getArchivedFiles = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id, isArchived: true, isDeleted: false })
    .populate('folder', 'name color').sort('-updatedAt');
  res.json({ success: true, files });
});

module.exports = {
  uploadFile, getFiles, getFile, downloadFile, serveFile,
  updateFile, deleteFile, toggleFavorite, getFavorites,
  getRecentFiles, toggleArchive, getArchivedFiles,
};
