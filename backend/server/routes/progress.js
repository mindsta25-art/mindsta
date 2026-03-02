import express from 'express';
import { UserProgress } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/progress/:userId — authenticated users can only read their own progress
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    // Enforce ownership: a student can only access their own progress
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden: you can only view your own progress' });
    }
    const progress = await UserProgress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (error) {
    console.error('[Progress GET] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST /api/progress — derives userId from the authenticated token
router.post('/', requireAuth, async (req, res) => {
  try {
    // Always use the authenticated user's ID, ignore any userId in the body
    const userId = req.user.userId;
    const { lessonId, completed, quizScore, videoPosition, videoWatchPercent, timeSpent } = req.body;

    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId is required' });
    }

    // Build update object — only include fields that are explicitly provided
    const updateFields = {
      lastAccessedAt: new Date(),
    };
    if (completed !== undefined) updateFields.completed = completed;
    if (quizScore !== undefined) updateFields.quizScore = quizScore;
    if (completed) updateFields.completedAt = new Date();
    if (!completed && completed !== undefined) updateFields.completedAt = null;
    if (videoPosition !== undefined) updateFields.videoPosition = videoPosition;
    if (videoWatchPercent !== undefined) updateFields.videoWatchPercent = videoWatchPercent;
    if (timeSpent !== undefined) updateFields.timeSpent = timeSpent;

    const progress = await UserProgress.findOneAndUpdate(
      { userId, lessonId },
      { $set: updateFields },
      { upsert: true, new: true }
    );
    
    res.json(progress);
  } catch (error) {
    console.error('[Progress POST] Error:', error.message);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
