import express from 'express';
import Newsletter from '../models/Newsletter.js';
import SentNewsletter from '../models/SentNewsletter.js';
import { User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { sendNewsletterEmail } from '../services/emailService.js';

const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email, source = 'home' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({ email });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({ error: 'This email is already subscribed' });
      } else {
        // Reactivate subscription
        existingSubscription.isActive = true;
        existingSubscription.subscribedAt = new Date();
        await existingSubscription.save();
        return res.json({ 
          message: 'Welcome back! Your subscription has been reactivated',
          subscription: existingSubscription 
        });
      }
    }

    // Create new subscription
    const subscription = new Newsletter({
      email,
      source,
      userId: req.user?.userId || null,
    });

    await subscription.save();

    res.status(201).json({ 
      message: 'Successfully subscribed to newsletter!',
      subscription 
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This email is already subscribed' });
    }
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subscription = await Newsletter.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ error: 'Email not found in our subscribers list' });
    }

    subscription.isActive = false;
    await subscription.save();

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
  }
});

// Get subscription status (for authenticated users)
router.get('/status', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subscription = await Newsletter.findOne({ email });

    res.json({ 
      subscribed: subscription ? subscription.isActive : false,
      subscription 
    });
  } catch (error) {
    console.error('Error checking newsletter status:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Get all subscribers (admin only)
router.get('/subscribers', requireAuth, async (req, res) => {
  try {
    const subscribers = await Newsletter.find()
      .sort({ subscribedAt: -1 })
      .select('-__v');

    res.json({ 
      subscribers,
      count: subscribers.length,
      active: subscribers.filter(s => s.isActive).length,
      inactive: subscribers.filter(s => !s.isActive).length
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Delete subscriber (admin only)
router.delete('/subscribers/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    res.json({ 
      message: 'Subscriber deleted successfully',
      subscriber 
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

// Send newsletter to all active subscribers (admin only)
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Get admin user info
    const admin = await User.findById(req.user.id).select('email fullName');
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Get all active subscribers with linked user info for personalization
    const subscribers = await Newsletter.find({ isActive: true })
      .select('email userId')
      .populate('userId', 'fullName firstName');

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No active subscribers found' });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      try {
        const subscriberName = subscriber.userId?.fullName || subscriber.userId?.firstName || 'Subscriber';
        await sendNewsletterEmail(subscriber.email, subscriberName, subject, message);
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError.message);
        failedCount++;
      }
    }

    // Determine status
    let status = 'sent';
    if (failedCount === subscribers.length) {
      status = 'failed';
    } else if (failedCount > 0) {
      status = 'partial';
    }

    // Save sent newsletter record
    const sentNewsletter = await SentNewsletter.create({
      subject,
      message,
      sentBy: req.user.id,
      sentByEmail: admin.email,
      totalSubscribers: subscribers.length,
      sentCount,
      failedCount,
      status,
    });

    res.json({ 
      message: 'Newsletter sent successfully',
      sentCount,
      failedCount,
      totalSubscribers: subscribers.length,
      id: sentNewsletter._id
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
});

// Get all sent newsletters (admin only)
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const sentNewsletters = await SentNewsletter.find()
      .sort({ sentAt: -1 })
      .populate('sentBy', 'fullName email')
      .select('-__v');

    res.json({ 
      newsletters: sentNewsletters,
      count: sentNewsletters.length
    });
  } catch (error) {
    console.error('Error fetching sent newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch sent newsletters' });
  }
});

// Get single sent newsletter details (admin only)
router.get('/sent/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const newsletter = await SentNewsletter.findById(id)
      .populate('sentBy', 'fullName email');

    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    res.json(newsletter);
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

export default router;
