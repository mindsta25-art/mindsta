import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Extract token from Authorization header
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    // Normalize the user object to support both id and userId fields
    const userId = payload.userId || payload.id;
    req.user = { 
      userId: userId,
      id: userId,
      email: payload.email,
      userType: payload.userType
    };
    
    // Update user activity status (online tracking)
    if (userId) {
      try {
        await User.updateOne(
          { _id: userId },
          { 
            $set: { 
              lastActiveAt: new Date(),
              isOnline: true
            } 
          }
        ).exec();
      } catch (activityError) {
        // Don't block request if activity tracking fails
        console.error('[Auth] Error updating user activity:', activityError.message);
      }
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Like requireAuth but accepts tokens that have just expired (ignoreExpiration).
 * Used exclusively by POST /auth/refresh so users can renew an expired token.
 */
export const requireAuthIgnoreExpiry = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const userId = payload.userId || payload.id;
    req.user = { userId, id: userId, email: payload.email, userType: payload.userType };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, async () => {
      if (req.user?.userType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      // Optionally verify user still exists
      const user = await User.findById(req.user.userId).select('_id userType');
      if (!user || user.userType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  } catch (err) {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

/**
 * Like requireAuth but does not reject unauthenticated requests.
 * Sets req.user if a valid token is present; otherwise leaves req.user undefined.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.userId || payload.id;
    req.user = { userId, id: userId, email: payload.email, userType: payload.userType };
  } catch (_) {
    // Invalid/expired token — treat as unauthenticated
  }
  next();
};

export default { requireAuth, optionalAuth, requireAdmin };
