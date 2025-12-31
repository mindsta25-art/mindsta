import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../middleware/auth.js';
import { User } from '../models/index.js';

const router = express.Router();

// Create a new admin user
// POST /api/admin/admins
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    const { email, password, fullName } = req.body || {};

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password and fullName are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({
      email,
      password: hashed,
      fullName,
      userType: 'admin',
    });

    return res.status(201).json({
      id: admin._id.toString(),
      email: admin.email,
      fullName: admin.fullName,
      userType: admin.userType,
      createdAt: admin.createdAt,
    });
  } catch (err) {
    console.error('Create admin error:', err);
    return res.status(500).json({ error: 'Failed to create admin', message: err.message });
  }
});

// Update user (role, status)
// PATCH /api/admin/users/:id
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, status, fullName } = req.body;

    const updates = {};
    if (userType) updates.userType = userType;
    if (status) updates.status = status;
    if (fullName) updates.fullName = fullName;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      status: user.status,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Failed to update user', message: err.message });
  }
});

// Reset password
// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword required' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password', message: err.message });
  }
});

// Deactivate user (soft delete)
// POST /api/admin/users/:id/deactivate
router.post('/users/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: 'inactive' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deactivated', id: user._id.toString(), status: user.status });
  } catch (err) {
    console.error('Deactivate user error:', err);
    return res.status(500).json({ error: 'Failed to deactivate user', message: err.message });
  }
});

// Delete user (hard delete)
// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully', id });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user', message: err.message });
  }
});


export default router;
