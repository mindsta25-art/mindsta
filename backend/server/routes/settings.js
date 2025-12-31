import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { SystemSettings } from '../models/index.js';

const router = express.Router();

const VALID_SECTIONS = new Set(['general', 'notifications', 'security', 'appearance', 'advanced']);

// GET /api/settings - fetch full settings document
router.get('/', requireAdmin, async (req, res) => {
  try {
    const settings = await SystemSettings.getSingleton();
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
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({ error: 'Invalid settings section' });
    }
    const settings = await SystemSettings.getSingleton();
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
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({ error: 'Invalid settings section' });
    }

    const payload = req.body || {};
    const settings = await SystemSettings.getSingleton();

    // Merge incoming payload into existing section
    const currentSection = settings[section] ? settings[section].toObject ? settings[section].toObject() : settings[section] : {};
    const nextSection = { ...currentSection, ...payload };
    settings[section] = nextSection;
    settings.markModified(section);
    const saved = await settings.save();
    res.json(saved);
  } catch (err) {
    console.error('[Settings] PUT /:section error', err);
    res.status(500).json({ error: 'Failed to update settings section' });
  }
});

export default router;
