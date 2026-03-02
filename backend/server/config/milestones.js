// Milestone definitions
export const MILESTONES = {
  FIRST_LESSON: {
    id: 'first_lesson',
    name: 'Getting Started',
    description: 'Complete your first lesson',
    requirement: 1,
    coinReward: 20,
    icon: 'Rocket',
    gradient: 'from-blue-500 to-cyan-500',
  },
  TEN_LESSONS: {
    id: 'ten_lessons',
    name: 'Learning Explorer',
    description: 'Complete 10 lessons',
    requirement: 10,
    coinReward: 100,
    icon: 'Map',
    gradient: 'from-green-500 to-emerald-500',
  },
  TWENTY_FIVE_LESSONS: {
    id: 'twenty_five_lessons',
    name: 'Knowledge Seeker',
    description: 'Complete 25 lessons',
    requirement: 25,
    coinReward: 250,
    icon: 'BookOpen',
    gradient: 'from-purple-500 to-pink-500',
  },
  FIFTY_LESSONS: {
    id: 'fifty_lessons',
    name: 'Dedicated Student',
    description: 'Complete 50 lessons',
    requirement: 50,
    coinReward: 500,
    icon: 'Award',
    gradient: 'from-orange-500 to-red-500',
  },
  HUNDRED_LESSONS: {
    id: 'hundred_lessons',
    name: 'Century Achiever',
    description: 'Complete 100 lessons',
    requirement: 100,
    coinReward: 1000,
    icon: 'Trophy',
    gradient: 'from-yellow-500 to-orange-500',
  },
  TWO_FIFTY_LESSONS: {
    id: 'two_fifty_lessons',
    name: 'Master Scholar',
    description: 'Complete 250 lessons',
    requirement: 250,
    coinReward: 2500,
    icon: 'Crown',
    gradient: 'from-indigo-500 to-purple-500',
  },
};

// Subject mastery level definitions
export const MASTERY_LEVELS = {
  BEGINNER: {
    level: 'Beginner',
    xpRequired: 0,
    lessonsRequired: 0,
    color: 'gray',
    icon: 'Seedling',
  },
  INTERMEDIATE: {
    level: 'Intermediate',
    xpRequired: 500,
    lessonsRequired: 5,
    color: 'blue',
    icon: 'Sprout',
  },
  ADVANCED: {
    level: 'Advanced',
    xpRequired: 1500,
    lessonsRequired: 15,
    color: 'purple',
    icon: 'Tree',
  },
  MASTER: {
    level: 'Master',
    xpRequired: 3000,
    lessonsRequired: 30,
    color: 'gold',
    icon: 'Crown',
  },
};

// Calculate XP for lesson completion
export function calculateLessonXP(quizScore = 0, timeSpent = 0) {
  let xp = 100; // Base XP
  
  // Bonus for quiz performance
  if (quizScore >= 90) xp += 50;
  else if (quizScore >= 80) xp += 30;
  else if (quizScore >= 70) xp += 10;
  
  // Time bonus (capped at 30 min)
  const timeBonus = Math.min(timeSpent, 30);
  xp += timeBonus;
  
  return xp;
}

// Determine mastery level from XP
export function getMasteryLevel(xp) {
  if (xp >= MASTERY_LEVELS.MASTER.xpRequired) return 'Master';
  if (xp >= MASTERY_LEVELS.ADVANCED.xpRequired) return 'Advanced';
  if (xp >= MASTERY_LEVELS.INTERMEDIATE.xpRequired) return 'Intermediate';
  return 'Beginner';
}

// Get next milestone
export function getNextMilestone(completedLessons) {
  const milestones = Object.values(MILESTONES).sort((a, b) => a.requirement - b.requirement);
  return milestones.find(m => m.requirement > completedLessons) || null;
}

// Check if milestone achieved
export function checkMilestones(completedLessons, existingMilestones = []) {
  const existingIds = existingMilestones.map(m => m.milestoneId);
  const newMilestones = [];
  
  Object.values(MILESTONES).forEach(milestone => {
    if (completedLessons >= milestone.requirement && !existingIds.includes(milestone.id)) {
      newMilestones.push({
        milestoneId: milestone.id,
        achievedAt: new Date(),
        lessonsCount: completedLessons,
      });
    }
  });
  
  return newMilestones;
}

// Motivational quotes
export const DAILY_QUOTES = [
  {
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    quote: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss",
  },
  {
    quote: "Education is not preparation for life; education is life itself.",
    author: "John Dewey",
  },
  {
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
  },
  {
    quote: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams",
  },
  {
    quote: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
  },
  {
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    quote: "Don't let what you cannot do interfere with what you can do.",
    author: "John Wooden",
  },
];

// Get quote of the day (based on date)
export function getQuoteOfDay() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const index = dayOfYear % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
