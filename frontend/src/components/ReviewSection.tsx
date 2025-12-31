import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, ShieldCheck, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  getReviews,
  getRatingStats,
  getMyReview,
  submitReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  type Review,
  type RatingStats,
} from '@/api/reviews';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface ReviewSectionProps {
  lessonId: string;
  isAuthenticated: boolean;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ lessonId, isAuthenticated }) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'helpful' | 'recent' | 'highest' | 'lowest'>('helpful');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Load reviews and stats
  useEffect(() => {
    loadReviewData();
  }, [lessonId, sortBy, filterRating, page]);

  // Load user's review if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadMyReview();
    }
  }, [lessonId, isAuthenticated]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        getReviews(lessonId, {
          sortBy,
          rating: filterRating || undefined,
          page,
          limit: 10,
        }),
        getRatingStats(lessonId),
      ]);

      setReviews(reviewsData.reviews);
      setRatingStats(statsData);
      setTotalPages(reviewsData.pagination.pages);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMyReview = async () => {
    try {
      const data = await getMyReview(lessonId);
      setMyReview(data.review);
    } catch (error) {
      console.error('Error loading my review:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await submitReview(lessonId, reviewForm);
      toast({
        title: "Success",
        description: editingReview ? "Review updated successfully" : "Review submitted successfully",
      });
      setShowReviewDialog(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      setEditingReview(false);
      loadReviewData();
      loadMyReview();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = () => {
    if (myReview) {
      setReviewForm({
        rating: myReview.rating,
        title: myReview.title,
        comment: myReview.comment,
      });
      setEditingReview(true);
      setShowReviewDialog(true);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;

    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
      await deleteReview(myReview._id);
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      setMyReview(null);
      loadReviewData();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await markReviewHelpful(reviewId);
      
      // Update the review in the list
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? { ...review, helpfulCount: result.helpfulCount }
            : review
        )
      );
      
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast({
        title: "Error",
        description: "Failed to update helpful status",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!ratingStats) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingStats.ratingDistribution[rating as keyof typeof ratingStats.ratingDistribution];
          const percentage = ratingStats.totalReviews > 0 
            ? (count / ratingStats.totalReviews) * 100 
            : 0;

          return (
            <button
              key={rating}
              onClick={() => setFilterRating(filterRating === rating ? null : rating)}
              className={`w-full flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors ${
                filterRating === rating ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-1 min-w-[80px]">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-1" />
              <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {ratingStats && (
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {ratingStats.averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(ratingStats.averageRating), 'lg')}
                <p className="text-muted-foreground mt-2">
                  {ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Distribution */}
              <div>
                <h3 className="font-semibold mb-4">Rating Distribution</h3>
                {renderRatingDistribution()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {isAuthenticated && (
        <div className="flex gap-3">
          {myReview ? (
            <>
              <Button onClick={handleEditReview} variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Your Review
              </Button>
              <Button onClick={handleDeleteReview} variant="outline" className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Review
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowReviewDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Write a Review
            </Button>
          )}
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterRating && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterRating(null)}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{review.userName}</span>
                          {review.isVerifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        {renderStars(review.rating, 'sm')}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-semibold mb-2">{review.title}</h4>
                    <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{review.comment}</p>

                    {review.instructorResponse && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
                        <p className="font-semibold text-sm mb-2">Instructor Response:</p>
                        <p className="text-sm">{review.instructorResponse.comment}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkHelpful(review._id)}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Helpful ({review.helpfulCount})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingReview ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
            <DialogDescription>
              Share your experience with this course to help other learners
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <Label>Your Rating *</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewForm.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reviewForm.title.length}/100 characters
              </p>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment">Your Review *</Label>
              <Textarea
                id="comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="What did you like or dislike about this course?"
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reviewForm.comment.length}/2000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setReviewForm({ rating: 5, title: '', comment: '' });
                setEditingReview(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || !reviewForm.title.trim() || !reviewForm.comment.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;
