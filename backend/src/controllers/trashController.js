const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const Activity = require('../models/Activity');
const storageService = require('../services/storageService');
const { asyncHandler } = require('../utils/helpers');

// GET /api/trash
const getTrash = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id, isDeleted: true })
    .populate('folder', 'name').sort('-deletedAt');
  const folders = await Folder.find({ owner: req.user._id, isDeleted: true }).sort('-deletedAt');
  res.json({ success: true, files, folders });
});

// POST /api/trash/:id/restore
const restoreFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
  if (!file) return res.status(404).json({ success: false, message: 'File not found in trash.' });

  file.isDeleted = false;
  file.deletedAt = null;
  await file.save();

  // Add back the storage that was deducted on soft-delete
  await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: file.size } });

  await Activity.create({ user: req.user._id, action: 'restore', file: file._id, metadata: { name: file.name } });
  res.json({ success: true, message: 'File restored successfully.', file });
});

// POST /api/trash/folder/:id/restore
const restoreFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found in trash.' });

  const recursiveRestore = async (folderId) => {
    // find files in this folder that are deleted
    const files = await File.find({ folder: folderId, isDeleted: true, owner: req.user._id });
    let sizeRestored = files.reduce((acc, f) => acc + f.size, 0);

    await Folder.findByIdAndUpdate(folderId, { isDeleted: false, deletedAt: null });
    await File.updateMany({ folder: folderId, isDeleted: true }, { isDeleted: false, deletedAt: null });

    const subfolders = await Folder.find({ parent: folderId, owner: req.user._id, isDeleted: true });
    for (const sub of subfolders) {
      sizeRestored += await recursiveRestore(sub._id);
    }
    return sizeRestored;
  };

  const totalRestored = await recursiveRestore(folder._id);
  if (totalRestored > 0) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: totalRestored } });
  }

  await Activity.create({ user: req.user._id, action: 'restore', folder: folder._id, metadata: { name: folder.name } });
  res.json({ success: true, message: 'Folder restored successfully.' });
});

// DELETE /api/trash/:id/permanent
const permanentDeleteFile = asyncHandler(async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
  if (!file) return res.status(404).json({ success: false, message: 'File not found in trash.' });

  await storageService.deleteFile(file.storageKey);
  // Storage was already decremented during soft delete, so no User update here.
  await Activity.create({ user: req.user._id, action: 'permanent_delete', metadata: { name: file.name, size: file.size } });
  await File.findByIdAndDelete(file._id);

  res.json({ success: true, message: 'File permanently deleted.' });
});

// DELETE /api/trash/empty
const emptyTrash = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id, isDeleted: true });
  for (const file of files) {
    await storageService.deleteFile(file.storageKey);
  }
  await File.deleteMany({ owner: req.user._id, isDeleted: true });
  await Folder.deleteMany({ owner: req.user._id, isDeleted: true });
  // Storage was already decremented during soft delete, so no User update here.
  await Activity.create({ user: req.user._id, action: 'permanent_delete', metadata: { bulk: true, count: files.length } });
  res.json({ success: true, message: `Trash emptied. ${files.length} file(s) permanently deleted.` });
});

module.exports = { getTrash, restoreFile, restoreFolder, permanentDeleteFile, emptyTrash };
