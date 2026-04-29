import express from 'express';
import Cart from '../models/Cart.js';
import Topic from '../models/Topic.js';
import { Lesson, CommonEntrance, Enrollment } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', requireAuth, async (req, res) => {
  try {
    // Only populate topicId — lessonId is returned as a raw ObjectId string so that
    // downstream code (Checkout → Payment → Enrollment) receives a serialisable ID,
    // not a full populated Lesson document.
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.topicId');
    
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

// Add topic to cart
router.post('/add-topic', requireAuth, async (req, res) => {
  try {
    console.log('[Cart] POST /add-topic called by user:', req.user?.id);
    
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ message: 'Topic ID is required' });
    }

    // Fetch topic details
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [],
      });
    }

    // Check if topic already exists in cart
    const existingItem = cart.items.find(
      item => item.itemType === 'topic' && item.topicId?.toString() === topicId
    );

    if (existingItem) {
      return res.status(400).json({ message: 'Topic already in cart' });
    }

    // Add new topic to cart
    cart.items.push({
      itemType: 'topic',
      topicId: topic._id,
      title: topic.title,
      subject: topic.subject,
      grade: topic.grade,
      term: topic.term,
      price: topic.price,
      imageUrl: topic.imageUrl,
      addedAt: new Date(),
    });
    // Reset abandoned-cart flag so a new reminder can fire after the next abandonment
    cart.abandonedEmailSentAt = null;

    await cart.save();
    await cart.populate('items.topicId');

    res.json({ message: 'Topic added to cart', cart });
  } catch (error) {
    console.error('[Cart] Error in POST /add-topic:', error);
    res.status(500).json({ message: 'Error adding topic to cart', error: error.message });
  }
});

// Add lesson to cart
router.post('/add-lesson', requireAuth, async (req, res) => {
  try {
    console.log('[Cart] POST /add-lesson called by user:', req.user?.id);
    
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ message: 'Lesson ID is required' });
    }

    // Fetch lesson details
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [],
      });
    }

    // Check if lesson already exists in cart
    const existingItem = cart.items.find(
      item => item.itemType === 'lesson' && item.lessonId?.toString() === lessonId
    );

    if (existingItem) {
      return res.status(400).json({ message: 'Lesson already in cart' });
    }

    // Add new lesson to cart
    cart.items.push({
      itemType: 'lesson',
      lessonId: lesson._id,
      title: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      term: lesson.term,
      price: lesson.price,
      imageUrl: lesson.imageUrl,
      addedAt: new Date(),
    });
    cart.abandonedEmailSentAt = null;

    await cart.save();
    // NOTE: Do NOT populate items.lessonId here — the frontend isInCart check compares
    // item.lessonId (string) against the lesson id string. Populating converts it to a
    // full document object, breaking that equality check.

    res.json({ message: 'Lesson added to cart', cart });
  } catch (error) {
    console.error('[Cart] Error in POST /add-lesson:', error);
    res.status(500).json({ message: 'Error adding lesson to cart', error: error.message });
  }
});

// Legacy add item endpoint (for backward compatibility)
router.post('/add', requireAuth, async (req, res) => {
  try {
    console.log('[Cart] POST /add called by user:', req.user?.id);
    
    const { subject, grade, term, price = 0, title = 'Item', lessonId } = req.body;

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

    console.log('[Cart] Current cart items:', cart.items.length);
    console.log('[Cart] Checking for lessonId:', lessonId);

    // Check if item already exists in cart (match by lessonId if provided, else by subject+grade+term)
    const existingItem = lessonId
      ? cart.items.find(item => {
          const match = item.lessonId?.toString() === lessonId;
          console.log('[Cart] Checking item lessonId:', item.lessonId?.toString(), 'against:', lessonId, 'match:', match);
          return match;
        })
      : cart.items.find(item => item.subject === subject && item.grade === grade && item.term === term && !item.lessonId);

    if (existingItem) {
      console.log('[Cart] Item already exists in cart, rejecting');
      return res.status(400).json({ message: 'Item already in cart' });
    }

    // Add new item
    const newItem = {
      itemType: lessonId ? 'lesson' : 'subject',
      title,
      subject,
      grade,
      term,
      price,
      addedAt: new Date(),
    };
    if (lessonId) {
      newItem.lessonId = lessonId;
      console.log('[Cart] Adding lesson item with lessonId:', lessonId);
    }
    
    cart.items.push(newItem);

    console.log('[Cart] Saving cart with', cart.items.length, 'items');
    await cart.save();
    console.log('[Cart] Cart saved successfully');

    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error('[Cart] Error in POST /add:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// Add Common Entrance exam to cart
router.post('/add-common-entrance', requireAuth, async (req, res) => {
  try {
    const { commonEntranceId } = req.body;
    if (!commonEntranceId) return res.status(400).json({ message: 'Common Entrance exam ID is required' });

    const exam = await CommonEntrance.findById(commonEntranceId);
    if (!exam) return res.status(404).json({ message: 'Common Entrance exam not found' });
    if (!exam.isPublished) return res.status(403).json({ message: 'Exam is not available' });

    // Prevent re-purchase of already-owned exams
    const alreadyEnrolled = await Enrollment.findOne({ userId: req.user.id, commonEntranceId: exam._id, isActive: true });
    if (alreadyEnrolled) return res.status(400).json({ message: 'You already own this exam' });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    const exists = cart.items.find(item => item.itemType === 'common-entrance' && item.commonEntranceId?.toString() === commonEntranceId);
    if (exists) return res.status(400).json({ message: 'Exam already in cart' });

    cart.items.push({
      itemType: 'common-entrance',
      commonEntranceId: exam._id,
      title: exam.title,
      subject: exam.subject,
      grade: 'Common Entrance',
      term: 'Common Entrance',
      price: exam.price,
      imageUrl: exam.imageUrl,
      addedAt: new Date(),
    });
    cart.abandonedEmailSentAt = null;
    await cart.save();

    res.json({ message: 'Exam added to cart', cart });
  } catch (error) {
    console.error('[Cart] Error in POST /add-common-entrance:', error);
    res.status(500).json({ message: 'Error adding exam to cart', error: error.message });
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
