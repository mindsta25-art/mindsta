import React, { useEffect, useState } from 'react';
import StarRating from './StarRating';
import { getRatingStats, type RatingStats } from '@/api/reviews';

interface RatingSummaryProps {
  lessonId: string;
  className?: string;
}

/**
 * Compact rating summary component that fetches and displays
 * rating statistics for a lesson. Perfect for course cards.
 */
const RatingSummary: React.FC<RatingSummaryProps> = ({ lessonId, className = '' }) => {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getRatingStats(lessonId);
        setStats(data);
      } catch (error) {
        console.error('Error loading rating stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [lessonId]);

  if (loading || !stats || stats.totalReviews === 0) {
    return null;
  }

  return (
    <div className={className}>
      <StarRating
        rating={stats.averageRating}
        totalReviews={stats.totalReviews}
        size="sm"
        showNumber={true}
      />
    </div>
  );
};

export default RatingSummary;
