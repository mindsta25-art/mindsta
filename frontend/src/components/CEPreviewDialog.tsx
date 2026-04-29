import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Clock,
  GraduationCap,
  ShoppingCart,
  Star,
  Trophy,
  Users,
  CheckCircle,
  Target,
  PlayCircle,
} from "lucide-react";
import { formatCurrency } from "@/config/siteConfig";
import type { CommonExam } from "@/api/commonEntrance";
import { stripHtml } from "@/utils/helpers";

interface CEPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: CommonExam | null;
  onAddToCart?: () => void;
  onStartExam?: () => void;
  isEnrolled?: boolean;
  isInCart?: boolean;
}

export const CEPreviewDialog = ({
  open,
  onOpenChange,
  exam,
  onAddToCart,
  onStartExam,
  isEnrolled = false,
  isInCart = false,
}: CEPreviewDialogProps) => {
  if (!exam) return null;

  const timeMins = Math.round(exam.timeLimit / 60);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero */}
        <div className="relative h-44 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-400 flex items-center justify-center overflow-hidden rounded-t-lg">
          {exam.imageUrl ? (
            <img
              src={exam.imageUrl}
              alt={exam.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : null}
          <div className="relative z-10 flex flex-col items-center gap-2 text-white text-center px-4">
            <Trophy className="w-12 h-12 drop-shadow-lg" />
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold">COMMON ENTRANCE EXAM</Badge>
          </div>
          {/* Decorative */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />
        </div>

        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold leading-snug">{exam.title}</DialogTitle>
            {exam.subtitle && (
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {exam.subtitle}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="font-medium">{exam.subject}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <BookOpen className="w-4 h-4 text-pink-600" />
              <span>{exam.questionCount} questions</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{timeMins} minutes</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Target className="w-4 h-4 text-rose-600" />
              <span>Pass: {exam.passingScore}%</span>
            </div>
            {exam.enrolledStudents > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>{exam.enrolledStudents.toLocaleString()} students</span>
              </div>
            )}
            {exam.rating > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{exam.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({exam.ratingsCount})</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Overview */}
          {exam.overview && stripHtml(exam.overview) ? (
            <div>
              <h3 className="font-semibold mb-2">About this exam</h3>
              <div
                className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: exam.overview }}
              />
            </div>
          ) : exam.description ? (
            <div>
              <h3 className="font-semibold mb-2">About this exam</h3>
              <p className="text-sm text-muted-foreground">{exam.description}</p>
            </div>
          ) : null}

          <Separator />

          {/* What to expect */}
          <div>
            <h3 className="font-semibold mb-3">What to expect</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                `${exam.questionCount} multiple-choice questions`,
                `${timeMins}-minute time limit`,
                `${exam.passingScore}% required to pass`,
                "Instant results with explanations",
                "Covers Common Entrance syllabus",
                "Retake as many times as needed",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-4">
            <div>
              {exam.price === 0 ? (
                <span className="text-2xl font-black text-green-600">FREE</span>
              ) : (
                <span className="text-2xl font-black">{formatCurrency(exam.price)}</span>
              )}
              {isEnrolled && (
                <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> You have access
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {isEnrolled ? (
                <Button onClick={() => { onStartExam?.(); onOpenChange(false); }} className="gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Start Exam
                </Button>
              ) : isInCart ? (
                <Button variant="secondary" className="gap-2" onClick={() => onOpenChange(false)}>
                  <ShoppingCart className="w-4 h-4" />
                  In Cart
                </Button>
              ) : (
                <Button onClick={() => { onAddToCart?.(); onOpenChange(false); }} className="gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {exam.price === 0 ? "Enroll Free" : "Add to Cart"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
