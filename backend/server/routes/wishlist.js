import express from 'express';
import Wishlist from '../models/Wishlist.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/', requireAuth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, items: [] });
    }
    res.json(wishlist);
  } catch (e) {
    console.error('Error fetching wishlist:', e);
    res.status(500).json({ message: 'Error fetching wishlist', error: e.message });
  }
});

// Add item to wishlist
router.post('/add', requireAuth, async (req, res) => {
  try {
    console.log('[Wishlist] POST /add called by user:', req.user?.id);
    console.log('[Wishlist] Request body:', req.body);
    
    const { subject, grade, term } = req.body;
    if (!subject || !grade) {
      console.log('[Wishlist] Validation failed: missing subject or grade');
      return res.status(400).json({ message: 'Subject and grade are required' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    console.log('[Wishlist] Existing wishlist found:', !!wishlist);
    
    if (!wishlist) {
      console.log('[Wishlist] Creating new wishlist for user:', req.user.id);
      wishlist = await Wishlist.create({ userId: req.user.id, items: [] });
    }

    const exists = wishlist.items.find((i) => i.subject === subject && i.grade === grade && i.term === term);
    if (exists) {
      console.log('[Wishlist] Item already exists in wishlist');
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    wishlist.items.push({ subject, grade, term, addedAt: new Date() });
    console.log('[Wishlist] Saving wishlist with', wishlist.items.length, 'items');
    await wishlist.save();
    console.log('[Wishlist] Wishlist saved successfully');

    res.json({ message: 'Item added to wishlist', wishlist });
  } catch (e) {
    console.error('[Wishlist] Error in POST /add:', e);
    res.status(500).json({ message: 'Error adding to wishlist', error: e.message });
  }
});

// Remove item from wishlist
router.delete('/remove/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.items = wishlist.items.filter((i) => i._id.toString() !== itemId);
    await wishlist.save();

    res.json({ message: 'Item removed from wishlist', wishlist });
  } catch (e) {
    console.error('Error removing from wishlist:', e);
    res.status(500).json({ message: 'Error removing from wishlist', error: e.message });
  }
});

// Clear wishlist
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.items = [];
    await wishlist.save();

    res.json({ message: 'Wishlist cleared', wishlist });
  } catch (e) {
    console.error('Error clearing wishlist:', e);
    res.status(500).json({ message: 'Error clearing wishlist', error: e.message });
  }
});

// Count
router.get('/count', requireAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    res.json({ count: wishlist ? wishlist.items.length : 0 });
  } catch (e) {
    console.error('Error counting wishlist:', e);
    res.status(500).json({ message: 'Error fetching wishlist count', error: e.message });
  }
});

export default router;
