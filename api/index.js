// Serverless function handler for Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('../backend/server/routes/auth.js');
const studentRoutes = require('../backend/server/routes/students.js');
const lessonRoutes = require('../backend/server/routes/lessons.js');
const quizRoutes = require('../backend/server/routes/quizzes.js');
const progressRoutes = require('../backend/server/routes/progress.js');
const referralRoutes = require('../backend/server/routes/referrals.js');
const analyticsRoutes = require('../backend/server/routes/analytics.js');
const paymentRoutes = require('../backend/server/routes/payments.js');
const wishlistRoutes = require('../backend/server/routes/wishlist.js');
const adminRoutes = require('../backend/server/routes/admin.js');
const profileRoutes = require('../backend/server/routes/profiles.js');
const reportsRoutes = require('../backend/server/routes/reports.js');
const settingsRoutes = require('../backend/server/routes/settings.js');
const cartRoutes = require('../backend/server/routes/cart.js');
const notificationRoutes = require('../backend/server/routes/notifications.js');
const assessmentRoutes = require('../backend/server/routes/assessment.js');
const bundleRoutes = require('../backend/server/routes/bundles.js');
const reviewRoutes = require('../backend/server/routes/reviews.js');
const enrollmentRoutes = require('../backend/server/routes/enrollments.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection (cached for serverless)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  cachedDb = mongoose.connection;
  return cachedDb;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Serverless handler
module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
