import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import UserProgress from '../models/UserProgress.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../models/Quiz.js';
import Lesson from '../models/Lesson.js';
import { SystemSettings } from '../models/index.js';
import { ACHIEVEMENTS, checkAchievements, calculateCoinRewards } from '../config/achievements.js';
import { 
  MILESTONES, 
  MASTERY_LEVELS, 
  checkMilestones, 
  getNextMilestone, 
  getMasteryLevel,
  calculateLessonXP,
  getQuoteOfDay,
  DAILY_QUOTES
} from '../config/milestones.js';

const router = express.Router();

// Get user's gamification stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const student = await Student.findOne({ userId: req.user.userId });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Get completion stats
    const progress = await UserProgress.find({ userId: req.user.userId });
    const completedLessons = progress.filter(p => p.completed).length;
    const enrollments = await Enrollment.countDocuments({ userId: req.user.userId });

    // Get today's completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lessonsCompletedToday = progress.filter(p => {
      return p.completed && p.completedAt && p.completedAt >= today;
    }).length;

    // Get perfect quizzes count
    const perfectQuizzes = await Quiz.countDocuments({
      userId: req.user.userId,
      score: 100,
    });

    // Get today's study time
    const todayStudyData = user.studyTimeData?.find(d => {
      const dataDate = new Date(d.date);
      dataDate.setHours(0, 0, 0, 0);
      return dataDate.getTime() === today.getTime();
    });

    const stats = {
      completedLessons,
      totalLessonsCompleted: completedLessons,
      enrollments,
      currentStreak: student.currentStreak || 0,
      lessonsCompletedToday,
      perfectQuizzes,
      studyMinutesToday: todayStudyData?.minutes || 0,
    };

    // Check for new achievements
    const newAchievements = checkAchievements(user, stats);
    
    if (newAchievements.length > 0) {
      const coinReward = calculateCoinRewards(newAchievements.map(a => a.achievementId));
      
      await User.findByIdAndUpdate(req.user.userId, {
        $push: { achievements: { $each: newAchievements } },
        $inc: { coins: coinReward },
      });

      user.achievements = [...(user.achievements || []), ...newAchievements];
      user.coins = (user.coins || 0) + coinReward;
    }

    res.json({
      coins: user.coins || 0,
      achievements: user.achievements || [],
      weeklyGoal: user.weeklyGoal || { dailyLessons: 3, enabled: true },
      streakFreezes: user.streakFreezes || { available: 1 },
      studyReminders: user.studyReminders || { enabled: false, time: "16:00" },
      stats,
      newAchievements,
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({ error: 'Failed to fetch gamification stats' });
  }
});

// Update weekly goal
router.put('/weekly-goal', requireAuth, async (req, res) => {
  try {
    const { dailyLessons, enabled } = req.body;

    const updates = {};
    if (dailyLessons !== undefined) {
      updates['weeklyGoal.dailyLessons'] = Math.max(1, Math.min(10, dailyLessons));
    }
    if (enabled !== undefined) {
      updates['weeklyGoal.enabled'] = enabled;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    );

    res.json({ weeklyGoal: user.weeklyGoal });
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    res.status(500).json({ error: 'Failed to update weekly goal' });
  }
});

// Use streak freeze
router.post('/use-freeze', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user.streakFreezes || user.streakFreezes.available <= 0) {
      return res.status(400).json({ error: 'No streak freezes available' });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'streakFreezes.available': -1 },
    });

    res.json({ success: true, remaining: user.streakFreezes.available - 1 });
  } catch (error) {
    console.error('Error using streak freeze:', error);
    res.status(500).json({ error: 'Failed to use streak freeze' });
  }
});

// Update study reminders
router.put('/study-reminders', requireAuth, async (req, res) => {
  try {
    const { enabled, time, timezone } = req.body;

    const updates = {};
    if (enabled !== undefined) {
      updates['studyReminders.enabled'] = enabled;
    }
    if (time !== undefined) {
      updates['studyReminders.time'] = time;
    }
    if (timezone !== undefined) {
      updates['studyReminders.timezone'] = timezone;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    );

    res.json({ studyReminders: user.studyReminders });
  } catch (error) {
    console.error('Error updating study reminders:', error);
    res.status(500).json({ error: 'Failed to update study reminders' });
  }
});

