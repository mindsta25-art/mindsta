import express from 'express';
import Topic from '../models/Topic.js';
import { Lesson } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/topics - Get all topics with filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    const { subject, grade, term, isPublished } = req.query;
    
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (term) query.term = term;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    // Only show active and published topics to students
    if (!req.user?.role || req.user.role === 'student') {
      query.isActive = true;
      query.isPublished = true;
    }
    
    const topics = await Topic.find(query)
      .populate('lessons', 'title description duration difficulty')
      .sort({ order: 1, createdAt: -1 });
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/topics/filters - Get available filter options
router.get('/filters', requireAuth, async (req, res) => {
  try {
    const query = {};
    
    // Only filter for published topics if user is a student
    if (!req.user?.role || req.user.role === 'student') {
      query.isActive = true;
      query.isPublished = true;
    }
    
    // Get unique values for filters
    const [grades, terms, subjects] = await Promise.all([
      Topic.distinct('grade', query),
      Topic.distinct('term', query),
      Topic.distinct('subject', query),
    ]);
    
    // Sort terms in order
    const termOrder = ['First Term', 'Second Term', 'Third Term'];
    const sortedTerms = terms.sort((a, b) => 
      termOrder.indexOf(a) - termOrder.indexOf(b)
    );
    
    res.json({
      grades: grades.sort(),
      terms: sortedTerms,
      subjects: subjects.sort(),
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/topics/:id - Get single topic by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('lessons');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/topics/slug/:slug - Get topic by slug
router.get('/slug/:slug', requireAuth, async (req, res) => {
  try {
    const topic = await Topic.findOne({ slug: req.params.slug })
      .populate('lessons');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/topics - Create new topic (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const topicData = req.body;
    const topic = new Topic(topicData);
    await topic.save();
    
    res.status(201).json(topic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/topics/:id - Update topic (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/topics/:id - Delete topic (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const topic = await Topic.findByIdAndDelete(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/topics/:id/lessons - Add lessons to topic (admin only)
router.post('/:id/lessons', requireAuth, async (req, res) => {
  try {
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { lessonIds } = req.body;
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Add lessons that aren't already in the topic
    const newLessonIds = lessonIds.filter(id => !topic.lessons.includes(id));
    topic.lessons.push(...newLessonIds);
    
    await topic.save();
    await topic.populate('lessons');
    
    res.json(topic);
  } catch (error) {
    console.error('Error adding lessons to topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/topics/:id/lessons/:lessonId - Remove lesson from topic (admin only)
router.delete('/:id/lessons/:lessonId', requireAuth, async (req, res) => {
  try {
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const topic = await Topic.findById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    topic.lessons = topic.lessons.filter(
      lessonId => lessonId.toString() !== req.params.lessonId
    );
    
    await topic.save();
    await topic.populate('lessons');
    
    res.json(topic);
  } catch (error) {
    console.error('Error removing lesson from topic:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
