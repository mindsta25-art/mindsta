import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, Sparkles } from "lucide-react";

interface UserTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}

export const UserTypeCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  gradient,
}: UserTypeCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:rotate-1",
        "p-8 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 border-4 border-purple-200 hover:border-purple-400"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-300",
          gradient
        )}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className={cn(
          "p-5 rounded-3xl shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300",
          gradient
        )}>
          <Icon className="w-14 h-14 text-white" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground font-semibold text-base">{description}</p>
        <div className="pt-2 text-purple-600 dark:text-purple-400 font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Click to Join! →
        </div>
      </div>
    </Card>
  );
};
