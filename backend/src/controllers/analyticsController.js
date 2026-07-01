const File = require('../models/File');
const Folder = require('../models/Folder');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// GET /api/analytics/summary
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [totalFiles, totalFolders, user] = await Promise.all([
    File.countDocuments({ owner: userId, isDeleted: false }),
    Folder.countDocuments({ owner: userId, isDeleted: false }),
    User.findById(userId),
  ]);

  const SharedFile = require('../models/SharedFile');
  const sharedCount = await SharedFile.countDocuments({ sharedBy: userId, isActive: true });

  const storagePercent = user.storageLimit > 0
    ? ((user.storageUsed / user.storageLimit) * 100).toFixed(1)
    : 0;

  // Month-over-month file growth
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthFiles = await File.countDocuments({ owner: userId, isDeleted: false, createdAt: { $lt: lastMonth } });
  const growth = lastMonthFiles > 0 ? (((totalFiles - lastMonthFiles) / lastMonthFiles) * 100).toFixed(1) : 100;

  res.json({
    success: true,
    summary: {
      totalFiles, totalFolders, sharedFiles: sharedCount,
      storageUsed: user.storageUsed, storageLimit: user.storageLimit,
      storagePercent: parseFloat(storagePercent),
      filesGrowth: parseFloat(growth),
    },
  });
});

// GET /api/analytics/storage-by-type
const getStorageByType = asyncHandler(async (req, res) => {
  const result = await File.aggregate([
    { $match: { owner: req.user._id, isDeleted: false } },
    { $group: { _id: '$category', totalSize: { $sum: '$size' }, count: { $sum: 1 } } },
    { $sort: { totalSize: -1 } },
  ]);
  res.json({ success: true, data: result });
});

// GET /api/analytics/upload-trends
const getUploadTrends = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = await File.aggregate([
    { $match: { owner: req.user._id, isDeleted: false, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatted = result.map((r) => ({
    month: `${months[r._id.month - 1]} ${r._id.year}`,
    files: r.count,
    storage: r.totalSize,
  }));

  res.json({ success: true, data: formatted });
});

// GET /api/analytics/largest-files
const getLargestFiles = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id, isDeleted: false })
    .sort('-size').limit(10).select('name size mimeType category createdAt');
  res.json({ success: true, files });
});

// GET /api/analytics/activity
const getActivityLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = await Activity.countDocuments({ user: req.user._id });
  const activities = await Activity.find({ user: req.user._id })
    .populate('file', 'name mimeType').populate('folder', 'name')
    .sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
  res.json({ success: true, activities, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// GET /api/analytics/file-types
const getFileTypeDistribution = asyncHandler(async (req, res) => {
  const result = await File.aggregate([
    { $match: { owner: req.user._id, isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: result });
});

module.exports = { getSummary, getStorageByType, getUploadTrends, getLargestFiles, getActivityLog, getFileTypeDistribution };
