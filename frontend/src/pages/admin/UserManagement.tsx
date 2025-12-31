import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  PlusCircle
} from "lucide-react";
import { LoadingScreen, Skeleton } from "@/components/ui/loading";
import { getAllProfiles, createAdmin, updateUser, resetUserPassword, deactivateUser, deleteUser } from "@/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles from MongoDB
      const profiles = await getAllProfiles();

      // Transform data for display
      const usersData: User[] = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        userType: profile.userType,
        createdAt: profile.createdAt || new Date().toISOString(),
        status: "active"
      }));

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
  });

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

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      toast({
        title: 'User Deleted',
        description: `Successfully deleted ${user.email}`,
      });
      await fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Unable to delete user',
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
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage students, referrals, and admins
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowCreateAdminModal(true)}>
              <Shield className="w-4 h-4" />
              New Admin
            </Button>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
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
              <Button variant="outline" type="button">
                Export
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
                <CardTitle>User List</CardTitle>
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
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No users found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
              <Input id="adminPassword" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Enter secure password" disabled={creatingAdmin} />
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
    </AdminLayout>
  );
};

export default UserManagement;
