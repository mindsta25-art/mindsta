import { User } from '../models/index.js';

/**
 * Middleware to track user activity and update online status
 * Updates lastActiveAt on every authenticated request
 */
export const trackActivity = async (req, res, next) => {
  // Only track if user is authenticated
  if (req.user && req.user.id) {
    try {
      // Update user's last active timestamp and online status
      // Use updateOne to avoid triggering save hooks
      await User.updateOne(
        { _id: req.user.id },
        { 
          $set: { 
            lastActiveAt: new Date(),
            isOnline: true
          } 
        }
      );
    } catch (error) {
      // Don't block request if activity tracking fails
      console.error('[Activity Tracker] Error updating user activity:', error.message);
    }
  }
  
  next();
};

/**
 * Background job to mark users as offline
 * Users are marked offline if they haven't been active for more than 5 minutes
 */
export const markInactiveUsersOffline = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await User.updateMany(
      {
        isOnline: true,
        lastActiveAt: { $lt: fiveMinutesAgo }
      },
      {
        $set: { isOnline: false }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`[Activity Tracker] Marked ${result.modifiedCount} user(s) as offline`);
    }
  } catch (error) {
    console.error('[Activity Tracker] Error marking users offline:', error.message);
  }
};

/**
 * Start the background job to periodically mark inactive users as offline
 * Runs every 2 minutes
 */
export const startActivityMonitor = () => {
  // Run immediately on startup
  markInactiveUsersOffline();
  
  // Then run every 2 minutes
  setInterval(markInactiveUsersOffline, 2 * 60 * 1000);
  
  console.log('[Activity Tracker] Started monitoring user activity');
};
