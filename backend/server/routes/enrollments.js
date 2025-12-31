import express from 'express';
import { Enrollment } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/enrollments - Get all enrollments for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      userId: req.user.id, 
      isActive: true 
    }).sort({ purchasedAt: -1 });
    
    res.json(enrollments);
  } catch (error) {
    console.error('[Get Enrollments Error]', error.message);
    res.status(500).json({ error: 'Failed to fetch enrollments', message: error.message });
  }
});

// GET /api/enrollments/check - Check if user has access to a specific course
// Query: subject, grade, term
router.get('/check', requireAuth, async (req, res) => {
  try {
    const { subject, grade, term } = req.query;
    
    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    const enrollment = await Enrollment.findOne({
      userId: req.user.id,
      subject,
      grade,
      term: term || undefined,
      isActive: true,
    });

    res.json({ hasAccess: !!enrollment, enrollment });
  } catch (error) {
    console.error('[Check Enrollment Error]', error.message);
    res.status(500).json({ error: 'Failed to check enrollment', message: error.message });
  }
});

export default router;
