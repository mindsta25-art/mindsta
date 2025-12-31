/**
 * Recent Activity Component - Shows latest learning activities with timeline view
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart3, Award, CheckCircle2, Clock } from 'lucide-react';
import type { RecentActivity } from '../hooks/useRecentActivities';

interface RecentActivitySectionProps {
  activities: RecentActivity[];
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const RecentActivitySectionComponent = ({ activities }: RecentActivitySectionProps) => {
  if (!activities || activities.length === 0) return null;

  const getActivityIcon = (type: string, score?: number) => {
    if (type === 'quiz') {
      if (score && score >= 90) return { icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
      return { icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    }
    return { icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' };
  };

  const formatTimeAgo = (timeStr: string) => {
    // Parse relative time (e.g., "2 hours ago", "Yesterday")
    return timeStr;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mb-8 sm:mb-12"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Recent Activity</h2>
        <Badge variant="outline" className="gap-2">
          <CheckCircle2 className="w-3 h-3" />
          {activities.length} Activities
        </Badge>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative space-y-0"
            role="list"
            aria-label="Recent learning activities"
          >
            {/* Timeline line */}
            <div className="absolute left-[19px] sm:left-[23px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-200 via-blue-200 to-transparent dark:from-indigo-800 dark:via-blue-800" aria-hidden="true" />
            
            {activities.slice(0, 5).map((activity, index) => {
              const iconConfig = getActivityIcon(activity.type, activity.score);
              const Icon = iconConfig.icon;
              const isLast = index === activities.length - 1 || index === 4;

              return (
                <motion.div
                  key={activity.id}
                  variants={fadeInUp}
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-colors hover:bg-muted/30 ${
                    !isLast ? 'pb-6' : ''
                  }`}
                  role="listitem"
                >
                  {/* Timeline node */}
                  <motion.div
                    className={`relative z-10 p-2 sm:p-2.5 ${iconConfig.bg} rounded-xl shadow-sm flex-shrink-0`}
                    aria-hidden="true"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconConfig.color}`} />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate leading-tight">
                          {activity.title}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {activity.subject}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {typeof activity.score === 'number' && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                          >
                            <Badge
                              variant={activity.score >= 80 ? 'default' : activity.score >= 60 ? 'secondary' : 'destructive'}
                              className="text-xs font-bold"
                              aria-label={`Score: ${activity.score}%`}
                            >
                              {activity.score}%
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    {/* Time indicator */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(activity.time)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* View all button */}
          {activities.length > 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 pt-4 border-t text-center"
            >
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                View All Activities ({activities.length})
              </button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const RecentActivitySection = memo(RecentActivitySectionComponent);
