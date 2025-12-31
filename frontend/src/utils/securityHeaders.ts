/**
 * Security headers configuration for production
 * These headers should be configured in your deployment platform
 * (Netlify, Vercel, etc.) or web server (Nginx, Apache)
 */

export const securityHeaders = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",
  
  // Prevent clickjacking
  "X-Frame-Options": "SAMEORIGIN",
  
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  
  // Permissions Policy (formerly Feature Policy)
  "Permissions-Policy": [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "),
};

/**
 * Netlify _headers file format
 * Create a file named "_headers" in your public folder with this content:
 * 
 * /*
 *   X-Content-Type-Options: nosniff
 *   X-XSS-Protection: 1; mode=block
 *   X-Frame-Options: SAMEORIGIN
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
 */

/**
 * Vercel vercel.json headers configuration:
 * {
 *   "headers": [
 *     {
 *       "source": "/(.*)",
 *       "headers": [
 *         { "key": "X-Content-Type-Options", "value": "nosniff" },
 *         { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
 *         { "key": "X-XSS-Protection", "value": "1; mode=block" }
 *       ]
 *     }
 *   ]
 * }
 */
