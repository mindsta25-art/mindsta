import express from 'express';
import CommonEntrance from '../models/CommonEntrance.js';
import Enrollment from '../models/Enrollment.js';
import { requireAdmin, requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ─── Helper ──────────────────────────────────────────────────────────────────
const formatExam = (exam, includeAnswers = false) => ({
  id: exam._id.toString(),
  title: exam.title,
  subtitle: exam.subtitle || '',
  description: exam.description,
  overview: exam.overview || '',
  subject: exam.subject,
  imageUrl: exam.imageUrl || null,
  imageDisplaySize: exam.imageDisplaySize || 'full',
  imageObjectFit: exam.imageObjectFit || 'cover',
  price: exam.price ?? 0,
  passingScore: exam.passingScore,
  timeLimit: exam.timeLimit,
  isPublished: exam.isPublished,
  questionCount: exam.questions?.length ?? 0,
  enrolledStudents: exam.enrolledStudents,
  rating: exam.rating,
  ratingsCount: exam.ratingsCount,
  createdAt: exam.createdAt.toISOString(),
  updatedAt: exam.updatedAt.toISOString(),
  ...(includeAnswers && {
    questions: exam.questions.map((q) => ({
      id: q._id.toString(),
      question: q.question,
      imageUrl: q.imageUrl || null,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })),
  }),
});

// ─── GET /api/common-entrance ─────────────────────────────────────────────────
// Public: list published exams. Admin: list all.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user?.userType === 'admin';
    const filter = isAdmin ? {} : { isPublished: true };
    const { subject } = req.query;
    if (subject) filter.subject = subject;

    // Use aggregation to compute questionCount without loading full question data
    const exams = await CommonEntrance.aggregate([
      { $match: filter },
      {
        $addFields: {
          _qCount: { $size: { $ifNull: ['$questions', []] } },
        },
      },
      { $project: { questions: 0 } },
      { $sort: { createdAt: -1 } },
    ]);

    // For admin, compute live enrollment counts from Enrollment collection
    let ceCountMap = {};
    if (isAdmin) {
      try {
        const ceCounts = await Enrollment.aggregate([
          { $match: { isActive: true, commonEntranceId: { $ne: null } } },
          { $group: { _id: '$commonEntranceId', count: { $sum: 1 } } },
        ]);
        ceCountMap = Object.fromEntries(ceCounts.map(c => [c._id.toString(), c.count]));
      } catch (countErr) {
        console.error('[CE live count error]', countErr.message);
      }
    }

    res.json(
      exams.map((e) => ({
        ...formatExam({ ...e, questions: [] }, false),
        questionCount: e._qCount,
        ...(isAdmin && { enrolledStudents: ceCountMap[e._id.toString()] ?? e.enrolledStudents ?? 0 }),
      }))
    );
  } catch (error) {
    console.error('[GET /common-entrance]', error);
    res.status(500).json({ error: 'Failed to fetch common entrance exams.' });
  }
});

// ─── GET /api/common-entrance/:id ────────────────────────────────────────────
// Authenticated students get questions WITHOUT answers.
// Admin gets everything including correctAnswer.
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user?.userType === 'admin';
    const exam = await CommonEntrance.findById(req.params.id).lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    if (!exam.isPublished && !isAdmin) return res.status(403).json({ error: 'Exam not available.' });

    if (isAdmin) return res.json(formatExam(exam, true));

    // For students: send questions without correct answers
    const studentView = {
      ...formatExam(exam, false),
      questions: exam.questions.map((q) => ({
        id: q._id.toString(),
        question: q.question,
        imageUrl: q.imageUrl || null,
        options: q.options,
        // correctAnswer and explanation intentionally omitted
      })),
    };
    res.json(studentView);
  } catch (error) {
    console.error('[GET /common-entrance/:id]', error);
    res.status(500).json({ error: 'Failed to fetch exam.' });
  }
});

// ─── GET /api/common-entrance/:id/submit ─────────────────────────────────────
// Students POST their answers here and receive score + explanations.
router.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const exam = await CommonEntrance.findById(req.params.id).lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    if (!exam.isPublished) return res.status(403).json({ error: 'Exam not available.' });

    const { answers } = req.body; // array of numbers (selected option index per question)
    if (!Array.isArray(answers) || answers.length !== exam.questions.length) {
      return res.status(400).json({ error: `Expected ${exam.questions.length} answers.` });
    }

    let correct = 0;
    const results = exam.questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        questionId: q._id.toString(),
        selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correct / exam.questions.length) * 100);
    const passed = score >= exam.passingScore;

    res.json({ score, passed, correct, total: exam.questions.length, results });
  } catch (error) {
    console.error('[POST /common-entrance/:id/submit]', error);
    res.status(500).json({ error: 'Failed to submit exam.' });
  }
});

