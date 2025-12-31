import express from 'express';
import Cart from '../models/Cart.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', requireAuth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({
        userId: req.user.id,
        items: [],
        totalAmount: 0,
      });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// Add item to cart
router.post('/add', requireAuth, async (req, res) => {
  try {
    console.log('[Cart] POST /add called by user:', req.user?.id);
    console.log('[Cart] Request body:', req.body);
    
    const { subject, grade, term, price = 0 } = req.body;

    if (!subject || !grade) {
      console.log('[Cart] Validation failed: missing subject or grade');
      return res.status(400).json({ message: 'Subject and grade are required' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    console.log('[Cart] Existing cart found:', !!cart);

    if (!cart) {
      console.log('[Cart] Creating new cart for user:', req.user.id);
      cart = new Cart({
        userId: req.user.id,
        items: [],
      });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      item => item.subject === subject && item.grade === grade && item.term === term
    );

    if (existingItem) {
      console.log('[Cart] Item already exists in cart');
      return res.status(400).json({ message: 'Item already in cart' });
    }

    // Add new item
    cart.items.push({
      subject,
      grade,
      term,
      price,
      addedAt: new Date(),
    });

    console.log('[Cart] Saving cart with', cart.items.length, 'items');
    await cart.save();
    console.log('[Cart] Cart saved successfully');

    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error('[Cart] Error in POST /add:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Remove item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    await cart.save();

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
});

// Clear cart
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.totalAmount = 0;

    await cart.save();

    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

// Get cart item count
router.get('/count', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    const count = cart ? cart.items.length : 0;

    res.json({ count });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({ message: 'Error fetching cart count', error: error.message });
  }
});

export default router;
