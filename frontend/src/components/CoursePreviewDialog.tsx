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
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (open && course?.id) {
      // Reset reviews when opening dialog
      setAllReviews([]);
      setReviewsPage(1);
      fetchReviews(1);
      fetchRatingStats();
    }
  }, [open, course?.id]);

  const fetchReviews = async (page = 1) => {
    if (!course?.id) return;
    try {
      setLoadingReviews(true);
      const data = await getReviews(course.id, {
        sortBy: 'helpful',
        page,
        limit: 10  // Increased from 5 to show more reviews
      });
      
      if (page === 1) {
        setAllReviews(data.reviews || []);
      } else {
        setAllReviews(prev => [...prev, ...(data.reviews || [])]);
      }
      
      setHasMoreReviews((data.reviews?.length || 0) >= 10);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadMoreReviews = () => {
    const nextPage = reviewsPage + 1;
    setReviewsPage(nextPage);
    fetchReviews(nextPage);
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        {/* Premium Header with Gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6 sm:p-8">
          <DialogHeader>
            <div className="flex-1">
              <DialogTitle className="text-2xl sm:text-3xl font-bold mb-2">{course.title}</DialogTitle>
              {course.subtitle && (
                <DialogDescription className="text-base sm:text-lg text-white/90">{course.subtitle}</DialogDescription>
              )}
            </div>
          </DialogHeader>

          {/* Course Metadata - White on gradient */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">
                {course.grade === "Common Entrance" ? "Common Entrance" : `Grade ${course.grade}`}
              </span>
            </div>
            {course.rating && course.rating > 0 && (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-300 text-amber-300" />
                <span className="font-bold text-sm sm:text-base">{course.rating.toFixed(1)}</span>
                {course.ratingsCount && (
                  <span className="text-white/80 text-xs sm:text-sm">({course.ratingsCount})</span>
                )}
              </div>
            )}
            {course.enrolledStudents && course.enrolledStudents > 0 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{course.enrolledStudents.toLocaleString()} students</span>
              </div>
            )}
            <Badge className={`${getDifficultyColor(course.difficulty)} text-xs sm:text-sm`}>
              {course.difficulty?.charAt(0).toUpperCase() + course.difficulty?.slice(1).toLowerCase()}
            </Badge>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Course Description */}
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">{course.description}</p>

          {/* Course Stats - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lessons</p>
                  <p className="text-lg sm:text-xl font-bold">{course.curriculum?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lectures</p>
                  <p className="text-lg sm:text-xl font-bold">{getTotalLectures()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-base sm:text-xl font-bold">{formatDuration(getTotalDuration())}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                  <p className="text-lg sm:text-xl font-bold">{(course as any).quizCount ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Tabs for Different Sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews
              {ratingStats && ratingStats.totalReviews > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {ratingStats.totalReviews}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Course Content
              </h3>
              <p className="text-sm text-muted-foreground">
                {course.curriculum?.length || 0} lessons • {getTotalLectures()} lectures • {formatDuration(getTotalDuration())} total length
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
                              Lesson {sectionIdx + 1}: {section.title}
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
            {/* Course Overview/Description */}
            {((course as any).overview || course.description || course.content) && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Course Overview
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {(course as any).overview || course.description || course.content}
                    </p>
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
            ) : allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((review) => (
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
                
                {/* Load More Reviews Button */}
                {hasMoreReviews && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreReviews}
                      disabled={loadingReviews}
                    >
                      {loadingReviews ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>Load More Reviews</>
                      )}
                    </Button>
                  </div>
                )}
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
                    navigate(`/subjects/${course.grade}/${course.subject}${course.term ? `?term=${course.term}` : ''}`);
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
