/**
 * Vercel Serverless Function Entry Point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import compression from 'compression';
import morgan from 'morgan';
import passport from '../server/config/passport.js';

// Load environment variables
dotenv.config();

// Import shared security middleware
import {
  securityHeaders,
  sanitizeData,
  preventPollution,
  validateInput,
  requestLogger,
  apiLimiter,
  authLimiter,
  otpLimiter,
  strictLimiter,
} from '../server/middleware/security.js';

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
import subjectRoutes from '../server/routes/subjects.js';
import topicRoutes from '../server/routes/topics.js';
import suggestionsRoutes from '../server/routes/suggestions.js';
import searchHistoryRoutes from '../server/routes/search-history.js';
import courseReviewRoutes from '../server/routes/course-reviews.js';
import courseQuestionRoutes from '../server/routes/course-questions.js';
import gamificationRoutes from '../server/routes/gamification.js';
import newsletterRoutes from '../server/routes/newsletter.js';
import ticketsRoutes from '../server/routes/tickets.js';
import adminAlertsRoutes from '../server/routes/admin-alerts.js';
import { errorHandler, notFoundHandler } from '../server/middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1);

// MongoDB Connection with connection caching for serverless
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const connection = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = connection;
  console.log('MongoDB connected (Vercel)');
  return cachedDb;
}

// Middleware
app.use(requestLogger);
app.use(securityHeaders);

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
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(sanitizeData);
app.use(preventPollution);
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(validateInput);
app.use(passport.initialize());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running on Vercel' });
});

// Routes — mirroring server/index.js
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/admin-signin', authLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/students', apiLimiter, studentRoutes);
app.use('/api/lessons', apiLimiter, lessonRoutes);
app.use('/api/quizzes', apiLimiter, quizRoutes);
app.use('/api/progress', apiLimiter, progressRoutes);
app.use('/api/referrals', apiLimiter, referralRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/admin', strictLimiter, adminRoutes);
app.use('/api/profiles', apiLimiter, profileRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/reports', apiLimiter, reportsRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/assessment', apiLimiter, assessmentRoutes);
app.use('/api/bundles', apiLimiter, bundleRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/enrollments', apiLimiter, enrollmentRoutes);
app.use('/api/subjects', apiLimiter, subjectRoutes);
app.use('/api/topics', apiLimiter, topicRoutes);
app.use('/api/suggestions', apiLimiter, suggestionsRoutes);
app.use('/api/search-history', apiLimiter, searchHistoryRoutes);
app.use('/api/course-reviews', apiLimiter, courseReviewRoutes);
app.use('/api/course-questions', apiLimiter, courseQuestionRoutes);
app.use('/api/gamification', apiLimiter, gamificationRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/tickets', apiLimiter, ticketsRoutes);
app.use('/api/admin-alerts', strictLimiter, adminAlertsRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Serverless function handler
export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}
