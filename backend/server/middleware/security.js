/**
 * Security Middleware
 * Comprehensive security measures to protect the application
 */

import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Rate Limiting - Prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour
  message: 'Too many OTP requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (increased for development)
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window (increased for development)
  message: 'Too many requests. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Security Headers - Helmet configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'http:', 'wss:', 'ws:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  hidePoweredBy: true,
});

/**
 * CORS Configuration
 */
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'http://localhost:3000',
      'https://mindsta.vercel.app',
      'https://mindsta-app.vercel.app',
      // Add your production domains here
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
};

/**
 * Data Sanitization - Prevent NoSQL injection (Express 5 compatible)
 */
export const sanitizeData = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      // Remove keys that start with $ or contain .
      if (key.startsWith('$') || key.includes('.')) {
        console.warn(`[Security] Blocked NoSQL operator: ${key} in ${req.method} ${req.path}`);
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  // Note: req.query is read-only in Express 5, so we skip it

  next();
};

/**
 * Prevent HTTP Parameter Pollution
 */
export const preventPollution = hpp({
  whitelist: [
    'grade',
    'term',
    'subject',
    'status',
    'userType',
    'sort',
    'page',
    'limit',
  ],
});

/**
 * Input Validation Middleware
 */
export const validateInput = (req, res, next) => {
  // Remove null bytes from all inputs
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/\0/g, '');
    }
    return str;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v => 
          typeof v === 'object' ? sanitizeObject(v) : sanitizeString(v)
        );
      } else {
        sanitized[key] = sanitizeString(value);
      }
    }
    return sanitized;
  };

  // Sanitize body and params (query is read-only in Express 5)
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);
  // Note: req.query cannot be modified in Express 5

  next();
};

/**
 * Error Handler - Don't expose stack traces in production
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: isDevelopment ? err.message : 'Invalid input data',
      ...(isDevelopment && { details: err.errors }),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: isDevelopment ? err.message : 'Invalid resource identifier',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: isDevelopment ? err.message : 'Resource already exists',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Authentication token has expired',
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.name || 'Server Error',
    message: isDevelopment ? err.message : 'An error occurred',
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * Request Logger - Log all requests for security monitoring
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Log suspicious activity
    if (res.statusCode >= 400) {
      console.warn('[Security]', logData);
    }
  });

  next();
};

/**
 * Content Type Validation
 */
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
      });
    }
  }
  next();
};

export default {
  authLimiter,
  otpLimiter,
  apiLimiter,
  strictLimiter,
  securityHeaders,
  corsOptions,
  sanitizeData,
  preventPollution,
  validateInput,
  errorHandler,
  requestLogger,
  validateContentType,
};
