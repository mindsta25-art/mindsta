/**
 * Reports Routes
 * Handles report generation and export
 */

import express from 'express';
import { Student, Lesson, Quiz, UserProgress, User, Payment, Referral, ReferralTransaction } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/reports/student-progress
 * Generate student progress report
 */
router.get('/student-progress', requireAdmin, async (req, res) => {
  try {
    const { period = 'month', grade, format = 'json' } = req.query;
    
    // Calculate date range
    const dateFilter = getDateFilter(period);
    
    // Build query
    const query = {};
    if (dateFilter) {
      query.createdAt = dateFilter;
    }
    
    // Get all students
    const students = await Student.find(query).populate('userId', 'email fullName');
    
    // Get progress for each student
    const progressPromises = students.map(async (student) => {
      const progress = await UserProgress.find({ userId: student.userId?._id });
      const completedLessons = progress.filter(p => p.completed).length;
      const totalLessons = progress.length;
      const quizScores = progress.filter(p => p.quizScore !== null && p.quizScore !== undefined);
      const avgQuizScore = quizScores.length > 0
        ? quizScores.reduce((sum, p) => sum + p.quizScore, 0) / quizScores.length
        : 0;
      
      return {
        studentId: student._id,
        name: student.fullName,
        email: student.userId?.email,
        grade: student.grade,
        schoolName: student.schoolName,
        totalLessons,
        completedLessons,
        completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        avgQuizScore: Math.round(avgQuizScore),
        lastActive: progress.length > 0 
          ? new Date(Math.max(...progress.map(p => new Date(p.updatedAt || p.createdAt))))
          : student.createdAt,
      };
    });
    
    const reportData = await Promise.all(progressPromises);
    
    // Sort by completion rate (highest first)
    reportData.sort((a, b) => b.completionRate - a.completionRate);
    
    const summary = {
      totalStudents: reportData.length,
      avgCompletionRate: Math.round(
        reportData.reduce((sum, s) => sum + s.completionRate, 0) / (reportData.length || 1)
      ),
      avgQuizScore: Math.round(
        reportData.reduce((sum, s) => sum + s.avgQuizScore, 0) / (reportData.length || 1)
      ),
      highPerformers: reportData.filter(s => s.avgQuizScore >= 80).length,
      needsSupport: reportData.filter(s => s.avgQuizScore < 60).length,
    };
    
    const report = {
      type: 'student-progress',
      period,
      generatedAt: new Date().toISOString(),
      summary,
      data: reportData,
    };
    
    if (format === 'csv') {
      return sendCSV(res, reportData, 'student-progress', [
        'studentId', 'name', 'email', 'grade', 'schoolName', 
        'totalLessons', 'completedLessons', 'completionRate', 'avgQuizScore'
      ]);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error generating student progress report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/lesson-analytics
 * Generate lesson analytics report
 */
router.get('/lesson-analytics', requireAdmin, async (req, res) => {
  try {
    const { period = 'month', subject, grade, format = 'json' } = req.query;
    
    const dateFilter = getDateFilter(period);
    
    // Get all lessons
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    
    const lessons = await Lesson.find(query);
    
    // Get analytics for each lesson
    const analyticsPromises = lessons.map(async (lesson) => {
      const progressRecords = await UserProgress.find({ lessonId: lesson._id });
      
      const completed = progressRecords.filter(p => p.completed).length;
      const started = progressRecords.length;
      const quizScores = progressRecords.filter(p => p.quizScore !== null);
      const avgQuizScore = quizScores.length > 0
        ? quizScores.reduce((sum, p) => sum + p.quizScore, 0) / quizScores.length
        : 0;
      
      return {
        lessonId: lesson._id,
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        term: lesson.term,
        started,
        completed,
        completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
        avgQuizScore: Math.round(avgQuizScore),
        quizAttempts: quizScores.length,
        engagementScore: calculateEngagementScore(started, completed, avgQuizScore),
        createdAt: lesson.createdAt,
      };
    });
    
    const reportData = await Promise.all(analyticsPromises);
    reportData.sort((a, b) => b.engagementScore - a.engagementScore);
    
    const summary = {
      totalLessons: reportData.length,
      totalStarts: reportData.reduce((sum, l) => sum + l.started, 0),
      totalCompletions: reportData.reduce((sum, l) => sum + l.completed, 0),
      avgCompletionRate: Math.round(
        reportData.reduce((sum, l) => sum + l.completionRate, 0) / (reportData.length || 1)
      ),
      avgQuizScore: Math.round(
        reportData.reduce((sum, l) => sum + l.avgQuizScore, 0) / (reportData.length || 1)
      ),
      topPerformers: reportData.slice(0, 10).map(l => ({ title: l.title, score: l.engagementScore })),
    };
    
    const report = {
      type: 'lesson-analytics',
      period,
      filters: { subject, grade },
      generatedAt: new Date().toISOString(),
      summary,
      data: reportData,
    };
    
    if (format === 'csv') {
      return sendCSV(res, reportData, 'lesson-analytics', [
        'lessonId', 'title', 'subject', 'grade', 'term',
        'started', 'completed', 'completionRate', 'avgQuizScore', 'engagementScore'
      ]);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error generating lesson analytics report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/engagement-summary
 * Generate engagement summary report
 */
router.get('/engagement-summary', requireAdmin, async (req, res) => {
  try {
    const { period = 'month', format = 'json' } = req.query;
    
    const dateFilter = getDateFilter(period);
    
    // Get all progress records in period
    const query = dateFilter ? { updatedAt: dateFilter } : {};
    const progressRecords = await UserProgress.find(query);
    
    // Get unique active users
    const activeUserIds = [...new Set(progressRecords.map(p => p.userId?.toString()))];
    const activeUsers = await User.find({ _id: { $in: activeUserIds } });
    
    // Calculate engagement metrics
    const totalSessions = progressRecords.length;
    const completedSessions = progressRecords.filter(p => p.completed).length;
    const quizAttempts = progressRecords.filter(p => p.quizScore !== null).length;
    
    // User type breakdown
    const userTypeBreakdown = activeUsers.reduce((acc, user) => {
      acc[user.userType] = (acc[user.userType] || 0) + 1;
      return acc;
    }, {});
    
    // Activity by day of week
    const activityByDay = progressRecords.reduce((acc, p) => {
      const day = new Date(p.updatedAt || p.createdAt).getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {});
    
    // Activity by hour
    const activityByHour = progressRecords.reduce((acc, p) => {
      const hour = new Date(p.updatedAt || p.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    const peakHour = Object.entries(activityByHour).reduce((max, [hour, count]) => 
      count > max.count ? { hour: parseInt(hour), count } : max,
      { hour: 0, count: 0 }
    );
    
    const summary = {
      activeUsers: activeUserIds.length,
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      quizAttempts,
      avgSessionsPerUser: activeUserIds.length > 0 ? Math.round(totalSessions / activeUserIds.length) : 0,
      peakActivityHour: peakHour.hour,
      peakActivityCount: peakHour.count,
    };
    
    const report = {
      type: 'engagement-summary',
      period,
      generatedAt: new Date().toISOString(),
      summary,
      userTypeBreakdown,
      activityByDay,
      activityByHour: Object.entries(activityByHour).map(([hour, count]) => ({ hour: parseInt(hour), count })),
    };
    
    if (format === 'csv') {
      const csvData = Object.entries(activityByDay).map(([day, count]) => ({ day, sessions: count }));
      return sendCSV(res, csvData, 'engagement-summary', ['day', 'sessions']);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error generating engagement summary:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/grade-performance
 * Generate grade performance report
 */
router.get('/grade-performance', requireAdmin, async (req, res) => {
  try {
    const { period = 'month', format = 'json' } = req.query;
    
    const dateFilter = getDateFilter(period);
    
    const grades = ['1', '2', '3', '4', '5', '6', 'Common Entrance'];
    
    const gradePromises = grades.map(async (grade) => {
      const students = await Student.find({ grade });
      const studentIds = students.map(s => s.userId);
      
      const query = { userId: { $in: studentIds } };
      if (dateFilter) {
        query.updatedAt = dateFilter;
      }
      
      const progress = await UserProgress.find(query);
      
      const completed = progress.filter(p => p.completed).length;
      const total = progress.length;
      const quizScores = progress.filter(p => p.quizScore !== null);
      const avgScore = quizScores.length > 0
        ? quizScores.reduce((sum, p) => sum + p.quizScore, 0) / quizScores.length
        : 0;
      
      // Subject breakdown
      const lessonIds = progress.map(p => p.lessonId);
      const lessons = await Lesson.find({ _id: { $in: lessonIds } });
      
      const subjectBreakdown = lessons.reduce((acc, lesson) => {
        const subject = lesson.subject || 'Other';
        if (!acc[subject]) {
          acc[subject] = { total: 0, completed: 0 };
        }
        const subjectProgress = progress.filter(p => p.lessonId?.toString() === lesson._id.toString());
        acc[subject].total += subjectProgress.length;
        acc[subject].completed += subjectProgress.filter(p => p.completed).length;
        return acc;
      }, {});
      
      return {
        grade,
        totalStudents: students.length,
        activeStudents: [...new Set(progress.map(p => p.userId?.toString()))].length,
        totalLessons: total,
        completedLessons: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgQuizScore: Math.round(avgScore),
        quizAttempts: quizScores.length,
        subjectBreakdown,
      };
    });
    
    const reportData = await Promise.all(gradePromises);
    
    const summary = {
      totalGrades: grades.length,
      totalStudents: reportData.reduce((sum, g) => sum + g.totalStudents, 0),
      avgCompletionRate: Math.round(
        reportData.reduce((sum, g) => sum + g.completionRate, 0) / (reportData.length || 1)
      ),
      avgQuizScore: Math.round(
        reportData.reduce((sum, g) => sum + g.avgQuizScore, 0) / (reportData.length || 1)
      ),
      topPerformingGrade: reportData.reduce((max, g) => 
        g.avgQuizScore > max.avgQuizScore ? g : max,
        reportData[0] || {}
      ).grade,
    };
    
    const report = {
      type: 'grade-performance',
      period,
      generatedAt: new Date().toISOString(),
      summary,
      data: reportData,
    };
    
    if (format === 'csv') {
      return sendCSV(res, reportData, 'grade-performance', [
        'grade', 'totalStudents', 'activeStudents', 'totalLessons',
        'completedLessons', 'completionRate', 'avgQuizScore', 'quizAttempts'
      ]);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error generating grade performance report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/user-activity
 * Generate user activity log report
 */
router.get('/user-activity', requireAdmin, async (req, res) => {
  try {
    const { period = 'week', userType, format = 'json', limit = 1000 } = req.query;
    
    const dateFilter = getDateFilter(period);
    
    // Get users
    const userQuery = {};
    if (userType) userQuery.userType = userType;
    if (dateFilter) userQuery.createdAt = dateFilter;
    
    const users = await User.find(userQuery).select('-password').limit(parseInt(limit));
    
    // Get progress for activity tracking
    const activityPromises = users.map(async (user) => {
      const progress = await UserProgress.find({ userId: user._id })
        .sort({ updatedAt: -1 })
        .limit(10);
      
      const lastActivity = progress.length > 0 
        ? progress[0].updatedAt || progress[0].createdAt
        : user.createdAt;
      
      return {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        status: user.status,
        lastActivity,
        recentActions: progress.length,
        completedActions: progress.filter(p => p.completed).length,
        joinedAt: user.createdAt,
      };
    });
    
    const reportData = await Promise.all(activityPromises);
    reportData.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    const summary = {
      totalUsers: reportData.length,
      activeUsers: reportData.filter(u => 
        new Date(u.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      inactiveUsers: reportData.filter(u => 
        new Date(u.lastActivity) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
    };
    
    const report = {
      type: 'user-activity',
      period,
      filters: { userType },
      generatedAt: new Date().toISOString(),
      summary,
      data: reportData,
    };
    
    if (format === 'csv') {
      return sendCSV(res, reportData, 'user-activity', [
        'userId', 'email', 'fullName', 'userType', 'status',
        'lastActivity', 'recentActions', 'completedActions', 'joinedAt'
      ]);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error generating user activity report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/content-inventory
 * Generate content inventory report
 */
router.get('/content-inventory', requireAdmin, async (req, res) => {
  try {
    const { grade, subject, term, format = 'json' } = req.query;
    
    const query = {};
    if (grade) query.grade = grade;
    if (subject) query.subject = subject;
    if (term) query.term = term;
    
    const lessons = await Lesson.find(query);
    
    const inventoryPromises = lessons.map(async (lesson) => {
      const quizzes = await Quiz.find({ lessonId: lesson._id });
      const progress = await UserProgress.find({ lessonId: lesson._id });
      
      return {
        lessonId: lesson._id,
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        term: lesson.term,
        description: lesson.description,
        videoUrl: lesson.videoUrl ? 'Yes' : 'No',
        contentLength: lesson.content ? lesson.content.length : 0,
        quizCount: quizzes.length,
        totalQuestions: quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0),
        timesAccessed: progress.length,
        timesCompleted: progress.filter(p => p.completed).length,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      };
    });
    
    const reportData = await Promise.all(inventoryPromises);
    
    const summary = {
      totalLessons: reportData.length,
      lessonsWithVideo: reportData.filter(l => l.videoUrl === 'Yes').length,
      totalQuizzes: reportData.reduce((sum, l) => sum + l.quizCount, 0),
      totalQuestions: reportData.reduce((sum, l) => sum + l.totalQuestions, 0),
      avgQuestionsPerQuiz: Math.round(
        reportData.reduce((sum, l) => sum + l.totalQuestions, 0) / 
        (reportData.reduce((sum, l) => sum + l.quizCount, 0) || 1)
      ),
    };
    
    const report = {
      type: 'content-inventory',
      filters: { grade, subject, term },
      generatedAt: new Date().toISOString(),
      summary,
      data: reportData,
    };
    
    if (format === 'csv') {
      return sendCSV(res, reportData, 'content-inventory', [
        'lessonId', 'title', 'subject', 'grade', 'term',
        'videoUrl', 'quizCount', 'totalQuestions', 'timesAccessed', 'timesCompleted'
      ]);
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error generating content inventory report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Helper function to get date filter based on period
 */
function getDateFilter(period) {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      return null;
  }
  
  return { $gte: startDate };
}

/**
 * Helper function to calculate engagement score
 */
function calculateEngagementScore(started, completed, avgQuizScore) {
  const completionWeight = 0.4;
  const quizWeight = 0.6;
  
  const completionRate = started > 0 ? (completed / started) * 100 : 0;
  const quizComponent = avgQuizScore || 0;
  
  return Math.round((completionRate * completionWeight) + (quizComponent * quizWeight));
}

/**
 * Helper function to send CSV response
 */
function sendCSV(res, data, filename, columns) {
  const headers = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return `"${value.toString().replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
}

export default router;
