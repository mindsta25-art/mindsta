import express from 'express';
import { Quiz } from '../models/index.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quizzes - Get all quizzes (admin)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('lessonId', 'title subject grade').sort({ createdAt: -1 });
    res.json(quizzes.map(quiz => ({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId?._id.toString(),
      lessonTitle: quiz.lessonId?.title,
      lessonSubject: quiz.lessonId?.subject,
      lessonGrade: quiz.lessonId?.grade,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questionCount: quiz.questions.length,
      createdAt: quiz.createdAt.toISOString(),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/lesson/:lessonId
router.get('/lesson/:lessonId', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ lessonId: req.params.lessonId });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    res.json({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId.toString(),
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
      createdAt: quiz.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lessonId');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId?._id.toString(),
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
      createdAt: quiz.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes - Create quiz (admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    // Enforce exactly 10 questions and 10-minute (600s) time limit
    if (!Array.isArray(payload.questions) || payload.questions.length !== 10) {
      return res.status(400).json({ error: 'Exactly 10 questions are required' });
    }
    payload.timeLimit = 600;

    const quiz = await Quiz.create(payload);
    res.status(201).json({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId.toString(),
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
      createdAt: quiz.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/quizzes/:id - Update quiz (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    if (updates.questions) {
      if (!Array.isArray(updates.questions) || updates.questions.length !== 10) {
        return res.status(400).json({ error: 'Exactly 10 questions are required' });
      }
    }
    if (updates.timeLimit && updates.timeLimit !== 600) {
      updates.timeLimit = 600; // lock to 10 minutes
    }
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId.toString(),
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
      createdAt: quiz.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/quizzes/:id - Delete quiz (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
