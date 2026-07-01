const express = require('express');
const router = express.Router();
const { getSummary, getStorageByType, getUploadTrends, getLargestFiles, getActivityLog, getFileTypeDistribution } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', getSummary);
router.get('/storage-by-type', getStorageByType);
router.get('/upload-trends', getUploadTrends);
router.get('/largest-files', getLargestFiles);
router.get('/activity', getActivityLog);
router.get('/file-types', getFileTypeDistribution);

module.exports = router;
