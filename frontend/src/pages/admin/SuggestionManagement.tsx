import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllSuggestions, 
  updateSuggestion, 
  deleteSuggestion,
  type Suggestion 
} from '@/api/suggestions';
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

const SuggestionManagement = () => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (gradeFilter !== 'all') filters.grade = gradeFilter;
      
      const data = await getAllSuggestions(filters);
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      toast({
        title: 'Error',
        description: 'Failed to load suggestions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter, gradeFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSuggestions();
    }, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, gradeFilter]);

  const handleViewSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminNotes(suggestion.adminNotes || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (status: 'reviewed' | 'approved' | 'rejected') => {
    if (!selectedSuggestion?._id) return;

    try {
      await updateSuggestion(selectedSuggestion._id, {
        status,
        adminNotes,
      });

      toast({
        title: 'Success',
        description: `Suggestion marked as ${status}`,
      });

      setIsDialogOpen(false);
      fetchSuggestions();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update suggestion',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;

    try {
      await deleteSuggestion(id);
      toast({
        title: 'Success',
        description: 'Suggestion deleted successfully',
      });
      fetchSuggestions();
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete suggestion',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
      reviewed: { color: 'bg-blue-500', icon: Eye, label: 'Reviewed' },
      approved: { color: 'bg-green-500', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: suggestions?.length || 0,
    pending: suggestions?.filter(s => s.status === 'pending').length || 0,
    approved: suggestions?.filter(s => s.status === 'approved').length || 0,
    rejected: suggestions?.filter(s => s.status === 'rejected').length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Suggestions</h1>
            <p className="text-muted-foreground">
              Manage student suggestions for new topics and content {loading && <span className="text-blue-600">(Refreshing...)</span>}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Activity className="w-4 h-4 mr-1 animate-pulse" />
            Auto-refresh enabled
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Lightbulb className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer" onClick={() => setStatusFilter('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer" onClick={() => setStatusFilter('approved')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer" onClick={() => setStatusFilter('rejected')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Grade</label>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={fetchSuggestions}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Suggestions</CardTitle>
            <CardDescription>
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No suggestions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestions.map((suggestion) => (
                      <TableRow key={suggestion._id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="line-clamp-2">{suggestion.topic}</div>
                        </TableCell>
                        <TableCell>
                          {suggestion.user?.fullName || 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          {suggestion.grade ? `Grade ${suggestion.grade}` : '-'}
                        </TableCell>
                        <TableCell>{suggestion.subject || '-'}</TableCell>
                        <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                        <TableCell>
                          {suggestion.createdAt 
                            ? format(new Date(suggestion.createdAt), 'MMM dd, yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewSuggestion(suggestion)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(suggestion._id!)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Suggestion Details</DialogTitle>
              <DialogDescription>
                Review and update the status of this suggestion
              </DialogDescription>
            </DialogHeader>
            {selectedSuggestion && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Topic</label>
                  <p className="text-lg font-semibold mt-1">{selectedSuggestion.topic}</p>
                </div>

                {selectedSuggestion.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1">{selectedSuggestion.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student</label>
                    <p className="mt-1">{selectedSuggestion.user?.fullName || 'Anonymous'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">{selectedSuggestion.user?.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Grade</label>
                    <p className="mt-1">{selectedSuggestion.grade ? `Grade ${selectedSuggestion.grade}` : '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject</label>
                    <p className="mt-1">{selectedSuggestion.subject || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <div className="mt-1">{getStatusBadge(selectedSuggestion.status)}</div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this suggestion..."
                    rows={4}
                    maxLength={500}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('reviewed')}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                Mark Reviewed
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('rejected')}
                className="bg-red-50 text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleUpdateStatus('approved')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default SuggestionManagement;
