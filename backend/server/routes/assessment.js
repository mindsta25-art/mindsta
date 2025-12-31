import express from 'express';
import { Quiz, Lesson } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/assessment/questions - Get randomized assessment questions
router.get('/questions', requireAuth, async (req, res) => {
  try {
    const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    const questionsPerGrade = 3; // 3 questions per grade = 18 total
    const assessmentQuestions = [];

    for (const grade of grades) {
      try {
        // Get all lessons for this grade
        const lessons = await Lesson.find({ grade }).select('_id subject');
        
        if (lessons.length === 0) {
          console.log(`No lessons found for ${grade}`);
          continue;
        }

        // Get quizzes for these lessons
        const lessonIds = lessons.map(l => l._id);
        const quizzes = await Quiz.find({ 
          lessonId: { $in: lessonIds },
          'questions.0': { $exists: true } // Ensure quiz has questions
        }).populate('lessonId', 'subject grade difficulty');

        if (quizzes.length === 0) {
          console.log(`No quizzes found for ${grade}`);
          continue;
        }

        // Collect all questions with metadata
        const allQuestions = [];
        quizzes.forEach(quiz => {
          if (quiz.questions && quiz.questions.length > 0) {
            quiz.questions.forEach(q => {
              allQuestions.push({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                subject: quiz.lessonId?.subject || 'General',
                grade: quiz.lessonId?.grade || grade,
                difficulty: quiz.lessonId?.difficulty || 'medium',
                lessonId: quiz.lessonId?._id
              });
            });
          }
        });

        // Randomly select questions for this grade
        const selectedQuestions = [];
        const questionsCopy = [...allQuestions];
        
        for (let i = 0; i < questionsPerGrade && questionsCopy.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * questionsCopy.length);
          selectedQuestions.push(questionsCopy[randomIndex]);
          questionsCopy.splice(randomIndex, 1);
        }

        assessmentQuestions.push(...selectedQuestions);
      } catch (gradeError) {
        console.error(`Error processing ${grade}:`, gradeError);
      }
    }

    // Add some Common Entrance level questions (from Grade 6 advanced)
    try {
      const grade6Lessons = await Lesson.find({ 
        grade: 'Grade 6',
        difficulty: { $in: ['advanced', 'hard'] }
      }).select('_id subject');
      
      if (grade6Lessons.length > 0) {
        const lessonIds = grade6Lessons.map(l => l._id);
        const advancedQuizzes = await Quiz.find({ 
          lessonId: { $in: lessonIds },
          'questions.0': { $exists: true }
        }).populate('lessonId', 'subject grade difficulty');

        const ceQuestions = [];
        advancedQuizzes.forEach(quiz => {
          if (quiz.questions && quiz.questions.length > 0) {
            quiz.questions.forEach(q => {
              ceQuestions.push({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                subject: quiz.lessonId?.subject || 'General',
                grade: 'Common Entrance',
                difficulty: 'advanced',
                lessonId: quiz.lessonId?._id
              });
            });
          }
        });

        // Select 3 CE questions
        for (let i = 0; i < 3 && ceQuestions.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * ceQuestions.length);
          assessmentQuestions.push(ceQuestions[randomIndex]);
          ceQuestions.splice(randomIndex, 1);
        }
      }
    } catch (ceError) {
      console.error('Error processing Common Entrance questions:', ceError);
    }

    // Shuffle the final questions array
    for (let i = assessmentQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [assessmentQuestions[i], assessmentQuestions[j]] = [assessmentQuestions[j], assessmentQuestions[i]];
    }

    if (assessmentQuestions.length === 0) {
      return res.status(404).json({ 
        error: 'No assessment questions available. Please add quizzes to lessons first.' 
      });
    }

    res.json({
      questions: assessmentQuestions,
      totalQuestions: assessmentQuestions.length,
      grades: grades.concat(['Common Entrance'])
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessment/evaluate - Evaluate assessment and recommend grade
router.post('/evaluate', requireAuth, async (req, res) => {
  try {
    const { answers } = req.body; // Array of { questionIndex, selectedAnswer, correctAnswer, grade, subject }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    // Initialize grade performance tracking
    const gradePerformance = {
      'Grade 1': { correct: 0, total: 0, subjects: {} },
      'Grade 2': { correct: 0, total: 0, subjects: {} },
      'Grade 3': { correct: 0, total: 0, subjects: {} },
      'Grade 4': { correct: 0, total: 0, subjects: {} },
      'Grade 5': { correct: 0, total: 0, subjects: {} },
      'Grade 6': { correct: 0, total: 0, subjects: {} },
      'Common Entrance': { correct: 0, total: 0, subjects: {} }
    };

    // Track subject performance
    const subjectPerformance = {};

    // Analyze each answer
    answers.forEach(answer => {
      const { selectedAnswer, correctAnswer, grade, subject } = answer;
      const isCorrect = selectedAnswer === correctAnswer;

      // Update grade performance
      if (gradePerformance[grade]) {
        gradePerformance[grade].total += 1;
        if (isCorrect) {
          gradePerformance[grade].correct += 1;
        }

        // Track subject performance within grade
        if (!gradePerformance[grade].subjects[subject]) {
          gradePerformance[grade].subjects[subject] = { correct: 0, total: 0 };
        }
        gradePerformance[grade].subjects[subject].total += 1;
        if (isCorrect) {
          gradePerformance[grade].subjects[subject].correct += 1;
        }
      }

      // Track overall subject performance
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { correct: 0, total: 0 };
      }
      subjectPerformance[subject].total += 1;
      if (isCorrect) {
        subjectPerformance[subject].correct += 1;
      }
    });

    // Calculate percentages for each grade
    const gradePercentages = {};
    Object.keys(gradePerformance).forEach(grade => {
      const { correct, total } = gradePerformance[grade];
      gradePercentages[grade] = total > 0 ? (correct / total) * 100 : 0;
    });

    // Advanced recommendation algorithm
    const recommendGrade = () => {
      const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Common Entrance'];
      
      // Find mastery level (consistent 75%+ performance)
      let masteryGrade = 'Grade 1';
      let comfortGrade = 'Grade 1';
      
      for (const grade of grades.slice(0, 6)) { // Check Grade 1-6
        const percentage = gradePercentages[grade];
        
        if (percentage >= 75) {
          masteryGrade = grade;
        }
        if (percentage >= 60) {
          comfortGrade = grade;
        }
      }

      // Check for Common Entrance readiness
      if (gradePercentages['Common Entrance'] >= 70 && gradePercentages['Grade 6'] >= 75) {
        return {
          recommendedGrade: 'Common Entrance',
          confidence: 'high',
          reason: 'exceptional_performance'
        };
      }

      // Calculate overall performance
      const totalCorrect = answers.filter(a => a.selectedAnswer === a.correctAnswer).length;
      const overallPercentage = (totalCorrect / answers.length) * 100;

      // Determine recommendation based on mastery pattern
      let recommended = masteryGrade;
      let confidence = 'medium';
      let reason = 'mastery_based';

      // If student shows strong performance, recommend next level
      if (overallPercentage >= 85 && masteryGrade !== 'Grade 1') {
        const gradeIndex = grades.indexOf(masteryGrade);
        if (gradeIndex < grades.length - 1) {
          // Check if next grade performance is reasonable (50%+)
          const nextGrade = grades[gradeIndex + 1];
          if (gradePercentages[nextGrade] >= 50) {
            recommended = nextGrade;
            confidence = 'high';
            reason = 'ready_to_advance';
          }
        }
      }

      // If struggling overall, recommend comfort level
      if (overallPercentage < 50) {
        recommended = comfortGrade;
        confidence = 'high';
        reason = 'foundation_building';
      }

      // Subject-specific analysis
      const weakSubjects = [];
      const strongSubjects = [];
      
      Object.keys(subjectPerformance).forEach(subject => {
        const { correct, total } = subjectPerformance[subject];
        const percentage = (correct / total) * 100;
        
        if (percentage < 50) {
          weakSubjects.push(subject);
        } else if (percentage >= 75) {
          strongSubjects.push(subject);
        }
      });

      return {
        recommendedGrade: recommended,
        confidence,
        reason,
        weakSubjects,
        strongSubjects
      };
    };

    const recommendation = recommendGrade();

    // Generate detailed feedback
    const totalCorrect = answers.filter(a => a.selectedAnswer === a.correctAnswer).length;
    const overallPercentage = (totalCorrect / answers.length) * 100;

    // Subject breakdown
    const subjectBreakdown = Object.keys(subjectPerformance).map(subject => {
      const { correct, total } = subjectPerformance[subject];
      return {
        subject,
        correct,
        total,
        percentage: (correct / total) * 100
      };
    });

    res.json({
      recommendedGrade: recommendation.recommendedGrade,
      confidence: recommendation.confidence,
      reason: recommendation.reason,
      overallScore: {
        correct: totalCorrect,
        total: answers.length,
        percentage: overallPercentage
      },
      gradePerformance: Object.keys(gradePerformance).map(grade => ({
        grade,
        correct: gradePerformance[grade].correct,
        total: gradePerformance[grade].total,
        percentage: gradePercentages[grade],
        subjects: gradePerformance[grade].subjects
      })),
      subjectBreakdown,
      weakSubjects: recommendation.weakSubjects || [],
      strongSubjects: recommendation.strongSubjects || [],
      recommendations: generateRecommendations(recommendation, gradePercentages, subjectPerformance)
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate personalized recommendations
function generateRecommendations(recommendation, gradePercentages, subjectPerformance) {
  const recommendations = [];
  const { recommendedGrade, reason, weakSubjects, strongSubjects } = recommendation;

  // Main recommendation message with detailed guidance
  if (reason === 'exceptional_performance') {
    recommendations.push({
      type: 'primary',
      icon: 'trophy',
      title: 'Outstanding Performance!',
      message: `Excellent work! You've demonstrated exceptional mastery across all grade levels and are ready for Common Entrance preparation. This advanced level will challenge you and prepare you for entrance examinations to top secondary schools.`
    });
    
    recommendations.push({
      type: 'action',
      icon: 'target',
      title: 'Recommended Action Plan',
      message: `1. Enroll in Common Entrance courses to access advanced materials
2. Focus on exam techniques and time management
3. Practice with past entrance examination papers
4. Join study groups for collaborative learning`
    });
  } else if (reason === 'ready_to_advance') {
    recommendations.push({
      type: 'primary',
      icon: 'trending-up',
      title: 'Ready to Level Up!',
      message: `Great job! Your strong performance indicates you're ready for ${recommendedGrade}. This level will build on your solid foundation and introduce new concepts at an appropriate pace.`
    });
    
    recommendations.push({
      type: 'action',
      icon: 'book',
      title: 'Your Learning Path',
      message: `1. Start with ${recommendedGrade} foundational lessons
2. Review any challenging topics from previous grades
3. Set weekly learning goals for each subject
4. Track your progress with regular quizzes`
    });
  } else if (reason === 'mastery_based') {
    recommendations.push({
      type: 'primary',
      icon: 'check-circle',
      title: 'Perfect Match Found!',
      message: `Based on your performance, ${recommendedGrade} is the ideal starting point. You've shown good understanding at this level, which will help you learn confidently and effectively.`
    });
    
    recommendations.push({
      type: 'action',
      icon: 'clipboard',
      title: 'Study Strategy',
      message: `1. Begin with subjects where you showed strong performance
2. Allocate more time to areas needing improvement
3. Complete lessons in sequence for better understanding
4. Take advantage of video tutorials and interactive content`
    });
  } else if (reason === 'foundation_building') {
    recommendations.push({
      type: 'primary',
      icon: 'building',
      title: 'Building Strong Foundations',
      message: `Starting with ${recommendedGrade} will help you build a strong foundation. This level ensures you master essential concepts before progressing to more advanced material.`
    });
    
    recommendations.push({
      type: 'action',
      icon: 'layers',
      title: 'Foundation Strategy',
      message: `1. Take your time with each lesson - understanding beats speed
2. Complete all practice exercises and quizzes
3. Don't hesitate to revisit lessons if needed
4. Ask questions and seek help when concepts are unclear`
    });
  }

  // Subject-specific recommendations with detailed guidance
  if (weakSubjects && weakSubjects.length > 0) {
    const subjectTips = weakSubjects.map(subject => {
      const tips = getSubjectSpecificTips(subject);
      return `${subject}: ${tips}`;
    }).join('\n');
    
    recommendations.push({
      type: 'improvement',
      icon: 'alert-circle',
      title: 'Areas for Improvement',
      message: `Focus on these subjects:\n\n${subjectTips}\n\nTip: Spend 60% of your study time on these subjects initially.`
    });
    
    recommendations.push({
      type: 'study_tip',
      icon: 'lightbulb',
      title: 'Improvement Techniques',
      message: `1. Break down complex topics into smaller chunks
2. Use multiple learning resources (videos, readings, practice)
3. Study in focused 25-minute sessions (Pomodoro technique)
4. Review and revise regularly, not just before tests`
    });
  }

  if (strongSubjects && strongSubjects.length > 0) {
    recommendations.push({
      type: 'strength',
      icon: 'star',
      title: 'Your Strengths',
      message: `You excel in: ${strongSubjects.join(', ')}. Keep up the excellent work!\n\nLeverage these strengths: Use your strong subjects to build confidence, then apply the same study techniques to other areas.`
    });
  }

  // Time management and study schedule
  recommendations.push({
    type: 'schedule',
    icon: 'clock',
    title: 'Recommended Study Schedule',
    message: `Weekly Plan for ${recommendedGrade}:\n• Monday-Wednesday: Core subjects (${weakSubjects.length > 0 ? 'focus on ' + weakSubjects.join(', ') : 'Mathematics, English, Science'})\n• Thursday-Friday: Practice & Review\n• Weekend: Catch-up and enrichment activities\n\nAim for: 1-2 hours daily for younger students, 2-3 hours for older students`
  });

  // Learning resources suggestion
  const resourceSuggestions = generateResourceSuggestions(recommendedGrade, weakSubjects, strongSubjects);
  recommendations.push({
    type: 'resources',
    icon: 'book-open',
    title: 'Recommended Learning Resources',
    message: resourceSuggestions
  });

  // Progress tracking suggestion
  recommendations.push({
    type: 'tracking',
    icon: 'chart',
    title: 'Track Your Progress',
    message: `Set these goals:\n1. Complete at least 3 lessons per week\n2. Achieve 70%+ on all quizzes\n3. Retake the assessment in 4-6 weeks to measure improvement\n4. Maintain a study journal to track challenges and breakthroughs`
  });

  // Motivational message
  recommendations.push({
    type: 'motivation',
    icon: 'heart',
    title: 'Remember',
    message: `Learning is a journey, not a race. Everyone progresses at their own pace. Celebrate small wins, stay curious, and never stop asking questions. Your dedication to taking this assessment shows you're committed to your education - that's already a huge step forward!`
  });

  return recommendations;
}

// Helper function to get subject-specific tips
function getSubjectSpecificTips(subject) {
  const tips = {
    'Mathematics': 'Practice daily with different problem types, focus on understanding concepts not just memorizing formulas',
    'English': 'Read diverse materials daily, practice writing regularly, build vocabulary through context',
    'Science': 'Conduct simple experiments, relate concepts to real-world examples, use diagrams and visual aids',
    'ICT/Computing Skills': 'Practice hands-on with computers, learn through projects, explore coding basics',
    'Social Studies': 'Connect historical events to current affairs, use maps and timelines, discuss topics with family',
    'Geography': 'Study maps regularly, learn about different cultures, relate geography to current events',
    'Civic Education': 'Understand rights and responsibilities, discuss civic issues, participate in community activities'
  };
  
  return tips[subject] || 'Review lessons regularly, practice consistently, and seek help when needed';
}

// Helper function to generate resource suggestions
function generateResourceSuggestions(grade, weakSubjects, strongSubjects) {
  const resources = [];
  
  // General resources
  resources.push(`For ${grade}:`);
  resources.push('• Complete all video lessons in sequence');
  resources.push('• Take all chapter quizzes for self-assessment');
  resources.push('• Download and review lesson notes');
  
  // Weak subject focus
  if (weakSubjects && weakSubjects.length > 0) {
    resources.push(`\nPriority Subjects (${weakSubjects.join(', ')}):`);
    resources.push('• Watch video tutorials multiple times');
    resources.push('• Complete all practice exercises');
    resources.push('• Use flashcards for key concepts');
    resources.push('• Join study groups or get a study buddy');
  }
  
  // Strong subject leverage
  if (strongSubjects && strongSubjects.length > 0) {
    resources.push(`\nEnrichment (${strongSubjects.join(', ')}):`);
    resources.push('• Explore advanced topics in these subjects');
    resources.push('• Help peers who struggle with these subjects');
    resources.push('• Take on challenge exercises');
  }
  
  return resources.join('\n');
}

export default router;