// Get learning analytics
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const student = await Student.findOne({ userId: req.user.userId });
    const [progressRaw, enrollments] = await Promise.all([
      UserProgress.find({ userId: req.user.userId }).lean(),
      Enrollment.find({ userId: req.user.userId }),
    ]);
    // Bulk-fetch referenced lessons in one query instead of N populate() calls
    const lessonIds = [...new Set(progressRaw.filter(p => p.lessonId).map(p => p.lessonId.toString()))];
    const lessonMap = {};
    if (lessonIds.length > 0) {
      const lessons = await Lesson.find({ _id: { $in: lessonIds } }).select('subject').lean();
      for (const l of lessons) lessonMap[l._id.toString()] = l;
    }
    // Attach lesson to each progress record (replaces populate)
    const progress = progressRaw.map(p => ({
      ...p,
      lessonId: p.lessonId ? (lessonMap[p.lessonId.toString()] || null) : null,
    }));

    // Calculate subject performance
    const subjectStats = {};
    progress.forEach(p => {
      if (p.lessonId && p.lessonId.subject) {
        if (!subjectStats[p.lessonId.subject]) {
          subjectStats[p.lessonId.subject] = { total: 0, completed: 0 };
        }
        subjectStats[p.lessonId.subject].total++;
        if (p.completed) {
          subjectStats[p.lessonId.subject].completed++;
        }
      }
    });

    const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      completed: stats.completed,
      total: stats.total,
      percentage: Math.round((stats.completed / stats.total) * 100),
    })).sort((a, b) => b.percentage - a.percentage);

    // Get weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const studyData = user.studyTimeData?.find(d => {
        const dataDate = new Date(d.date);
        dataDate.setHours(0, 0, 0, 0);
        return dataDate.getTime() === date.getTime();
      });

      const lessonsOnDay = progress.filter(p => {
        if (!p.completedAt) return false;
        const completedDate = new Date(p.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === date.getTime();
      }).length;

      weeklyActivity.push({
        date: date.toISOString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: studyData?.minutes || 0,
        lessonsCompleted: lessonsOnDay,
      });
    }

    // Calculate average study time
    const totalMinutes = user.studyTimeData?.reduce((sum, d) => sum + d.minutes, 0) || 0;
    const avgMinutesPerDay = user.studyTimeData?.length > 0 
      ? Math.round(totalMinutes / user.studyTimeData.length) 
      : 0;

    // Find strongest and weakest subjects
    const strongest = subjectPerformance[0] || null;
    const weakest = subjectPerformance[subjectPerformance.length - 1] || null;

    res.json({
      subjectPerformance,
      weeklyActivity,
      totalLessonsCompleted: progress.filter(p => p.completed).length,
      totalEnrollments: enrollments.length,
      currentStreak: student?.currentStreak || 0,
      bestStreak: student?.bestStreak || 0,
      avgMinutesPerDay,
      totalStudyMinutes: totalMinutes,
      strongest,
      weakest,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get personalized recommendations
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    const progress = await UserProgress.find({ userId: req.user.userId }).populate('lessonId');
    const enrollments = await Enrollment.find({ userId: req.user.userId });

    // Get subjects the student is enrolled in
    const enrolledSubjects = new Set(enrollments.map(e => e.subject).filter(Boolean));

    // Find subjects with low completion rates
    const subjectCompletion = {};
    progress.forEach(p => {
      if (p.lessonId && p.lessonId.subject && enrolledSubjects.has(p.lessonId.subject)) {
        if (!subjectCompletion[p.lessonId.subject]) {
          subjectCompletion[p.lessonId.subject] = { total: 0, completed: 0 };
        }
        subjectCompletion[p.lessonId.subject].total++;
        if (p.completed) {
          subjectCompletion[p.lessonId.subject].completed++;
        }
      }
    });

    const lowCompletionSubjects = Object.entries(subjectCompletion)
      .filter(([_, stats]) => {
        const percentage = (stats.completed / stats.total) * 100;
        return percentage < 50 && stats.total >= 3; // Less than 50% and at least 3 lessons
      })
      .map(([subject]) => subject);

    // Enhanced recommendation algorithm
    const recommendations = [];

    // 1. Recommend subjects with low completion rates (struggling areas)
    if (lowCompletionSubjects.length > 0) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        subjects: lowCompletionSubjects,
        message: 'Focus on these subjects to improve your overall progress',
        reason: 'Low completion rate (below 50%)',
      });
    }

    // 2. Find subjects with recent activity but not completed
    const recentIncomplete = progress
      .filter(p => !p.completed && p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
      .slice(0, 3)
      .map(p => p.lessonId?.subject)
      .filter(Boolean);

    if (recentIncomplete.length > 0) {
      recommendations.push({
        type: 'continue',
        priority: 'medium',
        subjects: [...new Set(recentIncomplete)], // Remove duplicates
        message: 'Continue where you left off',
        reason: 'Recently started but not completed',
      });
    }

    // 3. Recommend subjects with high completion (build momentum)
    const highCompletionSubjects = Object.entries(subjectCompletion)
      .filter(([_, stats]) => {
        const percentage = (stats.completed / stats.total) * 100;
        return percentage >= 50 && percentage < 100; // 50-99% completion
      })
      .sort((a, b) => {
        const percentA = (a[1].completed / a[1].total) * 100;
        const percentB = (b[1].completed / b[1].total) * 100;
        return percentB - percentA;
      })
      .slice(0, 2)
      .map(([subject]) => subject);

    if (highCompletionSubjects.length > 0) {
      recommendations.push({
        type: 'complete',
        priority: 'medium',
        subjects: highCompletionSubjects,
        message: 'You\'re almost there! Complete these subjects',
        reason: 'High completion rate (50-99%)',
      });
    }

    // 4. Find streak-worthy subjects (consistent progress)
    const recentWeek = progress
      .filter(p => {
        if (!p.lastAccessedAt) return false;
        const daysSince = (Date.now() - new Date(p.lastAccessedAt)) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

    const weeklySubjectCount = {};
    recentWeek.forEach(p => {
      const subject = p.lessonId?.subject;
      if (subject) {
        weeklySubjectCount[subject] = (weeklySubjectCount[subject] || 0) + 1;
      }
    });

    const consistentSubjects = Object.entries(weeklySubjectCount)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([subject]) => subject);

    if (consistentSubjects.length > 0) {
      recommendations.push({
        type: 'momentum',
        priority: 'low',
        subjects: consistentSubjects,
        message: 'Keep your momentum going with these subjects',
        reason: 'Consistent activity in the past week',
      });
    }

    res.json({
      recommendations,
      summary: recommendations.length > 0 
        ? `We found ${recommendations.length} personalized recommendations for you`
        : 'Great job! Keep up the excellent work across all subjects',
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Record study time
router.post('/record-study-time', requireAuth, async (req, res) => {
  try {
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'Invalid study time' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await User.findById(req.user.userId);
    const existingData = user.studyTimeData?.find(d => {
      const dataDate = new Date(d.date);
      dataDate.setHours(0, 0, 0, 0);
      return dataDate.getTime() === today.getTime();
    });

    if (existingData) {
      // Update existing entry
      await User.updateOne(
        { _id: req.user.userId, 'studyTimeData.date': existingData.date },
        { $inc: { 'studyTimeData.$.minutes': minutes } }
      );
    } else {
      // Add new entry
      await User.findByIdAndUpdate(req.user.userId, {
        $push: {
          studyTimeData: {
            date: today,
            minutes,
          },
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording study time:', error);
    res.status(500).json({ error: 'Failed to record study time' });
  }
});

// Get all available achievements with progress
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const student = await Student.findOne({ userId: req.user.userId });
    const progress = await UserProgress.find({ userId: req.user.userId });
    const enrollments = await Enrollment.countDocuments({ userId: req.user.userId });

    const completedLessons = progress.filter(p => p.completed).length;
    const perfectQuizzes = await Quiz.countDocuments({
      userId: req.user.userId,
      score: 100,
    });

    const unlockedIds = user.achievements?.map(a => a.achievementId) || [];

    const achievementList = Object.values(ACHIEVEMENTS).map(achievement => {
      const isUnlocked = unlockedIds.includes(achievement.id);
      let currentProgress = 0;

      // Calculate progress for each achievement
      switch (achievement.id) {
        case 'first_steps':
        case 'dedicated_learner':
        case 'century_club':
          currentProgress = completedLessons;
          break;
        case 'perfect_week':
        case 'on_fire':
          currentProgress = student?.currentStreak || 0;
          break;
        case 'quiz_master':
          currentProgress = perfectQuizzes;
          break;
        case 'course_collector':
          currentProgress = enrollments;
          break;
        default:
          currentProgress = 0;
      }

      return {
        ...achievement,
        isUnlocked,
        progress: currentProgress,
        progressPercentage: Math.min(100, Math.round((currentProgress / achievement.requirement) * 100)),
      };
    });

    res.json({ achievements: achievementList });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get milestones
router.get('/milestones', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const progress = await UserProgress.find({ userId: req.user.userId });
    const completedLessons = progress.filter(p => p.completed).length;

    // Check for new milestones
    const newMilestones = checkMilestones(completedLessons, user.milestones || []);
    
    if (newMilestones.length > 0) {
      const coinReward = newMilestones.reduce((total, m) => {
        const milestone = Object.values(MILESTONES).find(ms => ms.id === m.milestoneId);
        return total + (milestone?.coinReward || 0);
      }, 0);

      await User.findByIdAndUpdate(req.user.userId, {
        $push: { milestones: { $each: newMilestones } },
        $inc: { coins: coinReward },
      });

      user.milestones = [...(user.milestones || []), ...newMilestones];
      user.coins = (user.coins || 0) + coinReward;
    }

    const nextMilestone = getNextMilestone(completedLessons);
    const achievedMilestones = (user.milestones || []).map(m => {
      const milestone = Object.values(MILESTONES).find(ms => ms.id === m.milestoneId);
      return {
        ...milestone,
        achievedAt: m.achievedAt,
      };
    });

    res.json({
      completedLessons,
      achievedMilestones,
      nextMilestone,
      newMilestones: newMilestones.length > 0 ? newMilestones.map(m => {
        const milestone = Object.values(MILESTONES).find(ms => ms.id === m.milestoneId);
        return { ...milestone, ...m };
      }) : [],
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// Get subject mastery levels
router.get('/mastery', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const progressRaw = await UserProgress.find({ userId: req.user.userId }).lean();
    // Bulk-fetch referenced lessons (no N+1 populate)
    const lessonIds = [...new Set(progressRaw.filter(p => p.lessonId).map(p => p.lessonId.toString()))];
    const lessonMap = {};
    if (lessonIds.length > 0) {
      const lessons = await Lesson.find({ _id: { $in: lessonIds } }).select('subject').lean();
      for (const l of lessons) lessonMap[l._id.toString()] = l;
    }
    const progress = progressRaw.map(p => ({
      ...p,
      lessonId: p.lessonId ? (lessonMap[p.lessonId.toString()] || null) : null,
    }));

    // Calculate mastery for each subject
    const subjectData = {};
    
    progress.forEach(p => {
      if (p.lessonId && p.lessonId.subject && p.completed) {
        if (!subjectData[p.lessonId.subject]) {
          subjectData[p.lessonId.subject] = {
            lessonsCompleted: 0,
            totalXP: 0,
          };
        }
        subjectData[p.lessonId.subject].lessonsCompleted++;
        // Award XP (simplified - in production, use quiz scores)
        subjectData[p.lessonId.subject].totalXP += calculateLessonXP(p.quizScore || 0, p.timeSpent || 0);
      }
    });

    // Update user's subject mastery
    const masteryUpdates = Object.entries(subjectData).map(([subject, data]) => {
      const level = getMasteryLevel(data.totalXP);
      const existing = user.subjectMastery?.find(m => m.subject === subject);
      
      if (existing) {
        existing.level = level;
        existing.xp = data.totalXP;
        existing.lessonsCompleted = data.lessonsCompleted;
        return existing;
      }
      
      return {
        subject,
        level,
        xp: data.totalXP,
        lessonsCompleted: data.lessonsCompleted,
      };
    });

    // Persist mastery update without blocking the response (fire-and-forget)
    User.findByIdAndUpdate(req.user.userId, { $set: { subjectMastery: masteryUpdates } }).exec().catch(() => {});

    // Format response with next level info
    const masteryList = masteryUpdates.map(m => {
      const currentLevel = Object.values(MASTERY_LEVELS).find(l => l.level === m.level);
      const levelIndex = Object.keys(MASTERY_LEVELS).indexOf(m.level.toUpperCase());
      const nextLevelKey = Object.keys(MASTERY_LEVELS)[levelIndex + 1];
      const nextLevel = nextLevelKey ? MASTERY_LEVELS[nextLevelKey] : null;
      
      return {
        subject: m.subject,
        level: m.level,
        xp: m.xp,
        lessonsCompleted: m.lessonsCompleted,
        currentLevelInfo: currentLevel,
        nextLevel: nextLevel ? {
          level: nextLevel.level,
          xpRequired: nextLevel.xpRequired,
          xpToGo: nextLevel.xpRequired - m.xp,
          progress: Math.min(100, Math.round((m.xp / nextLevel.xpRequired) * 100)),
        } : null,
      };
    });

    res.json({ mastery: masteryList });
  } catch (error) {
    console.error('Error fetching mastery:', error);
    res.status(500).json({ error: 'Failed to fetch mastery levels' });
  }
});

// ADMIN: Get full leaderboard (all students, bypasses visibility settings)
router.get('/admin/leaderboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { timeframe = 'allTime' } = req.query;

    // Get ALL students regardless of leaderboardSettings
    const users = await User.find({ userType: 'student' })
      .select('_id fullName coins leaderboardSettings');

    const leaderboardData = await Promise.all(users.map(async (user) => {
      const userStudent = await Student.findOne({ userId: user._id });
      const progress = await UserProgress.find({ userId: user._id });

      let completedLessons = progress.filter(p => p.completed).length;

      if (timeframe === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        completedLessons = progress.filter(p =>
          p.completed && p.completedAt && new Date(p.completedAt) > oneWeekAgo
        ).length;
      } else if (timeframe === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        completedLessons = progress.filter(p =>
          p.completed && p.completedAt && new Date(p.completedAt) > oneMonthAgo
        ).length;
      }

      return {
        userId: user._id.toString(),
        name: user.fullName,
        grade: userStudent?.grade || '-',
        coins: user.coins || 0,
        completedLessons,
        streak: userStudent?.currentStreak || 0,
        visible: user.leaderboardSettings?.visible !== false,
      };
    }));

    const sorted = leaderboardData.sort((a, b) => b.coins - a.coins);
    const ranked = sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.json({
      leaderboard: ranked,
      totalParticipants: ranked.length,
    });
  } catch (error) {
    console.error('Error fetching admin leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch admin leaderboard' });
  }
});

// Get leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const { timeframe = 'allTime' } = req.query;
    const currentUserId = req.user.userId;

    // Build timeframe date filter for UserProgress
    let completedAtFilter = {};
    if (timeframe === 'week') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      completedAtFilter = { $gte: cutoff };
    } else if (timeframe === 'month') {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 1);
      completedAtFilter = { $gte: cutoff };
    }

    // Aggregate completed lesson counts per user in one query
    const progressMatch = { completed: true };
    if (completedAtFilter.$gte) progressMatch.completedAt = completedAtFilter;
    const progressCounts = await UserProgress.aggregate([
      { $match: progressMatch },
      { $group: { _id: '$userId', completedLessons: { $sum: 1 } } },
    ]);
    const progressMap = {};
    for (const p of progressCounts) progressMap[p._id.toString()] = p.completedLessons;

    // Fetch all students for streak data in one query
    const students = await Student.find({}).select('userId currentStreak').lean();
    const streakMap = {};
    for (const s of students) streakMap[s.userId.toString()] = s.currentStreak || 0;

    // Fetch all student users with leaderboard visibility enabled
    const users = await User.find({
      userType: 'student',
      $or: [
        { 'leaderboardSettings.visible': true },
        { 'leaderboardSettings.visible': { $exists: false } },
      ],
    }).select('_id fullName coins leaderboardSettings').lean();

    const leaderboardData = users.map(user => {
      const uid = user._id.toString();
      return {
        userId: uid,
        name: user.leaderboardSettings?.showFullName
          ? user.fullName
          : (user.fullName || '').split(' ')[0],
        coins: user.coins || 0,
        completedLessons: progressMap[uid] || 0,
        streak: streakMap[uid] || 0,
        isCurrentUser: uid === currentUserId,
      };
    });

    // Sort by coins descending, assign ranks
    leaderboardData.sort((a, b) => b.coins - a.coins);
    const rankedLeaderboard = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    const userPosition = rankedLeaderboard.find(e => e.isCurrentUser);

    res.json({
      leaderboard: rankedLeaderboard.slice(0, 100),
      userPosition,
      totalParticipants: rankedLeaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Update leaderboard visibility
router.put('/leaderboard-settings', requireAuth, async (req, res) => {
  try {
    const { visible, showFullName } = req.body;

    const updates = {};
    if (visible !== undefined) {
      updates['leaderboardSettings.visible'] = visible;
    }
    if (showFullName !== undefined) {
      updates['leaderboardSettings.showFullName'] = showFullName;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    );

    res.json({ leaderboardSettings: user.leaderboardSettings });
  } catch (error) {
    console.error('Error updating leaderboard settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get quote of the day
router.get('/quote-of-day', requireAuth, async (req, res) => {
  try {
    // Check for admin-configured custom quotes
    let quote;
    try {
      const settings = await SystemSettings.getSingleton();
      const quotesConfig = settings.quotes;
      if (quotesConfig && quotesConfig.customQuotesEnabled && quotesConfig.dailyQuotes && quotesConfig.dailyQuotes.length > 0) {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const index = dayOfYear % quotesConfig.dailyQuotes.length;
        quote = quotesConfig.dailyQuotes[index];
      }
    } catch (_) {}
    if (!quote) {
      quote = getQuoteOfDay();
    }

    const progress = await UserProgress.find({ userId: req.user.userId });
    const completedToday = progress.filter(p => {
      if (!p.completedAt) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedDate = new Date(p.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    // Personalize the message based on progress
    let personalMessage = "";
    if (completedToday >= 5) {
      personalMessage = "Amazing work today! You've completed " + completedToday + " lessons! 🌟";
    } else if (completedToday >= 3) {
      personalMessage = "Great progress! " + completedToday + " lessons done today! Keep it up! 💪";
    } else if (completedToday >= 1) {
      personalMessage = "Good start! You've completed " + completedToday + " lesson" + (completedToday > 1 ? "s" : "") + " today! 🎯";
    } else {
      personalMessage = "Ready to learn something new today? Let's get started! 🚀";
    }

    res.json({
      quote: quote.quote,
      author: quote.author,
      personalMessage,
      completedToday,
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Get quick quiz questions
router.get('/quick-quiz', requireAuth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.userId, isActive: true });
    
    if (enrollments.length === 0) {
      return res.json({ quizzes: [] });
    }

    // Build quiz query from enrolled subject/grade pairs (Enrollment has no lessonId)
    const subjectGradePairs = enrollments.map(e => ({ subject: e.subject, grade: e.grade }));
    
    // Get quizzes matching the student's enrolled subjects and grades
    const quizzes = await Quiz.find({
      $or: subjectGradePairs,
    }).limit(10);

    // Extract and transform individual questions
    const allQuestions = [];
    quizzes.forEach(quiz => {
      if (quiz.questions && quiz.questions.length > 0) {
        quiz.questions.forEach(q => {
          allQuestions.push({
            _id: q._id,
            question: q.question,
            options: q.options,
            correctAnswer: Array.isArray(q.options) && q.correctAnswer >= 0 ? q.options[q.correctAnswer] : undefined,
            explanation: q.explanation,
            lessonId: quiz.lessonId,
            subject: quiz.subject,
            grade: quiz.grade
          });
        });
      }
    });

    // Randomly select 3 questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 3);

    res.json({ quizzes: selectedQuestions });
  } catch (error) {
    console.error('Error fetching quick quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Admin: Get all students' study time data
router.get('/admin/students-study-time', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email studyTimeData createdAt').lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    weekAgo.setHours(0, 0, 0, 0);

    const result = users.map((u) => {
      const data = u.studyTimeData || [];
      const totalMinutes = data.reduce((s, d) => s + (d.minutes || 0), 0);
      const todayMins = data
        .filter((d) => {
          const dd = new Date(d.date);
          dd.setHours(0, 0, 0, 0);
          return dd.getTime() === today.getTime();
        })
        .reduce((s, d) => s + (d.minutes || 0), 0);
      const weeklyMinutes = data
        .filter((d) => new Date(d.date) >= weekAgo)
        .reduce((s, d) => s + (d.minutes || 0), 0);
      const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastStudyDate = sorted.length > 0 ? sorted[0].date : null;

      return {
        userId: u._id,
        name: u.fullName || 'Unknown',
        email: u.email,
        totalMinutes,
        todayMinutes: todayMins,
        weeklyMinutes,
        lastStudyDate,
        joinedAt: u.createdAt,
      };
    });

    result.sort((a, b) => b.totalMinutes - a.totalMinutes);
    res.json({ students: result });
  } catch (error) {
    console.error('Error fetching student study times:', error);
    res.status(500).json({ error: 'Failed to fetch student study times' });
  }
});

export default router;
