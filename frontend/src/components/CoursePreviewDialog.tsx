import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  PlayCircle,
  ShoppingCart,
  Star,
  Trophy,
  Users,
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  Award,
  Target,
  Lightbulb,
  ThumbsUp,
  MessageSquare
} from "lucide-react";
import { formatCurrency } from "@/config/siteConfig";
import type { Lesson, Section } from "@/api/lessons";
import { getReviews, getRatingStats, type Review, type RatingStats } from "@/api/reviews";
import { format } from "date-fns";

interface CoursePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Lesson | null;
  onAddToCart?: () => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isInCart?: boolean;
}

export const CoursePreviewDialog = ({
  open,
  onOpenChange,
  course,
  onAddToCart,
  onEnroll,
  isEnrolled = false,
  isInCart = false,
}: CoursePreviewDialogProps) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);

  useEffect(() => {
    if (open && course?.id) {
      fetchReviews();
      fetchRatingStats();
    }
  }, [open, course?.id]);

  const fetchReviews = async () => {
    if (!course?.id) return;
    try {
      setLoadingReviews(true);
      const data = await getReviews(course.id, {
        sortBy: 'helpful',
        page: reviewsPage,
        limit: 5
      });
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchRatingStats = async () => {
    if (!course?.id) return;
    try {
      const stats = await getRatingStats(course.id);
      setRatingStats(stats);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  };

  if (!course) return null;

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const getTotalLectures = () => {
    if (!course.curriculum || course.curriculum.length === 0) return 0;
    return course.curriculum.reduce((total, section) => total + (section.lectures?.length || 0), 0);
  };

  const getTotalDuration = () => {
    if (!course.curriculum || course.curriculum.length === 0) return 0;
    return course.curriculum.reduce((total, section) => {
      return total + (section.lectures?.reduce((sectionTotal, lecture) => sectionTotal + (lecture.duration || 0), 0) || 0);
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty?.toLowerCase() || 'beginner';
    switch (diff) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getLectureIcon = (type: string) => {
    switch (type) {
      case 'video':
        return PlayCircle;
      case 'article':
        return FileText;
      case 'quiz':
        return Trophy;
      default:
        return FileText;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold mb-2">{course.title}</DialogTitle>
              {course.subtitle && (
                <DialogDescription className="text-lg">{course.subtitle}</DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Course Header Info */}
        <div className="space-y-4">
          <p className="text-muted-foreground text-lg leading-relaxed">{course.description}</p>

          {/* Course Metadata */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <span className="font-medium">
                {course.grade === "Common Entrance" ? "Common Entrance" : `Grade ${course.grade}`}
              </span>
            </div>
            <Badge className={getDifficultyColor(course.difficulty)}>
              {course.difficulty?.charAt(0).toUpperCase() + course.difficulty?.slice(1).toLowerCase()}
            </Badge>
            {course.rating && course.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold">{course.rating.toFixed(1)}</span>
                {course.ratingsCount && (
                  <span className="text-muted-foreground text-sm">({course.ratingsCount} ratings)</span>
                )}
              </div>
            )}
            {course.enrolledStudents && course.enrolledStudents > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-sm">{course.enrolledStudents.toLocaleString()} students</span>
              </div>
            )}
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sections</p>
                  <p className="text-xl font-bold">{course.curriculum?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lectures</p>
                  <p className="text-xl font-bold">{getTotalLectures()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-xl font-bold">{formatDuration(getTotalDuration())}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-lg font-bold capitalize">{course.difficulty || 'Beginner'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Tabs for Different Sections */}
        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews
              {ratingStats && ratingStats.totalReviews > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {ratingStats.totalReviews}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Course Content
              </h3>
              <p className="text-sm text-muted-foreground">
                {course.curriculum?.length || 0} sections • {getTotalLectures()} lectures • {formatDuration(getTotalDuration())} total length
              </p>
            </div>

            {course.curriculum && course.curriculum.length > 0 ? (
              <div className="space-y-2">
                {course.curriculum.map((section, sectionIdx) => {
                  const isExpanded = expandedSections.has(sectionIdx);
                  const sectionDuration = section.lectures?.reduce((total, lecture) => total + (lecture.duration || 0), 0) || 0;

                  return (
                    <Card key={sectionIdx} className="overflow-hidden">
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                        onClick={() => toggleSection(sectionIdx)}
                      >
                        <div className="flex items-start gap-3 text-left flex-1">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="font-semibold">
                              Section {sectionIdx + 1}: {section.title}
                            </div>
                            {section.description && (
                              <div className="text-sm text-muted-foreground font-normal">
                                {section.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{section.lectures?.length || 0} lectures</span>
                              <span>•</span>
                              <span>{formatDuration(sectionDuration)}</span>
                            </div>
                          </div>
                        </div>
                      </Button>

                      {isExpanded && section.lectures && section.lectures.length > 0 && (
                        <CardContent className="px-4 py-0 pb-4 space-y-0">
                          {section.lectures.map((lecture, lectureIdx) => {
                            const LectureIcon = getLectureIcon(lecture.type);
                            const isPreview = lecture.isPreview || false;

                            return (
                              <div key={lectureIdx}>
                                <div className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors">
                                  <div className="flex items-center gap-3 flex-1">
                                    <LectureIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                                        <span>{lecture.title}</span>
                                        {isPreview && (
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                            Preview
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {lecture.type}
                                        </Badge>
                                        {lecture.duration > 0 && (
                                          <>
                                            <span>•</span>
                                            <span>{formatDuration(lecture.duration)}</span>
                                          </>
                                        )}
                                        {lecture.resources && lecture.resources.length > 0 && (
                                          <>
                                            <span>•</span>
                                            <span>{lecture.resources.length} resources</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {!isEnrolled && !isPreview && (
                                    <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                {lectureIdx < section.lectures.length - 1 && (
                                  <Separator className="mx-4" />
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No curriculum content available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Course Overview - Added for student preview */}
            {(course as any).overview && (
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Course Overview
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">{(course as any).overview}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* What you'll learn */}
            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    What you'll learn
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {course.whatYouWillLearn.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Target Audience */}
            {course.targetAudience && course.targetAudience.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Who this course is for
                  </h3>
                  <ul className="space-y-2">
                    {course.targetAudience.map((item, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Learning Objectives */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    Learning Objectives
                  </h3>
                  <ul className="space-y-2">
                    {course.learningObjectives.map((item, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6 mt-6">
            {/* Rating Statistics */}
            {ratingStats && ratingStats.totalReviews > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-purple-600">
                        {ratingStats.averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 my-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(ratingStats.averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingStats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
                        const percentage = ratingStats.totalReviews > 0 
                          ? (count / ratingStats.totalReviews) * 100 
                          : 0;
                        
                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-16">
                              <span className="text-sm font-medium">{rating}</span>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </div>
                            <Progress value={percentage} className="h-2 flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading reviews...</p>
                </CardContent>
              </Card>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{review.userName}</span>
                            {review.isVerifiedPurchase && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(review.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {review.title && (
                        <h4 className="font-semibold mb-2">{review.title}</h4>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {review.comment}
                      </p>
                      
                      {review.instructorResponse && (
                        <Card className="bg-muted/50 mt-4">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2 mb-2">
                              <Award className="w-4 h-4 text-purple-600 mt-1" />
                              <div>
                                <p className="text-sm font-semibold">Instructor Response</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(review.instructorResponse.respondedAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm pl-6">{review.instructorResponse.comment}</p>
                          </CardContent>
                        </Card>
                      )}
                      
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="text-xs">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Be the first to share your experience!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6 mt-6">
            {course.requirements && course.requirements.length > 0 ? (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Requirements
                  </h3>
                  <ul className="space-y-3">
                    {course.requirements.map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No specific requirements</p>
                  <p className="text-sm text-muted-foreground mt-2">This course is suitable for all students</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-background pt-4 border-t mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              {isEnrolled ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">You own this course</span>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(course.price || 0)}</p>
                  <p className="text-sm text-muted-foreground">One-time payment</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEnrolled ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/grade/${course.grade}/${course.subject}/lesson/${course.id}`);
                  }}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Go to Course
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => {
                      onAddToCart?.();
                      onOpenChange(false);
                    }}
                    disabled={isInCart}
                  >
                    {isInCart ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
