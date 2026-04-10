/**
 * Graceful Shutdown Service
 * Handles clean shutdown of the application with proper cleanup
 */

import { EventEmitter } from 'events';

class GracefulShutdown extends EventEmitter {
  constructor() {
    super();
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30 seconds
    this.cleanupTasks = [];
    this.server = null;
    this.shutdownPromise = null;
  }

  /**
   * Initialize graceful shutdown handlers
   */
  initialize(server) {
    this.server = server;

    // Handle different shutdown signals
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, () => {
        this.logger.info(`Received ${signal}, initiating graceful shutdown`);
        this.initiateShutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.initiateShutdown('uncaughtException', error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.initiateShutdown('unhandledRejection', reason);
    });

    // Handle process warnings
    process.on('warning', (warning) => {
      this.logger.warn('Process Warning:', warning);
    });

    this.logger.info('Graceful shutdown handlers initialized');
  }

  /**
   * Add a cleanup task
   */
  addCleanupTask(task) {
    if (typeof task !== 'function') {
      throw new Error('Cleanup task must be a function');
    }
    this.cleanupTasks.push(task);
  }

  /**
   * Initiate graceful shutdown
   */
  async initiateShutdown(signal, error = null) {
    if (this.isShuttingDown) {
      return this.shutdownPromise;
    }

    this.isShuttingDown = true;
    this.emit('shutdownInitiated', { signal, error });

    this.shutdownPromise = this.performShutdown(signal, error);
    return this.shutdownPromise;
  }

  /**
   * Perform the actual shutdown sequence
   */
  async performShutdown(signal, error) {
    const startTime = Date.now();
    this.logger.info('Starting graceful shutdown sequence');

    try {
      // Step 1: Stop accepting new connections
      await this.stopAcceptingConnections();

      // Step 2: Wait for existing connections to complete
      await this.waitForConnections();

      // Step 3: Execute cleanup tasks
      await this.executeCleanupTasks();

      // Step 4: Close database connections
      await this.closeDatabaseConnections();

      // Step 5: Close cache connections
      await this.closeCacheConnections();

      // Step 6: Clean up queues
      await this.cleanupQueues();

      // Step 7: Final cleanup
      await this.finalCleanup();

      const shutdownTime = Date.now() - startTime;
      this.logger.info(`Graceful shutdown completed in ${shutdownTime}ms`);

      // Exit with appropriate code
      const exitCode = error ? 1 : 0;
      process.exit(exitCode);

    } catch (shutdownError) {
      this.logger.error('Error during shutdown:', shutdownError);
      process.exit(1);
    }
  }

  /**
   * Stop accepting new connections
   */
  async stopAcceptingConnections() {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.logger.info('Stopping new connections');
      this.server.close((err) => {
        if (err) {
          this.logger.error('Error closing server:', err);
        } else {
          this.logger.info('Server closed, no longer accepting connections');
        }
        resolve();
      });

      // Force close after timeout
      setTimeout(() => {
        this.logger.warn('Forcing server shutdown after timeout');
        resolve();
      }, 10000);
    });
  }

  /**
   * Wait for existing connections to complete
   */
  async waitForConnections() {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      // Check if there are active connections
      this.server.getConnections((err, count) => {
        if (err) {
          this.logger.error('Error getting connection count:', err);
          resolve();
          return;
        }

        if (count === 0) {
          this.logger.info('No active connections');
          resolve();
          return;
        }

        this.logger.info(`Waiting for ${count} connections to complete`);

        // Wait for connections to close naturally
        const checkInterval = setInterval(() => {
          this.server.getConnections((err, currentCount) => {
            if (err || currentCount === 0) {
              clearInterval(checkInterval);
              this.logger.info('All connections completed');
              resolve();
            }
          });
        }, 1000);

        // Timeout after waiting period
        setTimeout(() => {
          clearInterval(checkInterval);
          this.logger.warn('Timeout waiting for connections, proceeding with shutdown');
          resolve();
        }, this.shutdownTimeout);
      });
    });
  }

  /**
   * Execute registered cleanup tasks
   */
  async executeCleanupTasks() {
    this.logger.info(`Executing ${this.cleanupTasks.length} cleanup tasks`);

    const cleanupPromises = this.cleanupTasks.map(async (task, index) => {
      try {
        this.logger.debug(`Running cleanup task ${index + 1}`);
        await task();
        this.logger.debug(`Cleanup task ${index + 1} completed`);
      } catch (error) {
        this.logger.error(`Cleanup task ${index + 1} failed:`, error);
        // Don't fail the entire shutdown for one task
      }
    });

    await Promise.allSettled(cleanupPromises);
  }

  /**
   * Close database connections
   */
  async closeDatabaseConnections() {
    try {
      // Import here to avoid circular dependencies
      const { databaseOptimizer } = await import('./databaseOptimizerService.js');
      await databaseOptimizer.shutdown();
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
    }
  }

  /**
   * Close cache connections
   */
  async closeCacheConnections() {
    try {
      // Import here to avoid circular dependencies
      const { closeRedisConnection } = await import('./cacheService.js');
      await closeRedisConnection();
      this.logger.info('Cache connections closed');
    } catch (error) {
      this.logger.error('Error closing cache connections:', error);
    }
  }

  /**
   * Clean up request queues
   */
  async cleanupQueues() {
    try {
      // Import here to avoid circular dependencies
      const { shutdownQueues } = await import('./requestQueueService.js');
      shutdownQueues();
      this.logger.info('Request queues cleaned up');
    } catch (error) {
      this.logger.error('Error cleaning up queues:', error);
    }
  }

  /**
   * Final cleanup operations
   */
  async finalCleanup() {
    try {
      // Flush logs
      const { monitoringService } = await import('./monitoringService.js');
      monitoringService.logger?.end();

      // Emit final shutdown event
      this.emit('shutdownComplete');

      this.logger.info('Final cleanup completed');
    } catch (error) {
      console.error('Error in final cleanup:', error);
    }
  }

  /**
   * Force immediate shutdown (for emergencies)
   */
  forceShutdown(exitCode = 1) {
    this.logger.error('Forcing immediate shutdown');
    process.exit(exitCode);
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress() {
    return this.isShuttingDown;
  }

  /**
   * Get shutdown status
   */
  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      shutdownTimeout: this.shutdownTimeout,
      cleanupTasksCount: this.cleanupTasks.length,
      serverClosed: this.server ? !this.server.listening : true,
    };
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();

// Add logger property for convenience
Object.defineProperty(gracefulShutdown, 'logger', {
  get() {
    // Lazy import to avoid circular dependencies
    try {
      const { logger } = require('./monitoringService.js');
      return logger;
    } catch {
      return console;
    }
  },
});