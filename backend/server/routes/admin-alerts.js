import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { AdminAlert } from '../models/index.js';

const router = express.Router();

// GET /api/admin-alerts — get recent alerts (latest 50), sorted newest first
router.get('/', requireAdmin, async (req, res) => {
  try {
    const alerts = await AdminAlert.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await AdminAlert.countDocuments({ read: false });
    res.json({ alerts, unreadCount });
  } catch (err) {
    console.error('[AdminAlerts] GET / error', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PUT /api/admin-alerts/:id/read — mark single alert as read
router.put('/:id/read', requireAdmin, async (req, res) => {
  try {
    await AdminAlert.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('[AdminAlerts] PUT /:id/read error', err);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// PUT /api/admin-alerts/read-all — mark all alerts as read
router.put('/read-all', requireAdmin, async (req, res) => {
  try {
    await AdminAlert.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('[AdminAlerts] PUT /read-all error', err);
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
});

// DELETE /api/admin-alerts/:id — delete single alert
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await AdminAlert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[AdminAlerts] DELETE /:id error', err);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;

// Helper to create an alert (call this from other routes)
export async function createAdminAlert({ type, title, message, metadata = {} }) {
  try {
    await AdminAlert.create({ type, title, message, metadata });
  } catch (err) {
    console.error('[AdminAlerts] createAdminAlert error', err);
  }
}
