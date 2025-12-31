import express from 'express';
import { Bundle } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bundles - Get all active bundles (public)
router.get('/', async (req, res) => {
  try {
    const { grade, isActive } = req.query;
    
    const query = {};
    if (grade) query.grade = grade;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    else query.isActive = true; // Default to active bundles only
    
    const bundles = await Bundle.find(query)
      .populate('subjects.lessonId', 'title description')
      .sort({ displayOrder: 1, grade: 1 });
    
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bundles/:id - Get single bundle
router.get('/:id', async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id)
      .populate('subjects.lessonId', 'title description');
    
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bundles - Create new bundle (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const bundleData = req.body;
    
    // Validate that bundlePrice is less than total
    const totalPrice = bundleData.subjects.reduce((sum, s) => sum + s.price, 0);
    if (bundleData.bundlePrice >= totalPrice) {
      return res.status(400).json({ 
        error: 'Bundle price must be less than total individual prices' 
      });
    }
    
    const bundle = new Bundle(bundleData);
    await bundle.save();
    
    res.status(201).json(bundle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/bundles/:id - Update bundle (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate bundle price if being updated
    if (updates.bundlePrice && updates.subjects) {
      const totalPrice = updates.subjects.reduce((sum, s) => sum + s.price, 0);
      if (updates.bundlePrice >= totalPrice) {
        return res.status(400).json({ 
          error: 'Bundle price must be less than total individual prices' 
        });
      }
    }
    
    const bundle = await Bundle.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    res.json(bundle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/bundles/:id - Delete bundle (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bundles/:id/toggle - Toggle bundle active status (Admin only)
router.patch('/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);
    
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    bundle.isActive = !bundle.isActive;
    await bundle.save();
    
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bundles/:id/increment-enrollment - Increment enrollment count
router.patch('/:id/increment-enrollment', requireAuth, async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndUpdate(
      req.params.id,
      { $inc: { enrollmentCount: 1 } },
      { new: true }
    );
    
    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
