import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  PlayCircle, 
  FileText, 
  CheckCircle2,
  Download,
  Lock
} from "lucide-react";
import { Section } from "@/api/lessons";

interface CourseCurriculumProps {
  curriculum: Section[];
  currentLectureId?: string;
  onLectureSelect?: (sectionIdx: number, lectureIdx: number) => void;
  completedLectures?: Set<string>;
  className?: string;
}

export const CourseCurriculum = ({ 
  curriculum, 
  currentLectureId,
  onLectureSelect,
  completedLectures = new Set(),
  className = ""
}: CourseCurriculumProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(curriculum.map((_, i) => i))
  );

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const getTotalLectures = () => 
    curriculum.reduce((sum, section) => sum + section.lectures.length, 0);

  const getTotalDuration = () => 
    curriculum.reduce(
      (sum, section) => 
        sum + section.lectures.reduce((lectureSum, lecture) => lectureSum + (lecture.duration || 0), 0), 
      0
    );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getCompletedInSection = (section: Section) => {
    return section.lectures.filter(lecture => 
      completedLectures.has(lecture._id || "")
    ).length;
  };

  const getLectureIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'article':
      case 'assignment':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Course Content Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Course Content</h2>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>{curriculum.length} sections</span>
          <span>•</span>
          <span>{getTotalLectures()} lectures</span>
          <span>•</span>
          <span>{formatDuration(getTotalDuration())} total length</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {curriculum.map((section, sectionIdx) => {
          const isExpanded = expandedSections.has(sectionIdx);
          const completedCount = getCompletedInSection(section);
          const totalLectures = section.lectures.length;

          return (
            <Card key={sectionIdx} className="overflow-hidden">
              {/* Section Header */}
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                onClick={() => toggleSection(sectionIdx)}
              >
                <div className="flex items-start gap-3 text-left flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold">
                      Section {sectionIdx + 1}: {section.title}
                    </div>
                    {section.description && (
                      <div className="text-sm text-muted-foreground font-normal">
                        {section.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal">
                      <span>{totalLectures} lectures</span>
                      <span>•</span>
                      <span>
                        {formatDuration(
                          section.lectures.reduce((sum, l) => sum + (l.duration || 0), 0)
                        )}
                      </span>
                      {completedCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-medium">
                            {completedCount}/{totalLectures} completed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Button>

              {/* Lectures */}
              {isExpanded && (
                <CardContent className="p-0 border-t">
                  {section.lectures.map((lecture, lectureIdx) => {
                    const isCompleted = completedLectures.has(lecture._id || "");
                    const isCurrent = currentLectureId === lecture._id;
                    const isLocked = false; // Can add logic for locked content

                    return (
                      <div key={lectureIdx}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start p-4 h-auto hover:bg-muted/50 ${
                            isCurrent ? 'bg-muted' : ''
                          }`}
                          onClick={() => onLectureSelect?.(sectionIdx, lectureIdx)}
                          disabled={isLocked}
                        >
                          <div className="flex items-start gap-3 w-full">
                            {/* Lecture Icon */}
                            <div className="mt-0.5 flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : isLocked ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                getLectureIcon(lecture.type)
                              )}
                            </div>

                            {/* Lecture Info */}
                            <div className="flex-1 text-left space-y-1">
                              <div className={`text-sm ${isCurrent ? 'font-semibold' : ''}`}>
                                {lecture.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {lecture.type}
                                </Badge>
                                <span>{lecture.duration}m</span>
                                {lecture.isPreview && (
                                  <Badge variant="secondary" className="text-xs">
                                    Preview
                                  </Badge>
                                )}
                              </div>

                              {/* Resources */}
                              {lecture.resources && lecture.resources.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Download className="w-3 h-3" />
                                  <span>{lecture.resources.length} resource{lecture.resources.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                        {lectureIdx < section.lectures.length - 1 && (
                          <div className="border-t mx-4" />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
