import express from 'express';
import { Subject } from '../models/index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all active subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get all subjects (including inactive) - Admin only
router.get('/all', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ order: 1, name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching all subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get a single subject by ID
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

// Create a new subject - Admin only
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, description, category, icon, color, order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    // Check if subject already exists
    const existing = await Subject.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ error: 'Subject already exists' });
    }

    const subject = new Subject({
      name,
      description: description || '',
      category: category || 'Core',
      icon: icon || 'BookOpen',
      color: color || '#6366f1',
      order: order || 0,
      createdBy: req.user.userId,
    });

    await subject.save();

    res.status(201).json({
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: error.message || 'Failed to create subject' });
  }
});

// Update a subject - Admin only
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, description, category, icon, color, order, isActive } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if new name conflicts with existing subject
    if (name && name !== subject.name) {
      const existing = await Subject.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ error: 'Subject name already exists' });
      }
    }

    // Update fields
    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (category) subject.category = category;
    if (icon) subject.icon = icon;
    if (color) subject.color = color;
    if (order !== undefined) subject.order = order;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();

    res.json({
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: error.message || 'Failed to update subject' });
  }
});

// Delete a subject - Admin only
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Soft delete - just deactivate
    subject.isActive = false;
    await subject.save();

    res.json({
      message: 'Subject deactivated successfully',
      subject,
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Permanently delete a subject - Admin only (dangerous)
router.delete('/:id/permanent', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json({
      message: 'Subject permanently deleted',
    });
  } catch (error) {
    console.error('Error permanently deleting subject:', error);
    res.status(500).json({ error: 'Failed to permanently delete subject' });
  }
});

export default router;
