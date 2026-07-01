const File = require('../models/File');
const Folder = require('../models/Folder');
const { asyncHandler } = require('../utils/helpers');

// GET /api/search?q=&type=&category=&folder=&dateFrom=&dateTo=
const search = asyncHandler(async (req, res) => {
  const { q, category, folder, dateFrom, dateTo, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ success: false, message: 'Search query is required.' });
  }

  const fileQuery = {
    owner: req.user._id,
    isDeleted: false,
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { originalName: { $regex: q.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(q.trim(), 'i')] } },
    ],
  };

  if (category) fileQuery.category = category;
  if (folder) fileQuery.folder = folder;
  if (dateFrom || dateTo) {
    fileQuery.createdAt = {};
    if (dateFrom) fileQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) fileQuery.createdAt.$lte = new Date(dateTo);
  }

  const folderQuery = {
    owner: req.user._id,
    isDeleted: false,
    name: { $regex: q.trim(), $options: 'i' },
  };

  const [files, folders, totalFiles] = await Promise.all([
    File.find(fileQuery).populate('folder', 'name color').sort(sort)
      .skip((page - 1) * limit).limit(parseInt(limit)),
    page == 1 ? Folder.find(folderQuery).sort('name').limit(10) : [],
    File.countDocuments(fileQuery),
  ]);

  res.json({
    success: true, query: q, files, folders,
    totalFiles, page: parseInt(page), pages: Math.ceil(totalFiles / limit),
  });
});

module.exports = { search };
