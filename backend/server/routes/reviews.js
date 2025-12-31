import express from 'express';
import { Review, Lesson, UserProgress, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews for a lesson
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { 
      rating, 
      sortBy = 'helpful', 
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query = { 
      lessonId, 
      status: 'active' 
    };
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'helpful':
        sort = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'highest':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sort = { rating: 1, createdAt: -1 };
        break;
      default:
        sort = { helpfulCount: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Get rating statistics for a lesson
router.get('/lesson/:lessonId/stats', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const stats = await Review.calculateAverageRating(lessonId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    res.status(500).json({ message: 'Failed to fetch rating stats', error: error.message });
  }
});

// Get user's review for a lesson
router.get('/lesson/:lessonId/my-review', requireAuth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ 
      lessonId, 
      userId 
    }).lean();

    res.json({ review: review || null });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ message: 'Failed to fetch user review', error: error.message });
  }
});

// Create or update a review
router.post('/lesson/:lessonId', requireAuth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Review title is required' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    if (title.length > 100) {
      return res.status(400).json({ message: 'Title must be 100 characters or less' });
    }

    if (comment.length > 2000) {
      return res.status(400).json({ message: 'Comment must be 2000 characters or less' });
    }

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has access to the lesson (optional - implement based on your business logic)
    // For now, we'll allow any authenticated user to review

    // Check completion status
    const progress = await UserProgress.findOne({ 
      userId, 
      lessonId 
    });

    const completionPercentage = progress ? progress.completionPercentage || 0 : 0;
    const isVerifiedPurchase = progress ? true : false;

    // Create or update review
    const reviewData = {
      lessonId,
      userId,
      userName: user.fullName,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedPurchase,
      completionPercentage,
    };

    const review = await Review.findOneAndUpdate(
      { userId, lessonId },
      reviewData,
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ 
      message: 'Review submitted successfully', 
      review 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }
    
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
});

// Update a review
router.put('/:reviewId', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (title && title.length > 100) {
      return res.status(400).json({ message: 'Title must be 100 characters or less' });
    }

    if (comment && comment.length > 2000) {
      return res.status(400).json({ message: 'Comment must be 2000 characters or less' });
    }

    // Find review and check ownership
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or you do not have permission to edit it' });
    }

    // Update fields
    if (rating) review.rating = parseInt(rating);
    if (title) review.title = title.trim();
    if (comment) review.comment = comment.trim();

    await review.save();

    res.json({ 
      message: 'Review updated successfully', 
      review 
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
});

// Delete a review
router.delete('/:reviewId', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({ _id: reviewId, userId });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found or you do not have permission to delete it' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const alreadyMarked = review.helpfulBy.some(
      id => id.toString() === userId.toString()
    );

    if (alreadyMarked) {
      // Remove from helpful
      review.helpfulBy = review.helpfulBy.filter(
        id => id.toString() !== userId.toString()
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add to helpful
      review.helpfulBy.push(userId);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({ 
      message: alreadyMarked ? 'Removed from helpful' : 'Marked as helpful',
      helpful: !alreadyMarked,
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Failed to update helpful status', error: error.message });
  }
});

// Admin: Add instructor response to a review
router.post('/:reviewId/response', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    // Check if user is admin or educator
    const user = await User.findById(userId);
    if (!user || !['admin', 'educator'].includes(user.userType)) {
      return res.status(403).json({ message: 'Only instructors and admins can respond to reviews' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Response comment is required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.instructorResponse = {
      comment: comment.trim(),
      respondedAt: new Date(),
      respondedBy: userId,
    };

    await review.save();

    res.json({ 
      message: 'Response added successfully', 
      review 
    });
  } catch (error) {
    console.error('Error adding instructor response:', error);
    res.status(500).json({ message: 'Failed to add response', error: error.message });
  }
});

// Admin: Get all reviews (with filters)
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { 
      status, 
      rating,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (rating) query.rating = parseInt(rating);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('lessonId', 'title subject grade')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Admin: Update review status
router.patch('/admin/:reviewId/status', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { reviewId } = req.params;
    const { status } = req.body;

    if (!['active', 'hidden', 'flagged'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ 
      message: 'Review status updated successfully', 
      review 
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ message: 'Failed to update review status', error: error.message });
  }
});

export default router;
