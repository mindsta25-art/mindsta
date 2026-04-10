/**
 * Database Optimization Service
 * Handles connection pooling, query optimization, and performance monitoring
 */

import mongoose from 'mongoose';
import { EventEmitter } from 'events';

class DatabaseOptimizer extends EventEmitter {
  constructor() {
    super();
    this.connectionPool = null;
    this.queryStats = new Map();
    this.slowQueries = [];
    this.indexes = new Map();
  }

  /**
   * Initialize optimized database connection
   */
  async initializeConnection(uri, options = {}) {
    const defaultOptions = {
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 5,  // Minimum number of connections in the connection pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      ...options,
    };

    try {
      await mongoose.connect(uri, defaultOptions);
      this.connectionPool = mongoose.connection;

      // Set up connection event listeners
      this.setupConnectionListeners();

      // Enable query profiling
      await this.enableQueryProfiling();

      console.log('Database connection optimized and established');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Set up connection event listeners
   */
  setupConnectionListeners() {
    const conn = this.connectionPool;

    conn.on('connected', () => {
      console.log('MongoDB connected');
      this.emit('connected');
    });

    conn.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      this.emit('error', err);
    });

    conn.on('disconnected', () => {
      console.log('MongoDB disconnected');
      this.emit('disconnected');
    });

    // Monitor connection pool stats
    setInterval(() => {
      const stats = this.getConnectionStats();
      this.emit('poolStats', stats);
    }, 30000); // Every 30 seconds
  }

  /**
   * Enable MongoDB query profiling
   */
  async enableQueryProfiling() {
    try {
      const db = this.connectionPool.db;
      await db.setProfilingLevel('slow_only', { slowms: 100 }); // Log queries slower than 100ms
    } catch (error) {
      console.warn('Failed to enable query profiling:', error.message);
    }
  }

  /**
   * Get connection pool statistics
   */
  getConnectionStats() {
    const conn = this.connectionPool;
    return {
      readyState: conn.readyState,
      name: conn.name,
      host: conn.host,
      port: conn.port,
      poolSize: conn.pool?.size || 0,
      availableConnections: conn.pool?.available || 0,
      pendingConnections: conn.pool?.pending || 0,
      borrowedConnections: conn.pool?.borrowed || 0,
    };
  }

  /**
   * Optimize query with caching and indexing hints
   */
  async optimizeQuery(model, query, options = {}) {
    const startTime = Date.now();
    const queryKey = `${model.modelName}-${JSON.stringify(query)}`;

    try {
      // Add query hints for better performance
      if (options.hint) {
        query.hint(options.hint);
      }

      // Add read preference for better distribution
      if (options.readPreference) {
        query.read(options.readPreference);
      }

      // Add lean option for faster queries (returns plain objects)
      if (options.lean !== false) {
        query.lean();
      }

      // Execute query with timeout
      const result = await query.maxTimeMS(options.maxTimeMS || 30000);

      const executionTime = Date.now() - startTime;

      // Track query performance
      this.trackQueryPerformance(queryKey, executionTime, options);

      // Log slow queries
      if (executionTime > 1000) { // Queries taking more than 1 second
        this.logSlowQuery(queryKey, executionTime, query);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackQueryPerformance(queryKey, executionTime, options, error);
      throw error;
    }
  }

  /**
   * Track query performance statistics
   */
  trackQueryPerformance(queryKey, executionTime, options, error = null) {
    const stats = this.queryStats.get(queryKey) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      errors: 0,
    };

    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.minTime = Math.min(stats.minTime, executionTime);

    if (error) {
      stats.errors++;
    }

    this.queryStats.set(queryKey, stats);
  }

  /**
   * Log slow query for analysis
   */
  logSlowQuery(queryKey, executionTime, query) {
    const slowQuery = {
      timestamp: new Date(),
      queryKey,
      executionTime,
      query: query.getQuery ? query.getQuery() : 'Unknown query',
      options: query.getOptions ? query.getOptions() : {},
    };

    this.slowQueries.push(slowQuery);

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    this.emit('slowQuery', slowQuery);
  }

  /**
   * Create optimized indexes
   */
  async createOptimizedIndexes(model, indexes) {
    try {
      const collectionName = model.collection.name;
      const existingIndexes = await model.collection.indexes();

      for (const indexSpec of indexes) {
        const indexName = Object.keys(indexSpec.keys).join('_');
        const existingIndex = existingIndexes.find(idx => idx.name === indexName);

        if (!existingIndex) {
          await model.collection.createIndex(
            indexSpec.keys,
            {
              name: indexName,
              background: true,
              ...indexSpec.options,
            }
          );
          console.log(`Created index: ${indexName} on ${collectionName}`);
        }
      }

      this.indexes.set(collectionName, indexes);
    } catch (error) {
      console.error('Failed to create optimized indexes:', error);
      throw error;
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    return {
      totalQueries: Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.count, 0),
      slowQueriesCount: this.slowQueries.length,
      recentSlowQueries: this.slowQueries.slice(-10),
      topSlowQueries: Array.from(this.queryStats.entries())
        .sort(([, a], [, b]) => b.avgTime - a.avgTime)
        .slice(0, 10)
        .map(([key, stats]) => ({ query: key, ...stats })),
    };
  }

  /**
   * Analyze and suggest optimizations
   */
  async analyzePerformance() {
    const analysis = {
      connectionStats: this.getConnectionStats(),
      queryStats: this.getQueryStats(),
      recommendations: [],
    };

    // Connection pool recommendations
    const poolStats = analysis.connectionStats;
    if (poolStats.poolSize > poolStats.availableConnections * 2) {
      analysis.recommendations.push({
        type: 'connection_pool',
        message: 'Consider increasing maxPoolSize or reducing concurrent operations',
        severity: 'medium',
      });
    }

    // Query performance recommendations
    const queryStats = analysis.queryStats;
    if (queryStats.slowQueriesCount > 10) {
      analysis.recommendations.push({
        type: 'query_optimization',
        message: 'High number of slow queries detected. Consider adding indexes or optimizing queries',
        severity: 'high',
      });
    }

    // Index recommendations based on slow queries
    const slowQueryPatterns = this.analyzeSlowQueryPatterns();
    if (slowQueryPatterns.length > 0) {
      analysis.recommendations.push({
        type: 'indexing',
        message: `Consider adding indexes for: ${slowQueryPatterns.join(', ')}`,
        severity: 'high',
      });
    }

    return analysis;
  }

  /**
   * Analyze patterns in slow queries to suggest indexes
   */
  analyzeSlowQueryPatterns() {
    const patterns = new Set();

    this.slowQueries.forEach(slowQuery => {
      // Simple pattern analysis - look for common query fields
      const query = slowQuery.query;
      if (query) {
        Object.keys(query).forEach(field => {
          if (field !== '_id' && !field.startsWith('$')) {
            patterns.add(field);
          }
        });
      }
    });

    return Array.from(patterns);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.connectionPool) {
      await mongoose.disconnect();
      console.log('Database connection closed gracefully');
    }
  }
}

// Export singleton instance
export const databaseOptimizer = new DatabaseOptimizer();