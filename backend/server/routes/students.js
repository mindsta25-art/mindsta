/**
 * Student Routes
 * Handles student CRUD operations
 */

import express from 'express';
import { Student, User } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/students/:userId/profile — create student record (used by Google OAuth users who lack one)
router.post('/:userId/profile', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const existing = await Student.findOne({ userId: req.params.userId });
    if (existing) {
      return res.status(409).json({ error: 'Student profile already exists' });
    }

    const { fullName, age, grade } = req.body;
    if (!fullName || !grade) {
      return res.status(400).json({ error: 'fullName and grade are required' });
    }

    const student = await Student.create({
      userId: req.params.userId,
      fullName,
      age: age ? Number(age) : undefined,
      grade,
    });

    if (fullName) {
      await User.findByIdAndUpdate(req.params.userId, { fullName });
    }

    res.status(201).json({
      id: student._id.toString(),
      userId: student.userId.toString(),
      fullName: student.fullName,
      grade: student.grade,
      age: student.age,
      isPaid: student.isPaid || false,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating student profile:', error);
    res.status(500).json({ error: 'Failed to create profile', message: error.message });
  }
});

// GET /api/students/:userId
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.params.userId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({
      id: student._id.toString(),
      userId: student.userId.toString(),
      fullName: student.fullName,
      grade: student.grade,
      age: student.age,
      isPaid: student.isPaid || false,
      currentStreak: student.currentStreak || 0,
      longestStreak: student.longestStreak || 0,
      lastActivityDate: student.lastActivityDate,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student', message: error.message });
  }
});

// GET /api/students — admin-only; returns all student records
router.get('/', requireAdmin, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students.map(s => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      fullName: s.fullName,
      grade: s.grade,
      age: s.age,
      isPaid: s.isPaid || false,
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students', message: error.message });
  }
});

// PUT /api/students/:userId/grade
router.put('/:userId/grade', requireAuth, async (req, res) => {
  try {
    const { grade } = req.body;
    
    if (!grade) {
      return res.status(400).json({ error: 'Grade is required' });
    }

    // Only the student themselves (or an admin) may change their grade
    const isAdmin = req.user.userType === 'admin';
    if (!isAdmin && req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden: you can only update your own grade' });
    }
    
    const student = await Student.findOneAndUpdate(
      { userId: req.params.userId },
      { grade },
      { new: true }
    );
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({
      id: student._id.toString(),
      userId: student.userId.toString(),
      fullName: student.fullName,
      grade: student.grade,
      age: student.age,
      isPaid: student.isPaid || false,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating student grade:', error);
    res.status(500).json({ error: 'Failed to update grade', message: error.message });
  }
});

// PUT /api/students/:userId/profile
router.put('/:userId/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, age, grade } = req.body;
    
    // Ensure user can only update their own profile
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (age) updateData.age = age;
    if (grade) updateData.grade = grade;
    
    const student = await Student.findOneAndUpdate(
      { userId: req.params.userId },
      updateData,
      { new: true }
    );
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Keep User.fullName in sync so the header / auth context always reflects the latest name
    if (fullName) {
      await User.findByIdAndUpdate(req.params.userId, { fullName });
    }
    
    res.json({
      id: student._id.toString(),
      userId: student.userId.toString(),
      fullName: student.fullName,
      grade: student.grade,
      age: student.age,
      isPaid: student.isPaid || false,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

// POST /api/students/:userId/update-streak
router.post('/:userId/update-streak', requireAuth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.params.userId });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = student.currentStreak || 0;
    let longestStreak = student.longestStreak || 0;
    const lastActivity = student.lastActivityDate ? new Date(student.lastActivityDate) : null;
    
    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change
        return res.json({
          currentStreak,
          longestStreak,
          message: 'Streak already updated today'
        });
      } else if (daysDiff === 1) {
        // Consecutive day
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      // First activity
      currentStreak = 1;
    }
    
    // Update longest streak if current is higher
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    
    // Update student record
    student.currentStreak = currentStreak;
    student.longestStreak = longestStreak;
    student.lastActivityDate = today;
    await student.save();
    
    res.json({
      currentStreak,
      longestStreak,
      lastActivityDate: today,
      message: 'Streak updated successfully'
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({ error: 'Failed to update streak', message: error.message });
  }
});

export default router;
