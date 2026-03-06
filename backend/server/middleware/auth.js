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

export default { requireAuth, requireAdmin };
