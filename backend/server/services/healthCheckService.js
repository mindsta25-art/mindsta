/**
 * Health Check Service
 * Monitors system health and provides status endpoints
 */

import mongoose from 'mongoose';
import { pingRedis } from './cacheService.js';
import { emailCircuitBreaker, paymentCircuitBreaker } from './circuitBreakerService.js';

/**
 * Comprehensive health check
 */
export const performHealthCheck = async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development',
  };

  // Database health
  try {
    const dbState = mongoose.connection.readyState;
    checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbState,
      name: mongoose.connection.name,
    };

    // Test database operation
    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
      checks.database.responseTime = 'ok';
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // Redis health
  try {
    const redisHealthy = await pingRedis();
    checks.redis = {
      status: redisHealthy ? 'healthy' : 'degraded',
      available: !!process.env.REDIS_URL,
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // Circuit breakers status
  checks.circuitBreakers = {
    email: emailCircuitBreaker.getState(),
    payment: paymentCircuitBreaker.getState(),
  };

  // Overall system status
  const criticalChecks = [checks.database];
  const hasCriticalFailure = criticalChecks.some(check => check.status === 'unhealthy');

  checks.overall = hasCriticalFailure ? 'unhealthy' : 'healthy';

  return checks;
};

/**
 * Lightweight ping check
 */
export const ping = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  service: 'mindsta-api',
});

/**
 * Readiness check (for Kubernetes/load balancers)
 */
export const readinessCheck = async () => {
  try {
    // Check if database is connected
    const dbReady = mongoose.connection.readyState === 1;

    if (!dbReady) {
      return { ready: false, reason: 'Database not connected' };
    }

    // Test database operation
    await mongoose.connection.db.admin().ping();

    return { ready: true };
  } catch (error) {
    return { ready: false, reason: `Database error: ${error.message}` };
  }
};

/**
 * Liveness check (for container orchestration)
 */
export const livenessCheck = () => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Check if process has been running for at least 30 seconds
  if (uptime < 30) {
    return { alive: false, reason: 'Process starting up' };
  }

  // Check memory usage (alert if using more than 1GB)
  if (memoryUsage.heapUsed > 1024 * 1024 * 1024) {
    return { alive: false, reason: 'High memory usage' };
  }

  return { alive: true };
};