/**
 * Storage Service - Abstract Interface
 * Swap localStorageAdapter for s3StorageAdapter without touching controllers.
 */
const localAdapter = require('./localStorageAdapter');
// const s3Adapter = require('./s3StorageAdapter'); // Uncomment for AWS S3

const adapter = process.env.STORAGE_ADAPTER === 's3' ? require('./s3StorageAdapter') : localAdapter;

module.exports = {
  /**
   * Upload a file buffer to storage
   * @param {Object} file - Multer file object
   * @returns {Promise<{storageKey, storageUrl}>}
   */
  uploadFile: (file) => adapter.uploadFile(file),

  /**
   * Get a readable stream for a file
   * @param {string} storageKey
   * @returns {Promise<ReadableStream>}
   */
  getFileStream: (storageKey) => adapter.getFileStream(storageKey),

  /**
   * Delete a file from storage
   * @param {string} storageKey
   * @returns {Promise<void>}
   */
  deleteFile: (storageKey) => adapter.deleteFile(storageKey),

  /**
   * Get the public URL or local path for a file
   * @param {string} storageKey
   * @returns {string}
   */
  getFileUrl: (storageKey) => adapter.getFileUrl(storageKey),

  /**
   * Get a pre-signed or raw download URL for a file
   * @param {string} storageKey
   * @param {string} filename - Renamed user-visible filename
   * @returns {Promise<string>}
   */
  getDownloadUrl: (storageKey, filename) => adapter.getDownloadUrl(storageKey, filename),

  /**
   * Check if a file exists
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  fileExists: (storageKey) => adapter.fileExists(storageKey),
};
