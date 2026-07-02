const express = require('express');
const router = express.Router();
const {
  uploadFile, getFiles, getFile, downloadFile, serveFile,
  downloadFileRaw, updateFile, deleteFile, toggleFavorite, getFavorites,
  getRecentFiles,
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

router.use(protect);

router.get('/favorites', getFavorites);
router.get('/recent', getRecentFiles);
router.get('/serve/:id', serveFile);
router.get('/download/raw/:userId/:filename', downloadFileRaw);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/:id', getFile);
router.get('/:id/download', downloadFile);
router.put('/:id', updateFile);
router.delete('/:id', deleteFile);
router.post('/:id/favorite', toggleFavorite);

module.exports = router;
