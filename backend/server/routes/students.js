/**
 * Student Routes
 * Handles student CRUD operations
 */

import express from 'express';
import { Student } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

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
      schoolName: student.schoolName,
      isPaid: student.isPaid || false,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student', message: error.message });
  }
});

// GET /api/students
router.get('/', requireAuth, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students.map(s => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      fullName: s.fullName,
      grade: s.grade,
      age: s.age,
      schoolName: s.schoolName,
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
      schoolName: student.schoolName,
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
    const { fullName, age, grade, schoolName } = req.body;
    
    // Ensure user can only update their own profile
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (age) updateData.age = age;
    if (grade) updateData.grade = grade;
    if (schoolName) updateData.schoolName = schoolName;
    
    const student = await Student.findOneAndUpdate(
      { userId: req.params.userId },
      updateData,
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
      schoolName: student.schoolName,
      isPaid: student.isPaid || false,
      createdAt: student.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

export default router;
