import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { 
  MessageCircle, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Search,
  User,
  Mail,
  Calendar,
  TrendingUp,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { getAllTickets, getTicketStats, updateTicket, addTicketReply, deleteTicket } from '@/api/tickets';
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
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  _id: string;
  ticketNumber: string;
  type: 'issue' | 'support';
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitterName: string;
  submitterEmail: string;
  replies: Array<{
    message: string;
    repliedByName: string;
    isAdmin: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  lastReplyAt?: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  issues: number;
  support: number;
  urgent: number;
}

const TicketManagement = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTicketNumber, setDeleteTicketNumber] = useState<string | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsData, statsData] = await Promise.all([
        getAllTickets({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined
        }),
        getTicketStats()
      ]);
      setTickets(ticketsData.tickets);
      setStats(statsData.stats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketNumber: string, newStatus: string) => {
    try {
      await updateTicket(ticketNumber, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${newStatus}`
      });
      fetchData();
      if (selectedTicket && selectedTicket.ticketNumber === ticketNumber) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const handlePriorityChange = async (ticketNumber: string, newPriority: string) => {
    try {
      await updateTicket(ticketNumber, { priority: newPriority });
      toast({
        title: 'Priority Updated',
        description: `Ticket priority changed to ${newPriority}`
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update priority',
        variant: 'destructive'
      });
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await addTicketReply(selectedTicket.ticketNumber, replyMessage);
      toast({
        title: 'Reply Sent',
        description: 'Your reply has been sent to the user'
      });
      setReplyMessage('');
      fetchData();
      const updatedTickets = await getAllTickets({});
      const updatedTicket = updatedTickets.tickets.find(
        (t: Ticket) => t.ticketNumber === selectedTicket.ticketNumber
      );
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive'
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicketNumber) return;
    setDeletingTicket(true);
    try {
      await deleteTicket(deleteTicketNumber);
      toast({
        title: 'Ticket Deleted',
        description: `Ticket ${deleteTicketNumber} has been permanently deleted.`
      });
      const wasSelected = selectedTicket?.ticketNumber === deleteTicketNumber;
      setDeleteTicketNumber(null);
      if (wasSelected) setSelectedTicket(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete ticket',
        variant: 'destructive'
      });
    } finally {
      setDeletingTicket(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      urgent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getTypeIcon = (type: string) => {
    return type === 'issue' ? <AlertTriangle className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.submitterEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tickets & Support</h1>
            <p className="text-muted-foreground mt-1">
              Manage user issues and support requests
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="gap-2 self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-2xl font-bold">{stats.issues}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Support</p>
                  <p className="text-2xl font-bold">{stats.support}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Urgent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.urgent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="issue">Issues</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets found</div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket._id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            {ticket.ticketNumber}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            {getTypeIcon(ticket.type)}
                            {ticket.type}
                          </Badge>
                          <Badge variant="secondary">{ticket.category}</Badge>
                        </div>

                        <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.message}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.submitterName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {ticket.submitterEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </span>
                          {ticket.replies.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTicketNumber(ticket.ticketNumber);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">{selectedTicket.subject}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        {selectedTicket.ticketNumber}
                      </Badge>
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => handleStatusChange(selectedTicket.ticketNumber, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(value) => handlePriorityChange(selectedTicket.ticketNumber, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-1.5 mt-1"
                      onClick={() => setDeleteTicketNumber(selectedTicket.ticketNumber)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Ticket
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Submitter Info */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{selectedTicket.submitterName}</p>
                        <p className="text-sm text-muted-foreground">{selectedTicket.submitterEmail}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Original Message */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Original Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                  </CardContent>
                </Card>

                {/* Replies */}
                {selectedTicket.replies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Conversation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {selectedTicket.replies.map((reply, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg ${
                                reply.isAdmin
                                  ? 'bg-blue-50 dark:bg-blue-950 ml-8'
                                  : 'bg-gray-50 dark:bg-gray-900 mr-8'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-sm">
                                  {reply.repliedByName}
                                  {reply.isAdmin && (
                                    <Badge variant="secondary" className="ml-2">Admin</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Reply Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Send Reply</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="w-full"
                    >
                      {sendingReply ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTicketNumber} onOpenChange={(open) => !open && setDeleteTicketNumber(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Ticket
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete ticket{' '}
              <strong className="text-foreground">{deleteTicketNumber}</strong>?{' '}
              This action cannot be undone and all conversation history will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTicket}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              disabled={deletingTicket}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingTicket ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default TicketManagement;
