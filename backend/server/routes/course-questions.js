import express from 'express';
import { CourseQuestion } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/course-questions
 * Get questions for a specific course
 */
router.get('/', async (req, res) => {
  try {
    const { subject, grade, term, lessonId } = req.query;

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    const query = { subject, grade };
    if (term) query.term = term;
    if (lessonId) query.lessonId = lessonId;

    const questions = await CourseQuestion.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(questions);
  } catch (error) {
    console.error('Error fetching course questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * GET /api/course-questions/all
 * Get all questions (admin only)
 */
router.get('/all', requireAuth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const questions = await CourseQuestion.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(questions);
  } catch (error) {
    console.error('Error fetching all questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * GET /api/course-questions/:id
 * Get a specific question
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await CourseQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Increment views
    question.views += 1;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

/**
 * POST /api/course-questions
 * Create a new question
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, grade, term, lessonId, lessonTitle, question } = req.body;
    const userId = req.user.id;

    if (!subject || !grade || !question) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newQuestion = new CourseQuestion({
      userId,
      studentName: req.user.fullName || req.user.email,
      subject,
      grade,
      term,
      lessonId,
      lessonTitle,
      question,
      answers: [],
      upvotes: 0,
      views: 0,
      status: 'open'
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * POST /api/course-questions/:id/answers
 * Add an answer to a question
 */
router.post('/:id/answers', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;

    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const question = await CourseQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const newAnswer = {
      userId,
      userName: req.user.fullName || req.user.email,
      isInstructor: req.user.userType === 'admin',
      answer,
      upvotes: 0,
      isAccepted: false
    };

    question.answers.push(newAnswer);
    
    // Update status if first answer
    if (question.answers.length === 1) {
      question.status = 'answered';
    }

    await question.save();
    res.json(question);
  } catch (error) {
    console.error('Error adding answer:', error);
    res.status(500).json({ error: 'Failed to add answer' });
  }
});

/**
 * POST /api/course-questions/:questionId/answers/:answerId/accept
 * Accept an answer as the best answer
 */
router.post('/:questionId/answers/:answerId/accept', requireAuth, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const userId = req.user.id;

    const question = await CourseQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Only question owner can accept an answer
    if (question.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Only the question owner can accept an answer' });
    }

    // Reset all answers to not accepted
    question.answers.forEach(ans => {
      ans.isAccepted = false;
    });

    // Find and accept the specified answer
    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    answer.isAccepted = true;
    question.status = 'answered';

    await question.save();
    res.json(question);
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
});

/**
 * POST /api/course-questions/:id/upvote
 * Upvote a question
 */
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const question = await CourseQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.upvotes += 1;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Error upvoting question:', error);
    res.status(500).json({ error: 'Failed to upvote question' });
  }
});

/**
 * POST /api/course-questions/:questionId/answers/:answerId/upvote
 * Upvote an answer
 */
router.post('/:questionId/answers/:answerId/upvote', requireAuth, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    const question = await CourseQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    answer.upvotes += 1;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Error upvoting answer:', error);
    res.status(500).json({ error: 'Failed to upvote answer' });
  }
});

/**
 * DELETE /api/course-questions/:id
 * Delete a question
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const question = await CourseQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Allow user to delete their own question or admin to delete any
    if (question.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    await CourseQuestion.findByIdAndDelete(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

/**
 * DELETE /api/course-questions/:questionId/answers/:answerId
 * Delete an answer
 */
router.delete('/:questionId/answers/:answerId', requireAuth, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const userId = req.user.id;

    const question = await CourseQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Allow user to delete their own answer or admin to delete any
    if (answer.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this answer' });
    }

    question.answers.pull(answerId);
    
    // Update status if no more answers
    if (question.answers.length === 0) {
      question.status = 'open';
    }

    await question.save();
    res.json(question);
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

/**
 * GET /api/course-questions/user/my-questions
 * Get current user's questions
 */
router.get('/user/my-questions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await CourseQuestion.find({ userId }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching user questions:', error);
    res.status(500).json({ error: 'Failed to fetch user questions' });
  }
});

export default router;
