/**
 * Search Results Page - Displays filtered lessons and subjects based on search query
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent } from '@/components/ui/card';
import { siteConfig, formatCurrency } from '@/config/siteConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Eye,
  Search,
  Filter,
  Clock,
  ArrowRight,
  Loader2,
  X,
  CheckCircle,
  PlayCircle,
  ShoppingCart,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { searchLessons, getLessonPreviewById, type Lesson } from '@/api/lessons';
import { getEnrollments, type Enrollment } from '@/api/enrollments';
import { isEnrolled as isEnrolledUtil } from '@/utils/enrollmentUtils';
import { stripHtml } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { CoursePreviewDialog } from '@/components/CoursePreviewDialog';
import { recordSearch } from '@/api/search-history';

const ITEMS_PER_PAGE = 12;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedLessonForPreview, setSelectedLessonForPreview] = useState<Lesson | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const GRADES = ['1', '2', '3', '4', '5', '6', 'Common Entrance'];

  // Fetch matching lessons from the server whenever query or filters change.
  // Enrollments are fetched once on mount.
  useEffect(() => {
    if (user !== undefined) {
      getEnrollments().then(e => setEnrollments(e ?? []));
    }
  }, [user]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setLoading(false);
        return; // Keep last results when query is cleared
      }
      setLoading(true);
      try {
        const lessons = await searchLessons(
          searchQuery,
          selectedGrade !== 'all' ? selectedGrade : undefined,
          selectedSubject !== 'all' ? selectedSubject : undefined,
          200,
        );
        setAllLessons(lessons ?? []);
        setCurrentPage(1);
        // Record search in DB so Browse recommendations stay up to date
        if (user?.id) {
          recordSearch(searchQuery, {
            grade: selectedGrade !== 'all' ? selectedGrade : undefined,
            subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [searchQuery, selectedGrade, selectedSubject]);

  // Client-side difficulty filter only (text/grade/subject handled server-side)
  useEffect(() => {
    if (selectedDifficulty === 'all') {
      setFilteredLessons(allLessons);
    } else {
      setFilteredLessons(allLessons.filter(l => l.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()));
    }
    setCurrentPage(1);
  }, [allLessons, selectedDifficulty]);

  // Update URL when search query changes
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    }
  };

  // Get unique subjects from all lessons
  const availableSubjects = Array.from(new Set(allLessons.map(l => l.subject))).sort();

  const clearFilters = () => {
    setSelectedGrade('all');
    setSelectedSubject('all');
    setSelectedDifficulty('all');
  };

  const createSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const isLessonPurchased = (lesson: Lesson): boolean => {
    return enrollments.some(e => isEnrolledUtil(e, lesson.subject, lesson.grade, lesson.term, lesson.id));
  };

  const handleAddLessonToCart = async (lesson: Lesson) => {
    await addToCart({
      subject: lesson.subject,
      grade: lesson.grade,
      term: lesson.term,
      price: lesson.price,
      lessonId: lesson.id,
      title: lesson.title,
    });
  };

  const handlePreviewLesson = async (lesson: Lesson) => {
    // Try to fetch full preview, fall back to search result data
    const preview = await getLessonPreviewById(lesson.id).catch(() => null);
    setSelectedLessonForPreview(preview ?? lesson);
    setPreviewDialogOpen(true);
  };

  // Build the same URL that MyLearning uses so clicking a search result opens
  // the subject page and auto-selects the specific lesson.
  const buildSubjectUrl = (lesson: Lesson): string => {
    const p = new URLSearchParams();
    if (lesson.term) p.set('term', lesson.term);
    if (lesson.id) p.set('lessonId', lesson.id);
    return `/subjects/${lesson.grade}/${lesson.subject}${p.toString() ? `?${p}` : ''}`;
  };

  const formatPrice = (price?: number) => {
    return formatCurrency(price || siteConfig.defaults.lessonPrice);
  };

  const difficultyColors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500'
  };

  const activeFiltersCount = [selectedGrade, selectedSubject, selectedDifficulty].filter(f => f !== 'all').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={user?.fullName} />

      <main className="pt-2 sm:pt-6 pb-12 sm:pb-16 container mx-auto px-4 sm:px-6">
        {/* Search Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Search Results</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for lessons, subjects, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 text-base"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </form>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Filters</span>
                {activeFiltersCount > 0 && (
                  <>
                    <Badge variant="secondary" className="ml-auto">
                      {activeFiltersCount} active
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 text-xs"
                    >
                      Clear all
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Grade</label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="All grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {GRADES.map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {grade === 'Common Entrance' ? grade : `Grade ${grade}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {availableSubjects.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Summary */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <p className="text-sm text-muted-foreground break-words">
            {loading ? (
              'Searching...'
            ) : (
              <>
                Found <strong>{filteredLessons.length}</strong> {filteredLessons.length === 1 ? 'result' : 'results'}
                {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
              </>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* No Results */}
        {!loading && filteredLessons.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find what you're looking for
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </motion.div>
        )}

        {/* Results Grid */}
        {!loading && filteredLessons.length > 0 && (() => {
          const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
          const paginatedLessons = filteredLessons.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
          return (
          <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          >
            <AnimatePresence>
              {paginatedLessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  variants={fadeInUp}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {(() => {
                    const purchased = isLessonPurchased(lesson);
                    return (
                      <Card
                        className={`h-full hover:shadow-xl transition-all group cursor-pointer overflow-hidden ${
                          purchased ? 'border-green-400 dark:border-green-600' : ''
                        }`}
                        onClick={() => navigate(buildSubjectUrl(lesson))}
                      >
                        {/* Thumbnail */}
                        <div className={`h-40 relative overflow-hidden ${
                          !lesson.imageUrl
                            ? purchased
                              ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500'
                              : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500'
                            : ''
                        }`}>
                          {lesson.imageUrl ? (
                            <img src={lesson.imageUrl} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {purchased
                                ? <PlayCircle className="w-12 h-12 text-white opacity-90" />
                                : <BookOpen className="w-12 h-12 text-white opacity-90" />
                              }
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>

                          {/* Purchased banner */}
                          {purchased && (
                            <div className="absolute top-0 left-0 right-0 bg-green-600/90 text-white text-xs font-bold py-1 px-3 flex items-center gap-1 justify-center">
                              <CheckCircle className="w-3 h-3" />
                              Purchased
                            </div>
                          )}

                          {!purchased && lesson.difficulty && (
                            <div className="absolute top-3 left-3">
                              <Badge className={`text-xs font-semibold ${difficultyColors[lesson.difficulty.toLowerCase() as keyof typeof difficultyColors] || 'bg-gray-500'}`}>
                                {lesson.difficulty}
                              </Badge>
                            </div>
                          )}
                          {lesson.duration && (
                            <div className="absolute bottom-3 right-3">
                              <Badge variant="secondary" className={`text-xs gap-1 bg-white/90 transition-colors ${purchased ? 'group-hover:bg-green-100 group-hover:text-green-700' : 'group-hover:bg-indigo-100 group-hover:text-indigo-700'}`}>
                                <Clock className="w-3 h-3" />
                                {lesson.duration} min
                              </Badge>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 flex h-[calc(100%-10rem)] flex-col">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {lesson.subject}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Grade {lesson.grade}
                            </span>
                          </div>

                          <h3 className={`font-bold text-sm mb-2 line-clamp-2 leading-tight transition-colors ${
                            purchased ? 'group-hover:text-green-600' : 'group-hover:text-indigo-600'
                          }`}>
                            {lesson.title}
                          </h3>

                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {stripHtml(lesson.description)}
                          </p>

                          <div className="mt-auto space-y-2">
                            {purchased ? (
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(buildSubjectUrl(lesson));
                                }}
                              >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Continue Learning
                              </Button>
                            ) : (
                              <div>
                                <div className="flex items-baseline justify-between mb-2">
                                  <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">
                                    {formatPrice(lesson.price)}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-300 px-3"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handlePreviewLesson(lesson);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-md"
                                    size="sm"
                                    disabled={isInCart(lesson.subject, lesson.grade, lesson.term, lesson.id)}
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      await handleAddLessonToCart(lesson);
                                    }}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                                    {isInCart(lesson.subject, lesson.grade, lesson.term, lesson.id) ? 'In Cart' : 'Add to Cart'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === currentPage ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCurrentPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
          </>
          );
        })()}
      </main>

      <StudentFooter />

      {/*Lesson Preview Dialog */}
      <CoursePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        course={selectedLessonForPreview}
        isEnrolled={selectedLessonForPreview ? isLessonPurchased(selectedLessonForPreview) : false}
        isInCart={selectedLessonForPreview ? isInCart(selectedLessonForPreview.subject, selectedLessonForPreview.grade, selectedLessonForPreview.term, selectedLessonForPreview.id) : false}
        onAddToCart={() => selectedLessonForPreview && handleAddLessonToCart(selectedLessonForPreview)}
        onEnroll={() => selectedLessonForPreview && navigate(buildSubjectUrl(selectedLessonForPreview))}
      />
    </div>
  );
}
