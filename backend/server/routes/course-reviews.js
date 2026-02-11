import express from 'express';
import { CourseReview } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/course-reviews
 * Get reviews for a specific course
 */
router.get('/', async (req, res) => {
  try {
    const { subject, grade, term } = req.query;

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    const query = { subject, grade };
    if (term) query.term = term;

    const reviews = await CourseReview.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * GET /api/course-reviews/stats
 * Get review statistics for a course
 */
router.get('/stats', async (req, res) => {
  try {
    const { subject, grade, term } = req.query;

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    const query = { subject, grade };
    if (term) query.term = term;

    const reviews = await CourseReview.find(query);

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

/**
 * POST /api/course-reviews
 * Create a new course review
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, grade, term, rating, review } = req.body;
    const userId = req.user.id;

    if (!subject || !grade || !rating || !review) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this course
    const query = { userId, subject, grade };
    if (term) query.term = term;

    const existingReview = await CourseReview.findOne(query);
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this course' });
    }

    const newReview = new CourseReview({
      userId,
      studentName: req.user.fullName || req.user.email,
      subject,
      grade,
      term,
      rating,
      review,
      verified: true // Can be set based on enrollment verification
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * PUT /api/course-reviews/:id
 * Update a course review
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    const existingReview = await CourseReview.findById(id);
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      existingReview.rating = rating;
    }

    if (review) {
      existingReview.review = review;
    }

    await existingReview.save();
    res.json(existingReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/course-reviews/:id
 * Delete a course review
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await CourseReview.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Allow user to delete their own review or admin to delete any
    if (review.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await CourseReview.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * POST /api/course-reviews/:id/helpful
 * Mark review as helpful or not helpful
 */
router.post('/:id/helpful', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    const review = await CourseReview.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (helpful) {
      review.helpful += 1;
    } else {
      review.notHelpful += 1;
    }

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ error: 'Failed to mark review helpful' });
  }
});

/**
 * GET /api/course-reviews/user/my-reviews
 * Get current user's reviews
 */
router.get('/user/my-reviews', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await CourseReview.find({ userId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

export default router;
