import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';

// Extract token from Authorization header
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, userType }
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
      const user = await User.findById(req.user.id).select('_id userType');
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
