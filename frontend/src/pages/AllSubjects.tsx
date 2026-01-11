import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  Clock,
  Target,
  ChevronRight,
  Filter,
  Grid3x3,
  List
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { getStudentByUserId } from '@/api';
import { getSubjects, type Subject as SubjectType } from '@/api/subjects';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

const CATEGORIES = ['All', 'Core', 'Science', 'Social', 'Languages', 'Arts', 'Technology', 'Practical', 'Religious', 'Business'];
const GRADE_OPTIONS = ['All Grades', '1', '2', '3', '4', '5', '6'];

const AllSubjects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInCart } = useCart();
  const { isInWishlist } = useWishlist();
  const [studentName, setStudentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const s = await getStudentByUserId(user.id);
        setStudentName(s?.fullName || '');
      } catch (error) {
        console.error('Error loading student:', error);
      }
    };
    load();
  }, [user]);

  // Fetch subjects from the database
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const fetchedSubjects = await getSubjects();
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects([]);
      }
      setLoading(false);
    };
    fetchSubjects();
  }, []);

  // Filter subjects based on search and category
  useEffect(() => {
    let filtered = subjects;
    if (searchQuery) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(subject => subject.category === selectedCategory);
    }
    setFilteredSubjects(filtered);
  }, [subjects, searchQuery, selectedCategory]);

  const handleSubjectClick = (subject: SubjectType) => {
    navigate(`/browse?subject=${encodeURIComponent(subject.name)}`);
  };

  const totalSubjects = subjects.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentHeader studentName={studentName} />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block p-3 sm:p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-4 sm:mb-6">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Explore All Subjects
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Discover comprehensive courses across all subjects for grades 1-6
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{totalSubjects}</div>
                  <div className="text-xs sm:text-sm text-white/80">Total Subjects</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{totalLessons}+</div>
                  <div className="text-xs sm:text-sm text-white/80">Total Lessons</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">6</div>
                  <div className="text-xs sm:text-sm text-white/80">Grade Levels</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">10+</div>
                  <div className="text-xs sm:text-sm text-white/80">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="container mx-auto px-4 -mt-8 relative z-10">
          <Card className="shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 sm:pl-10 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Grade Filter */}
                <div className="w-full lg:w-48">
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade === 'All Grades' ? 'All Grades' : `Grade ${grade}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 justify-center lg:justify-start">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs and Subjects */}
        <div className="container mx-auto px-4 mt-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="overflow-x-auto pb-2 mb-6 sm:mb-8">
              <TabsList className="inline-flex w-auto min-w-full justify-start sm:justify-center">
                {CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4"
                  >
                    {category}
                    {category !== 'All' && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {subjects.filter(s => s.category === category).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredSubjects.length}</span> subject{filteredSubjects.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Subjects Grid/List */}
            {filteredSubjects.length === 0 ? (
              <Card className="p-12 sm:p-16 text-center">
                <div className="inline-block p-4 sm:p-6 bg-muted rounded-full mb-4 sm:mb-6">
                  <Search className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">No subjects found</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedGrade('All Grades');
                }}>
                  Clear Filters
                </Button>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredSubjects.map((subject) => (
                  <Card
                    key={subject.name}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-300"
                    onClick={() => handleSubjectClick(subject.name)}
                  >
                    <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center">
                      <h3 className="text-base sm:text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors text-center">
                        {subject.name}
                      </h3>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-4">
                        {subject.lessonCount} lessons
                      </div>
                      <Button className="w-full group-hover:bg-purple-600 text-sm sm:text-base" size="sm">
                        View Subject
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredSubjects.map((subject) => (
                  <Card
                    key={subject.name}
                    className="group hover:shadow-lg transition-all cursor-pointer hover:border-purple-300"
                    onClick={() => handleSubjectClick(subject.name)}
                  >
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center">
                      <h3 className="text-lg sm:text-xl font-bold mb-1 group-hover:text-purple-600 transition-colors text-center">
                        {subject.name}
                      </h3>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-3">
                        {subject.lessonCount} lessons
                      </div>
                      <Button className="group-hover:bg-purple-600 w-full sm:w-auto text-sm sm:text-base" size="sm">
                        View Subject
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Tabs>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 mt-12 sm:mt-16">
          <Card className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white border-0">
            <CardContent className="p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Not sure where to start?
              </h2>
              <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Take our quick assessment to get personalized subject recommendations based on your grade and interests.
              </p>
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                Take Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
};

export default AllSubjects;
