import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitReview, updateReview } from "@/api/reviews";
import confetti from 'canvas-confetti';

interface CourseRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  grade: string;
  term: string;
  lessonId: string;
  existingReview?: {
    id: string;
    rating: number;
    title: string;
    comment: string;
  } | null;
  onReviewSubmitted?: () => void;
}

export const CourseRatingDialog = ({
  open,
  onOpenChange,
  subject,
  grade,
  term,
  lessonId,
  existingReview,
  onReviewSubmitted
}: CourseRatingDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (title.trim().length === 0) {
      toast({
        title: "Title Required",
        description: "Please add a title for your review.",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Review Too Short",
        description: "Please write at least 10 characters in your review.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      if (existingReview) {
        await updateReview(existingReview.id, { 
          rating, 
          title: title.trim(),
          comment: comment.trim()
        });
        toast({
          title: "Review Updated",
          description: "Your review has been updated successfully!",
        });
      } else {
        await submitReview(lessonId, {
          rating,
          title: title.trim(),
          comment: comment.trim()
        });
        
        // Celebrate!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        });
      }

      onReviewSubmitted?.();
      
      setTimeout(() => {
        onOpenChange(false);
      }, existingReview ? 0 : 1500);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existingReview ? 'Update Your Review' : 'Rate This Course'}</DialogTitle>
          <DialogDescription>
            Share your experience with {subject} - {grade === "Common Entrance" ? "Common Entrance" : `Grade ${grade}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground font-medium">
                {rating === 1 && "⭐ Poor"}
                {rating === 2 && "⭐⭐ Fair"}
                {rating === 3 && "⭐⭐⭐ Good"}
                {rating === 4 && "⭐⭐⭐⭐ Very Good"}
                {rating === 5 && "⭐⭐⭐⭐⭐ Excellent"}
              </p>
            )}
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Review Title</label>
            <Input
              placeholder="Sum up your experience in one line"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100 characters
            </p>
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Your Review</label>
            <Textarea
              placeholder="Share your thoughts about this course... What did you like? What could be improved?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/2000 characters (minimum 10)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0 || title.trim().length === 0 || comment.trim().length < 10}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
