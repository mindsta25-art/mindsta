import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Sparkles } from 'lucide-react';

interface DailyQuoteWidgetProps {
  quote: string;
  author: string;
  personalMessage: string;
  completedToday: number;
}

export const DailyQuoteWidget = ({
  quote,
  author,
  personalMessage,
  completedToday,
}: DailyQuoteWidgetProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-indigo-200 dark:border-indigo-900">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Personal Message */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm"
            >
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                {personalMessage}
              </p>
            </motion.div>

            {/* Quote */}
            <div className="relative">
              <Quote className="absolute -top-1 -left-1 w-8 h-8 text-purple-300 dark:text-purple-700 opacity-50" />
              <div className="pl-8">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3 italic leading-relaxed"
                >
                  "{quote}"
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-semibold text-purple-600 dark:text-purple-400"
                >
                  — {author}
                </motion.p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
