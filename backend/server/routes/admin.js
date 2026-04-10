import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../middleware/auth.js';
import { User, SystemSettings, Student, CourseQuestion, ReferralTransaction, Newsletter, Ticket, Suggestion, Notification } from '../models/index.js';
import { Lesson, Quiz, UserProgress, Referral, Payment, ReferralProfile, Enrollment, Subject, Topic } from '../models/index.js';

const router = express.Router();

// Create a new admin user
// POST /api/admin/admins
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    const { email, password, fullName, userType, grade, age } = req.body || {};

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password and fullName are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashed,
      fullName,
      userType: userType || 'admin',
      isVerified: true, // Admin-created accounts are pre-verified — no email OTP needed
    });

    // Create Student record when userType is 'student'
    if (userType === 'student') {
      try {
        await Student.create({
          userId: user._id,
          fullName,
          grade: grade || '1',
          age: parseInt(age) || 10,
        });
      } catch (studentError) {
        console.error('[Admin Create User] Error creating student record:', studentError.message);
      }
    }

    return res.status(201).json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Create admin error:', err);
    return res.status(500).json({ error: 'Failed to create admin', message: err.message });
  }
});

// Update user (role, status)
// PATCH /api/admin/users/:id
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, status, fullName } = req.body;

    const updates = {};
    if (userType) updates.userType = userType;
    if (status) updates.status = status;
    if (fullName) updates.fullName = fullName;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      status: user.status,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Failed to update user', message: err.message });
  }
});

// Reset password
// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword required' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password', message: err.message });
  }
});

// Deactivate user (soft delete)
// POST /api/admin/users/:id/deactivate
router.post('/users/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: 'inactive' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deactivated', id: user._id.toString(), status: user.status });
  } catch (err) {
    console.error('Deactivate user error:', err);
    return res.status(500).json({ error: 'Failed to deactivate user', message: err.message });
  }
});

// Delete user (hard delete)
// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully', id });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user', message: err.message });
  }
});

// Get sales statistics
// GET /api/admin/sales-stats
router.get('/sales-stats', requireAdmin, async (req, res) => {
  try {
    const settings = await SystemSettings.getSingleton();
    
    if (!settings.salesStats) {
      return res.json({
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        lastSaleDate: null,
        monthlySales: 0,
        monthlyRevenue: 0,
        formattedTotalRevenue: '₦0',
        formattedMonthlyRevenue: '₦0',
      });
    }

    const stats = settings.salesStats;
    
    return res.json({
      totalSales: stats.totalSales || 0,
      totalRevenue: (stats.totalRevenue || 0) / 100, // Convert from kobo to naira
      totalItems: stats.totalItems || 0,
      lastSaleDate: stats.lastSaleDate,
      monthlySales: stats.monthlySales || 0,
      monthlyRevenue: (stats.monthlyRevenue || 0) / 100, // Convert from kobo to naira
      formattedTotalRevenue: `₦${((stats.totalRevenue || 0) / 100).toLocaleString()}`,
      formattedMonthlyRevenue: `₦${((stats.monthlyRevenue || 0) / 100).toLocaleString()}`,
      averageOrderValue: stats.totalSales > 0 
        ? ((stats.totalRevenue / stats.totalSales) / 100).toFixed(2)
        : 0,
    });
  } catch (err) {
    console.error('Get sales stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch sales statistics', message: err.message });
  }
});


// Get online users statistics
// GET /api/admin/online-users
router.get('/online-users', requireAdmin, async (req, res) => {
  try {
    // Get all online users
    const onlineUsers = await User.find({ isOnline: true })
      .select('email fullName userType lastActiveAt')
      .sort({ lastActiveAt: -1 });
    
    // Get statistics
    const totalUsers = await User.countDocuments();
    const onlineCount = onlineUsers.length;
    const offlineCount = totalUsers - onlineCount;
    
    // Get online users by type
    const studentCount = onlineUsers.filter(u => u.userType === 'student').length;
    const referralCount = onlineUsers.filter(u => u.userType === 'referral').length;
    const adminCount = onlineUsers.filter(u => u.userType === 'admin').length;
    
    return res.json({
      statistics: {
        totalUsers,
        onlineCount,
        offlineCount,
        onlinePercentage: totalUsers > 0 ? ((onlineCount / totalUsers) * 100).toFixed(1) : 0,
        byUserType: {
          students: studentCount,
          referrals: referralCount,
          admins: adminCount,
        }
      },
      onlineUsers: onlineUsers.map(user => ({
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        lastActiveAt: user.lastActiveAt,
        activeMinutesAgo: Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / 1000 / 60),
      })),
    });
  } catch (err) {
    console.error('Get online users error:', err);
    return res.status(500).json({ error: 'Failed to fetch online users', message: err.message });
  }
});


// GET /api/admin/sidebar-counts — live badge counts for the admin sidebar
router.get('/sidebar-counts', requireAdmin, async (req, res) => {
  try {
    const [questions, suggestions, tickets, users, referralPayouts, newsletter, notifications] = await Promise.all([
      CourseQuestion.countDocuments({ status: 'open' }),
      Suggestion.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: 'open' }),
      User.countDocuments({ isVerified: false, userType: { $ne: 'admin' } }),
      ReferralTransaction.countDocuments({ status: 'requested' }),
      Newsletter.countDocuments({
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Notification.countDocuments({ isActive: true }),
    ]);
    res.json({ questions, suggestions, tickets, users, referralPayouts, newsletter, notifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sidebar counts', message: error.message });
  }
});

// GET /api/admin/backup — export all data as a JSON backup
router.get('/backup', requireAdmin, async (req, res) => {
  try {
    const [
      users, students, lessons, quizzes, subjects, topics,
      enrollments, payments, referrals, referralProfiles,
      referralTransactions, progress, settings, tickets, suggestions, newsletter,
    ] = await Promise.all([
      User.find({}).select('-password').lean(),
      Student.find({}).lean(),
      Lesson.find({}).lean(),
      Quiz.find({}).lean(),
      Subject.find({}).lean(),
      Topic.find({}).lean(),
      Enrollment.find({}).lean(),
      Payment.find({}).lean(),
      Referral.find({}).lean(),
      ReferralProfile.find({}).lean(),
      ReferralTransaction.find({}).lean(),
      UserProgress.find({}).lean(),
      SystemSettings.find({}).lean(),
      Ticket.find({}).lean(),
      Suggestion.find({}).lean(),
      Newsletter.find({}).lean(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      collections: {
        users,
        students,
        lessons,
        quizzes,
        subjects,
        topics,
        enrollments,
        payments,
        referrals,
        referralProfiles,
        referralTransactions,
        progress,
        settings,
        tickets,
        suggestions,
        newsletter,
      },
      counts: {
        users: users.length,
        students: students.length,
        lessons: lessons.length,
        quizzes: quizzes.length,
        subjects: subjects.length,
        topics: topics.length,
        enrollments: enrollments.length,
        payments: payments.length,
        referrals: referrals.length,
        referralTransactions: referralTransactions.length,
        progress: progress.length,
      },
    };

    const filename = `mindsta-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (error) {
    console.error('[Admin Backup] Error:', error);
    res.status(500).json({ error: 'Failed to generate backup', message: error.message });
  }
});

export default router;