// ─── POST /api/common-entrance (admin) ───────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, description, overview, subject, imageUrl, imageDisplaySize, imageObjectFit, price, questions, passingScore, timeLimit, isPublished } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });
    if (!subject?.trim()) return res.status(400).json({ error: 'Subject is required.' });

    const isDraft = isPublished === false;
    const qs = Array.isArray(questions) ? questions : [];

    // Published exams must have exactly 50 complete questions
    if (!isDraft) {
      if (qs.length !== 50)
        return res.status(400).json({ error: 'Exactly 50 questions are required to publish.' });
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        if (!q.question?.trim()) return res.status(400).json({ error: `Question ${i + 1} text is required.` });
        if (!Array.isArray(q.options) || q.options.length !== 4)
          return res.status(400).json({ error: `Question ${i + 1} must have exactly 4 options.` });
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3)
          return res.status(400).json({ error: `Question ${i + 1} must have a valid correct answer (0-3).` });
      }
    }

    const exam = await CommonEntrance.create({
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      description: description?.trim() || '',
      overview: overview?.trim() || '',
      subject: subject.trim(),
      imageUrl: imageUrl || null,
      imageDisplaySize: imageDisplaySize || 'full',
      imageObjectFit: imageObjectFit || 'cover',
      price: price ?? 0,
      questions: qs,
      passingScore: passingScore ?? 90,
      timeLimit: timeLimit ?? 3000,
      isPublished: isPublished ?? false,
    });

    res.status(201).json(formatExam(exam.toObject(), true));
  } catch (error) {
    console.error('[POST /common-entrance]', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(error.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create exam.' });
  }
});

// ─── PUT /api/common-entrance/:id (admin) ────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await CommonEntrance.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });

    const { title, subtitle, description, overview, subject, imageUrl, imageDisplaySize, imageObjectFit, price, questions, passingScore, timeLimit, isPublished } = req.body;

    // Validate question completeness for publishing
    if (isPublished === true && Array.isArray(questions) && questions.length !== 50) {
      return res.status(400).json({ error: 'Exactly 50 questions are required to publish.' });
    }

    if (title !== undefined) exam.title = title.trim();
    if (subtitle !== undefined) exam.subtitle = subtitle.trim();
    if (description !== undefined) exam.description = description.trim();
    if (overview !== undefined) exam.overview = overview.trim();
    if (subject !== undefined) exam.subject = subject.trim();
    if (imageUrl !== undefined) exam.imageUrl = imageUrl || null;
    if (imageDisplaySize !== undefined) exam.imageDisplaySize = imageDisplaySize;
    if (imageObjectFit !== undefined) exam.imageObjectFit = imageObjectFit;
    if (price !== undefined) exam.price = price;
    if (questions !== undefined) exam.questions = questions;
    if (passingScore !== undefined) exam.passingScore = passingScore;
    if (timeLimit !== undefined) exam.timeLimit = timeLimit;
    if (isPublished !== undefined) exam.isPublished = isPublished;

    await exam.save();
    res.json(formatExam(exam.toObject(), true));
  } catch (error) {
    console.error('[PUT /common-entrance/:id]', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(error.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update exam.' });
  }
});

// ─── DELETE /api/common-entrance/:id (admin) ─────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await CommonEntrance.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    res.json({ message: 'Exam deleted successfully.' });
  } catch (error) {
    console.error('[DELETE /common-entrance/:id]', error);
    res.status(500).json({ error: 'Failed to delete exam.' });
  }
});

// ─── PATCH /api/common-entrance/:id/publish (admin) ──────────────────────────
router.patch('/:id/publish', requireAdmin, async (req, res) => {
  try {
    const exam = await CommonEntrance.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    // Prevent publishing if fewer than 50 questions
    if (!exam.isPublished && exam.questions.length !== 50) {
      return res.status(400).json({ error: `Cannot publish: exam needs exactly 50 questions (has ${exam.questions.length}).` });
    }
    exam.isPublished = !exam.isPublished;
    await exam.save();
    res.json({ id: exam._id.toString(), isPublished: exam.isPublished });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle publish status.' });
  }
});

export default router;
