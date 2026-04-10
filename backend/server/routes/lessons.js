import express from 'express';
import { Lesson, UserProgress, Enrollment } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getCache, setCache, deleteCache } from '../services/cacheService.js';
import { monitoringService } from '../services/monitoringService.js';
import { databaseOptimizer } from '../services/databaseOptimizerService.js';

const router = express.Router();

// Cache keys for different types of data
const CACHE_KEYS = {
  SUBJECTS_BY_GRADE: (grade, term) => `lessons:subjects:${grade}:${term || 'all'}`,
  LESSONS_BY_SUBJECT: (subjectId, grade, term) => `lessons:subject:${subjectId}:${grade}:${term || 'all'}`,
  LESSON_DETAIL: (lessonId) => `lessons:detail:${lessonId}`,
  LESSONS_BY_TOPIC: (topicId) => `lessons:topic:${topicId}`,
};

// GET /api/lessons/subjects-by-grade/:grade
router.get('/subjects-by-grade/:grade', requireAuth, async (req, res) => {
  try {
    const { grade } = req.params;
    const { term } = req.query;

    // Check Redis cache first
    const cacheKey = CACHE_KEYS.SUBJECTS_BY_GRADE(grade, term);
    const cached = await getCache(cacheKey);
    if (cached) {
      monitoringService.logCacheOperation('get', cacheKey, true);
      return res.json(cached);
    }
    monitoringService.logCacheOperation('get', cacheKey, false);

    // Build match query — use $ne:false so legacy lessons without the field still show
    const matchQuery = { grade, isPublished: { $ne: false } };
    if (term) matchQuery.term = term;

    // Use optimized query with database optimizer
    const subjectsWithCount = await databaseOptimizer.optimizeQuery(
      Lesson,
      Lesson.aggregate([
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
      ]),
      { lean: true, maxTimeMS: 10000 }
    );

    // Cache the result for 10 minutes
    await setCache(cacheKey, subjectsWithCount, 600);

    res.json(subjectsWithCount);
  } catch (error) {
    monitoringService.logDatabaseOperation('aggregate', 'lessons', 0, error);
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
      { $match: { grade, isPublished: { $ne: false } } },
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
    const { subject, grade, term, isPublished } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (term) query.term = term;
    if (isPublished !== undefined) {
      if (req.user?.userType === 'admin') {
        query.isPublished = isPublished === 'true';
      } else {
        query.isPublished = { $ne: false };
      }
    }
    // Non-admins only see published lessons.
    // Use $ne:false (not strict === true) so lessons created before the isPublished field
    // was added (which have isPublished: undefined) are treated as published.
    if (req.user?.userType !== 'admin' && isPublished === undefined) {
      query.isPublished = { $ne: false };
    }
    
    const lessons = await Lesson.find(query).sort({ grade: 1, term: 1, title: 1 });
    const isAdmin = req.user?.userType === 'admin';
    res.json(lessons.map(l => ({
      id: l._id.toString(),
      subject: l.subject,
      grade: l.grade,
      term: l.term,
      title: l.title,
      subtitle: l.subtitle,
      description: l.description,
      content: isAdmin ? l.content : undefined,
      videoUrl: isAdmin ? (l.videoUrl || null) : undefined,
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
      isPublished: l.isPublished ?? true,
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

    // Enforce enrollment gate for non-admin users
    if (req.user?.userType !== 'admin') {
      const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        subject: lesson.subject,
        grade: lesson.grade,
        term: lesson.term,
        isActive: true,
      });
      if (!enrollment) {
        return res.status(403).json({
          error: 'Access denied. Please purchase this course to view lesson content.',
          code: 'NOT_ENROLLED',
        });
      }
    }

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
      isPublished: lesson.isPublished ?? true,
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
      isPublished: lesson.isPublished ?? true,
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
      isPublished: lesson.isPublished ?? true,
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
// Cascading delete: removes lesson and all related student progress
router.delete('/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    
    // Delete all user progress records for this lesson
    const progressDeleteResult = await UserProgress.deleteMany({ lessonId });

    // Delete per-lesson enrollment records for this lesson so students no
    // longer see a ghost card for content that no longer exists
    await Enrollment.deleteMany({ lessonId });

    // Delete the lesson itself
    const lesson = await Lesson.findByIdAndDelete(lessonId);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Clear cache for this lesson's subject/grade
    const cachePattern = `subjects-${lesson.grade}-`;
    for (const [key] of cache) {
      if (key.startsWith(cachePattern)) {
        cache.delete(key);
      }
    }
    
    res.json({ 
      message: 'Lesson deleted successfully', 
      deletedProgressRecords: progressDeleteResult.deletedCount,
      lesson: { id: lesson._id, title: lesson.title, subject: lesson.subject }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
