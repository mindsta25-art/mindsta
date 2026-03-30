import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { SystemSettings } from '../models/index.js';

const router = express.Router();

const VALID_SECTIONS = new Set(['general', 'contact', 'notifications', 'security', 'appearance', 'advanced', 'quotes']);

// PUBLIC: GET /api/settings/public/contact - fetch contact settings (no auth required)
router.get('/public/contact', async (req, res) => {
  try {
    console.log('[Settings GET /public/contact] Public contact settings request');
    const settings = await SystemSettings.getSingleton();
    console.log('[Settings GET /public/contact] Returning contact data:', JSON.stringify(settings.contact, null, 2));
    res.json(settings.contact || {});
  } catch (err) {
    console.error('[Settings] GET /public/contact error', err);
    res.status(500).json({ error: 'Failed to fetch contact settings' });
  }
});

// PUBLIC: GET /api/settings/public/advanced - expose non-sensitive advanced settings
router.get('/public/advanced', async (req, res) => {
  try {
    const settings = await SystemSettings.getSingleton();
    const { lessonsPerPage, leaderboardPerPage, myLearningPerPage } = settings.advanced || {};
    res.json({
      lessonsPerPage: lessonsPerPage ?? 12,
      leaderboardPerPage: leaderboardPerPage ?? 10,
      myLearningPerPage: myLearningPerPage ?? 9,
    });
  } catch (err) {
    console.error('[Settings] GET /public/advanced error', err);
    res.status(500).json({ error: 'Failed to fetch public advanced settings' });
  }
});

// GET /api/settings - fetch full settings document
router.get('/', requireAdmin, async (req, res) => {
  try {
    console.log('[Settings GET /] Fetching all settings');
    const settings = await SystemSettings.getSingleton();
    console.log('[Settings GET /] Contact section:', JSON.stringify(settings.contact, null, 2));
    res.json(settings);
  } catch (err) {
    console.error('[Settings] GET / error', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/settings/:section - fetch a specific section
router.get('/:section', requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`[Settings GET /${section}] Received request`);
    
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({ error: 'Invalid settings section' });
    }
    const settings = await SystemSettings.getSingleton();
    console.log(`[Settings GET /${section}] Returning data:`, JSON.stringify(settings[section], null, 2));
    res.json(settings[section]);
  } catch (err) {
    console.error('[Settings] GET /:section error', err);
    res.status(500).json({ error: 'Failed to fetch settings section' });
  }
});

// PUT /api/settings/:section - update a specific section (partial merge)
router.put('/:section', requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`[Settings PUT /${section}] Received request`);
    
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({ error: 'Invalid settings section' });
    }

    const payload = req.body || {};
    console.log(`[Settings PUT /${section}] Payload:`, JSON.stringify(payload, null, 2));
    
    const settings = await SystemSettings.getSingleton();

    // Merge incoming payload into existing section
    const currentSection = settings[section] ? settings[section].toObject ? settings[section].toObject() : settings[section] : {};
    console.log(`[Settings PUT /${section}] Current section:`, JSON.stringify(currentSection, null, 2));
    
    const nextSection = { ...currentSection, ...payload };
    settings[section] = nextSection;
    settings.markModified(section);
    
    console.log(`[Settings PUT /${section}] About to save merged section:`, JSON.stringify(nextSection, null, 2));
    const saved = await settings.save();
    console.log(`[Settings PUT /${section}] Saved successfully! New ${section} data:`, JSON.stringify(saved[section], null, 2));
    res.json(saved);
  } catch (err) {
    console.error('[Settings] PUT /:section error', err);
    res.status(500).json({ error: 'Failed to update settings section' });
  }
});

export default router;
