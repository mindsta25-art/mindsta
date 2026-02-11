import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Suggestion from '../models/Suggestion.js';

const router = express.Router();

// POST /api/suggestions - allow students to suggest a topic
router.post('/', requireAuth, async (req, res) => {
  try {
    const { topic, description, subject, grade } = req.body;
    
    if (!topic || typeof topic !== 'string' || topic.length < 3) {
      return res.status(400).json({ error: 'Please provide a valid topic (minimum 3 characters)' });
    }

    const suggestion = new Suggestion({ 
      topic, 
      description: description || '',
      subject: subject || '',
      grade: grade || '',
      user: req.user.id,
      status: 'pending'
    });
    
    await suggestion.save();
    res.status(201).json({ 
      message: 'Thank you! Your suggestion has been submitted successfully.',
      suggestion 
    });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    res.status(500).json({ error: 'Failed to save suggestion. Please try again.' });
  }
});

// GET /api/suggestions - Get all suggestions (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, grade, subject } = req.query;
    
    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    if (grade) filter.grade = grade;
    if (subject) filter.subject = subject;

    const suggestions = await Suggestion.find(filter)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// GET /api/suggestions/my - Get current user's suggestions
router.get('/my', requireAuth, async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch your suggestions' });
  }
});

// PATCH /api/suggestions/:id - Update suggestion status (admin only)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { 
        status,
        adminNotes: adminNotes || '',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'fullName email');

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json({ 
      message: 'Suggestion updated successfully',
      suggestion 
    });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

// DELETE /api/suggestions/:id - Delete a suggestion (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const suggestion = await Suggestion.findByIdAndDelete(id);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});

export default router;
