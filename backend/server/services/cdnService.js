/**
 * CDN Configuration Service
 * Handles static asset delivery, optimization, and CDN integration
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

class CDNService extends EventEmitter {
  constructor() {
    super();
    this.config = {
      provider: process.env.CDN_PROVIDER || 'cloudflare', // cloudflare, aws, google, azure
      baseUrl: process.env.CDN_BASE_URL || '',
      enabled: process.env.CDN_ENABLED === 'true',
      cacheControl: {
        static: 'public, max-age=31536000, immutable', // 1 year for static assets
        images: 'public, max-age=86400', // 1 day for images
        fonts: 'public, max-age=31536000', // 1 year for fonts
        dynamic: 'public, max-age=300', // 5 minutes for dynamic content
      },
      compression: {
        enabled: true,
        types: ['gzip', 'br'],
      },
      optimization: {
        imageOptimization: true,
        minification: true,
        bundling: true,
      },
    };

    this.assetManifest = new Map();
    this.cache = new Map();
  }

  /**
   * Initialize CDN service
   */
  async initialize() {
    if (!this.config.enabled) {
      console.log('CDN service disabled');
      return;
    }

    try {
      await this.loadAssetManifest();
      await this.setupCDNHeaders();
      this.setupOptimization();

      console.log(`CDN service initialized with provider: ${this.config.provider}`);
      this.emit('initialized', this.config);
    } catch (error) {
      console.error('Failed to initialize CDN service:', error);
      throw error;
    }
  }

  /**
   * Load asset manifest for cache busting
   */
  async loadAssetManifest() {
    try {
      const manifestPath = path.join(process.cwd(), 'dist', 'asset-manifest.json');

      // Check if manifest exists
      await fs.access(manifestPath);

      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      // Store hashed asset paths
      Object.entries(manifest).forEach(([originalPath, hashedPath]) => {
        this.assetManifest.set(originalPath, hashedPath);
      });

      console.log(`Loaded asset manifest with ${this.assetManifest.size} entries`);
    } catch (error) {
      console.warn('Asset manifest not found, using direct paths:', error.message);
    }
  }

  /**
   * Set up CDN-specific headers
   */
  async setupCDNHeaders() {
    // This would be configured at the CDN level
    // Here we prepare the headers for the application
    this.cdnHeaders = {
      'X-CDN-Provider': this.config.provider,
      'X-CDN-Enabled': this.config.enabled.toString(),
      'X-Content-Optimization': this.config.optimization.imageOptimization.toString(),
    };
  }

  /**
   * Set up asset optimization
   */
  setupOptimization() {
    if (!this.config.optimization.imageOptimization) return;

    // Image optimization settings
    this.imageOptimization = {
      formats: ['webp', 'avif', 'jpg', 'png'],
      qualities: {
        webp: 85,
        avif: 80,
        jpg: 85,
        png: 90,
      },
      sizes: [320, 640, 1024, 1920], // Responsive image sizes
    };
  }

  /**
   * Get optimized asset URL with cache busting
   */
  getAssetUrl(assetPath, options = {}) {
    if (!this.config.enabled) {
      return assetPath;
    }

    // Get hashed version if available
    const hashedPath = this.assetManifest.get(assetPath) || assetPath;

    // Add CDN base URL
    let cdnUrl = this.config.baseUrl ? `${this.config.baseUrl}${hashedPath}` : hashedPath;

    // Add query parameters for cache busting if not using hashed filenames
    if (!this.assetManifest.has(assetPath) && options.cacheBust) {
      const version = crypto.createHash('md5').update(assetPath + Date.now()).digest('hex').substr(0, 8);
      cdnUrl += `?v=${version}`;
    }

    // Add image optimization parameters
    if (options.optimize && this.isImage(assetPath)) {
      cdnUrl = this.addImageOptimizationParams(cdnUrl, options);
    }

    return cdnUrl;
  }

  /**
   * Check if path is an image
   */
  isImage(assetPath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    return imageExtensions.some(ext => assetPath.toLowerCase().endsWith(ext));
  }

  /**
   * Add image optimization parameters
   */
  addImageOptimizationParams(url, options) {
    const params = new URLSearchParams();

    // Format conversion
    if (options.format && this.imageOptimization.formats.includes(options.format)) {
      params.append('format', options.format);
    }

    // Quality setting
    if (options.quality) {
      params.append('quality', options.quality.toString());
    } else if (options.format) {
      params.append('quality', this.imageOptimization.qualities[options.format]?.toString() || '85');
    }

    // Resize parameters
    if (options.width) {
      params.append('width', options.width.toString());
    }
    if (options.height) {
      params.append('height', options.height.toString());
    }

    // Responsive images
    if (options.responsive) {
      const sizes = this.imageOptimization.sizes.join(',');
      params.append('sizes', sizes);
    }

    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  }

  /**
   * Get cache control header for asset type
   */
  getCacheControl(assetPath) {
    const ext = path.extname(assetPath).toLowerCase();

    // Static assets (JS, CSS, fonts)
    if (['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
      return this.config.cacheControl.static;
    }

    // Images
    if (this.isImage(assetPath)) {
      return this.config.cacheControl.images;
    }

    // Fonts
    if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
      return this.config.cacheControl.fonts;
    }

    // Default to dynamic content
    return this.config.cacheControl.dynamic;
  }

  /**
   * Generate preload headers for critical assets
   */
  generatePreloadHeaders(criticalAssets = []) {
    const preloadHeaders = [];

    criticalAssets.forEach(asset => {
      const url = this.getAssetUrl(asset.path);
      const as = this.getResourceType(asset.path);
      const crossorigin = asset.crossorigin ? 'crossorigin' : '';

      preloadHeaders.push(`<${url}>; rel=preload; as=${as}${crossorigin ? `; ${crossorigin}` : ''}`);
    });

    return {
      'Link': preloadHeaders.join(', '),
    };
  }

  /**
   * Get resource type for preload
   */
  getResourceType(assetPath) {
    const ext = path.extname(assetPath).toLowerCase();

    const typeMap = {
      '.js': 'script',
      '.css': 'style',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.gif': 'image',
      '.webp': 'image',
      '.avif': 'image',
      '.svg': 'image',
    };

    return typeMap[ext] || 'fetch';
  }

  /**
   * Purge CDN cache for specific assets
   */
  async purgeCache(assetPaths = []) {
    if (!this.config.enabled) return;

    try {
      const purgeUrls = assetPaths.map(path => this.getAssetUrl(path));

      // This would integrate with specific CDN APIs
      switch (this.config.provider) {
        case 'cloudflare':
          await this.purgeCloudflareCache(purgeUrls);
          break;
        case 'aws':
          await this.purgeAWSCloudFrontCache(purgeUrls);
          break;
        case 'google':
          await this.purgeGoogleCDNCache(purgeUrls);
          break;
        default:
          console.warn(`CDN purge not implemented for provider: ${this.config.provider}`);
      }

      this.emit('cachePurged', { assetPaths, purgeUrls });
      console.log(`Purged CDN cache for ${assetPaths.length} assets`);
    } catch (error) {
      console.error('Failed to purge CDN cache:', error);
      throw error;
    }
  }

  /**
   * Cloudflare cache purge
   */
  async purgeCloudflareCache(urls) {
    // Implementation would use Cloudflare API
    console.log('Purging Cloudflare cache for URLs:', urls);
  }

  /**
   * AWS CloudFront cache purge
   */
  async purgeAWSCloudFrontCache(urls) {
    // Implementation would use AWS SDK
    console.log('Purging AWS CloudFront cache for URLs:', urls);
  }

  /**
   * Google CDN cache purge
   */
  async purgeGoogleCDNCache(urls) {
    // Implementation would use Google CDN API
    console.log('Purging Google CDN cache for URLs:', urls);
  }

  /**
   * Get CDN analytics/stats
   */
  async getAnalytics(timeframe = '24h') {
    if (!this.config.enabled) return null;

    // This would fetch real analytics from CDN provider
    return {
      provider: this.config.provider,
      timeframe,
      requests: 0,
      bandwidth: 0,
      cacheHitRate: 0,
      topAssets: [],
      errors: [],
    };
  }

  /**
   * Middleware for setting CDN headers
   */
  middleware() {
    return (req, res, next) => {
      if (!this.config.enabled) return next();

      // Add CDN headers
      Object.entries(this.cdnHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Set cache control based on asset type
      if (req.path.startsWith('/assets/') || req.path.startsWith('/static/')) {
        const cacheControl = this.getCacheControl(req.path);
        res.setHeader('Cache-Control', cacheControl);
      }

      // Add compression headers if enabled
      if (this.config.compression.enabled) {
        res.setHeader('Accept-Encoding', this.config.compression.types.join(', '));
      }

      next();
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

// Export singleton instance
export const cdnService = new CDNService();