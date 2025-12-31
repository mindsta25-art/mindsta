import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, FileText, CheckCircle, Lock, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Section, Lecture } from '@/api/lessons';

interface CurriculumDisplayProps {
  sections: Section[];
  onLectureClick?: (sectionIndex: number, lectureIndex: number, lecture: Lecture) => void;
  currentLectureId?: string;
  completedLectures?: Set<string>;
  showPreviewOnly?: boolean;
  className?: string;
}

const CurriculumDisplay: React.FC<CurriculumDisplayProps> = ({
  sections,
  onLectureClick,
  currentLectureId,
  completedLectures = new Set(),
  showPreviewOnly = false,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]) // Expand first section by default
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

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const getLectureIcon = (type: string) => {
    switch (type) {
      case 'video':
        return PlayCircle;
      case 'article':
        return FileText;
      case 'quiz':
        return CheckCircle;
      default:
        return FileText;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const calculateSectionStats = (section: Section) => {
    const totalLectures = section.lectures.length;
    const totalDuration = section.lectures.reduce((sum, lecture) => sum + (lecture.duration || 0), 0);
    const completedCount = section.lectures.filter(lecture => 
      lecture._id && completedLectures.has(lecture._id)
    ).length;
    
    return { totalLectures, totalDuration, completedCount };
  };

  const calculateTotalStats = () => {
    const totalSections = sections.length;
    const totalLectures = sections.reduce((sum, section) => sum + section.lectures.length, 0);
    const totalDuration = sections.reduce((sum, section) => 
      sum + section.lectures.reduce((lectureSum, lecture) => lectureSum + (lecture.duration || 0), 0), 0
    );
    
    return { totalSections, totalLectures, totalDuration };
  };

  const stats = calculateTotalStats();

  if (!sections || sections.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No curriculum content available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">Course Content</CardTitle>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{stats.totalSections} {stats.totalSections === 1 ? 'section' : 'sections'}</span>
              <span>•</span>
              <span>{stats.totalLectures} {stats.totalLectures === 1 ? 'lecture' : 'lectures'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(stats.totalDuration)} total length
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand all
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse all
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.has(sectionIndex);
          const sectionStats = calculateSectionStats(section);
          const progress = sectionStats.totalLectures > 0 
            ? (sectionStats.completedCount / sectionStats.totalLectures) * 100 
            : 0;

          return (
            <div key={section._id || sectionIndex} className="border rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold mb-1">
                      Section {sectionIndex + 1}: {section.title}
                    </div>
                    {section.description && (
                      <div className="text-sm text-muted-foreground mb-1">
                        {section.description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{sectionStats.totalLectures} {sectionStats.totalLectures === 1 ? 'lecture' : 'lectures'}</span>
                      <span>•</span>
                      <span>{formatDuration(sectionStats.totalDuration)}</span>
                      {sectionStats.completedCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {sectionStats.completedCount}/{sectionStats.totalLectures} completed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {progress > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Math.round(progress)}%
                  </Badge>
                )}
              </button>

              {/* Section Content - Lectures */}
              {isExpanded && (
                <div className="divide-y">
                  {section.lectures.map((lecture, lectureIndex) => {
                    const LectureIcon = getLectureIcon(lecture.type);
                    const isCompleted = lecture._id && completedLectures.has(lecture._id);
                    const isCurrent = lecture._id === currentLectureId;
                    const isLocked = showPreviewOnly && !lecture.isPreview;
                    const canClick = !isLocked && onLectureClick;

                    return (
                      <div
                        key={lecture._id || lectureIndex}
                        className={cn(
                          'px-4 py-3 flex items-center gap-3 transition-colors',
                          canClick && 'hover:bg-muted/50 cursor-pointer',
                          isCurrent && 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-600',
                          isLocked && 'opacity-60'
                        )}
                        onClick={() => {
                          if (canClick && !isLocked) {
                            onLectureClick(sectionIndex, lectureIndex, lecture);
                          }
                        }}
                      >
                        {/* Lecture Icon/Status */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <LectureIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Lecture Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mb-1 flex items-center gap-2">
                            <span className="truncate">{lecture.title}</span>
                            {lecture.isPreview && (
                              <Badge variant="outline" className="text-xs">
                                Preview
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{lecture.type}</span>
                            {lecture.duration > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(lecture.duration)}
                                </span>
                              </>
                            )}
                            {lecture.resources && lecture.resources.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{lecture.resources.length} {lecture.resources.length === 1 ? 'resource' : 'resources'}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Play/View Button */}
                        {canClick && !isLocked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLectureClick(sectionIndex, lectureIndex, lecture);
                            }}
                          >
                            {lecture.type === 'video' ? 'Play' : 'View'}
                          </Button>
                        )}

                        {isLocked && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            Locked
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CurriculumDisplay;
