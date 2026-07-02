require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const folderRoutes = require('./routes/folders');
const trashRoutes = require('./routes/trash');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');

const app = express();

// Connect to MongoDB
connectDB();

// Security & utility middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests.' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many auth attempts.' });
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// Static uploads directory
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_PATH || 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DriveBeen API is running successfully"
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DriveBeen API is running 🚀', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 DriveBeen API running on http://localhost:${PORT}`);
  console.log(`📦 Storage adapter: ${process.env.STORAGE_ADAPTER || 'local'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Configure the Node HTTP server timeouts for large file uploads (e.g. 500MB+)
server.timeout = 600000; // 10 minutes timeout
server.keepAliveTimeout = 61000;
server.headersTimeout = 65000;

module.exports = app;
