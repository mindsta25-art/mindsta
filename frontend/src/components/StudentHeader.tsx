import { useEffect, useState, useRef, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/NotificationBell";
import { formatUserName } from "@/lib/stringUtils";
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
  Home,
  Moon,
  Sun,
  Trophy,
  Award,
  Target,
  ChevronDown
} from "lucide-react";
import { signOut } from "@/api";
import { getStudentByUserId, updateStudentGrade } from "@/api";
import { getAllLessons, type Lesson } from "@/api/lessons";
import { formatCurrency } from "@/config/siteConfig";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentHeaderProps {
  studentName?: string; // Optional override, defaults to auth user's name
}

const StudentHeaderComponent = ({ studentName }: StudentHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const { cart, cartCount, removeFromCart } = useCart();
  const { wishlistCount } = useWishlistSafe();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  // Use auth user's fullName as the source of truth, capitalize properly
  const displayName = formatUserName(studentName || user?.fullName || "Student");
  

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
    const p = new URLSearchParams();
    if (lesson.term) p.set('term', lesson.term);
    if (lesson.id) p.set('lessonId', lesson.id);
    navigate(`/subjects/${lesson.grade}/${encodeURIComponent(lesson.subject)}${p.toString() ? `?${p}` : ''}`);
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
    <>
    <TooltipProvider delayDuration={300}>
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Mindsta</span>
                <span className="text-[10px] block text-muted-foreground leading-tight">... Every Child Can Do Well</span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className={`font-medium transition-colors ${location.pathname === '/dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'}`}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/browse")}
                className={`font-medium transition-colors ${location.pathname === '/browse' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'}`}
              >
                Browse Lessons
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/my-learning")}
                className={`font-medium transition-colors ${location.pathname === '/my-learning' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'}`}
              >
                My Learning
              </Button>
              {/* Categories dropdown - hidden for now
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
                </DropdownMenuContent>
              </DropdownMenu>
              */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-medium">
                    Progress
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel>My Progress</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/leaderboard")}>
                    <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                    Leaderboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/progress")}>
                    <TrendingUp className="w-4 h-4 mr-2 text-teal-500" />
                    Progress Milestones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/achievements")}>
                    <Award className="w-4 h-4 mr-2 text-indigo-500" />
                    Achievements
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
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {lesson.imageUrl ? (
                              <img src={lesson.imageUrl} alt={lesson.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-6 h-6 text-white" />
                            )}
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
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="hidden md:flex hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>

            {/* Notification Bell */}
            <NotificationBell />
            
            {/* Wishlist — desktop only; accessible via Sheet on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex relative hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
              </TooltipTrigger>
              <TooltipContent side="bottom">Wishlist</TooltipContent>
            </Tooltip>
            {/* Cart — desktop only, hover to preview; accessible via Sheet on mobile */}
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex relative hover:bg-purple-100 dark:hover:bg-purple-950/40"
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
                  <Button variant="ghost" className="gap-2 px-2 lg:px-3 hover:bg-purple-100 dark:hover:bg-purple-950/40 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm font-semibold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium max-w-[80px] truncate">{capitalizeFirstName(displayName)}</span>
                    <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-muted-foreground" />
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
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
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
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-purple-100 dark:hover:bg-purple-950/40"
              onClick={() => { setMobileSearchOpen(v => !v); setSearchQuery(''); setShowSuggestions(false); }}
              aria-label={mobileSearchOpen ? 'Close search' : 'Search'}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-purple-100 dark:hover:bg-purple-950/40"
              onClick={() => { setMobileMenuOpen(true); setMobileSearchOpen(false); setSearchQuery(''); }}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay — full-width, slides down from header */}
      {mobileSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-border shadow-xl z-40 animate-in slide-in-from-top-2 duration-150">
          <div className="container mx-auto px-4 py-3">
            <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                autoFocus
                type="text"
                placeholder="Search lessons, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-full h-10 text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </header>

    {/* Mobile Navigation Sheet — slides in from right */}
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Main navigation and account options</SheetDescription>
        {/* Sheet Header — user info + grade */}
        <div className="px-4 py-5 bg-gradient-to-br from-indigo-600 to-purple-700 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-white/40">
              <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white truncate">{displayName}</p>
              <p className="text-xs text-indigo-200 truncate">{user?.email}</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200 mb-1.5 block">Current Grade</label>
            <Select value={currentGrade} onValueChange={handleGradeChange} disabled={updatingGrade}>
              <SelectTrigger className="w-full h-9 bg-white/15 border-white/30 text-white text-sm placeholder:text-white/60">
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
          {/* Quick-count chips — wishlist & cart glanceable in header */}
          {(wishlistCount > 0 || cartCount > 0) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {wishlistCount > 0 && (
                <button
                  onClick={() => { navigate('/wishlist'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-full text-xs text-white font-medium"
                >
                  <Heart className="w-3 h-3" />
                  {wishlistCount} saved
                </button>
              )}
              {cartCount > 0 && (
                <button
                  onClick={() => { navigate('/cart'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-full text-xs text-white font-medium"
                >
                  <ShoppingCart className="w-3 h-3" />
                  {cartCount} in cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Nav Items */}
        <ScrollArea className="flex-1">
          <div className="py-2 px-3 space-y-0.5">
            {/* ── Learning ── */}
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Learning</p>
            {[
              { label: "Dashboard",      icon: Home,       path: "/dashboard",   active: location.pathname === "/dashboard" },
              { label: "Browse Lessons", icon: BookOpen,   path: "/browse",      active: location.pathname === "/browse" },
              { label: "My Learning",    icon: GraduationCap, path: "/my-learning", active: location.pathname === "/my-learning" },
            ].map(({ label, icon: Icon, path, active }) => (
              <Button key={path} variant="ghost" onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                className={`w-full justify-start text-sm h-11 rounded-lg font-medium ${active ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'hover:bg-muted'}`}>
                <Icon className={`w-4 h-4 mr-3 ${active ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </Button>
            ))}

            {/* ── Shopping ── */}
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Shopping</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => { navigate("/wishlist"); setMobileMenuOpen(false); }}
                className="justify-start text-sm h-11 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20">
                <Heart className="w-4 h-4 mr-2 text-rose-500" />
                Wishlist
                {wishlistCount > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">{wishlistCount}</Badge>
                )}
              </Button>
              <Button variant="ghost" onClick={() => { navigate("/cart"); setMobileMenuOpen(false); }}
                className="justify-start text-sm h-11 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20">
                <ShoppingCart className="w-4 h-4 mr-2 text-orange-500" />
                Cart
                {cartCount > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">{cartCount}</Badge>
                )}
              </Button>
            </div>

            {/* ── Progress & Rewards ── */}
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Progress &amp; Rewards</p>
            {[
              { label: "Leaderboard",        icon: Trophy,     path: "/leaderboard",               navPath: "/leaderboard",               iconClass: "text-yellow-500" },
              { label: "Progress Milestones", icon: TrendingUp, path: "/progress",                  navPath: "/progress",                  iconClass: "text-teal-500" },
              { label: "Achievements",        icon: Award,      path: "/progress?tab=achievements", navPath: "/progress?tab=achievements", iconClass: "text-indigo-500" },
            ].map(({ label, icon: Icon, path, navPath, iconClass }) => {
              const active = path === '/leaderboard'
                ? location.pathname === '/leaderboard'
                : path === '/progress?tab=achievements'
                  ? location.pathname === '/progress' && location.search.includes('achievements')
                  : location.pathname === '/progress' && !location.search.includes('achievements');
              return (
                <Button key={path} variant="ghost" onClick={() => { navigate(navPath); setMobileMenuOpen(false); }}
                  className={`w-full justify-start text-sm h-11 rounded-lg font-medium ${active ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'hover:bg-muted'}`}>
                  <Icon className={`w-4 h-4 mr-3 ${iconClass}`} />
                  {label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </Button>
              );
            })}

            {/* ── Account ── */}
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Account</p>
            <Button variant="ghost" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}
              className={`w-full justify-start text-sm h-11 rounded-lg ${location.pathname === '/profile' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-muted'}`}>
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              Profile
              {location.pathname === '/profile' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
            </Button>
            <Button variant="ghost" onClick={() => { navigate("/settings"); setMobileMenuOpen(false); }}
              className={`w-full justify-start text-sm h-11 rounded-lg ${location.pathname === '/settings' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-muted'}`}>
              <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
              Settings
              {location.pathname === '/settings' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
            </Button>
            <Button variant="ghost" onClick={toggleTheme}
              className="w-full justify-start text-sm h-11 rounded-lg hover:bg-muted">
              {theme === 'dark'
                ? <><Sun className="w-4 h-4 mr-3 text-yellow-400" />Light Mode</>
                : <><Moon className="w-4 h-4 mr-3 text-indigo-400" />Dark Mode</>}
            </Button>
          </div>
        </ScrollArea>

        {/* Sticky Logout at Bottom */}
        <div className="p-4 border-t border-border flex-shrink-0 bg-background">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-11 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 font-semibold"
            onClick={() => { setShowLogoutDialog(true); setMobileMenuOpen(false); }}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {/* Logout Confirmation Dialog */}
    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-500" />
            Sign Out
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Are you sure you want to sign out of your account? Any unsaved progress will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
          >
            Yes, sign me out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {/* Height sentinel: pushes page body below the fixed header */}
    <div aria-hidden="true" className="h-16" />
    </TooltipProvider>
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export const StudentHeader = memo(StudentHeaderComponent);
export default StudentHeader;

