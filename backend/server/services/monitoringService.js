/**
 * Monitoring and Logging Service
 * Comprehensive monitoring, logging, and alerting system
 */

import winston from 'winston';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.logger = null;
    this.metrics = new Map();
    this.alerts = [];
    this.performanceData = [];
    this.isInitialized = false;
  }

  /**
   * Initialize monitoring service
   */
  async initialize(options = {}) {
    if (this.isInitialized) return;

    const logDir = options.logDir || path.join(process.cwd(), 'logs');
    await fs.mkdir(logDir, { recursive: true });

    // Configure Winston logger
    this.logger = winston.createLogger({
      level: options.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'mindsta-api' },
      transports: [
        // Error log
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
        }),
        // Combined log
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
        }),
        // Performance log
        new winston.transports.File({
          filename: path.join(logDir, 'performance.log'),
          level: 'debug',
        }),
      ],
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }));
    }

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    this.isInitialized = true;
    this.logger.info('Monitoring service initialized');
  }

  /**
   * Set up performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor event loop lag
    const eventLoopMonitor = setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        this.recordMetric('event_loop_lag', lag);

        if (lag > 100) { // Alert if lag > 100ms
          this.createAlert('high_event_loop_lag', `Event loop lag: ${lag.toFixed(2)}ms`, 'warning');
        }
      });
    }, 10000); // Check every 10 seconds

    // Monitor memory usage
    const memoryMonitor = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.recordMetric('memory_heap_used', memUsage.heapUsed);
      this.recordMetric('memory_heap_total', memUsage.heapTotal);
      this.recordMetric('memory_external', memUsage.external);
      this.recordMetric('memory_rss', memUsage.rss);

      // Alert if memory usage is high
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 512) { // Alert if > 512MB
        this.createAlert('high_memory_usage', `Memory usage: ${heapUsedMB.toFixed(2)}MB`, 'warning');
      }
    }, 30000); // Check every 30 seconds

    // Store interval IDs for cleanup
    this.monitors = { eventLoopMonitor, memoryMonitor };
  }

  /**
   * Record a metric
   */
  recordMetric(name, value, tags = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      timestamp,
      tags,
    };

    // Store in memory (last 1000 metrics)
    this.performanceData.push(metric);
    if (this.performanceData.length > 1000) {
      this.performanceData.shift();
    }

    // Update current metrics map
    this.metrics.set(name, { value, timestamp, tags });

    // Emit metric event
    this.emit('metric', metric);
  }

  /**
   * Create an alert
   */
  createAlert(type, message, severity = 'info', data = {}) {
    const alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: new Date(),
      data,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log the alert
    this.logger.log(severity, message, { alert: true, alertId: alert.id, ...data });

    // Emit alert event
    this.emit('alert', alert);

    return alert;
  }

  /**
   * Log API request
   */
  logRequest(req, res, responseTime, error = null) {
    if (!this.logger) return;
    const logData = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      responseTime,
      statusCode: res.statusCode,
      userId: req.user?.id,
      requestId: req.requestId,
    };

    if (error) {
      this.logger.error('API Request Error', {
        ...logData,
        error: error.message,
        stack: error.stack,
      });
    } else {
      this.logger.info('API Request', logData);
    }

    // Record response time metric
    this.recordMetric('api_response_time', responseTime, {
      method: req.method,
      endpoint: req.route?.path || req.url,
      statusCode: res.statusCode,
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation, collection, duration, error = null) {
    const logData = {
      operation,
      collection,
      duration,
    };

    if (error) {
      this.logger.error('Database Operation Error', {
        ...logData,
        error: error.message,
      });
    } else {
      this.logger.debug('Database Operation', logData);
    }

    // Record database operation metric
    this.recordMetric('db_operation_duration', duration, {
      operation,
      collection,
    });
  }

  /**
   * Log cache operation
   */
  logCacheOperation(operation, key, hit = null, duration = null) {
    const logData = {
      operation,
      key,
      hit,
      duration,
    };

    this.logger.debug('Cache Operation', logData);

    if (operation === 'get' && hit !== null) {
      this.recordMetric('cache_hit_rate', hit ? 1 : 0, { key });
    }

    if (duration) {
      this.recordMetric('cache_operation_duration', duration, {
        operation,
        key,
      });
    }
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const uptime = process.memoryUsage();

    return {
      uptime: process.uptime(),
      memory: uptime,
      metrics: Object.fromEntries(this.metrics),
      alerts: this.alerts.slice(-10), // Last 10 alerts
      performanceData: this.performanceData.slice(-50), // Last 50 metrics
      activeAlerts: this.alerts.filter(alert =>
        alert.timestamp > new Date(Date.now() - 3600000) // Last hour
      ).length,
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const stats = this.getStats();
    const recentAlerts = this.alerts.filter(alert =>
      alert.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
    );

    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'error');
    const warningAlerts = recentAlerts.filter(alert => alert.severity === 'warning');

    let status = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 2) {
      status = 'warning';
    }

    return {
      status,
      timestamp: new Date(),
      uptime: stats.uptime,
      memoryUsage: stats.memory.heapUsed,
      activeAlerts: recentAlerts.length,
      criticalAlerts: criticalAlerts.length,
      warningAlerts: warningAlerts.length,
    };
  }

  /**
   * Export logs for analysis
   */
  async exportLogs(startDate, endDate, format = 'json') {
    // This would typically export to external storage like S3
    // For now, return in-memory data
    const filteredData = {
      alerts: this.alerts.filter(alert =>
        alert.timestamp >= startDate && alert.timestamp <= endDate
      ),
      metrics: this.performanceData.filter(metric =>
        metric.timestamp >= startDate.getTime() && metric.timestamp <= endDate.getTime()
      ),
    };

    if (format === 'csv') {
      // Convert to CSV format
      return this.convertToCSV(filteredData);
    }

    return filteredData;
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    let csv = 'timestamp,type,data\n';

    data.alerts.forEach(alert => {
      csv += `${alert.timestamp.toISOString()},alert,${JSON.stringify(alert).replace(/"/g, '""')}\n`;
    });

    data.metrics.forEach(metric => {
      csv += `${new Date(metric.timestamp).toISOString()},metric,${JSON.stringify(metric).replace(/"/g, '""')}\n`;
    });

    return csv;
  }

  /**
   * Clean up old data
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = Date.now() - maxAge;

    this.performanceData = this.performanceData.filter(
      metric => metric.timestamp > cutoff
    );

    this.alerts = this.alerts.filter(
      alert => alert.timestamp.getTime() > cutoff
    );
  }

  /**
   * Shutdown monitoring service
   */
  shutdown() {
    if (this.monitors) {
      Object.values(this.monitors).forEach(interval => clearInterval(interval));
    }

    this.logger.info('Monitoring service shut down');
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Convenience logging functions
export const logger = {
  info: (message, meta = {}) => monitoringService.logger?.info(message, meta),
  warn: (message, meta = {}) => monitoringService.logger?.warn(message, meta),
  error: (message, meta = {}) => monitoringService.logger?.error(message, meta),
  debug: (message, meta = {}) => monitoringService.logger?.debug(message, meta),
};