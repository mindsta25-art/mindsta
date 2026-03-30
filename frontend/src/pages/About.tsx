import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  BookOpen, 
  Target, 
  Clock, 
  Users, 
  Award, 
  TrendingUp, 
  Sparkles,
  CheckCircle,
  Globe,
  BookMarked,
  GraduationCap,
  Zap,
  Shield,
  Heart
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeFooter } from '@/components/HomeFooter';

const About = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const Header = user ? StudentHeader : HomeHeader;
  const Footer = user ? StudentFooter : HomeFooter;

  const features = [
    {
      title: "Personalized Learning",
      description: "Adaptive learning paths tailored to each student's pace, style, and academic goals.",
      icon: Target,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Flexible Schedule",
      description: "Learn anytime, anywhere with 24/7 access to comprehensive course materials.",
      icon: Clock,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Expert Content",
      description: "Curriculum designed by education specialists and verified by subject matter experts.",
      icon: Award,
      color: "from-orange-500 to-amber-500"
    },
    {
      title: "Interactive Practice",
      description: "Hands-on exercises, quizzes, and real-world applications to reinforce learning.",
      icon: Zap,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Progress Tracking",
      description: "Real-time analytics and insights to monitor achievement and identify growth areas.",
      icon: TrendingUp,
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Community Support",
      description: "Connect with peers, share experiences, and learn together in a supportive environment.",
      icon: Users,
      color: "from-pink-500 to-rose-500"
    }
  ];

  const stats = [
    { label: "Active Students", value: "10,000+", icon: Users },
    { label: "Course Subjects", value: "50+", icon: BookMarked },
    { label: "Success Rate", value: "95%", icon: TrendingUp },
    { label: "Learning Hours", value: "100K+", icon: Clock }
  ];

  const values = [
    {
      title: "Excellence",
      description: "We're committed to delivering the highest quality educational content and experience.",
      icon: Award
    },
    {
      title: "Accessibility",
      description: "Education should be accessible to everyone, regardless of location or background.",
      icon: Globe
    },
    {
      title: "Innovation",
      description: "We continuously evolve our platform using the latest educational technology.",
      icon: Sparkles
    },
    {
      title: "Integrity",
      description: "We build trust through transparency, honesty, and ethical practices.",
      icon: Shield
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header - Hidden when using component headers */}
      <header className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm border-b hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Mindsta</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-900 dark:to-purple-900 dark:text-indigo-300 border-0">
                About Mindsta
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Empowering Minds Through
                <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Innovative Education
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                At Mindsta, we believe every student deserves access to quality education that adapts to their unique learning journey. Our platform combines cutting-edge technology with proven pedagogical methods to create an engaging, effective learning experience.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  onClick={() => navigate("/auth?mode=register")}
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Start Learning
                </Button>
                <Button 
                  onClick={() => navigate("/browse")}
                  size="lg"
                  variant="outline"
                >
                  Explore lessons
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <Icon className="w-8 h-8 text-white mx-auto mb-3" />
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-indigo-100">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <Badge className="mb-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0">
                  Our Mission
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                  Making Quality Education Accessible to All
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  We're on a mission to democratize education by providing comprehensive, affordable, and engaging learning experiences. Our platform is designed to break down barriers and create opportunities for students everywhere.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Student-Centered Approach</h4>
                      <p className="text-slate-600 dark:text-slate-300">Every feature is designed with student success in mind.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Proven Results</h4>
                      <p className="text-slate-600 dark:text-slate-300">Our methods are backed by educational research and data.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Continuous Improvement</h4>
                      <p className="text-slate-600 dark:text-slate-300">We regularly update content based on student feedback.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-8 flex items-center justify-center">
                  <GraduationCap className="w-48 h-48 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full blur-3xl opacity-50" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Our comprehensive platform provides all the tools and resources for effective learning.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index}
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="mb-4 bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-0">
                Our Values
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                What We Stand For
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Our core values guide everything we do and shape the learning experience we provide.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Heart className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Join thousands of students who are achieving their academic goals with Mindsta.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  onClick={() => navigate("/auth?mode=register")}
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  Get Started Free
                </Button>
                <Button 
                  onClick={() => navigate("/auth?mode=login")}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Hidden when using component footer */}
      <footer className="relative z-10 py-8 bg-white dark:bg-slate-900 border-t hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-600 dark:text-slate-400">
            <p>© {new Date().getFullYear()} Mindsta. All rights reserved.</p>
            <p className="text-sm mt-2">Empowering minds through innovative education.</p>
          </div>
        </div>
      </footer>
      
      <Footer />
    </div>
  );
};

export default About;
