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
import { errorHandler as oldErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startActivityMonitor } from './middleware/activityTracker.js';
import {
  securityHeaders,
  corsOptions,
  sanitizeData,
  preventPollution,
  validateInput,
  errorHandler,
  requestLogger,
  apiLimiter,
  authLimiter,
  otpLimiter,
} from './middleware/security.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'VITE_JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar] && !process.env[`VITE_${envVar}`]);
if (missingEnvVars.length > 0) {
  console.error(` Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Resolve local path details for diagnostic logging (ESM equivalent of __dirname)
const __filenameLocal = fileURLToPath(import.meta.url);
const __dirnameLocal = path.dirname(__filenameLocal);

// Diagnostic boot logs
console.log('[ServerBoot] Environment:', NODE_ENV);
console.log('[ServerBoot] process.cwd():', process.cwd());
console.log('[ServerBoot] __dirnameLocal:', __dirnameLocal);

// ============================================
// SECURITY MIDDLEWARE (Applied in Order)
// ============================================

// 1. Request Logger - Monitor all requests
app.use(requestLogger);

// 2. Security Headers - Helmet configuration
app.use(securityHeaders);

// 3. CORS - Cross-Origin Resource Sharing
app.use(cors(corsOptions));

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

console.log('[CORS] Allowed origins:', allowedOrigins);

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
const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI || 'mongodb+srv://mindsta:dbmindsta123456@mindsta.vxy6aly.mongodb.net/mindsta?retryWrites=true&w=majority';

console.log('[ServerBoot] Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
  .then(() => {
    console.log(' MongoDB Connected Successfully');
    if (IS_PRODUCTION) {
      console.log('[MongoDB] Running in PRODUCTION mode');
    }
    
    // Start activity monitor for online/offline tracking
    startActivityMonitor();
  })
  .catch((error) => {
    console.error(' MongoDB Connection Error:', error);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error(' MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log(' MongoDB reconnected');
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
console.log('[Security] Applying rate limiters to routes');

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
// Log the mounted referral routes to confirm active route stack
try {
  const referralLayers = referralRoutes.stack?.map(l => l.route?.path || l.name);
  console.log('[ServerBoot] Mounted referralRoutes layers:', referralLayers);
} catch (e) {
  console.log('[ServerBoot] Unable to inspect referralRoutes stack:', e.message);
}
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
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/search-history', searchHistoryRoutes);
app.use('/api/course-reviews', courseReviewRoutes);
app.use('/api/course-questions', courseQuestionRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/tickets', apiLimiter, ticketsRoutes);
app.use('/api/admin-alerts', adminAlertsRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  process.exit(1);
});

// Export app for Vercel serverless functions
export default app;

// Only start server if not running in Vercel (serverless environment)
if (process.env.VERCEL !== '1') {
  console.log('[ServerBoot] Starting Express server on port', PORT);
  const server = app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` API Health: http://localhost:${PORT}/api/health`);
    console.log('[ServerBoot] Server is now listening for connections');
  });

  server.on('error', (error) => {
    console.error(' Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please free the port or change PORT in .env`);
    }
    process.exit(1);
  });

  console.log('[ServerBoot] Server setup complete, keeping process alive...');
} else {
  console.log('[ServerBoot] Running in Vercel serverless environment');
}
