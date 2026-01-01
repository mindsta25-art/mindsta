/**
 * Express Backend Server for Mindsta App
 * Handles MongoDB operations and authentication
 * Production-ready with security, logging, and monitoring
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
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
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'VITE_JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar] && !process.env[`VITE_${envVar}`]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
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

// Security Middleware
// 1. Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? undefined : false, // Disable in dev for easier testing
  crossOriginEmbedderPolicy: false, // Allow embedding for payment gateways
}));

// 2. Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: IS_PRODUCTION ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: IS_PRODUCTION ? 5 : 50, // 5 attempts per 15 minutes in production
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// 3. MongoDB Query Sanitization - Prevent NoSQL injection
// KNOWN ISSUE: express-mongo-sanitize v2.2.0 has compatibility issues with Express 5.x
// Error: "Cannot set property query of #<IncomingMessage> which has only a getter"
// Workaround: Manual input validation in routes until package is updated
// Alternative: Downgrade to Express 4.x or wait for express-mongo-sanitize v3.x
// Security Note: Ensure all user inputs are validated and sanitized in route handlers
console.log('[Security] MongoDB query sanitization: DISABLED (compatibility issue)');
console.log('[Security] Manual input validation enabled in routes');
// app.use(mongoSanitize({
//   replaceWith: '_',
//   onSanitize: ({ req, key }) => {
//     console.warn(`[Security] Sanitized key: ${key}`);
//   },
// }));

// 4. Compression - Compress all responses
app.use(compression());

// 5. Logging - Morgan for HTTP request logging
if (IS_PRODUCTION) {
  app.use(morgan('combined')); // Apache combined format for production
} else {
  app.use(morgan('dev')); // Colored dev format
}

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:8080', 'http://localhost:8082', 'http://localhost:5173'];

// In production, also allow Vercel preview and production URLs
if (IS_PRODUCTION) {
  allowedOrigins.push(
    /https:\/\/.*\.vercel\.app$/,  // All Vercel preview deployments
    /https:\/\/mindsta.*\.vercel\.app$/  // Specific mindsta deployments
  );
}

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/referrals', referralRoutes);
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

// Start server
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
