import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  BookOpen,
  Loader2 
} from 'lucide-react';
import { 
  getAllSubjects, 
  createSubject, 
  updateSubject, 
  deleteSubject, 
  toggleSubjectStatus,
  type Subject 
} from '@/api/subjects';

// Helper to safely get subject ID
const getSubjectId = (subject: Subject): string => {
  return subject._id || subject.id || '';
};

const SubjectManagement = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      console.log('[fetchSubjects] Fetching subjects...');
      const data = await getAllSubjects();
      console.log('[fetchSubjects] Received subjects:', data);
      setSubjects(data || []);
    } catch (error: any) {
      console.error('[fetchSubjects] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load subjects',
        variant: 'destructive'
      });
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSubject(null);
    setFormData({
      name: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Subject name is required',
        variant: 'destructive'
      });
      return;
    }
    
    setSubmitting(true);

    try {
      console.log('[handleSubmit] Form data:', formData);
      
      if (editingSubject) {
        const subjectId = getSubjectId(editingSubject);
        if (!subjectId) {
          throw new Error('Subject ID is missing');
        }
        console.log('[handleSubmit] Updating subject:', subjectId);
        await updateSubject(subjectId, formData);
        toast({
          title: 'Success',
          description: 'Subject updated successfully'
        });
      } else {
        console.log('[handleSubmit] Creating new subject');
        const result = await createSubject(formData);
        console.log('[handleSubmit] Subject created:', result);
        toast({
          title: 'Success',
          description: 'Subject created successfully'
        });
      }
      
      handleCloseDialog();
      await fetchSubjects(); // Wait for fetch to complete
    } catch (error: any) {
      console.error('[handleSubmit] Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Operation failed',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (subject: Subject) => {
    try {
      const subjectId = getSubjectId(subject);
      if (!subjectId) {
        throw new Error('Subject ID is missing');
      }
      await toggleSubjectStatus(subjectId);
      toast({
        title: 'Success',
        description: `Subject ${subject.isActive ? 'deactivated' : 'activated'} successfully`
      });
      fetchSubjects();
    } catch (error: any) {
      console.error('[handleToggleStatus] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      const subjectId = getSubjectId(subjectToDelete);
      if (!subjectId) {
        throw new Error('Subject ID is missing');
      }
      await deleteSubject(subjectId);
      toast({
        title: 'Success',
        description: 'Subject deleted successfully'
      });
      fetchSubjects();
    } catch (error: any) {
      console.error('[handleDelete] Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to delete subject',
        variant: 'destructive'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Subject Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage available subjects for all grade levels
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subjects ({subjects.length})</CardTitle>
            <CardDescription>
              Active subjects are visible to students. Manage subject details, categories, and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No subjects found. Create your first subject.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((subject) => {
                    if (!subject || !subject._id) {
                      console.warn('[SubjectTable] Invalid subject:', subject);
                      return null;
                    }
                    
                    return (
                      <TableRow key={subject._id}>
                        <TableCell className="font-medium">
                          {subject.name || 'Unnamed'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={subject.isActive ? 'default' : 'secondary'}>
                            {subject.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(subject)}
                              title={subject.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(subject)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subject)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }).filter(Boolean)}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {subjects.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, subjects.length)} to{' '}
                      {Math.min(currentPage * itemsPerPage, subjects.length)} of {subjects.length} subjects
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(subjects.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(subjects.length / itemsPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(subjects.length / itemsPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </DialogTitle>
              <DialogDescription>
                {editingSubject 
                  ? 'Update subject information below'
                  : 'Enter the subject name to add it to the database'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  required
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingSubject ? 'Update' : 'Create'} Subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subject "{subjectToDelete?.name}". 
              This action cannot be undone and will affect all related lessons and topics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Subject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SubjectManagement;
