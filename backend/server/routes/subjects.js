import express from 'express';
import Subject from '../models/Subject.js';
import Lesson from '../models/Lesson.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all subjects (public - for students)
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get all subjects including inactive (admin only)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ order: 1, name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching all subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get single subject by ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Create new subject (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, description, icon, color, order } = req.body;

    // Check if subject already exists
    const existing = await Subject.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(400).json({ error: 'Subject already exists' });
    }

    const subject = new Subject({
      name,
      category,
      description,
      icon,
      color,
      order: order || 0,
      isActive: true
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, description, icon, color, order, isActive } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if new name conflicts with existing subject
    if (name && name !== subject.name) {
      const existing = await Subject.findOne({ 
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ error: 'Subject name already exists' });
      }
    }

    if (name) subject.name = name;
    if (category) subject.category = category;
    if (description !== undefined) subject.description = description;
    if (icon) subject.icon = icon;
    if (color) subject.color = color;
    if (order !== undefined) subject.order = order;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();
    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if subject has lessons
    const lessonCount = await Lesson.countDocuments({ subject: subject.name });
    
    if (lessonCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete subject with ${lessonCount} associated lessons. Please delete or reassign lessons first.` 
      });
    }

    await subject.deleteOne();
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Toggle subject active status (admin only)
router.patch('/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    subject.isActive = !subject.isActive;
    await subject.save();
    
    res.json(subject);
  } catch (error) {
    console.error('Error toggling subject status:', error);
    res.status(500).json({ error: 'Failed to toggle subject status' });
  }
});

export default router;
