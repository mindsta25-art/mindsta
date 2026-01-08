import { useEffect, useState, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/NotificationBell";
import mindstaLogo from "../../assets/icons/mindsta2.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { 
  BookOpen, 
  Search, 
  User, 
  Settings, 
  LogOut,
  GraduationCap,
  Menu,
  X,
  ShoppingCart,
  Heart,
  Trash2,
  ArrowRight,
  TrendingUp,
  Home
} from "lucide-react";
import { signOut } from "@/api";
import { getStudentByUserId, updateStudentGrade } from "@/api";
import { getAllLessons, type Lesson } from "@/api/lessons";
import { formatCurrency } from "@/config/siteConfig";

interface StudentHeaderProps {
  studentName?: string; // Optional override, defaults to auth user's name
}

const StudentHeaderComponent = ({ studentName }: StudentHeaderProps) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { cart, cartCount, removeFromCart } = useCart();
  const { wishlistCount } = useWishlistSafe();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Lesson[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [wishBump, setWishBump] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [currentGrade, setCurrentGrade] = useState<string>("");
  const [updatingGrade, setUpdatingGrade] = useState(false);
  
  // Use auth user's fullName as the source of truth
  const displayName = studentName || user?.fullName || "Student";
  
  // Debug: Warn if passed name doesn't match auth user
  useEffect(() => {
    if (studentName && user?.fullName && studentName !== user.fullName) {
      console.warn('⚠️ StudentHeader: Name mismatch detected!', {
        passedName: studentName,
        authUserName: user.fullName,
        using: displayName
      });
    }
  }, [studentName, user?.fullName, displayName]);

  // Fetch student grade
  useEffect(() => {
    const fetchGrade = async () => {
      if (!user?.id) return;
      try {
        const student = await getStudentByUserId(user.id);
        if (student?.grade) {
          setCurrentGrade(student.grade);
        }
      } catch (error) {
        console.error('Error fetching student grade:', error);
      }
    };
    fetchGrade();
  }, [user?.id]);

  const handleGradeChange = async (newGrade: string) => {
    if (!user?.id || updatingGrade) return;
    
    try {
      setUpdatingGrade(true);
      const updated = await updateStudentGrade(user.id, newGrade);
      if (updated) {
        setCurrentGrade(newGrade);
        toast({
          title: "Grade Updated",
          description: `Your grade has been changed to ${newGrade === 'Common Entrance' ? 'Common Entrance' : `Grade ${newGrade}`}`,
        });
        // Refresh the page to reload content for new grade
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      toast({
        title: "Error",
        description: "Failed to update grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingGrade(false);
    }
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const handleLogout = async () => {
    try {
      signOut();
      refreshUser();
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (lesson: Lesson) => {
    const subjectSlug = lesson.subject.toLowerCase().replace(/\s+/g, '-');
    navigate(`/grade/${lesson.grade}/${subjectSlug}/lesson/${lesson.id}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Fetch all lessons once for search suggestions - deferred to not block initial render
  useEffect(() => {
    // Defer loading lessons until after initial render
    const fetchLessons = async () => {
      try {
        const lessons = await getAllLessons();
        setAllLessons(lessons || []);
      } catch (error) {
        console.error('Error fetching lessons for search:', error);
      }
    };
    
    // Delay fetching to prioritize page load
    const timer = setTimeout(fetchLessons, 500);
    return () => clearTimeout(timer);
  }, []);

  // Update search suggestions as user types
  useEffect(() => {
    if (searchQuery.trim() && allLessons.length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = allLessons
        .filter(lesson => 
          lesson.title?.toLowerCase().includes(query) ||
          lesson.description?.toLowerCase().includes(query) ||
          lesson.subject?.toLowerCase().includes(query)
        )
        .slice(0, 5); // Show max 5 suggestions
      
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allLessons]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    const parts = name.split(" ");
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const capitalizeFirstName = (name?: string) => {
    if (!name) return "Student";
    const firstName = name.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // Safe access to wishlist context (header may be used on pages before provider mounts)
  function useWishlistSafe() {
    try {
      // Lazy require to avoid import cycle at top
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useWishlist } = require('@/contexts/WishlistContext');
      return useWishlist();
    } catch {
      return { wishlistCount: 0 } as any;
    }
  }

  // Trigger a subtle bump animation on the wishlist badge when count changes
  useEffect(() => {
    if (wishlistCount > 0) {
      setWishBump(true);
      const t = setTimeout(() => setWishBump(false), 250);
      return () => clearTimeout(t);
    }
  }, [wishlistCount]);

  // Trigger a subtle bump animation on the cart badge when count changes
  useEffect(() => {
    if (cartCount > 0) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 250);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={mindstaLogo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Mindsta</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/home")}
                className="font-medium"
              >
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/browse")}
                className="font-medium"
              >
                Browse Courses
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/my-learning")}
                className="font-medium"
              >
                My Learning
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/grade-assessment")}
                className="font-medium text-indigo-600 dark:text-indigo-400"
              >
                Find My Grade
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-medium">
                    Categories
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Browse by Subject</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/all-grades")}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    All Grades
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/all-subjects")}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    All Subjects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4" ref={searchRef}>
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for lessons, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                className="pl-10 w-full border-gray-300 dark:border-gray-700"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <Card className="absolute top-full mt-2 w-full shadow-lg border-2 z-50 max-h-96 overflow-auto">
                  <CardContent className="p-0">
                    <div className="p-2 bg-muted/30 border-b flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Top Results
                      </span>
                    </div>
                    {searchSuggestions.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleSuggestionClick(lesson)}
                        className="w-full p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                              {lesson.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {lesson.subject}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Grade {lesson.grade}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleSearch}
                      className="w-full p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-center font-medium text-sm text-indigo-600"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* Wishlist Icon with count - visible on all screens */}
            <Button
              variant="ghost"
              size="icon"
              className="flex relative"
              onClick={() => navigate("/wishlist")}
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs transition-transform duration-200 ${wishBump ? 'scale-110' : 'scale-100'}`}>
                  {wishlistCount}
                </Badge>
              )}
            </Button>
            {/* Cart Icon with Hover Dropdown - visible on all screens */}
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex relative"
                  onClick={() => navigate("/cart")}
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs transition-transform duration-200 ${cartBump ? 'scale-110' : 'scale-100'}`}>
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[calc(100vw-2rem)] sm:w-96 p-0" align="end" sideOffset={8}>
                <div className="relative">
                  {/* Header */}
                  <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base sm:text-lg">Shopping Cart</h3>
                      <Badge variant="secondary" className="text-xs">{cartCount} {cartCount === 1 ? 'item' : 'items'}</Badge>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                    {!cart || cart.items.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center">
                        <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground mb-1.5 sm:mb-2">Your cart is empty</p>
                        <p className="text-xs text-muted-foreground">Add lessons to get started!</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {cart.items.map((item) => (
                          <div key={item._id} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors group">
                            <div className="flex gap-2 sm:gap-3">
                              {/* Thumbnail */}
                              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-400 to-pink-400 rounded flex-shrink-0 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-0.5 sm:mb-1 line-clamp-1">{item.subject}</h4>
                                <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2">
                                  Grade {item.grade} {item.term && `• ${item.term}`}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-indigo-600">{formatCurrency(item.price || 0)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 sm:h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFromCart(item._id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Remove</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer with Total and Actions */}
                  {cart && cart.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="p-3 sm:p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <span className="font-semibold text-sm sm:text-base">Total:</span>
                          <span className="text-lg sm:text-xl font-bold text-indigo-600">{formatCurrency(calculateTotal())}</span>
                        </div>
                        <Button 
                          className="w-full gap-2 font-semibold text-sm sm:text-base" 
                          onClick={() => navigate("/cart")}
                        >
                          Go to Cart
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>

            {/* User Menu - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{capitalizeFirstName(displayName)}</span>
                      <span className="text-xs font-normal text-muted-foreground">My Account</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Grade Selector */}
                  <div className="px-2 py-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Current Grade</label>
                    <Select
                      value={currentGrade}
                      onValueChange={handleGradeChange}
                      disabled={updatingGrade}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="Select grade..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Grade 1</SelectItem>
                        <SelectItem value="2">Grade 2</SelectItem>
                        <SelectItem value="3">Grade 3</SelectItem>
                        <SelectItem value="4">Grade 4</SelectItem>
                        <SelectItem value="5">Grade 5</SelectItem>
                        <SelectItem value="6">Grade 6</SelectItem>
                        <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/my-learning")}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    My Learning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2 animate-in slide-in-from-top-5 duration-200">
            {/* Grade Selector - Mobile */}
            <div className="px-4 pb-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Current Grade</label>
              <Select
                value={currentGrade}
                onValueChange={handleGradeChange}
                disabled={updatingGrade}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                  <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/home");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/wishlist");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start relative"
            >
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
              {wishlistCount > 0 && (
                <Badge className={`ml-auto transition-transform duration-200 ${wishBump ? 'scale-110' : 'scale-100'}`} variant="secondary">
                  {wishlistCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/cart");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start relative"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge className={`ml-auto transition-transform duration-200 ${cartBump ? 'scale-110' : 'scale-100'}`} variant="secondary">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/browse");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/my-learning");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              My Learning
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/grade-assessment");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-indigo-600 dark:text-indigo-400"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Find My Grade
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/profile");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/settings");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

// Memoize component to prevent unnecessary re-renders
export const StudentHeader = memo(StudentHeaderComponent);
export default StudentHeader;

