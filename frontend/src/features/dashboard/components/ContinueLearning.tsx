/**
 * Continue Learning Component - Shows most recent incomplete lesson with progress tracking
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import {
  BookOpen,
  Clock,
  Target,
  GraduationCap,
  PlayCircle,
  Heart,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import type { ContinueLearningData } from '../hooks/useContinueLearning';
import { createSlug } from '../utils/formatters';

interface ContinueLearningProps {
  data: ContinueLearningData | null;
  selectedGrade?: string;
  onAddToWishlist: (subject: string, grade: string, term: string) => void;
  isInWishlist: (subject: string, grade: string, term: string) => boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ContinueLearningComponent = ({
  data,
  selectedGrade,
  onAddToWishlist,
  isInWishlist
}: ContinueLearningProps) => {
  const navigate = useNavigate();

  if (!data) return null;

  const { lesson, progress: lessonProgress = 0 } = data;
  const grade = selectedGrade || lesson.grade;
  const subjectSlug = createSlug(lesson.subject);

  // Calculate estimated time remaining (mock calculation)
  const totalDuration = lesson.duration || 30;
  const timeRemaining = Math.ceil(totalDuration * (1 - lessonProgress / 100));

  const handleNavigate = () => {
    navigate(`/grade/${grade}/${subjectSlug}/lesson/${lesson.id}`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToWishlist(lesson.subject, lesson.grade, lesson.term);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8 sm:mb-12"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Continue Learning</h2>
        <Badge variant="outline" className="gap-2">
          <TrendingUp className="w-3 h-3" />
          {lessonProgress}% Complete
        </Badge>
      </div>
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-indigo-100 dark:border-indigo-900 overflow-hidden">
          <HoverCard openDelay={200} closeDelay={150}>
            <HoverCardTrigger asChild>
              <div
                className="flex flex-col md:flex-row cursor-pointer"
                onClick={handleNavigate}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                aria-label={`Continue learning ${lesson.title}`}
              >
                {/* Thumbnail with circular progress */}
                <div className="relative h-48 md:h-auto md:w-64 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 flex-shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  
                  {/* Circular progress indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="8"
                          fill="none"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="white"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 352" }}
                          animate={{ 
                            strokeDasharray: `${(lessonProgress / 100) * 352} 352`
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-3 left-3">
                    <Badge className="font-semibold shadow-lg">{lesson.subject}</Badge>
                  </div>
                  
                  {/* Progress badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-indigo-700 font-bold">
                      {lessonProgress}% Done
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 sm:p-6 flex-1">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-bold group-hover:text-indigo-600 transition-colors flex-1">
                          {lesson.title}
                        </h3>
                        {lessonProgress > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-2"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {lesson.description}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Your Progress</span>
                          <span className="font-semibold text-indigo-600">{lessonProgress}%</span>
                        </div>
                        <Progress value={lessonProgress} className="h-2" />
                      </div>
                    </div>

                    {/* Meta info with enhanced design */}
                    <div className="grid grid-cols-4 gap-2 py-3 px-3 bg-muted/30 rounded-lg mb-4">
                      <div className="text-center">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-blue-600" aria-hidden="true" />
                        <p className="text-xs font-medium truncate">{lesson.subject}</p>
                      </div>
                      <div className="text-center">
                        <GraduationCap className="w-4 h-4 mx-auto mb-1 text-indigo-600" aria-hidden="true" />
                        <p className="text-xs font-medium">Grade {lesson.grade}</p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-orange-600" aria-hidden="true" />
                        <p className="text-xs font-medium">{timeRemaining}m left</p>
                      </div>
                      <div className="text-center">
                        <Target className="w-4 h-4 mx-auto mb-1 text-green-600" aria-hidden="true" />
                        <p className="text-xs font-medium capitalize">
                          {lesson.difficulty || 'Medium'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-2 font-semibold"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNavigate();
                        }}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Continue Learning
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleWishlist}
                        disabled={isInWishlist(lesson.subject, lesson.grade, lesson.term)}
                        aria-label="Add to wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isInWishlist(lesson.subject, lesson.grade, lesson.term)
                              ? 'fill-current text-red-500'
                              : ''
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-96" side="right" align="start" sideOffset={10}>
              <div className="space-y-2">
                <h4 className="font-semibold">{lesson.title}</h4>
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Subject</p>
                    <p className="font-medium">{lesson.subject}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Grade</p>
                    <p className="font-medium">{lesson.grade}</p>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export const ContinueLearning = memo(ContinueLearningComponent);
