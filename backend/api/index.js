/**
 * Vercel Serverless Function Entry Point
 * This file is required for Vercel to run the Express app as a serverless function
 */

import app from '../server/index.js';

// Export the Express app as a Vercel serverless function
export default app;
