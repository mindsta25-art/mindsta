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
  Search,
  Filter,
  Clock,
  Target,
  GraduationCap,
  ArrowRight,
  Loader2,
  X,
  CheckCircle,
  PlayCircle,
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAllLessons, type Lesson } from '@/api/lessons';
import { getEnrollments, type Enrollment } from '@/api/enrollments';
import { isEnrolled as isEnrolledUtil } from '@/utils/enrollmentUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

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
  const { addToWishlist, isInWishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 12;

  const GRADES = ['1', '2', '3', '4', '5', '6', 'Common Entrance'];

  // Fetch all lessons + enrollments
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const [lessons, userEnrollments] = await Promise.allSettled([
          getAllLessons(),
          user ? getEnrollments() : Promise.resolve([]),
        ]);
        setAllLessons(lessons.status === 'fulfilled' ? lessons.value || [] : []);
        setEnrollments(userEnrollments.status === 'fulfilled' ? userEnrollments.value : []);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [user]);

  // Filter lessons based on search query and filters
  useEffect(() => {
    let results = [...allLessons];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(lesson => 
        lesson.title?.toLowerCase().includes(query) ||
        lesson.description?.toLowerCase().includes(query) ||
        lesson.subject?.toLowerCase().includes(query)
      );
    }

    // Grade filter
    if (selectedGrade !== 'all') {
      results = results.filter(lesson => lesson.grade === selectedGrade);
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      results = results.filter(lesson => lesson.subject === selectedSubject);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      results = results.filter(lesson => lesson.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    setFilteredLessons(results);
    setCurrentPage(1);
  }, [searchQuery, allLessons, selectedGrade, selectedSubject, selectedDifficulty]);

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
    return enrollments.some(e => isEnrolledUtil(e, lesson.subject, lesson.grade, lesson.term));
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
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              'Searching...'
            ) : (
              <>
                Found <strong>{filteredLessons.length}</strong> {filteredLessons.length === 1 ? 'result' : 'results'}
                {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
                {filteredLessons.length > RESULTS_PER_PAGE && (
                  <span className="ml-2">
                    — showing {Math.min((currentPage - 1) * RESULTS_PER_PAGE + 1, filteredLessons.length)}–{Math.min(currentPage * RESULTS_PER_PAGE, filteredLessons.length)}
                  </span>
                )}
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
        {!loading && filteredLessons.length > 0 && (
          <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          >
            <AnimatePresence>
              {filteredLessons.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE).map((lesson) => (
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
                            <img src={lesson.imageUrl} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover" />
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

                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
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
                            {lesson.description}
                          </p>

                          <div className="flex items-center justify-between">
                            {purchased ? (
                              <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Purchased
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-indigo-600">
                                {formatPrice(lesson.price)}
                              </span>
                            )}
                            <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${
                              purchased ? 'text-green-600' : 'text-indigo-600'
                            }`} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination Controls */}
          {filteredLessons.length > RESULTS_PER_PAGE && (
            <div className="flex justify-center items-center gap-2 mt-10 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(filteredLessons.length / RESULTS_PER_PAGE);
                  const pages: number[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else if (currentPage <= 4) {
                    for (let i = 1; i <= 5; i++) pages.push(i);
                    pages.push(-1); pages.push(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    pages.push(1); pages.push(-1);
                    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1); pages.push(-1);
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                    pages.push(-2); pages.push(totalPages);
                  }
                  return pages.map((page, idx) =>
                    page < 0 ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={currentPage === page ? 'bg-indigo-600 hover:bg-indigo-700 text-white w-9' : 'w-9'}
                      >
                        {page}
                      </Button>
                    )
                  );
                })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => { setCurrentPage(p => Math.min(Math.ceil(filteredLessons.length / RESULTS_PER_PAGE), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage >= Math.ceil(filteredLessons.length / RESULTS_PER_PAGE)}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          </>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
