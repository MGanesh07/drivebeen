const express = require('express');
const router = express.Router();
const { createFolder, getFolders, getFolder, updateFolder, deleteFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id', getFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

module.exports = router;
