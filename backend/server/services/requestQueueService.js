/**
 * Request Queuing Service
 * Manages request queues to prevent system overload during traffic spikes
 */

import { EventEmitter } from 'events';

class RequestQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 10;
    this.maxQueueSize = options.maxQueueSize || 100;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.processing = new Set();
    this.queue = [];
    this.stats = {
      processed: 0,
      queued: 0,
      rejected: 0,
      timedOut: 0,
    };
  }

  async enqueue(requestId, requestHandler, priority = 0) {
    return new Promise((resolve, reject) => {
      if (this.processing.size >= this.maxConcurrent && this.queue.length >= this.maxQueueSize) {
        this.stats.rejected++;
        reject(new Error('Queue full - request rejected'));
        return;
      }

      const request = {
        id: requestId,
        handler: requestHandler,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
        timeoutId: setTimeout(() => {
          this.stats.timedOut++;
          // Remove from queue if still pending, or from processing if already started
          this.removeFromQueue(requestId);
          this.processing.delete(requestId);
          reject(new Error('Request timeout'));
          // Unblock the next queued request so a stale slot doesn't permanently reduce concurrency
          setImmediate(() => this.process());
        }, this.timeout),
      };

      // Insert based on priority (higher priority first)
      const insertIndex = this.queue.findIndex(item => item.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIndex, 0, request);
      }

      this.stats.queued++;
      this.process();
    });
  }

  async process() {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.processing.add(request.id);

    try {
      const result = await request.handler();
      clearTimeout(request.timeoutId);
      request.resolve(result);
      this.stats.processed++;
    } catch (error) {
      clearTimeout(request.timeoutId);
      request.reject(error);
    } finally {
      this.processing.delete(request.id);
      this.emit('processed', request.id);

      // Process next request
      setImmediate(() => this.process());
    }
  }

  removeFromQueue(requestId) {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const request = this.queue.splice(index, 1)[0];
      clearTimeout(request.timeoutId);
      request.reject(new Error('Request cancelled'));
    }
  }

  getStats() {
    return {
      ...this.stats,
      currentQueueSize: this.queue.length,
      processingCount: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
    };
  }

  clear() {
    // Clear timeouts for queued requests
    this.queue.forEach(request => {
      clearTimeout(request.timeoutId);
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processing.clear();
  }
}

// Global request queues for different types of operations
export const requestQueues = {
  // High priority operations (auth, payments)
  critical: new RequestQueue({
    maxConcurrent: 5,
    maxQueueSize: 50,
    timeout: 15000,
  }),

  // Standard operations (API calls, data retrieval)
  standard: new RequestQueue({
    maxConcurrent: 50,
    maxQueueSize: 500,
    timeout: 30000,
  }),

  // Background operations (emails, notifications)
  background: new RequestQueue({
    maxConcurrent: 10,
    maxQueueSize: 500,
    timeout: 60000,
  }),
};

/**
 * Middleware to queue requests
 */
export const queueMiddleware = (queueType = 'standard') => {
  return async (req, res, next) => {
    const queue = requestQueues[queueType];
    if (!queue) {
      return next();
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await queue.enqueue(requestId, () => {
        // Wrap the request handling
        return new Promise((resolve, reject) => {
          const originalSend = res.send;
          const originalJson = res.json;

          res.send = function(data) {
            if (res.headersSent) return this;
            resolve(data);
            return originalSend.call(this, data);
          };

          res.json = function(data) {
            if (res.headersSent) return this;
            resolve(data);
            return originalJson.call(this, data);
          };

          // Continue with the request
          next();
        });
      });

    } catch (error) {
      if (error.message === 'Queue full - request rejected') {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Too many requests, please try again later',
        });
      }
      if (error.message === 'Request timeout') {
        return res.status(504).json({
          error: 'Request timeout',
          message: 'Request took too long to process',
        });
      }
      next(error);
    }
  };
};

/**
 * Get queue statistics
 */
export const getQueueStats = () => {
  const stats = {};
  Object.keys(requestQueues).forEach(key => {
    stats[key] = requestQueues[key].getStats();
  });
  return stats;
};

/**
 * Graceful shutdown helper
 */
export const shutdownQueues = () => {
  Object.values(requestQueues).forEach(queue => {
    queue.clear();
  });
};