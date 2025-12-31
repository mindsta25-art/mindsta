import express from 'express';
import Notification from '../models/Notification.js';
import Student from '../models/Student.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for the current user (student)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get student to find their grade
    const student = await Student.findOne({ userId });
    // Convert grade to number for comparison (1-6, or 7 for Common Entrance)
    let userGrade = null;
    if (student?.grade) {
      const gradeStr = student.grade.toLowerCase();
      if (gradeStr.includes('common') || gradeStr.includes('entrance')) {
        userGrade = 7;
      } else {
        // Extract number from strings like "Grade 1", "1", etc.
        const gradeNum = parseInt(student.grade);
        if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 6) {
          userGrade = gradeNum;
        }
      }
    }
    
    const notifications = await Notification.getActiveForUser(userId, userGrade);
    
    // Add isRead flag for each notification
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy?.some(read => read.userId.toString() === userId.toString()) || false,
    }));
    
    res.json(notificationsWithReadStatus);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const student = await Student.findOne({ userId });
    // Convert grade to number for comparison (1-6, or 7 for Common Entrance)
    let userGrade = null;
    if (student?.grade) {
      const gradeStr = student.grade.toLowerCase();
      if (gradeStr.includes('common') || gradeStr.includes('entrance')) {
        userGrade = 7;
      } else {
        const gradeNum = parseInt(student.grade);
        if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 6) {
          userGrade = gradeNum;
        }
      }
    }
    
    const unreadNotifications = await Notification.getUnreadForUser(userId, userGrade);
    
    res.json({ count: unreadNotifications.length });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const notification = await Notification.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const student = await Student.findOne({ userId });
    // Convert grade to number for comparison (1-6, or 7 for Common Entrance)
    let userGrade = null;
    if (student?.grade) {
      const gradeStr = student.grade.toLowerCase();
      if (gradeStr.includes('common') || gradeStr.includes('entrance')) {
        userGrade = 7;
      } else {
        const gradeNum = parseInt(student.grade);
        if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 6) {
          userGrade = gradeNum;
        }
      }
    }
    
    const unreadNotifications = await Notification.getUnreadForUser(userId, userGrade);
    
    await Promise.all(
      unreadNotifications.map(notification => 
        Notification.markAsRead(notification._id, userId)
      )
    );
    
    res.json({ message: 'All notifications marked as read', count: unreadNotifications.length });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// ===== ADMIN ROUTES =====

// Get all notifications (admin only)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, type } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (type) query.type = type;
    
    const notifications = await Notification.find(query)
      .populate('createdBy', 'username email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await Notification.countDocuments(query);
    
    res.json({
      notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Create a new notification (admin only)
router.post('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      targetAudience,
      targetGrades,
      targetUsers,
      expiresAt,
      metadata,
    } = req.body;

    console.log('[Notifications] Creating notification:', {
      title,
      message,
      type,
      priority,
      targetAudience,
      targetGrades,
      targetUsers,
      expiresAt,
      createdBy: req.user.id
    });

    // Validation
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (!targetGrades || targetGrades.length === 0) {
      return res.status(400).json({ message: 'Please select at least one grade' });
    }
    
    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      targetAudience: 'grade-specific',
      targetGrades: targetGrades || [],
      targetUsers: targetUsers || [],
      createdBy: req.user.id,
      expiresAt: expiresAt || null,
      metadata: metadata || {},
      isActive: true,
    });
    
    await notification.save();
    
    console.log('[Notifications] Notification created successfully:', notification._id);
    
    res.status(201).json({ 
      message: 'Notification created successfully', 
      notification 
    });
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    console.error('[Notifications] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to create notification',
      error: error.message 
    });
  }
});

// Update a notification (admin only)
router.put('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const updates = req.body;

    console.log('[Notifications] Updating notification:', notificationId, updates);

    // Validation
    if (!updates.targetGrades || updates.targetGrades.length === 0) {
      return res.status(400).json({ message: 'Please select at least one grade' });
    }

    // Ensure targetAudience is grade-specific
    updates.targetAudience = 'grade-specific';
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log('[Notifications] Notification updated successfully:', notification._id);
    
    res.json({ message: 'Notification updated successfully', notification });
  } catch (error) {
    console.error('[Notifications] Error updating notification:', error);
    console.error('[Notifications] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to update notification',
      error: error.message 
    });
  }
});

// Delete a notification (admin only)
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Toggle notification active status (admin only)
router.patch('/admin/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.isActive = !notification.isActive;
    await notification.save();
    
    res.json({ 
      message: `Notification ${notification.isActive ? 'activated' : 'deactivated'}`, 
      notification 
    });
  } catch (error) {
    console.error('Error toggling notification status:', error);
    res.status(500).json({ message: 'Failed to toggle notification status' });
  }
});

// Get notification statistics (admin only)
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const activeNotifications = await Notification.countDocuments({ isActive: true });
    const expiredNotifications = await Notification.countDocuments({ 
      expiresAt: { $lt: new Date() },
      isActive: true 
    });
    
    const notificationsByType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const notificationsByPriority = await Notification.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    res.json({
      total: totalNotifications,
      active: activeNotifications,
      expired: expiredNotifications,
      inactive: totalNotifications - activeNotifications,
      byType: notificationsByType,
      byPriority: notificationsByPriority,
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Failed to fetch notification stats' });
  }
});

export default router;
