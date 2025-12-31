import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
};

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen = ({ 
  message = "Loading...", 
  fullScreen = true 
}: LoadingScreenProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-background",
        fullScreen && "min-h-screen"
      )}
    >
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-lg animate-pulse">{message}</p>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-card rounded-lg shadow-soft p-6 space-y-4 border border-border">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

export const GradeCardSkeleton = () => {
  return (
    <Skeleton className="h-32 w-full rounded-xl" />
  );
};

export const LessonCardSkeleton = () => {
  return (
    <div className="bg-card rounded-lg shadow-soft p-4 space-y-3 border border-border">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <GradeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
