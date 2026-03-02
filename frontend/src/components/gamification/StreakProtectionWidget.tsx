import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Shield, Zap, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StreakProtectionProps {
  currentStreak: number;
  bestStreak: number;
  freezesAvailable: number;
  onUseFreeze: () => void;
}

export const StreakProtectionWidget = ({
  currentStreak,
  bestStreak,
  freezesAvailable,
  onUseFreeze,
}: StreakProtectionProps) => {
  const isNewRecord = currentStreak > 0 && currentStreak === bestStreak;

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-200 dark:border-orange-900/30">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          Streak Protection
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Current Streak Display */}
          <div className="text-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: currentStreak > 0 ? [0, -5, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-3 shadow-lg"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{currentStreak}</div>
                <div className="text-xs text-white/90">days</div>
              </div>
            </motion.div>
            {isNewRecord && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center gap-2 mb-2"
              >
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  New Record!
                </Badge>
              </motion.div>
            )}
            <p className="text-sm text-muted-foreground">
              Best: {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>

          {/* Freeze Info */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  Streak Freezes
                  <Badge variant="outline" className="text-xs">
                    {freezesAvailable} available
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Protect your streak when you can't study. Use a freeze to maintain your streak for one day.
                </p>
                {freezesAvailable > 0 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full">
                        <Shield className="w-4 h-4 mr-2" />
                        Use Freeze
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Use Streak Freeze?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will protect your streak for today. You'll have{' '}
                          {freezesAvailable - 1} freeze{freezesAvailable - 1 !== 1 ? 's' : ''}{' '}
                          remaining after this.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onUseFreeze}>
                          Use Freeze
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-900">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      No freezes available. Earn more by maintaining weekly streaks!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Earn More Info */}
          <div className="text-center text-xs text-muted-foreground">
            Earn 1 freeze every week you meet your daily goals!
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
