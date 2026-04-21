import express from 'express';
import { Lesson, UserProgress, Enrollment } from '../models/index.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { getCache, setCache, deleteCache } from '../services/cacheService.js';
import { monitoringService } from '../services/monitoringService.js';
import { databaseOptimizer } from '../services/databaseOptimizerService.js';

const router = express.Router();

// Process-level in-memory cache — works regardless of Redis availability.
// Keyed by cache key, value is { data, expiresAt }.
const _memCache = new Map();
const _memGet = (key) => {
  const entry = _memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _memCache.delete(key); return null; }
  return entry.data;
};
const _memSet = (key, data, ttlSeconds) => {
  _memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  // Cap at 500 entries to prevent unbounded memory growth
  if (_memCache.size > 500) _memCache.delete(_memCache.keys().next().value);
};

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

    // Check Redis / in-memory cache first
    const cacheKey = CACHE_KEYS.SUBJECTS_BY_GRADE(grade, term);
    const cached = (await getCache(cacheKey)) ?? _memGet(cacheKey);
    if (cached) {
      monitoringService.logCacheOperation('get', cacheKey, true);
      return res.json(cached);
    }
    monitoringService.logCacheOperation('get', cacheKey, false);

    // Build match query — use $ne:false so legacy lessons without the field still show
    const matchQuery = { grade, isPublished: { $ne: false } };
    if (term) matchQuery.term = term;

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

    // Cache the result for 10 minutes
    await setCache(cacheKey, subjectsWithCount, 600);
    _memSet(cacheKey, subjectsWithCount, 600);
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
    const cached = (await getCache(cacheKey)) ?? _memGet(cacheKey);
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
    await setCache(cacheKey, termsWithCount);
    _memSet(cacheKey, termsWithCount, 300);
    res.json(termsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons/search?q=<text>&grade=<g>&limit=<n>
// Lightweight server-side text search — used by the header search box and search page.
// Returns only the fields needed to render search suggestions (no content/videoUrl).
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q = '', grade, subject, limit = 20 } = req.query;
    const maxLimit = Math.min(Number(limit), 100);
    const match = { isPublished: { $ne: false } };
    if (grade) match.grade = grade;
    if (subject) match.subject = subject;
    if (q.trim()) {
      match.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { subject: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { keywords: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    const lessons = await Lesson.find(match)
      .select('_id title subject grade term imageUrl difficulty price rating ratingsCount enrolledStudents duration')
      .limit(maxLimit)
      .sort({ enrolledStudents: -1, rating: -1 })
      .lean();
    res.json(lessons.map(l => ({
      id: l._id.toString(),
      title: l.title,
      subject: l.subject,
      grade: l.grade,
      term: l.term,
      imageUrl: l.imageUrl,
      difficulty: l.difficulty,
      price: l.price,
      rating: l.rating || 0,
      ratingsCount: l.ratingsCount || 0,
      enrolledStudents: l.enrolledStudents || 0,
      duration: l.duration,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons
// SECURITY: Admin gets all lessons; students can browse published lessons.
// Detailed lesson content is still gated by enrollment on /api/lessons/:id.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { subject, grade, term, isPublished, enrolledOnly, purchasedOnly } = req.query;
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

    const fetchEnrolledOnly = enrolledOnly === 'true' || purchasedOnly === 'true';
    const isAdmin = req.user?.userType === 'admin';

    // Cache non-personalised student browse queries (no enrolledOnly filter) for 5 minutes
    const isCacheable = !isAdmin && !fetchEnrolledOnly;
    const cacheKey = isCacheable
      ? `lessons:list:${grade || 'all'}:${subject || 'all'}:${term || 'all'}`
      : null;

    if (cacheKey) {
      const cached = (await getCache(cacheKey)) ?? _memGet(cacheKey);
      if (cached) return res.json(cached);
    }

    let lessons;

    if (req.user?.userType !== 'admin' && fetchEnrolledOnly) {
      // Only fetch enrolled lessons — avoids loading the entire lesson collection
      const studentEnrollments = await Enrollment.find({ userId: req.user.id, isActive: true }).lean();
      if (studentEnrollments.length === 0) {
        return res.json([]);
      }
      const lessonIdEnrollments = studentEnrollments.filter(e => e.lessonId);
      const subjectEnrollments  = studentEnrollments.filter(e => !e.lessonId);

      const orClauses = [];
      if (lessonIdEnrollments.length > 0) {
        orClauses.push({ _id: { $in: lessonIdEnrollments.map(e => e.lessonId) } });
      }
      for (const e of subjectEnrollments) {
        const clause = { subject: e.subject, grade: e.grade };
        if (e.term) clause.term = e.term;
        orClauses.push(clause);
      }
      if (orClauses.length === 0) return res.json([]);
      query.$or = orClauses;
      lessons = await Lesson.find(query).sort({ grade: 1, term: 1, title: 1 }).lean();
    } else {
      lessons = await Lesson.find(query).sort({ grade: 1, term: 1, title: 1 }).lean();
    }

    const responseData = lessons.map(l => ({
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
    }));

    if (cacheKey) {
      await setCache(cacheKey, responseData, 300);
      _memSet(cacheKey, responseData, 300);
    }
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons/:id/preview
// Public preview metadata: show lesson title/summary without full content
router.get('/:id/preview', optionalAuth, async (req, res) => {
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
      imageUrl: lesson.imageUrl,
      difficulty: lesson.difficulty,
      order: lesson.order,
      duration: lesson.duration,
      price: lesson.price,
      isPublished: lesson.isPublished ?? true,
      rating: lesson.rating || 0,
      ratingsCount: lesson.ratingsCount || 0,
      enrolledStudents: lesson.enrolledStudents || 0,
      learningObjectives: lesson.learningObjectives,
      whatYouWillLearn: lesson.whatYouWillLearn,
      requirements: lesson.requirements,
      targetAudience: lesson.targetAudience,
      curriculum: (lesson.curriculum || []).map(section => ({
        title: section.title,
        description: section.description,
        order: section.order,
        lectures: (section.lectures || []).map(lecture => ({
          title: lecture.title,
          type: lecture.type,
          duration: lecture.duration,
          order: lecture.order,
        })),
      })),
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons/:id
// SECURITY: Enforce enrollment check - students can only access lessons they purchased
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Enforce enrollment gate for non-admin users
    if (req.user?.userType !== 'admin') {
      const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        isActive: true,
        $or: [
          { lessonId: lesson._id },
          {
            subject: lesson.subject,
            grade: lesson.grade,
            term: lesson.term,
            $or: [
              { lessonId: { $exists: false } },
              { lessonId: null }
            ]
          }
        ]
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
    
    // Clear cache for this lesson's subject/grade/term combinations
    await deleteCache(`lessons:subjects:${lesson.grade}:${lesson.term}`);
    await deleteCache(`lessons:subjects:${lesson.grade}:all`);
    await deleteCache(`lessons:subject:${lesson.subject}:${lesson.grade}:${lesson.term}`);
    await deleteCache(`lessons:subject:${lesson.subject}:${lesson.grade}:all`);
    
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
