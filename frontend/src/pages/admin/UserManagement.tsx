import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { siteConfig } from "@/config/siteConfig";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  Edit,
  PlusCircle,
  Download,
  Wifi,
  WifiOff,
  Circle,
  Eye,
  EyeOff
} from "lucide-react";
import { LoadingScreen, Skeleton } from "@/components/ui/loading";
import { getAllProfiles, createAdmin, updateUser, resetUserPassword, deactivateUser, deleteUser } from "@/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface User {
  id: string;
  email: string;
  fullName?: string;
  userType: string;
  createdAt: string;
  status?: string;
  isOnline?: boolean;
  lastActiveAt?: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  
  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editUserType, setEditUserType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [updatingUser, setUpdatingUser] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Add User modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserType, setNewUserType] = useState("student");
  const [creatingUser, setCreatingUser] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [onlineCount, setOnlineCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [silentRefreshing, setSilentRefreshing] = useState(false);

  // Reset page when search query or tab changes
  useEffect(() => {
    setUsersPage(1);
  }, [searchQuery, selectedTab]);

  useEffect(() => {
    fetchUsers(false);
    
    // Auto-refresh every 30 seconds to update online/offline status silently
    const refreshInterval = setInterval(() => {
      fetchUsers(true); // silent = true: don't show loading screen
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchUsers = async (silent = false) => {
    try {
      if (silent) {
        setSilentRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch all profiles from MongoDB
      const profiles = await getAllProfiles();

      // Transform data for display
      const usersData: User[] = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        userType: profile.userType,
        createdAt: profile.createdAt || new Date().toISOString(),
        status: "active",
        isOnline: profile.isOnline || false,
        lastActiveAt: profile.lastActiveAt,
      }));

      setUsers(usersData);
      
      // Calculate online/offline counts
      const online = usersData.filter(u => u.isOnline).length;
      const offline = usersData.length - online;
      setOnlineCount(online);
      setOfflineCount(offline);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSilentRefreshing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      selectedTab === "all" || 
      user.userType === selectedTab;

    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    // Online users always appear first
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    // Among online users sort by lastActiveAt descending
    if (a.isOnline && b.isOnline) {
      const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return bTime - aTime;
    }
    return 0;
  });

  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case "student":
        return "bg-blue-500/10 text-blue-500";
      case "referral":
        return "bg-green-500/10 text-green-500";
      case "admin":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "inactive":
        return "bg-gray-500/10 text-gray-500";
      case "suspended":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading user management..." />;
  }

  const userTypeCounts = {
    all: users.length,
    student: users.filter(u => u.userType === "student").length,
    referral: users.filter(u => u.userType === "referral").length,
    admin: users.filter(u => u.userType === "admin").length,
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword || !adminFullName) {
      toast({
        title: 'Missing fields',
        description: 'Email, password and full name are required.',
        variant: 'destructive'
      });
      return;
    }
    try {
      setCreatingAdmin(true);
      const newAdmin = await createAdmin({
        email: adminEmail,
        password: adminPassword,
        fullName: adminFullName,
      });
      toast({
        title: 'Admin Created',
        description: `Successfully created admin ${newAdmin.email}`,
      });
      // Refresh users list
      await fetchUsers();
      // Reset form
      setAdminEmail('');
      setAdminPassword('');
      setAdminFullName('');
      setShowCreateAdminModal(false);
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err?.message || 'Unable to create admin',
        variant: 'destructive'
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName || "");
    setEditUserType(user.userType);
    setEditStatus(user.status || "active");
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdatingUser(true);
      await updateUser(editingUser.id, {
        fullName: editFullName,
        userType: editUserType,
        status: editStatus
      });
      
      toast({
        title: 'User Updated',
        description: `Successfully updated ${editingUser.email}`,
      });
      
      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err?.message || 'Unable to update user',
        variant: 'destructive'
      });
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      toast({
        title: 'User Deleted',
        description: `Successfully deleted ${userToDelete.email}`,
      });
      await fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete user',
        variant: 'destructive'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast({
        title: 'Missing fields',
        description: 'Email, password and full name are required.',
        variant: 'destructive'
      });
      return;
    }
    try {
      setCreatingUser(true);
      
      // Use createAdmin API but with selected user type
      const newUser = await createAdmin({
        email: newUserEmail,
        password: newUserPassword,
        fullName: newUserFullName,
        userType: newUserType
      });
      
      toast({
        title: 'User Created',
        description: `Successfully created ${newUserType} ${newUser.email}`,
      });
      
      await fetchUsers();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserType('student');
      setShowAddUserModal(false);
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err?.message || 'Unable to create user',
        variant: 'destructive'
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const exportUsers = () => {
    setShowExportDialog(true);
  };

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindsta-users-${timestamp}.pdf`;

      // Create PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234); // Primary color
      doc.text('Mindsta Users Report', 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
      doc.text(`Total Users: ${filteredUsers.length}`, 14, 34);

      // Prepare table data
      const tableData = filteredUsers.map(user => [
        user.fullName || 'N/A',
        user.email,
        user.userType,
        user.status || 'active',
        new Date(user.createdAt).toLocaleDateString()
      ]);

      // Add table
      autoTable(doc, {
        head: [['Full Name', 'Email', 'User Type', 'Status', 'Joined Date']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: orientation === 'portrait' ? 40 : 60 },
          1: { cellWidth: orientation === 'portrait' ? 50 : 70 },
          2: { cellWidth: orientation === 'portrait' ? 30 : 40 },
          3: { cellWidth: orientation === 'portrait' ? 25 : 30 },
          4: { cellWidth: orientation === 'portrait' ? 30 : 40 },
        },
        margin: { top: 40, right: 14, bottom: 20, left: 14 },
      });

      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const pageHeight = doc.internal.pageSize.height;
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          '© 2024 Mindsta. All rights reserved.',
          14,
          pageHeight - 10
        );
      }

      // Save PDF
      doc.save(filename);

      toast({
        title: 'Export Successful',
        description: `Exported ${filteredUsers.length} users as PDF (${orientation})`,
      });

      setShowPdfDialog(false);
      setShowExportDialog(false);
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExport = (format: 'csv' | 'json' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      setShowPdfDialog(true);
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindsta-users-${timestamp}`;

      if (format === 'csv') {
        // Create CSV content
        const headers = ['Full Name', 'Email', 'User Type', 'Status', 'Joined Date'];
        const csvRows = [
          headers.join(','),
          ...filteredUsers.map(user => [
            `"${user.fullName || 'N/A'}"`,
            `"${user.email}"`,
            user.userType,
            user.status || 'active',
            new Date(user.createdAt).toLocaleDateString()
          ].join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'json') {
        // Export as JSON
        const jsonData = filteredUsers.map(user => ({
          fullName: user.fullName || 'N/A',
          email: user.email,
          userType: user.userType,
          status: user.status || 'active',
          joinedDate: new Date(user.createdAt).toISOString(),
          id: user.id
        }));
        
        const jsonContent = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Export as Excel-compatible CSV with better formatting
        const headers = ['Full Name', 'Email', 'User Type', 'Status', 'Joined Date', 'User ID'];
        const csvRows = [
          headers.join(','),
          ...filteredUsers.map(user => [
            `"${user.fullName || 'N/A'}"`,
            `"${user.email}"`,
            `"${user.userType}"`,
            `"${user.status || 'active'}"`,
            `"${new Date(user.createdAt).toLocaleDateString()}"`,
            `"${user.id}"`
          ].join(','))
        ];
        
        const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'Export Successful',
        description: `Exported ${filteredUsers.length} users as ${format.toUpperCase()}`,
      });
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export users',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              User Management
              {silentRefreshing && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  syncing
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage students, referrals, and admins
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowCreateAdminModal(true)}>
              <Shield className="w-4 h-4" />
              New Admin
            </Button>
            <Button className="gap-2" onClick={() => setShowAddUserModal(true)}>
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Online/Offline Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Online Users</p>
                  <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
                    {onlineCount}
                    <Circle className="w-3 h-3 fill-green-500 text-green-500 animate-pulse" />
                  </h3>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Active in the last 5 minutes
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offline Users</p>
                  <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                    {offlineCount}
                    <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />
                  </h3>
                </div>
                <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Inactive or logged out
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {users.length}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {users.length > 0 ? `${((onlineCount / users.length) * 100).toFixed(1)}% online` : 'No users yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                type="button"
                onClick={exportUsers}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export ({filteredUsers.length})
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Users Table */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Users ({userTypeCounts.all})
            </TabsTrigger>
            <TabsTrigger value="student">
              Students ({userTypeCounts.student})
            </TabsTrigger>
            <TabsTrigger value="referral">
              Referrals ({userTypeCounts.referral})
            </TabsTrigger>
            <TabsTrigger value="admin">
              Admins ({userTypeCounts.admin})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  User List
                  {onlineCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5">
                      <Circle className="w-2 h-2 fill-green-500 animate-pulse" />
                      {onlineCount} online first
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {filteredUsers.length} user(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Online Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No users found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.fullName || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                {user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getUserTypeColor(user.userType)}>
                                {user.userType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status || "active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.isOnline ? (
                                  <>
                                    <div className="relative flex items-center">
                                      <Circle className="w-3 h-3 text-green-500 fill-green-500 animate-pulse" />
                                      <Circle className="absolute w-3 h-3 text-green-500 animate-ping" />
                                    </div>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-3 h-3 text-gray-400 fill-gray-400" />
                                    <span className="text-sm text-muted-foreground">Offline</span>
                                    {user.lastActiveAt && (
                                      <span className="text-xs text-muted-foreground">
                                        ({Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / 1000 / 60)}m ago)
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  className="gap-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {filteredUsers.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Showing {Math.min((usersPage - 1) * usersPerPage + 1, filteredUsers.length)}–{Math.min(usersPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                        <Select
                          value={String(usersPerPage)}
                          onValueChange={(val) => { setUsersPerPage(Number(val)); setUsersPage(1); }}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage(1)}
                          disabled={usersPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          «
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                          disabled={usersPage === 1}
                          className="h-8 px-2"
                        >
                          ‹ Prev
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {usersPage} of {usersTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                          disabled={usersPage === usersTotalPages}
                          className="h-8 px-2"
                        >
                          Next ›
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage(usersTotalPages)}
                          disabled={usersPage === usersTotalPages}
                          className="h-8 w-8 p-0"
                        >
                          »
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newUserFullName">Full Name</Label>
              <Input 
                id="newUserFullName" 
                value={newUserFullName} 
                onChange={e => setNewUserFullName(e.target.value)} 
                placeholder="John Doe" 
                disabled={creatingUser} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserEmail">Email</Label>
              <Input 
                id="newUserEmail" 
                type="email" 
                value={newUserEmail} 
                onChange={e => setNewUserEmail(e.target.value)} 
                placeholder="user@example.com" 
                disabled={creatingUser} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserPassword">Password</Label>
              <div className="relative">
                <Input 
                  id="newUserPassword" 
                  type={showNewUserPassword ? "text" : "password"} 
                  value={newUserPassword} 
                  onChange={e => setNewUserPassword(e.target.value)} 
                  placeholder="Enter secure password" 
                  disabled={creatingUser} 
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNewUserPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserType">User Type</Label>
              <Select 
                value={newUserType} 
                onValueChange={setNewUserType}
                disabled={creatingUser}
              >
                <SelectTrigger id="newUserType">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddUserModal(false)} 
                disabled={creatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingUser} className="gap-2">
                <UserPlus className="w-4 h-4" />
                {creatingUser ? 'Creating...' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Admin Modal */}
      <Dialog open={showCreateAdminModal} onOpenChange={setShowCreateAdminModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin Account</DialogTitle>
            <DialogDescription>Provide details for the new administrator.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminFullName">Full Name</Label>
              <Input id="adminFullName" value={adminFullName} onChange={e => setAdminFullName(e.target.value)} placeholder="Jane Doe" disabled={creatingAdmin} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email</Label>
              <Input id="adminEmail" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder={`admin@${siteConfig.company.name.toLowerCase()}.com`} disabled={creatingAdmin} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <div className="relative">
                <Input id="adminPassword" type={showAdminPassword ? "text" : "password"} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Enter secure password" disabled={creatingAdmin} className="pr-10" />
                <button type="button" onClick={() => setShowAdminPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateAdminModal(false)} disabled={creatingAdmin}>Cancel</Button>
              <Button type="submit" disabled={creatingAdmin} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                {creatingAdmin ? 'Creating...' : 'Create Admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <Input 
                id="editFullName" 
                value={editFullName} 
                onChange={e => setEditFullName(e.target.value)} 
                placeholder="John Doe" 
                disabled={updatingUser} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserType">User Type</Label>
              <Select 
                value={editUserType} 
                onValueChange={setEditUserType}
                disabled={updatingUser}
              >
                <SelectTrigger id="editUserType">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select 
                value={editStatus} 
                onValueChange={setEditStatus}
                disabled={updatingUser}
              >
                <SelectTrigger id="editStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditModal(false)} 
                disabled={updatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingUser}>
                {updatingUser ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${userToDelete?.email}? This action cannot be undone and will remove all user data, progress, and enrollments.`}
        confirmText="Delete User"
      />

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Users
            </DialogTitle>
            <DialogDescription>
              Export {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} in your preferred format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Export Format</Label>
              <div className="grid gap-3">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2">
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">CSV Format</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Universal format, works with Excel, Google Sheets, and most tools
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2">
                    <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Excel-Optimized CSV</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Enhanced formatting specifically for Microsoft Excel
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-purple-100 dark:bg-purple-950 p-2">
                    <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">JSON Format</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Developer-friendly format for data processing and APIs
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-red-100 dark:bg-red-950 p-2">
                    <Download className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">PDF Document</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Professional report with portrait or landscape orientation
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold text-foreground mb-1">Export includes:</div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Full Name</li>
                <li>• Email Address</li>
                <li>• User Type & Status</li>
                <li>• Registration Date</li>
                <li>• User ID (JSON & Excel only)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Orientation Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-red-600" />
              PDF Export Options
            </DialogTitle>
            <DialogDescription>
              Choose the page orientation for your PDF export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Select Orientation</Label>
              <div className="grid gap-3">
                <button
                  onClick={() => {
                    setPdfOrientation('portrait');
                    handleExportPdf('portrait');
                  }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-blue-100 dark:bg-blue-950 p-2">
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="7" y="2" width="10" height="20" rx="1" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Portrait</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Vertical orientation (A4: 210mm × 297mm)
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setPdfOrientation('landscape');
                    handleExportPdf('landscape');
                  }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="rounded-md bg-green-100 dark:bg-green-950 p-2">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="7" width="20" height="10" rx="1" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Landscape</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Horizontal orientation (A4: 297mm × 210mm) - Better for wide tables
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold text-foreground mb-1">📄 PDF will include:</div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Professional header with title</li>
                <li>• User data in formatted table</li>
                <li>• Page numbers and footer</li>
                <li>• Generation date and time</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowPdfDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
