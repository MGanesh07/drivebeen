require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || 'uploads');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🌱 Connected to MongoDB. Starting seed...');

  await Promise.all([
    User.deleteMany({}), File.deleteMany({}), Folder.deleteMany({}),
    Activity.deleteMany({}), Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data.');

  // Create demo user
  const user = await User.create({
    name: 'Alex Johnson',
    email: 'alex@drivebeen.io',
    password: 'password123',
    storageUsed: 2684354560, // 2.5GB used
    storageLimit: 5368709120, // 5GB
    isVerified: true,
    preferences: { theme: 'dark', viewMode: 'grid' },
  });
  console.log(`👤 Created user: ${user.email}`);

  // Create sample user dir
  const userDir = path.join(UPLOAD_DIR, user._id.toString());
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  // Create folders
  const folderData = [
    { name: 'Projects', color: '#7C3AED', icon: 'briefcase' },
    { name: 'Documents', color: '#2563EB', icon: 'file-text' },
    { name: 'Images', color: '#059669', icon: 'image' },
    { name: 'Videos', color: '#DC2626', icon: 'video' },
    { name: 'Personal', color: '#D97706', icon: 'heart' },
    { name: 'Work', color: '#7C3AED', icon: 'briefcase' },
  ];
  const folders = await Folder.insertMany(folderData.map((f) => ({ ...f, owner: user._id })));
  console.log(`📁 Created ${folders.length} folders.`);

  // Create sample files with realistic metadata
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  const fileData = [
    { name: 'Q4 Financial Report.pdf', mimeType: 'application/pdf', size: 4194304, folder: folders[1]._id, isFavorite: true, createdAt: daysAgo(2) },
    { name: 'Product Roadmap 2025.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1048576, folder: folders[0]._id, isFavorite: true, createdAt: daysAgo(5) },
    { name: 'Design System v2.fig', mimeType: 'application/octet-stream', size: 25165824, folder: folders[0]._id, createdAt: daysAgo(7) },
    { name: 'Team Photo 2025.jpg', mimeType: 'image/jpeg', size: 3145728, folder: folders[2]._id, isFavorite: true, createdAt: daysAgo(10) },
    { name: 'Conference Keynote.mp4', mimeType: 'video/mp4', size: 524288000, folder: folders[3]._id, createdAt: daysAgo(14) },
    { name: 'Budget Tracker.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 524288, folder: folders[1]._id, createdAt: daysAgo(3) },
    { name: 'Client Presentation.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 8388608, folder: folders[5]._id, isFavorite: true, createdAt: daysAgo(1) },
    { name: 'Database Schema.sql', mimeType: 'text/x-sql', size: 65536, folder: folders[0]._id, createdAt: daysAgo(20) },
    { name: 'Profile Banner.png', mimeType: 'image/png', size: 2097152, folder: folders[2]._id, createdAt: daysAgo(8) },
    { name: 'Meeting Recording.mp4', mimeType: 'video/mp4', size: 262144000, folder: folders[5]._id, createdAt: daysAgo(4) },
    { name: 'app.js', mimeType: 'application/javascript', size: 12288, folder: folders[0]._id, createdAt: daysAgo(6) },
    { name: 'Podcast Episode 12.mp3', mimeType: 'audio/mpeg', size: 52428800, folder: folders[4]._id, createdAt: daysAgo(15) },
    { name: 'source-code-v2.zip', mimeType: 'application/zip', size: 104857600, folder: folders[0]._id, createdAt: daysAgo(12) },
    { name: 'Invoice_2025_03.pdf', mimeType: 'application/pdf', size: 204800, folder: folders[1]._id, isDeleted: true, deletedAt: daysAgo(1), createdAt: daysAgo(30) },
    { name: 'Old Notes.txt', mimeType: 'text/plain', size: 8192, folder: folders[4]._id, isDeleted: true, deletedAt: daysAgo(2), createdAt: daysAgo(45) },
    { name: 'Brand Guidelines.pdf', mimeType: 'application/pdf', size: 16777216, folder: folders[5]._id, isFavorite: true, isArchived: true, createdAt: daysAgo(60) },
    { name: 'UI Mockups.png', mimeType: 'image/png', size: 5242880, folder: folders[2]._id, createdAt: daysAgo(9) },
    { name: 'API Documentation.md', mimeType: 'text/markdown', size: 32768, folder: folders[0]._id, createdAt: daysAgo(11) },
    { name: 'Intro Video.mp4', mimeType: 'video/mp4', size: 104857600, folder: folders[3]._id, downloadCount: 42, createdAt: daysAgo(25) },
    { name: 'data-export.csv', mimeType: 'text/csv', size: 1048576, folder: folders[1]._id, createdAt: daysAgo(18) },
  ];

  const files = await Promise.all(
    fileData.map((f) =>
      File.create({
        ...f,
        originalName: f.name,
        extension: f.name.split('.').pop().toLowerCase(),
        storageKey: path.join(userDir, `demo_${f.name.replace(/\s/g, '_')}`),
        owner: user._id,
        lastAccessedAt: daysAgo(Math.floor(Math.random() * 5)),
      })
    )
  );
  console.log(`📄 Created ${files.length} files.`);

  // Create activities
  const actions = ['upload', 'download', 'share', 'rename', 'folder_create', 'delete'];
  const activities = files.slice(0, 10).map((f, i) => ({
    user: user._id,
    action: actions[i % actions.length],
    file: f._id,
    metadata: { name: f.name },
    createdAt: daysAgo(i),
  }));
  await Activity.insertMany(activities);
  console.log(`📊 Created ${activities.length} activity entries.`);

  // Create notifications
  const notifications = [
    { user: user._id, type: 'account', title: 'Welcome to DriveBeen! 🎉', message: 'Your account has been created. Start uploading files!', icon: 'party', createdAt: daysAgo(30) },
    { user: user._id, type: 'upload_success', title: 'Upload Complete', message: '"Q4 Financial Report.pdf" uploaded successfully.', isRead: true, createdAt: daysAgo(2) },
    { user: user._id, type: 'share_invite', title: 'File shared with you', message: 'A colleague shared "Design System v2.fig" with you.', createdAt: daysAgo(3) },
    { user: user._id, type: 'storage_warning', title: 'Storage at 50%', message: 'You have used 2.5GB of your 5GB storage.', createdAt: daysAgo(1) },
    { user: user._id, type: 'upload_success', title: 'Upload Complete', message: '"Client Presentation.pptx" uploaded successfully.', isRead: true, createdAt: daysAgo(1) },
  ];
  await Notification.insertMany(notifications);
  console.log(`🔔 Created ${notifications.length} notifications.`);

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Login Email:    alex@drivebeen.io`);
  console.log(`🔑 Login Password: password123`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
};

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
