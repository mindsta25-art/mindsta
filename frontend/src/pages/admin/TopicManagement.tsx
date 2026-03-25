import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/AdminLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
  Filter,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  addLessonsToTopic,
  getTopicFilters,
  type Topic,
} from '@/api/topics';
import { getLessons } from '@/api/lessons';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const DIFFICULTIES = ['beginner', 'easy', 'intermediate', 'medium', 'advanced', 'hard'];

export default function TopicManagement() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState<Partial<Topic>>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    term: '',
    price: 0,
    discountPercentage: 0,
    difficulty: 'beginner',
    learningOutcomes: [],
    keywords: [],
    isActive: true,
    isPublished: false,
  });
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [currentTopicForLessons, setCurrentTopicForLessons] = useState<Topic | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  useEffect(() => {
    loadTopics();
    loadSubjects();
    loadGrades();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const data = await getTopics();
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const filters = await getTopicFilters();
      console.log('Loaded subjects from filters:', filters.subjects);
      // Convert subject names to the format expected by the component
      const subjectsData = (filters.subjects || []).map(name => ({ _id: name, name }));
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadGrades = async () => {
    try {
      const filters = await getTopicFilters();
      console.log('Loaded filters:', filters);
      setGrades(filters.grades || []);
      console.log('Grades set to:', filters.grades);
    } catch (error) {
      console.error('Error loading grades:', error);
      // Fallback to empty array if fetch fails
      setGrades([]);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!formData.title || !formData.subject || !formData.grade || !formData.term) {
        toast.error('Please fill all required fields');
        return;
      }

      if (editingTopic) {
        await updateTopic(editingTopic.id || editingTopic._id!, formData);
        toast.success('Topic updated successfully');
      } else {
        await createTopic(formData);
        toast.success('Topic created successfully');
      }
      
      setShowDialog(false);
      resetForm();
      loadTopics();
    } catch (error: any) {
      console.error('Error saving topic:', error);
      toast.error(error.response?.data?.error || 'Failed to save topic');
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      description: topic.description,
      subject: topic.subject,
      grade: topic.grade,
      term: topic.term,
      price: topic.price,
      discountPercentage: topic.discountPercentage,
      difficulty: topic.difficulty,
      imageUrl: topic.imageUrl,
      learningOutcomes: topic.learningOutcomes,
      keywords: topic.keywords,
      isActive: topic.isActive,
      isPublished: topic.isPublished,
    });
    setShowDialog(true);
  };

  const handleDelete = (topic: Topic) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!topicToDelete) return;
    try {
      await deleteTopic(topicToDelete.id || topicToDelete._id!);
      toast.success('Topic deleted successfully');
      loadTopics();
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast.error(error.response?.data?.error || 'Failed to delete topic');
    } finally {
      setTopicToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingTopic(null);
    setFormData({
      title: '',
      description: '',
      subject: '',
      grade: '',
      term: '',
      price: 0,
      discountPercentage: 0,
      difficulty: 'beginner',
      learningOutcomes: [],
      keywords: [],
      isActive: true,
      isPublished: false,
    });
  };

  const handleManageLessons = async (topic: Topic) => {
    setCurrentTopicForLessons(topic);
    setSelectedLessons(topic.lessons?.map((l: any) => l._id || l.id) || []);
    
    // Load lessons for the topic's subject, grade, and term
    try {
      const lessons = await getLessons(topic.subject, topic.grade, topic.term);
      setAvailableLessons(lessons || []);
      setShowLessonSelector(true);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast.error('Failed to load lessons');
      setAvailableLessons([]);
    }
  };

  const handleSaveLessons = async () => {
    if (!currentTopicForLessons) return;
    
    try {
      await addLessonsToTopic(
        currentTopicForLessons.id || currentTopicForLessons._id!,
        selectedLessons
      );
      toast.success('Lessons updated successfully');
      setShowLessonSelector(false);
      loadTopics();
    } catch (error: any) {
      console.error('Error updating lessons:', error);
      toast.error(error.response?.data?.error || 'Failed to update lessons');
    }
  };

  const toggleLessonSelection = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const filteredTopics = (topics || []).filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = !filterGrade || topic.grade === filterGrade;
    const matchesSubject = !filterSubject || topic.subject === filterSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Topic Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage learning topics</p>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Topic
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Grade</Label>
                <Select value={filterGrade || 'all'} onValueChange={(value) => setFilterGrade(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {(grades || []).map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Subject</Label>
                <Select value={filterSubject || 'all'} onValueChange={(value) => setFilterSubject(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {(subjects || []).map(subject => (
                      <SelectItem key={subject._id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Topics ({filteredTopics.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics.map(topic => (
                    <TableRow key={topic.id || topic._id}>
                      <TableCell className="font-medium">{topic.title}</TableCell>
                      <TableCell>{topic.subject}</TableCell>
                      <TableCell>{topic.grade}</TableCell>
                      <TableCell>{topic.term}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageLessons(topic)}
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          {topic.lessons?.length || 0}
                        </Button>
                      </TableCell>
                      <TableCell>{formatPrice(topic.price)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {topic.isPublished ? (
                            <Badge variant="default">
                              <Eye className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                          {!topic.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(topic)}
                            title="Edit topic"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageLessons(topic)}
                            title="Manage lessons"
                          >
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(topic)}
                            title="Delete topic"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? 'Edit Topic' : 'Create New Topic'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details for the topic
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter topic title"
                />
              </div>
              
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter topic description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {(subjects || []).map(subject => (
                        <SelectItem key={subject._id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Grade *</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => setFormData({ ...formData, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {(grades || []).map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Term *</Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value) => setFormData({ ...formData, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map(term => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(diff => (
                        <SelectItem key={diff} value={diff}>
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                  <Label>Published</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate}>
                <Save className="w-4 h-4 mr-2" />
                {editingTopic ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Selector Dialog */}
        <Dialog open={showLessonSelector} onOpenChange={setShowLessonSelector}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Lessons</DialogTitle>
              <DialogDescription>
                Select lessons for "{currentTopicForLessons?.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2">
              {(availableLessons || []).map(lesson => {
                const lessonId = lesson._id || lesson.id;
                return (
                  <div
                    key={lessonId}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLessons.includes(lessonId)}
                      onChange={() => toggleLessonSelection(lessonId)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-muted-foreground">{lesson.description}</div>
                    </div>
                  </div>
                );
              })}
              
              {(availableLessons || []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No lessons found for this topic's criteria
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLessonSelector(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLessons}>
                Save Lessons ({selectedLessons.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Topic"
        description={`Are you sure you want to delete "${topicToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Topic"
        destructive
      />
    </AdminLayout>
  );
}
