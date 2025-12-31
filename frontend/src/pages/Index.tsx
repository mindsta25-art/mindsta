import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserTypeCard } from "@/components/UserTypeCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { HomeFooter } from "@/components/HomeFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Heart, 
  Sparkles,
  Award,
  Target,
  TrendingUp,
  CheckCircle2,
  Star,
  Zap,
  Shield,
  Rocket,
  Brain,
  Smile,
  Trophy,
  GamepadIcon,
  Palette,
  Music,
  Youtube,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  Lightbulb,
  PartyPopper,
  Gift,
  Menu,
  X
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const dest = user.userType === 'admin' ? '/admin' : '/dashboard';
      navigate(dest);
    }
  }, [user, loading, navigate]);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const userTypes = [
    {
      icon: GraduationCap,
      title: "Students",
      description: "Learn and explore exciting topics at your grade level",
      type: "student",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
      features: ["Interactive Lessons", "Fun Quizzes", "Progress Tracking"]
    },
    {
      icon: Heart,
      title: "Parents",
      description: "Monitor your child's progress and support their learning",
      type: "parent",
      gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
      features: ["Real-time Updates", "Performance Reports", "Direct Communication"]
    },
    {
      icon: Users,
      title: "Educators",
      description: "Create and manage educational content for students",
      type: "educator",
      gradient: "bg-gradient-to-br from-orange-500 to-amber-500",
      features: ["Content Creation", "Student Management", "Analytics Dashboard"]
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Interactive Learning",
      description: "Engaging lessons with rich multimedia content",
      color: "text-blue-500"
    },
    {
      icon: Award,
      title: "Achievement System",
      description: "Earn badges and certificates as you progress",
      color: "text-yellow-500"
    },
    {
      icon: Target,
      title: "Personalized Path",
      description: "Adaptive learning tailored to each student",
      color: "text-green-500"
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Detailed analytics and performance insights",
      color: "text-purple-500"
    },
  ];

  const stats = [
    { label: "Happy Students", value: "10,000+", icon: Users, emoji: "🎉" },
    { label: "Fun Lessons", value: "500+", icon: BookOpen, emoji: "📚" },
    { label: "Success Rate", value: "95%", icon: TrendingUp, emoji: "⭐" },
    { label: "Cool Teachers", value: "200+", icon: GraduationCap, emoji: "👨‍🏫" },
  ];

  const whyMindsta = [
    {
      icon: Brain,
      title: "Learn While Having Fun!",
      description: "Our lessons are like games - you'll love learning new things every day!",
      color: "from-pink-500 to-rose-500",
      emoji: "🧠"
    },
    {
      icon: GamepadIcon,
      title: "Interactive Games & Quizzes",
      description: "Play educational games, solve puzzles, and earn cool badges!",
      color: "from-purple-500 to-indigo-500",
      emoji: "🎮"
    },
    {
      icon: Trophy,
      title: "Collect Rewards & Achievements",
      description: "Complete lessons to unlock trophies, stars, and special prizes!",
      color: "from-yellow-500 to-orange-500",
      emoji: "🏆"
    },
    {
      icon: Smile,
      title: "Safe & Kid-Friendly",
      description: "A secure space where you can learn, explore, and grow at your own pace!",
      color: "from-green-500 to-teal-500",
      emoji: "😊"
    },
  ];

  const aboutUs = {
    title: "About Mindsta",
    description: "Remembering and retaining of lessons can be difficult, but you don't have to do it alone. Mindsta is built to be the ultimate support system for the modern student, transforming how you learn and retain information.",
    features: [
      { text: "Personalized Learning Programs: A custom-tailored path for every student's unique year level.", emoji: "🎯" },
      { text: "Self-Paced Journeys: Learn on your schedule and master each topic thoroughly.", emoji: "⏰" },
      { text: "Visual & Conceptual Clarity: Visually rich content that builds deep understanding for lifelong retention.", emoji: "👁️"},
      { text: "Mastery Through Practice: Curated sets of 49+ key questions per subject to solidify knowledge.", emoji: "💪"},
      { text: "Timed Exam Simulation: Build speed, accuracy, and real test confidence.", emoji: "⏱️" }
    ],
    tagline: "Welcome to Mindsta—where every child can do well."
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-muted dark:to-background">
      {/* Fun Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Floating Emojis */}
        <div className="absolute top-10 left-1/4 text-4xl animate-bounce delay-200">⭐</div>
        <div className="absolute top-32 right-1/4 text-4xl animate-bounce delay-500">🚀</div>
        <div className="absolute bottom-32 left-1/3 text-4xl animate-bounce delay-700">🎨</div>
        <div className="absolute bottom-20 right-1/3 text-4xl animate-bounce delay-1000">🎉</div>
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-card backdrop-blur-sm shadow-lg border-b-4 border-purple-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/assets/icons/mindsta2.png" alt="Mindsta Logo" className="w-10 h-10 object-contain" />
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</span>
                <span className="text-xs block text-muted-foreground">Learn • Play • Grow! </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                onClick={() => navigate("/referral-auth")}
                className="gap-2 hover:scale-110 transition-all duration-300 border-2 border-yellow-300 hover:border-yellow-500 hover:shadow-lg font-bold"
                title="Sign up as a Referrer - Earn rewards by inviting friends!"
              >
                <Gift className="w-4 h-4" />
                Refer & Earn 
              </Button>
              <Button 
                onClick={() => navigate("/auth?mode=login")}
                className="gap-2 hover:scale-110 transition-all duration-300 border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg"
                title="Student Login - Access your learning dashboard"
              >
                <Shield className="w-4 h-4" />
                Student Sign In
              </Button>
              <Button 
                onClick={() => navigate("/auth?mode=register")}
                className="gap-2 hover:scale-110 transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold"
                title="Student Registration - Start your learning journey!"
              >
                Student Sign Up 
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-purple-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-purple-600" />
              ) : (
                <Menu className="w-6 h-6 text-purple-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-4 animate-in slide-in-from-top-5 duration-200">
              <Button 
                onClick={() => {
                  navigate("/referral-auth");
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 border-2 border-yellow-300 hover:border-yellow-500 font-bold justify-center"
              >
                <Gift className="w-4 h-4" />
                Refer & Earn 
              </Button>
              <Button 
                onClick={() => {
                  navigate("/auth?mode=login");
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 border-2 border-purple-300 hover:border-purple-500 justify-center"
              >
                <Shield className="w-4 h-4" />
                Student Sign In
              </Button>
              <Button 
                onClick={() => {
                  navigate("/auth?mode=register");
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold justify-center"
              >
                Student Sign Up 
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10 mt-20">
        <div className="text-center mb-20 space-y-6">
          <Badge className="mb-4 px-6 py-3 text-base font-bold bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border-yellow-500/50 hover:scale-110 transition-transform shadow-lg">
            <PartyPopper className="w-5 h-5 mr-2 inline animate-bounce" />
            Join 10,000+ Happy Students! 🎉
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 animate-in slide-in-from-bottom duration-700">
            🌟 Welcome to{" "}
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
              Mindsta
            </span>
            ! 🎈
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 max-w-3xl mx-auto animate-in slide-in-from-bottom duration-700 delay-100 leading-relaxed">
            Where Learning Feels Like Playing! 🚀
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
            Cool lessons, fun games, and awesome prizes for grades 1-6! 
            Get ready for the most exciting learning adventure ever! ✨
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8 animate-in fade-in duration-700 delay-200">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth?mode=register")}
              className="gap-2 text-xl px-10 py-7 hover:scale-110 transition-all duration-300 shadow-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600"
              title="Sign up as a Student"
            >
              <Rocket className="w-6 h-6 animate-bounce" />
              Start Your Adventure! 
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('why-mindsta')?.scrollIntoView({ behavior: 'smooth' })}
              className="gap-2 text-xl px-10 py-7 hover:scale-110 transition-all duration-300 border-4 border-purple-300 hover:border-purple-500 hover:shadow-xl"
            >
              <Star className="w-6 h-6 animate-spin" />
              Why It's So Fun! 
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20 animate-in fade-in duration-700 delay-300">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.label} 
                className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-110 border-4 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="text-5xl mb-2">{stat.emoji}</div>
                  <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">{stat.value}</div>
                  <div className="text-sm font-bold text-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Mindsta Section */}
        <div id="why-mindsta" className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-6 py-3 text-base font-bold bg-gradient-to-r from-pink-400/30 to-purple-400/30 border-pink-500/50">
              <Lightbulb className="w-5 h-5 mr-2 inline animate-pulse" />
              Why Kids Love Mindsta! 💜
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-4">
              🎯 Why Choose{" "}
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Mindsta
              </span>
              ?
            </h2>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 max-w-2xl mx-auto">
              Because learning should be FUN! 
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {whyMindsta.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.title}
                  className={`group hover:shadow-2xl transition-all duration-300 cursor-pointer border-4 hover:border-purple-400 bg-gradient-to-br ${
                    activeFeature === index ? 'ring-4 ring-purple-400 scale-105 border-purple-500' : 'border-purple-200'
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4 animate-bounce">{item.emoji}</div>
                    <div className={`inline-flex p-4 rounded-3xl bg-gradient-to-br ${item.color} mb-4 group-hover:scale-125 transition-transform shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-3">{item.title}</h3>
                    <p className="text-lg text-muted-foreground font-medium">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* About Us Section */}
        <div className="mb-20">
          <Card className="max-w-5xl mx-auto border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-2xl">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <Badge className="mb-4 px-6 py-3 text-base font-bold bg-gradient-to-r from-blue-400/30 to-green-400/30 border-blue-500/50">
                  <Smile className="w-5 h-5 mr-2 inline" />
                  About Mindsta 
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                  {aboutUs.title}
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
                  {aboutUs.description}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {aboutUs.features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition-transform border-2 border-purple-200 hover:border-purple-400"
                  >
                    <div className="text-5xl animate-bounce" style={{ animationDelay: `${index * 200}ms` }}>
                      {feature.emoji}
                    </div>
                    <p className="text-lg font-bold text-foreground">{feature.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {aboutUs.tagline}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border-4 border-purple-300 shadow-2xl">
            <CardContent className="p-12">
              <div className="text-7xl mb-6 animate-bounce">🎉</div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                Ready for the Adventure? 🚀
              </h2>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                Join the Mindsta Family Today!
              </p>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Thousands of kids are already having fun while learning. 
                Join them now and unlock a world of exciting lessons, games, and prizes! 
                It's 100% FREE! ✨
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth?mode=register")}
                  className="gap-3 text-2xl px-12 py-8 hover:scale-110 transition-all duration-300 shadow-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 font-black"
                  title="Student Registration"
                >
                  <Rocket className="w-7 h-7 animate-bounce" />
                  Start Learning Now! 🎮
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/auth?mode=login")}
                  className="gap-3 text-xl px-10 py-8 hover:scale-110 transition-all duration-300 border-4 border-purple-300 hover:border-purple-500 font-bold"
                  title="Student Login"
                >
                  Already a Student? Login! 👋
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
