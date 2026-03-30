import express from 'express';
import { Quiz } from '../models/index.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quizzes - Get all quizzes (admin or filtered by query params)
router.get('/', async (req, res) => {
  try {
    const { subject, grade, term } = req.query;
    const filter = {};
    
    // Allow filtering by subject, grade, and term
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (term) filter.term = term;
    
    const quizzes = await Quiz.find(filter).populate('lessonId', 'title subject grade term').sort({ createdAt: -1 });
    res.json(quizzes.map(quiz => ({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId?._id.toString(),
      lessonTitle: quiz.lessonId?.title,
      lessonSubject: quiz.lessonId?.subject || quiz.subject,
      lessonGrade: quiz.lessonId?.grade || quiz.grade,
      lessonTerm: quiz.lessonId?.term || quiz.term,
      subject: quiz.subject,
      grade: quiz.grade,
      term: quiz.term,
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
    if (!quiz) return res.status(200).json(null);
    
    res.json({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId.toString(),
      subject: quiz.subject,
      grade: quiz.grade,
      term: quiz.term,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,        imageUrl: q.imageUrl || null,        imageUrl: q.imageUrl || null,
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
      subject: quiz.subject,
      grade: quiz.grade,
      term: quiz.term,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        imageUrl: q.imageUrl || null,
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

    // If lessonId is provided, populate subject, grade, and term from the lesson
    if (payload.lessonId) {
      const { Lesson } = await import('../models/index.js');
      const lesson = await Lesson.findById(payload.lessonId);
      if (lesson) {
        payload.subject = payload.subject || lesson.subject;
        payload.grade = payload.grade || lesson.grade;
        payload.term = payload.term || lesson.term;
      }
    }

    // Enforce one quiz per lesson — reject if a quiz already exists for this lesson
    const existingQuiz = await Quiz.findOne({ lessonId: payload.lessonId });
    if (existingQuiz) {
      return res.status(409).json({
        error: 'A quiz already exists for this lesson. Please edit the existing quiz instead.',
        existingQuizId: existingQuiz._id.toString(),
      });
    }

    const quiz = await Quiz.create(payload);
    res.status(201).json({
      id: quiz._id.toString(),
      lessonId: quiz.lessonId.toString(),
      subject: quiz.subject,
      grade: quiz.grade,
      term: quiz.term,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        imageUrl: q.imageUrl || null,
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
      subject: quiz.subject,
      grade: quiz.grade,
      term: quiz.term,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        imageUrl: q.imageUrl || null,
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
