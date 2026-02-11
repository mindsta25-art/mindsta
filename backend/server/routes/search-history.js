import express from 'express';
import { SearchHistory } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/search-history - Record a search
router.post('/', requireAuth, async (req, res) => {
  try {
    const { query, filters } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const userId = req.user.id;
    const searchRecord = await SearchHistory.recordSearch(userId, query, filters);

    res.status(201).json({
      id: searchRecord._id.toString(),
      query: searchRecord.query,
      searchCount: searchRecord.searchCount,
    });
  } catch (error) {
    console.error('Error recording search:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search-history - Get user's search history
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const searches = await SearchHistory.getUserSearchKeywords(userId, limit);

    res.json(searches.map(s => ({
      id: s._id.toString(),
      query: s.query,
      searchCount: s.searchCount,
      lastSearchedAt: s.lastSearchedAt,
    })));
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search-history/keywords - Get unique search keywords for recommendations
router.get('/keywords', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const searches = await SearchHistory.getUserSearchKeywords(userId, 100);

    // Extract unique keywords from search queries
    const keywords = new Set();
    searches.forEach(search => {
      // Split query into words and add to keywords
      const words = search.normalizedQuery.split(/\s+/).filter(w => w.length > 2);
      words.forEach(word => keywords.add(word));
    });

    res.json({
      keywords: Array.from(keywords),
      recentSearches: searches.slice(0, 10).map(s => s.query),
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/search-history/:id/click - Record that user clicked on a search result
router.put('/:id/click', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, grade, term } = req.body;

    const searchRecord = await SearchHistory.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!searchRecord) {
      return res.status(404).json({ error: 'Search record not found' });
    }

    searchRecord.resultClicked = true;
    searchRecord.clickedCourse = { subject, grade, term };
    await searchRecord.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating search click:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search-history/popular - Get popular searches (optional, for suggestions)
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const popular = await SearchHistory.getPopularSearches(limit);

    res.json(popular.map(p => ({
      query: p.query,
      totalSearches: p.totalSearches,
      userCount: p.userCount,
    })));
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/search-history - Clear user's search history
router.delete('/', requireAuth, async (req, res) => {
  try {
    await SearchHistory.deleteMany({ userId: req.user.id });
    res.json({ message: 'Search history cleared successfully' });
  } catch (error) {
    console.error('Error clearing search history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
