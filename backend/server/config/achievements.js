// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: 'CheckCircle',
    requirement: 1,
    coinReward: 10,
    gradient: 'from-purple-500 to-pink-500',
  },
  SPEED_LEARNER: {
    id: 'speed_learner',
    name: 'Speed Learner',
    description: 'Complete 5 lessons in one day',
    icon: 'Zap',
    requirement: 5,
    coinReward: 50,
    gradient: 'from-yellow-500 to-orange-500',
  },
  PERFECT_WEEK: {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Study 7 days in a row',
    icon: 'Calendar',
    requirement: 7,
    coinReward: 100,
    gradient: 'from-green-500 to-emerald-500',
  },
  QUIZ_MASTER: {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Score 100% on 10 quizzes',
    icon: 'Trophy',
    requirement: 10,
    coinReward: 75,
    gradient: 'from-blue-500 to-cyan-500',
  },
  SUBJECT_CHAMPION: {
    id: 'subject_champion',
    name: 'Subject Champion',
    description: 'Complete all lessons in a subject',
    icon: 'Award',
    requirement: 1,
    coinReward: 150,
    gradient: 'from-indigo-500 to-purple-500',
  },
  COURSE_COLLECTOR: {
    id: 'course_collector',
    name: 'Course Collector',
    description: 'Enroll in 3 or more courses',
    icon: 'BookOpen',
    requirement: 3,
    coinReward: 30,
    gradient: 'from-blue-500 to-cyan-500',
  },
  ON_FIRE: {
    id: 'on_fire',
    name: 'On Fire!',
    description: 'Maintain a 3-day learning streak',
    icon: 'Flame',
    requirement: 3,
    coinReward: 25,
    gradient: 'from-orange-500 to-red-500',
  },
  DEDICATED_LEARNER: {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 25 lessons',
    icon: 'Star',
    requirement: 25,
    coinReward: 100,
    gradient: 'from-purple-500 to-pink-500',
  },
  CENTURY_CLUB: {
    id: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 lessons',
    icon: 'Award',
    requirement: 100,
    coinReward: 500,
    gradient: 'from-yellow-500 to-orange-500',
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Study before 9 AM on 5 different days',
    icon: 'Sun',
    requirement: 5,
    coinReward: 40,
    gradient: 'from-yellow-400 to-orange-400',
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study after 9 PM on 5 different days',
    icon: 'Moon',
    requirement: 5,
    coinReward: 40,
    gradient: 'from-indigo-500 to-purple-500',
  },
  FOCUSED_STUDENT: {
    id: 'focused_student',
    name: 'Focused Student',
    description: 'Study for 60 minutes in one day',
    icon: 'Clock',
    requirement: 60,
    coinReward: 60,
    gradient: 'from-blue-500 to-teal-500',
  },
};

// Check and award achievements
export function checkAchievements(user, stats) {
  const newAchievements = [];
  const existingIds = user.achievements?.map(a => a.achievementId) || [];

  // First Steps - Complete first lesson
  if (stats.completedLessons >= 1 && !existingIds.includes(ACHIEVEMENTS.FIRST_STEPS.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.FIRST_STEPS.id,
      unlockedAt: new Date(),
    });
  }

  // Speed Learner - 5 lessons in one day
  if (stats.lessonsCompletedToday >= 5 && !existingIds.includes(ACHIEVEMENTS.SPEED_LEARNER.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.SPEED_LEARNER.id,
      unlockedAt: new Date(),
    });
  }

  // Perfect Week - 7 day streak
  if (stats.currentStreak >= 7 && !existingIds.includes(ACHIEVEMENTS.PERFECT_WEEK.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.PERFECT_WEEK.id,
      unlockedAt: new Date(),
    });
  }

  // Quiz Master - 10 perfect quizzes
  if (stats.perfectQuizzes >= 10 && !existingIds.includes(ACHIEVEMENTS.QUIZ_MASTER.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.QUIZ_MASTER.id,
      unlockedAt: new Date(),
    });
  }

  // Course Collector - 3+ enrollments
  if (stats.enrollments >= 3 && !existingIds.includes(ACHIEVEMENTS.COURSE_COLLECTOR.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.COURSE_COLLECTOR.id,
      unlockedAt: new Date(),
    });
  }

  // On Fire - 3 day streak
  if (stats.currentStreak >= 3 && !existingIds.includes(ACHIEVEMENTS.ON_FIRE.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.ON_FIRE.id,
      unlockedAt: new Date(),
    });
  }

  // Dedicated Learner - 25 lessons
  if (stats.completedLessons >= 25 && !existingIds.includes(ACHIEVEMENTS.DEDICATED_LEARNER.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.DEDICATED_LEARNER.id,
      unlockedAt: new Date(),
    });
  }

  // Century Club - 100 lessons
  if (stats.completedLessons >= 100 && !existingIds.includes(ACHIEVEMENTS.CENTURY_CLUB.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.CENTURY_CLUB.id,
      unlockedAt: new Date(),
    });
  }

  // Focused Student - 60 min in one day
  if (stats.studyMinutesToday >= 60 && !existingIds.includes(ACHIEVEMENTS.FOCUSED_STUDENT.id)) {
    newAchievements.push({
      achievementId: ACHIEVEMENTS.FOCUSED_STUDENT.id,
      unlockedAt: new Date(),
    });
  }

  return newAchievements;
}

// Calculate coin rewards for new achievements
export function calculateCoinRewards(achievementIds) {
  return achievementIds.reduce((total, id) => {
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === id);
    return total + (achievement?.coinReward || 0);
  }, 0);
}
