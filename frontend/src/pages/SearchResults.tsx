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
  X
} from 'lucide-react';
import { getAllLessons, type Lesson } from '@/api/lessons';
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

  const GRADES = ['1', '2', '3', '4', '5', '6', 'Common Entrance'];

  // Fetch all lessons
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const lessons = await getAllLessons();
        setAllLessons(lessons || []);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

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

      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 container mx-auto px-4 sm:px-6">
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
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          >
            <AnimatePresence>
              {filteredLessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  variants={fadeInUp}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow group cursor-pointer overflow-hidden">
                    <div
                      onClick={() => {
                        const subjectSlug = createSlug(lesson.subject);
                        navigate(`/grade/${lesson.grade}/${subjectSlug}/lesson/${lesson.id}`);
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="h-40 bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white opacity-90" />
                        </div>
                        {lesson.difficulty && (
                          <div className="absolute top-3 left-3">
                            <Badge className={`text-xs font-semibold ${difficultyColors[lesson.difficulty.toLowerCase() as keyof typeof difficultyColors] || 'bg-gray-500'}`}>
                              {lesson.difficulty}
                            </Badge>
                          </div>
                        )}
                        {lesson.duration && (
                          <div className="absolute bottom-3 right-3">
                            <Badge variant="secondary" className="text-xs gap-1 bg-white/90">
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
                        
                        <h3 className="font-bold text-sm mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                          {lesson.title}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {lesson.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-indigo-600">
                            {formatPrice(lesson.price)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
