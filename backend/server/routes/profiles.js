import express from 'express';
import { User } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/profiles/online-count — lean endpoint, no full profile payload
router.get('/online-count', requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments({ isOnline: true });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/profiles
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      fullName: u.fullName,
      userType: u.userType,
      status: u.status || 'active',
      isOnline: u.isOnline || false,
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
