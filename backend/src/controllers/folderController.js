const Folder = require('../models/Folder');
const File = require('../models/File');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../utils/helpers');

// POST /api/folders
const createFolder = asyncHandler(async (req, res) => {
  const { name, parent, color, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Folder name is required.' });

  const folder = await Folder.create({
    name, parent: parent || null, color: color || '#7C3AED',
    description: description || '', owner: req.user._id,
  });
  await Activity.create({ user: req.user._id, action: 'folder_create', folder: folder._id, metadata: { name } });
  res.status(201).json({ success: true, folder });
});

// GET /api/folders
const getFolders = asyncHandler(async (req, res) => {
  const { parent } = req.query;
  const query = { owner: req.user._id, isDeleted: false };
  if (parent === 'root') query.parent = null;
  else if (parent) query.parent = parent;

  const folders = await Folder.find(query).sort('name');

  // Attach file counts
  const foldersWithCounts = await Promise.all(
    folders.map(async (f) => {
      const fileCount = await File.countDocuments({ folder: f._id, isDeleted: false });
      return { ...f.toObject(), fileCount };
    })
  );

  res.json({ success: true, folders: foldersWithCounts });
});

// GET /api/folders/:id
const getFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });
  const files = await File.find({ folder: folder._id, isDeleted: false }).sort('-createdAt');
  res.json({ success: true, folder, files });
});

// PUT /api/folders/:id
const updateFolder = asyncHandler(async (req, res) => {
  const { name, color, description } = req.body;
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  const oldName = folder.name;
  if (name) folder.name = name;
  if (color) folder.color = color;
  if (description !== undefined) folder.description = description;
  await folder.save();

  if (name && name !== oldName) {
    await Activity.create({ user: req.user._id, action: 'folder_rename', folder: folder._id, metadata: { oldName, newName: name } });
  }

  res.json({ success: true, folder });
});

// DELETE /api/folders/:id (soft delete)
const deleteFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

  const recursiveSoftDelete = async (folderId) => {
    // Find all files in this folder that are not already deleted
    const files = await File.find({ folder: folderId, isDeleted: false, owner: req.user._id });
    let sizeDeducted = files.reduce((acc, f) => acc + f.size, 0);

    await Folder.findByIdAndUpdate(folderId, { isDeleted: true, deletedAt: new Date() });
    await File.updateMany({ folder: folderId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() });

    const subfolders = await Folder.find({ parent: folderId, owner: req.user._id });
    for (const sub of subfolders) {
      sizeDeducted += await recursiveSoftDelete(sub._id);
    }
    return sizeDeducted;
  };

  const totalDeducted = await recursiveSoftDelete(folder._id);
  if (totalDeducted > 0) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -totalDeducted } });
  }

  await Activity.create({ user: req.user._id, action: 'folder_delete', folder: folder._id, metadata: { name: folder.name } });
  res.json({ success: true, message: 'Folder moved to trash.' });
});

module.exports = { createFolder, getFolders, getFolder, updateFolder, deleteFolder };
