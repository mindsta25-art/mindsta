import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Star } from "lucide-react";

interface GradeCardProps {
  grade: number;
  onClick: () => void;
}

export const GradeCard = ({ grade, onClick }: GradeCardProps) => {
  const gradientColors = [
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-green-500",
  ];

  const emojis = ["🌟", "🚀", "🎨", "🎮", "⚡", "🏆"];

  const gradient = gradientColors[(grade - 1) % gradientColors.length];
  const emoji = emojis[(grade - 1) % emojis.length];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl",
        "p-6 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 border-4 border-purple-200 hover:border-purple-400"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300",
          gradient
        )}
      />
      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        <div className="text-5xl animate-bounce group-hover:scale-125 transition-transform">
          {emoji}
        </div>
        <div className={cn(
          "p-3 rounded-2xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform",
          gradient
        )}>
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-black text-foreground">Grade {grade}</h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
      </div>
    </Card>
  );
};
