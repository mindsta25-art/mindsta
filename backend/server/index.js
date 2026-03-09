import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import morgan from 'morgan';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import lessonRoutes from './routes/lessons.js';
import quizRoutes from './routes/quizzes.js';
import progressRoutes from './routes/progress.js';
import referralRoutes from './routes/referrals.js';
import analyticsRoutes from './routes/analytics.js';
import paymentRoutes from './routes/payments.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profiles.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import cartRoutes from './routes/cart.js';
import notificationRoutes from './routes/notifications.js';
import assessmentRoutes from './routes/assessment.js';
import bundleRoutes from './routes/bundles.js';
import reviewRoutes from './routes/reviews.js';
import enrollmentRoutes from './routes/enrollments.js';
import subjectRoutes from './routes/subjects.js';
import topicRoutes from './routes/topics.js';
import suggestionRoutes from './routes/suggestions.js';
import searchHistoryRoutes from './routes/search-history.js';
import courseReviewRoutes from './routes/course-reviews.js';
import courseQuestionRoutes from './routes/course-questions.js';
import gamificationRoutes from './routes/gamification.js';
import newsletterRoutes from './routes/newsletter.js';
import ticketsRoutes from './routes/tickets.js';
import adminAlertsRoutes from './routes/admin-alerts.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startActivityMonitor } from './middleware/activityTracker.js';
import {
  securityHeaders,
  corsOptions,
  sanitizeData,
  preventPollution,
  validateInput,
  requestLogger,
  apiLimiter,
  authLimiter,
  otpLimiter,
  strictLimiter,
} from './middleware/security.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables — hard crash in production if missing
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('[FATAL] Set these in your Render environment variables and redeploy.');
  process.exit(1);
}

// Crash immediately if JWT_SECRET is still the insecure default
if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
  console.error('[FATAL] JWT_SECRET is set to the insecure default value. Change it in Render env vars.');
  process.exit(1);
}

const app = express();
// Trust Render/Vercel reverse proxy so express-rate-limit reads real client IPs
// (fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR and false 403s)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Resolve local path details for diagnostic logging (ESM equivalent of __dirname)
const __filenameLocal = fileURLToPath(import.meta.url);
const __dirnameLocal = path.dirname(__filenameLocal);

// Boot log — minimal in production
if (!IS_PRODUCTION) {
  console.log('[ServerBoot] Environment:', NODE_ENV);
  console.log('[ServerBoot] process.cwd():', process.cwd());
} else {
  console.log('[ServerBoot] Mindsta API starting — NODE_ENV=production');
}

// ============================================
// SECURITY MIDDLEWARE (Applied in Order)
// ============================================

// 1. Request Logger - Monitor all requests
app.use(requestLogger);

// 2. Security Headers - Helmet configuration
app.use(securityHeaders);

// 3. CORS - handled below with env-driven origin list

// 4. Data Sanitization - Prevent NoSQL injection
app.use(sanitizeData);

// 5. Prevent HTTP Parameter Pollution
app.use(preventPollution);

// 6. Compression - Compress all responses
app.use(compression());

// 7. Logging - Morgan for HTTP request logging
if (IS_PRODUCTION) {
  app.use(morgan('combined')); // Apache combined format for production
} else {
  app.use(morgan('dev', {
    skip: (req, res) => req.method === 'GET' && res.statusCode < 400
  }));
}

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:8081', 
      'http://localhost:8080', 
      'http://localhost:8082', 
      'http://localhost:5173',
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:808\d$/,  // Local network IPs (10.x.x.x:8080-8089)
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:808\d$/,  // Local network IPs (192.168.x.x:8080-8089)
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:808\d$/,  // Local network IPs (172.16-31.x.x:8080-8089)
    ];

// In production, also allow Vercel preview and production URLs
if (IS_PRODUCTION) {
  allowedOrigins.push(
    /https:\/\/.*\.vercel\.app$/,  // All Vercel preview deployments
    /https:\/\/mindsta.*\.vercel\.app$/  // Specific mindsta deployments
  );
}

if (!IS_PRODUCTION) console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 8. Input Validation - Sanitize user inputs
app.use(validateInput);

// 9. Body Parser - Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 10. Initialize Passport for OAuth
app.use(passport.initialize());

// MongoDB Connection with production settings
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set! Cannot connect to database.');
  process.exit(1);
}

console.log('[MongoDB] Connecting...');
mongoose.connect(MONGODB_URI, {
  maxPoolSize: IS_PRODUCTION ? 20 : 5,
  serverSelectionTimeoutMS: IS_PRODUCTION ? 10000 : 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
})
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    try { startActivityMonitor(); } catch (e) { console.error('[ActivityMonitor] Failed to start:', e.message); }
  })
  .catch((error) => {
    console.error('[MongoDB] Connection failed:', error.message);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error(' MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Mongoose will attempt auto-reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected successfully');
});

// If Mongoose cannot reconnect after repeated attempts, exit and let the process manager restart
mongoose.connection.on('close', () => {
  console.error('[MongoDB] Connection closed permanently — exiting so the service can restart.');
  process.exit(1);
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Mindsta Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      students: '/api/students/*',
      lessons: '/api/lessons/*',
      admin: '/api/admin/*'
    }
  });
});

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
  };
  
  const statusCode = health.mongodb === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Routes with Rate Limiting

// Auth routes with strict rate limiting
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/admin-signin', authLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth', apiLimiter, authRoutes);

// Public routes with moderate rate limiting
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
app.use('/api/suggestions', apiLimiter, suggestionRoutes);
app.use('/api/search-history', apiLimiter, searchHistoryRoutes);
app.use('/api/course-reviews', apiLimiter, courseReviewRoutes);
app.use('/api/course-questions', apiLimiter, courseQuestionRoutes);
app.use('/api/gamification', apiLimiter, gamificationRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/tickets', apiLimiter, ticketsRoutes);
app.use('/api/admin-alerts', strictLimiter, adminAlertsRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection] Unhandled promise rejection:', reason);
  console.error('[UnhandledRejection] Promise:', promise);
  // Exit so Render/PM2 can restart the service cleanly
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error.message, error.stack);
  process.exit(1);
});

// Export app for Vercel serverless functions
export default app;

// Only start server if not running in Vercel (serverless environment)
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT} (${NODE_ENV})`);
    if (!IS_PRODUCTION) {
      console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    }
    // Signal PM2 that the app is ready (required when wait_ready: true in ecosystem.config)
    if (process.send) process.send('ready');
  });

  // Graceful shutdown — close DB connections and finish in-flight requests
  const shutdown = (signal) => {
    console.log(`[Server] ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('[Server] MongoDB connection closed. Exiting.');
      } catch (_) {}
      process.exit(0);
    });
    // Force exit after 15 seconds if graceful shutdown hangs
    setTimeout(() => { console.error('[Server] Forced exit after timeout'); process.exit(1); }, 15000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  server.on('error', (error) => {
    console.error('[Server] Error:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} already in use.`);
    }
    process.exit(1);
  });
}
