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
import commonEntranceRoutes from './routes/common-entrance.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startActivityMonitor } from './middleware/activityTracker.js';
import { startAbandonedCartScheduler } from './services/abandonedCartScheduler.js';
import { gracefulShutdown } from './services/gracefulShutdownService.js';
import { monitoringService } from './services/monitoringService.js';
import { databaseOptimizer } from './services/databaseOptimizerService.js';
import { cdnService } from './services/cdnService.js';
import { queueMiddleware } from './services/requestQueueService.js';
import { performHealthCheck, ping, readinessCheck, livenessCheck } from './services/healthCheckService.js';
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
const NODE_ENV = process.env.npm_lifecycle_event === 'dev'
  ? 'development'
  : (process.env.NODE_ENV || 'development');
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

// In production, also allow official domain and Vercel preview URLs
if (IS_PRODUCTION) {
  allowedOrigins.push(
    'https://mindsta.com.ng',
    'https://www.mindsta.com.ng',
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

// CDN middleware for static assets
app.use(cdnService.middleware());

// MongoDB Connection with production settings
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set! Cannot connect to database.');
  process.exit(1);
}

console.log('[MongoDB] Connecting...');
mongoose.connect(MONGODB_URI, {
  maxPoolSize: IS_PRODUCTION ? 20 : 5,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
})
  .then(async () => {
    console.log('[MongoDB] Connected successfully');

    // ── One-time migration: drop the old unique index on enrollments ──────────
    // The old schema had { userId, subject, grade, term } with unique:true.
    // The new schema tracks per-lesson enrollments so that index is too strict.
    // We replace it with a non-unique index that includes lessonId.
    try {
      const enrollmentCollection = mongoose.connection.db.collection('enrollments');
      const OLD_INDEX = 'userId_1_subject_1_grade_1_term_1';
      const indexes = await enrollmentCollection.indexes();
      const oldExists = indexes.some(i => i.name === OLD_INDEX && i.unique);
      if (oldExists) {
        await enrollmentCollection.dropIndex(OLD_INDEX);
        console.log('[Migration] Dropped old unique enrollment index — per-lesson enrollments now supported.');
      }
    } catch (migErr) {
      // Non-fatal: log and continue. The server can still run even if migration fails.
      console.warn('[Migration] Could not drop old enrollment index:', migErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    try { startActivityMonitor(); } catch (e) { console.error('[ActivityMonitor] Failed to start:', e.message); }
    try { startAbandonedCartScheduler(); } catch (e) { console.error('[AbandonedCart] Failed to start:', e.message); }

    // Initialize robustness services
    try {
      await monitoringService.initialize({
        logLevel: IS_PRODUCTION ? 'info' : 'debug',
        logDir: path.join(__dirnameLocal, '..', 'logs')
      });
      console.log('[Monitoring] Service initialized');
    } catch (e) { console.error('[Monitoring] Failed to initialize:', e.message); }

    try {
      await databaseOptimizer.initializeConnection(MONGODB_URI, {
        maxPoolSize: IS_PRODUCTION ? 20 : 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log('[DatabaseOptimizer] Service initialized');
    } catch (e) { console.error('[DatabaseOptimizer] Failed to initialize:', e.message); }

    try {
      await cdnService.initialize();
      console.log('[CDN] Service initialized');
    } catch (e) { console.error('[CDN] Failed to initialize:', e.message); }

    // Initialize graceful shutdown
    gracefulShutdown.initialize(app);
  })
  .catch((error) => {
    console.error('[MongoDB] Connection failed:', error.message);
    console.error('[MongoDB] ⚠️  Check that your IP (run: curl ifconfig.me) is whitelisted in MongoDB Atlas Network Access.');
    // Don't exit — keep server alive so health checks and non-DB routes still respond.
    // Mongoose will auto-retry connection in the background.
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

// Root health check (for uptime monitors and Render health pings)
app.all('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Mindsta API' });
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
app.get('/api/health', async (req, res) => {
  try {
    const healthData = await performHealthCheck();
    const statusCode = healthData.overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness check for Kubernetes/load balancers
app.get('/api/readiness', async (req, res) => {
  try {
    const readiness = await readinessCheck();
    res.status(readiness.ready ? 200 : 503).json(readiness);
  } catch (error) {
    res.status(503).json({ ready: false, reason: error.message });
  }
});

// Liveness check for container orchestration
app.get('/api/liveness', async (req, res) => {
  try {
    const liveness = await livenessCheck();
    res.status(liveness.alive ? 200 : 503).json(liveness);
  } catch (error) {
    res.status(503).json({ alive: false, reason: error.message });
  }
});

// Monitoring stats endpoint (admin only)
app.get('/api/monitoring/stats', (req, res) => {
  // TODO: Add admin authentication check
  const stats = monitoringService.getStats();
  res.json(stats);
});

// Queue stats endpoint (admin only)
app.get('/api/monitoring/queues', async (req, res) => {
  // TODO: Add admin authentication check
  const { getQueueStats } = await import('./services/requestQueueService.js');
  const queueStats = getQueueStats();
  res.json(queueStats);
});

// Lightweight ping — answers immediately with no DB check.
// The frontend uses this to detect Render cold-start without hitting heavy routes.
app.get('/api/ping', (_req, res) => {
  res.status(200).json({ ok: true });
});

// API Routes with Rate Limiting and Request Queuing

// Request monitoring middleware
app.use('/api', (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    if (res.headersSent) return this;
    const duration = Date.now() - startTime;
    monitoringService.logRequest(req, res, duration);
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    if (res.headersSent) return this;
    const duration = Date.now() - startTime;
    monitoringService.logRequest(req, res, duration);
    return originalJson.call(this, data);
  };

  next();
});

// Critical routes (auth, payments) - high priority queuing
app.use('/api/auth/signin', authLimiter, queueMiddleware('critical'));
app.use('/api/auth/admin-signin', authLimiter, queueMiddleware('critical'));
app.use('/api/auth/verify-otp', otpLimiter, queueMiddleware('critical'));
app.use('/api/auth/resend-otp', otpLimiter, queueMiddleware('critical'));
app.use('/api/auth', apiLimiter, queueMiddleware('standard'), authRoutes);
app.use('/api/payments', apiLimiter, queueMiddleware('critical'), paymentRoutes);

// Standard routes with queuing
app.use('/api/students', apiLimiter, queueMiddleware('standard'), studentRoutes);
// Lesson text-search — lightweight read, bypasses queue to avoid 504 on search-as-you-type
app.use('/api/lessons/search', apiLimiter, (req, res, next) => {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  req.url = '/search' + qs;
  lessonRoutes(req, res, next);
});
// Standard lesson routes with queuing
app.use('/api/lessons', apiLimiter, queueMiddleware('standard'), lessonRoutes);
app.use('/api/quizzes', apiLimiter, queueMiddleware('standard'), quizRoutes);
app.use('/api/progress', apiLimiter, queueMiddleware('standard'), progressRoutes);
app.use('/api/referrals', apiLimiter, queueMiddleware('standard'), referralRoutes);
app.use('/api/analytics', apiLimiter, queueMiddleware('standard'), analyticsRoutes);
app.use('/api/profiles', apiLimiter, queueMiddleware('standard'), profileRoutes);
app.use('/api/reports', apiLimiter, queueMiddleware('standard'), reportsRoutes);
app.use('/api/settings', apiLimiter, queueMiddleware('standard'), settingsRoutes);
app.use('/api/cart', apiLimiter, queueMiddleware('standard'), cartRoutes);
app.use('/api/wishlist', apiLimiter, queueMiddleware('standard'), wishlistRoutes);
app.use('/api/notifications', apiLimiter, queueMiddleware('standard'), notificationRoutes);
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
app.use('/api/common-entrance', apiLimiter, queueMiddleware('standard'), commonEntranceRoutes);
app.use('/api/admin', apiLimiter, queueMiddleware('standard'), adminRoutes);

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
  const normalizePort = (portValue) => {
    const parsed = Number(portValue);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
    return 3000;
  };

  const preferredPort = normalizePort(PORT);
  let activePort = preferredPort;
  let server = null;

  const startServer = (portToUse) => {
    activePort = portToUse;
    const nextServer = app.listen(portToUse);

    nextServer.once('listening', () => {
      console.log(`[Server] Listening on port ${portToUse} (${NODE_ENV})`);
      if (!IS_PRODUCTION) {
        console.log(`[Server] Health: http://localhost:${portToUse}/api/health`);
      }
      // Signal PM2 that the app is ready (required when wait_ready: true in ecosystem.config)
      if (process.send) process.send('ready');
    });

    nextServer.once('error', (error) => {
      console.error('[Server] Error:', error.message);

      if (error.code === 'EADDRINUSE') {
        if (!IS_PRODUCTION) {
          const fallbackPort = portToUse + 1;
          console.warn(`[Server] Port ${portToUse} in use. Retrying on ${fallbackPort}...`);
          startServer(fallbackPort);
          return;
        }

        console.error(`[Server] Port ${portToUse} already in use.`);
      }

      process.exit(1);
    });

    server = nextServer;
  };

  startServer(preferredPort);

  // Graceful shutdown — close DB connections and finish in-flight requests
  const shutdown = (signal) => {
    console.log(`[Server] ${signal} received — shutting down gracefully...`);
    if (!server) {
      process.exit(0);
      return;
    }

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
}
