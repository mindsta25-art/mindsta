import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Target, Clock, Palette, Edit, Timer, Sparkles } from "lucide-react";
import mindstaLogo from "../assets/icons/mindsta2.png";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Personalized Learning Programs",
      description: "A custom-tailored path for every student's unique year level.",
      icon: Target,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Self-Paced Journeys",
      description: "Learn on your schedule and master each topic thoroughly.",
      icon: Clock,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Visual & Conceptual Clarity",
      description: "Visually rich content that builds deep understanding for lifelong retention.",
      icon: Palette,
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Mastery Through Practice",
      description: "Curated sets of 49+ key questions per subject to solidify knowledge.",
      icon: Edit,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Timed Exam Simulation",
      description: "Build speed, accuracy, and real test confidence.",
      icon: Timer,
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-muted dark:to-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-card backdrop-blur-sm shadow-lg border-b-4 border-purple-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shadow-lg">
                <img src={mindstaLogo} alt="Mindsta Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</span>
                <span className="text-xs block text-muted-foreground">Learn • Grow • Excel</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-6 px-6 py-3 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shadow-lg">
            <Sparkles className="w-5 h-5 mr-2 inline" />
            About Mindsta
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 leading-tight">
            About <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            Remembering and retaining of lessons can be difficult, but you don't have to do it alone.
            <span className="block mt-4 font-semibold text-purple-600 dark:text-purple-400">
              Mindsta is built to be the ultimate support system for the modern student, transforming how you learn and retain information.
            </span>
          </p>
        </div>

        {/* Key Features Section */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-center text-foreground mb-12">
            Our Key Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="group border-4 border-purple-200 hover:border-purple-400 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-900"
                >
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tagline Section */}
        <div className="mb-16">
          <Card className="max-w-5xl mx-auto border-4 border-purple-300 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-6">✨</div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
                Welcome to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mindsta</span>
              </h2>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                Where every child can do well.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border-4 border-purple-300 shadow-2xl">
            <CardContent className="p-12">
              <div className="text-7xl mb-6 animate-bounce">🚀</div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of students who are already excelling with Mindsta's personalized learning approach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => navigate("/auth?mode=register")}
                  size="lg"
                  className="text-xl px-10 py-7 shadow-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold hover:scale-110 transition-all"
                >
                  Get Started Free
                </Button>
                <Button 
                  onClick={() => navigate("/auth?mode=login")}
                  size="lg"
                  variant="outline"
                  className="text-xl px-10 py-7 border-4 border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold hover:scale-110 transition-all"
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 py-8 bg-white/80 dark:bg-card backdrop-blur-sm border-t-4 border-purple-300">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Mindsta. All rights reserved. Empowering students to excel.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
