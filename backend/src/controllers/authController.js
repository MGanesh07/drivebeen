const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { generateToken, asyncHandler } = require('../utils/helpers');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

  const user = await User.create({ name, email, password });
  await Activity.create({ user: user._id, action: 'register', metadata: { email } });
  await Notification.create({
    user: user._id, type: 'account',
    title: 'Welcome to DriveBeen! 🎉',
    message: `Hi ${name}, your account is ready. Start uploading files to your personal cloud drive.`,
    icon: 'party',
  });

  const token = generateToken(user._id);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'EMAIL_NOT_FOUND' });
  }
  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'WRONG_PASSWORD' });
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  await Activity.create({
    user: user._id, action: 'login',
    ipAddress: req.ip, userAgent: req.get('User-Agent'),
  });

  const token = generateToken(user._id);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toSafeObject() });
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferences } = req.body;
  const update = {};
  if (name) update.name = name;
  if (preferences) update.preferences = { ...req.user.preferences, ...preferences };
  if (req.file) update.avatar = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
  await Activity.create({ user: req.user._id, action: 'profile_update' });
  res.json({ success: true, user: user.toSafeObject() });
});

// PUT /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  await Activity.create({ user: req.user._id, action: 'password_change' });
  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
