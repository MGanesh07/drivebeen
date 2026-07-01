/**
 * DriveBeen Storage Reset Script
 * 
 * Clears all files, folders, activities, and notifications from the database.
 * Resets every user's storageUsed to 0.
 * 
 * Usage: node backend/scripts/resetStorage.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drivebeen';
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

async function resetStorage() {
  console.log('\n🗑️  DriveBeen Storage Reset');
  console.log('══════════════════════════════');

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  let deletedFiles = 0, deletedFolders = 0, deletedActivities = 0, deletedNotifications = 0;

  if (collectionNames.includes('files')) {
    const res = await db.collection('files').deleteMany({});
    deletedFiles = res.deletedCount;
    console.log(`🗂️  Deleted ${deletedFiles} file records`);
  }

  if (collectionNames.includes('folders')) {
    const res = await db.collection('folders').deleteMany({});
    deletedFolders = res.deletedCount;
    console.log(`📁  Deleted ${deletedFolders} folder records`);
  }

  if (collectionNames.includes('activities')) {
    const res = await db.collection('activities').deleteMany({});
    deletedActivities = res.deletedCount;
    console.log(`📋  Deleted ${deletedActivities} activity records`);
  }

  if (collectionNames.includes('notifications')) {
    const res = await db.collection('notifications').deleteMany({});
    deletedNotifications = res.deletedCount;
    console.log(`🔔  Deleted ${deletedNotifications} notification records`);
  }

  // Reset all users' storageUsed to 0
  if (collectionNames.includes('users')) {
    const res = await db.collection('users').updateMany({}, { $set: { storageUsed: 0 } });
    console.log(`👤  Reset storageUsed to 0 for ${res.modifiedCount} users`);
  }

  // Remove uploaded files from disk
  if (fs.existsSync(UPLOAD_PATH)) {
    let diskFilesRemoved = 0;
    const userDirs = fs.readdirSync(UPLOAD_PATH);
    for (const userDir of userDirs) {
      const userPath = path.join(UPLOAD_PATH, userDir);
      const stat = fs.statSync(userPath);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(userPath);
        for (const file of files) {
          fs.unlinkSync(path.join(userPath, file));
          diskFilesRemoved++;
        }
      }
    }
    console.log(`💾  Removed ${diskFilesRemoved} files from disk (${UPLOAD_PATH})`);
  } else {
    console.log('💾  Upload directory not found — skipping disk cleanup');
  }

  console.log('\n✨  Storage reset complete!');
  console.log('    The app will now show empty state with 0 files, 0 folders, 0 GB used.\n');

  await mongoose.disconnect();
  process.exit(0);
}

resetStorage().catch((err) => {
  console.error('❌  Reset failed:', err.message);
  process.exit(1);
});
