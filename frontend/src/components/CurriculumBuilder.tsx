import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Check,
  X
} from "lucide-react";
import { Section, Lecture, Resource } from "@/api/lessons";

interface CurriculumBuilderProps {
  curriculum: Section[];
  onChange: (curriculum: Section[]) => void;
}

export const CurriculumBuilder = ({ curriculum, onChange }: CurriculumBuilderProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingLecture, setEditingLecture] = useState<{ sectionIdx: number; lectureIdx: number } | null>(null);
  const [addingResource, setAddingResource] = useState<{ sectionIdx: number; lectureIdx: number } | null>(null);

  const [sectionForm, setSectionForm] = useState({ title: "", description: "" });
  const [lectureForm, setLectureForm] = useState({
    title: "",
    type: "article" as Lecture['type'],
    content: "",
    videoUrl: "",
    duration: 0,
  });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    type: "link" as Resource['type'],
    url: "",
    description: "",
  });

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const addSection = () => {
    if (!sectionForm.title.trim()) return;
    
    const newSection: Section = {
      title: sectionForm.title,
      description: sectionForm.description,
      order: curriculum.length,
      lectures: [],
    };
    
    onChange([...curriculum, newSection]);
    setSectionForm({ title: "", description: "" });
    setExpandedSections(new Set([...expandedSections, curriculum.length]));
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    const updated = [...curriculum];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
    setEditingSection(null);
  };

  const deleteSection = (index: number) => {
    if (!confirm("Delete this section and all its lectures?")) return;
    const updated = curriculum.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addLecture = (sectionIndex: number) => {
    if (!lectureForm.title.trim()) return;

    const updated = [...curriculum];
    const newLecture: Lecture = {
      title: lectureForm.title,
      type: lectureForm.type,
      content: lectureForm.content,
      videoUrl: lectureForm.videoUrl,
      duration: lectureForm.duration,
      order: updated[sectionIndex].lectures.length,
      resources: [],
    };

    updated[sectionIndex].lectures.push(newLecture);
    onChange(updated);
    setLectureForm({
      title: "",
      type: "article",
      content: "",
      videoUrl: "",
      duration: 0,
    });
    setEditingLecture(null);
  };

  const updateLecture = (sectionIdx: number, lectureIdx: number, updates: Partial<Lecture>) => {
    const updated = [...curriculum];
    updated[sectionIdx].lectures[lectureIdx] = { 
      ...updated[sectionIdx].lectures[lectureIdx], 
      ...updates 
    };
    onChange(updated);
    setEditingLecture(null);
  };

  const deleteLecture = (sectionIdx: number, lectureIdx: number) => {
    if (!confirm("Delete this lecture?")) return;
    const updated = [...curriculum];
    updated[sectionIdx].lectures = updated[sectionIdx].lectures.filter((_, i) => i !== lectureIdx);
    onChange(updated);
  };

  const addResource = (sectionIdx: number, lectureIdx: number) => {
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return;

    const updated = [...curriculum];
    const newResource: Resource = {
      title: resourceForm.title,
      type: resourceForm.type,
      url: resourceForm.url,
      description: resourceForm.description,
    };

    if (!updated[sectionIdx].lectures[lectureIdx].resources) {
      updated[sectionIdx].lectures[lectureIdx].resources = [];
    }
    updated[sectionIdx].lectures[lectureIdx].resources!.push(newResource);
    
    onChange(updated);
    setResourceForm({ title: "", type: "link", url: "", description: "" });
    setAddingResource(null);
  };

  const deleteResource = (sectionIdx: number, lectureIdx: number, resourceIdx: number) => {
    const updated = [...curriculum];
    updated[sectionIdx].lectures[lectureIdx].resources = 
      updated[sectionIdx].lectures[lectureIdx].resources?.filter((_, i) => i !== resourceIdx) || [];
    onChange(updated);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === curriculum.length - 1) return;

    const updated = [...curriculum];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated[index].order = index;
    updated[newIndex].order = newIndex;
    onChange(updated);
  };

  const moveLecture = (sectionIdx: number, lectureIdx: number, direction: 'up' | 'down') => {
    const lectures = curriculum[sectionIdx].lectures;
    if (direction === 'up' && lectureIdx === 0) return;
    if (direction === 'down' && lectureIdx === lectures.length - 1) return;

    const updated = [...curriculum];
    const newIndex = direction === 'up' ? lectureIdx - 1 : lectureIdx + 1;
    [updated[sectionIdx].lectures[lectureIdx], updated[sectionIdx].lectures[newIndex]] = 
      [updated[sectionIdx].lectures[newIndex], updated[sectionIdx].lectures[lectureIdx]];
    
    updated[sectionIdx].lectures[lectureIdx].order = lectureIdx;
    updated[sectionIdx].lectures[newIndex].order = newIndex;
    onChange(updated);
  };

  const getTotalLectures = () => curriculum.reduce((sum, section) => sum + section.lectures.length, 0);
  const getTotalDuration = () => curriculum.reduce((sum, section) => 
    sum + section.lectures.reduce((lectureSum, lecture) => lectureSum + (lecture.duration || 0), 0), 
  0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Curriculum Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Curriculum Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{curriculum.length}</div>
              <div className="text-sm text-muted-foreground">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalLectures()}</div>
              <div className="text-sm text-muted-foreground">Lectures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatDuration(getTotalDuration())}</div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="sectionTitle">Section Title *</Label>
            <Input
              id="sectionTitle"
              value={sectionForm.title}
              onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              placeholder="e.g., Introduction to the Topic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sectionDescription">Section Description</Label>
            <Textarea
              id="sectionDescription"
              value={sectionForm.description}
              onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
              placeholder="Optional: Describe what this section covers"
              rows={2}
            />
          </div>
          <Button onClick={addSection} disabled={!sectionForm.title.trim()} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Section
          </Button>
        </CardContent>
      </Card>

      {/* Sections List */}
      <div className="space-y-3">
        {curriculum.map((section, sectionIdx) => (
          <Card key={sectionIdx} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-move" />
                  <div className="flex-1">
                    {editingSection === sectionIdx ? (
                      <div className="space-y-2">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(sectionIdx, { title: e.target.value })}
                          placeholder="Section title"
                        />
                        <Textarea
                          value={section.description || ""}
                          onChange={(e) => updateSection(sectionIdx, { description: e.target.value })}
                          placeholder="Section description"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditingSection(null)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => toggleSection(sectionIdx)}
                          >
                            {expandedSections.has(sectionIdx) ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </Button>
                          <div>
                            <h3 className="font-semibold">
                              Section {sectionIdx + 1}: {section.title}
                            </h3>
                            {section.description && (
                              <p className="text-sm text-muted-foreground">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{section.lectures.length} lectures</Badge>
                          <Badge variant="outline">
                            {formatDuration(section.lectures.reduce((sum, l) => sum + (l.duration || 0), 0))}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(sectionIdx, 'up')}
                    disabled={sectionIdx === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSection(sectionIdx, 'down')}
                    disabled={sectionIdx === curriculum.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection(sectionIdx)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSection(sectionIdx)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedSections.has(sectionIdx) && (
              <CardContent className="space-y-3 pt-0">
                {/* Lectures List */}
                <div className="space-y-2 ml-7">
                  {section.lectures.map((lecture, lectureIdx) => (
                    <Card key={lectureIdx} className="bg-muted/50">
                      <CardContent className="p-3">
                        {editingLecture?.sectionIdx === sectionIdx && editingLecture?.lectureIdx === lectureIdx ? (
                          <div className="space-y-2">
                            <Input
                              value={lecture.title}
                              onChange={(e) => updateLecture(sectionIdx, lectureIdx, { title: e.target.value })}
                              placeholder="Lecture title"
                            />
                            <Select
                              value={lecture.type}
                              onValueChange={(value: Lecture['type']) => 
                                updateLecture(sectionIdx, lectureIdx, { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="article">Article</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                              </SelectContent>
                            </Select>
                            {lecture.type === 'video' && (
                              <Input
                                value={lecture.videoUrl || ""}
                                onChange={(e) => updateLecture(sectionIdx, lectureIdx, { videoUrl: e.target.value })}
                                placeholder="Video URL"
                              />
                            )}
                            {(lecture.type === 'article' || lecture.type === 'assignment') && (
                              <Textarea
                                value={lecture.content || ""}
                                onChange={(e) => updateLecture(sectionIdx, lectureIdx, { content: e.target.value })}
                                placeholder="Lecture content (Markdown supported)"
                                rows={4}
                              />
                            )}
                            <Input
                              type="number"
                              value={lecture.duration}
                              onChange={(e) => updateLecture(sectionIdx, lectureIdx, { duration: parseInt(e.target.value) || 0 })}
                              placeholder="Duration (minutes)"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setEditingLecture(null)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingLecture(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                {lecture.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                <div className="flex-1">
                                  <div className="font-medium">{lecture.title}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{lecture.type}</Badge>
                                    <span className="text-xs text-muted-foreground">{lecture.duration}m</span>
                                    {lecture.resources && lecture.resources.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {lecture.resources.length} resources
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveLecture(sectionIdx, lectureIdx, 'up')}
                                  disabled={lectureIdx === 0}
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveLecture(sectionIdx, lectureIdx, 'down')}
                                  disabled={lectureIdx === section.lectures.length - 1}
                                >
                                  ↓
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingLecture({ sectionIdx, lectureIdx })}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAddingResource({ sectionIdx, lectureIdx })}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteLecture(sectionIdx, lectureIdx)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Resources */}
                            {lecture.resources && lecture.resources.length > 0 && (
                              <div className="mt-2 ml-6 space-y-1">
                                {lecture.resources.map((resource, resourceIdx) => (
                                  <div key={resourceIdx} className="flex items-center justify-between text-xs bg-background p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <Download className="w-3 h-3" />
                                      <span>{resource.title}</span>
                                      <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteResource(sectionIdx, lectureIdx, resourceIdx)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Resource Form */}
                            {addingResource?.sectionIdx === sectionIdx && addingResource?.lectureIdx === lectureIdx && (
                              <div className="mt-2 ml-6 space-y-2 p-2 border rounded">
                                <Input
                                  value={resourceForm.title}
                                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                                  placeholder="Resource title"
                                  className="text-sm"
                                />
                                <Select
                                  value={resourceForm.type}
                                  onValueChange={(value: Resource['type']) => 
                                    setResourceForm({ ...resourceForm, type: value })
                                  }
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="document">Document</SelectItem>
                                    <SelectItem value="link">Link</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={resourceForm.url}
                                  onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                                  placeholder="Resource URL"
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => addResource(sectionIdx, lectureIdx)}
                                    disabled={!resourceForm.title.trim() || !resourceForm.url.trim()}
                                  >
                                    Add Resource
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setAddingResource(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Lecture Form */}
                <Card className="ml-7 bg-muted/30">
                  <CardContent className="p-3 space-y-2">
                    <div className="text-sm font-medium">Add Lecture</div>
                    <Input
                      value={lectureForm.title}
                      onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                      placeholder="Lecture title"
                      className="text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={lectureForm.type}
                        onValueChange={(value: Lecture['type']) => 
                          setLectureForm({ ...lectureForm, type: value })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={lectureForm.duration}
                        onChange={(e) => setLectureForm({ ...lectureForm, duration: parseInt(e.target.value) || 0 })}
                        placeholder="Duration (min)"
                        className="text-sm"
                      />
                    </div>
                    {lectureForm.type === 'video' && (
                      <Input
                        value={lectureForm.videoUrl}
                        onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                        placeholder="Video URL (YouTube/Vimeo embed)"
                        className="text-sm"
                      />
                    )}
                    {(lectureForm.type === 'article' || lectureForm.type === 'assignment') && (
                      <Textarea
                        value={lectureForm.content}
                        onChange={(e) => setLectureForm({ ...lectureForm, content: e.target.value })}
                        placeholder="Content (Markdown supported)"
                        rows={3}
                        className="text-sm"
                      />
                    )}
                    <Button 
                      onClick={() => addLecture(sectionIdx)} 
                      disabled={!lectureForm.title.trim()}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lecture to Section
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {curriculum.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No sections yet. Add your first section above to start building your curriculum.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
