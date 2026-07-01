const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || 'uploads');

const uploadFile = async (file) => {
  // File is already on disk from multer — just return metadata
  return {
    storageKey: file.path,
    storageUrl: null, // No public URL for local storage
  };
};

const getFileStream = async (storageKey) => {
  if (!fs.existsSync(storageKey)) throw new Error('File not found on disk');
  return fs.createReadStream(storageKey);
};

const deleteFile = async (storageKey) => {
  try {
    if (fs.existsSync(storageKey)) {
      fs.unlinkSync(storageKey);
    }
  } catch (err) {
    console.error('Error deleting local file:', err.message);
  }
};

const getFileUrl = (storageKey) => {
  // Return a relative API download URL for local files
  const filename = path.basename(storageKey);
  const userId = path.basename(path.dirname(storageKey));
  return `/api/files/serve/${userId}/${filename}`;
};

const fileExists = async (storageKey) => {
  return fs.existsSync(storageKey);
};

module.exports = { uploadFile, getFileStream, deleteFile, getFileUrl, fileExists };
