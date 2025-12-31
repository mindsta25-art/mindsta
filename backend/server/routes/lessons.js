import express from 'express';
import { Lesson } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Simple in-memory cache with TTL (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// GET /api/lessons/subjects-by-grade/:grade
router.get('/subjects-by-grade/:grade', requireAuth, async (req, res) => {
  try {
    const { grade } = req.params;
    const { term } = req.query;
    
    // Check cache first
    const cacheKey = `subjects-${grade}-${term || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Build match query
    const matchQuery = { grade };
    if (term) matchQuery.term = term;
    
    // Use aggregation pipeline for optimal performance (single query instead of N+1)
    const subjectsWithCount = await Lesson.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$subject',
          lessonCount: { $sum: 1 },
          avgPrice: { $avg: { $ifNull: ['$price', 0] } },
          minPrice: { $min: { $ifNull: ['$price', 0] } },
          maxPrice: { $max: { $ifNull: ['$price', 0] } },
          avgRating: { $avg: { $ifNull: ['$rating', 0] } },
          totalRatingsCount: { $sum: { $ifNull: ['$ratingsCount', 0] } },
          totalEnrolled: { $sum: { $ifNull: ['$enrolledStudents', 0] } },
          totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
          difficulty: { $first: '$difficulty' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          lessonCount: 1,
          price: { $round: ['$avgPrice', 0] },
          rating: { $round: ['$avgRating', 1] },
          ratingsCount: '$totalRatingsCount',
          enrolledStudents: '$totalEnrolled',
          duration: '$totalDuration',
          difficulty: 1
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    // Cache the result
    setCache(cacheKey, subjectsWithCount);
    
    res.json(subjectsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons/terms-by-grade/:grade
router.get('/terms-by-grade/:grade', requireAuth, async (req, res) => {
  try {
    const { grade } = req.params;
    
    // Check cache first
    const cacheKey = `terms-${grade}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Use aggregation pipeline for optimal performance
    const termsWithCount = await Lesson.aggregate([
      { $match: { grade } },
      {
        $group: {
          _id: '$term',
          subjects: { $addToSet: '$subject' },
          lessonCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          subjectCount: { $size: '$subjects' },
          lessonCount: 1
        }
      }
    ]);
    
    // Sort by term order
    const termOrder = ['First Term', 'Second Term', 'Third Term'];
    termsWithCount.sort((a, b) => termOrder.indexOf(a.name) - termOrder.indexOf(b.name));
    
    // Cache the result
    setCache(cacheKey, termsWithCount);
    
    res.json(termsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons
router.get('/', requireAuth, async (req, res) => {
  try {
    const { subject, grade, term } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (term) query.term = term;
    
    const lessons = await Lesson.find(query).sort({ grade: 1, term: 1, title: 1 });
    res.json(lessons.map(l => ({
      id: l._id.toString(),
      subject: l.subject,
      grade: l.grade,
      term: l.term,
      title: l.title,
      subtitle: l.subtitle,
      description: l.description,
      content: l.content,
      videoUrl: l.videoUrl || null,
      imageUrl: l.imageUrl,
      difficulty: l.difficulty,
      order: l.order,
      duration: l.duration,
      keywords: l.keywords,
      learningObjectives: l.learningObjectives,
      whatYouWillLearn: l.whatYouWillLearn,
      requirements: l.requirements,
      targetAudience: l.targetAudience,
      curriculum: l.curriculum,
      price: l.price,
      rating: l.rating || 0,
      ratingsCount: l.ratingsCount || 0,
      enrolledStudents: l.enrolledStudents || 0,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({
      id: lesson._id.toString(),
      subject: lesson.subject,
      grade: lesson.grade,
      term: lesson.term,
      title: lesson.title,
      subtitle: lesson.subtitle,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl || null,
      imageUrl: lesson.imageUrl,
      difficulty: lesson.difficulty,
      order: lesson.order,
      duration: lesson.duration,
      keywords: lesson.keywords,
      learningObjectives: lesson.learningObjectives,
      whatYouWillLearn: lesson.whatYouWillLearn,
      requirements: lesson.requirements,
      targetAudience: lesson.targetAudience,
      curriculum: lesson.curriculum,
      price: lesson.price,
      rating: lesson.rating || 0,
      ratingsCount: lesson.ratingsCount || 0,
      enrolledStudents: lesson.enrolledStudents || 0,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lessons
router.post('/', async (req, res) => {
  try {
    console.log('Creating lesson with data:', JSON.stringify(req.body, null, 2));
    const lesson = await Lesson.create(req.body);
    res.status(201).json({
      id: lesson._id.toString(),
      subject: lesson.subject,
      grade: lesson.grade,
      term: lesson.term,
      title: lesson.title,
      subtitle: lesson.subtitle,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl || null,
      imageUrl: lesson.imageUrl,
      difficulty: lesson.difficulty,
      order: lesson.order,
      duration: lesson.duration,
      keywords: lesson.keywords,
      learningObjectives: lesson.learningObjectives,
      whatYouWillLearn: lesson.whatYouWillLearn,
      requirements: lesson.requirements,
      targetAudience: lesson.targetAudience,
      curriculum: lesson.curriculum,
      price: lesson.price,
      rating: lesson.rating || 0,
      ratingsCount: lesson.ratingsCount || 0,
      enrolledStudents: lesson.enrolledStudents || 0,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

// PUT /api/lessons/:id
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating lesson with data:', JSON.stringify(req.body, null, 2));
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({
      id: lesson._id.toString(),
      subject: lesson.subject,
      grade: lesson.grade,
      term: lesson.term,
      title: lesson.title,
      subtitle: lesson.subtitle,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl || null,
      imageUrl: lesson.imageUrl,
      difficulty: lesson.difficulty,
      order: lesson.order,
      duration: lesson.duration,
      keywords: lesson.keywords,
      learningObjectives: lesson.learningObjectives,
      whatYouWillLearn: lesson.whatYouWillLearn,
      requirements: lesson.requirements,
      targetAudience: lesson.targetAudience,
      curriculum: lesson.curriculum,
      price: lesson.price,
      rating: lesson.rating || 0,
      ratingsCount: lesson.ratingsCount || 0,
      enrolledStudents: lesson.enrolledStudents || 0,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

// DELETE /api/lessons/:id
router.delete('/:id', async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
