import express from 'express';
import { UserProgress } from '../models/index.js';

const router = express.Router();

// GET /api/progress/:userId
router.get('/:userId', async (req, res) => {
  try {
    const progress = await UserProgress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/progress
router.post('/', async (req, res) => {
  try {
    const { userId, lessonId, completed, quizScore } = req.body;
    
    const progress = await UserProgress.findOneAndUpdate(
      { userId, lessonId },
      { completed, quizScore, completedAt: completed ? new Date() : null },
      { upsert: true, new: true }
    );
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
