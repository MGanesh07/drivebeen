const express = require('express');
const router = express.Router();
const { getTrash, restoreFile, restoreFolder, permanentDeleteFile, emptyTrash } = require('../controllers/trashController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getTrash);
router.post('/:id/restore', restoreFile);
router.post('/folder/:id/restore', restoreFolder);
router.delete('/:id/permanent', permanentDeleteFile);
router.delete('/empty', emptyTrash);

module.exports = router;
