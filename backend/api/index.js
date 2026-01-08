/**
 * Vercel Serverless Function Entry Point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from '../server/routes/auth.js';
import studentRoutes from '../server/routes/students.js';
import lessonRoutes from '../server/routes/lessons.js';
import quizRoutes from '../server/routes/quizzes.js';
import progressRoutes from '../server/routes/progress.js';
import referralRoutes from '../server/routes/referrals.js';
import analyticsRoutes from '../server/routes/analytics.js';
import paymentRoutes from '../server/routes/payments.js';
import wishlistRoutes from '../server/routes/wishlist.js';
import adminRoutes from '../server/routes/admin.js';
import profileRoutes from '../server/routes/profiles.js';
import reportsRoutes from '../server/routes/reports.js';
import settingsRoutes from '../server/routes/settings.js';
import cartRoutes from '../server/routes/cart.js';
import notificationRoutes from '../server/routes/notifications.js';
import assessmentRoutes from '../server/routes/assessment.js';
import bundleRoutes from '../server/routes/bundles.js';
import reviewRoutes from '../server/routes/reviews.js';
import enrollmentRoutes from '../server/routes/enrollments.js';
import { errorHandler, notFoundHandler } from '../server/middleware/errorHandler.js';

const app = express();

// MongoDB Connection
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const connection = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = connection;
  console.log('✅ MongoDB connected (Vercel)');
  return cachedDb;
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running on Vercel' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Serverless function handler
export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}
