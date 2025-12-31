import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllReferrals, 
  getReferralStats, 
  updateReferral, 
  deleteReferral,
  type Referral,
  type ReferralStats
} from "@/api/referrals";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle,
  Edit,
  Trash2,
  Search,
  Award,
  UserPlus
} from "lucide-react";

const ReferralManagement = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [editForm, setEditForm] = useState<{
    status: 'pending' | 'completed' | 'expired';
    rewardAmount: number;
    rewardClaimed: boolean;
  }>({
    status: 'pending',
    rewardAmount: 0,
    rewardClaimed: false,
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [referralsData, statsData] = await Promise.all([
        getAllReferrals(),
        getReferralStats(),
      ]);
      setReferrals(referralsData);
      setStats(statsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch referral data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (referral: Referral) => {
    setEditingReferral(referral);
    setEditForm({
      status: referral.status,
      rewardAmount: referral.rewardAmount,
      rewardClaimed: referral.rewardClaimed,
    });
    setIsEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingReferral) return;

    try {
      await updateReferral(editingReferral.id, editForm);
      toast({
        title: "Success",
        description: "Referral updated successfully",
      });
      await fetchData();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update referral",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this referral?")) {
      return;
    }

    try {
      await deleteReferral(id);
      toast({
        title: "Success",
        description: "Referral deleted successfully",
      });
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete referral",
        variant: "destructive",
      });
    }
  };

  // Filter referrals
  const filteredReferrals = referrals.filter((ref) => {
    const matchesSearch =
      ref.referrerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referrerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referredEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referredUserName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || ref.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-500 gap-1">
            <CheckCircle className="w-3 h-3" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-500/10 text-red-500 gap-1">
            <XCircle className="w-3 h-3" /> Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Referral Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all referral registrations
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All registered referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalReferrals > 0
                    ? `${((stats.completedReferrals / stats.totalReferrals) * 100).toFixed(1)}% completion rate`
                    : "No referrals yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting signup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRewards.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.claimedRewards.toFixed(2)} claimed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Referrers */}
        {stats && stats.topReferrers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Referrers
              </CardTitle>
              <CardDescription>Users with the most referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topReferrers.slice(0, 5).map((referrer, index) => (
                  <div
                    key={referrer.referrerId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{referrer.referrerName}</p>
                        <p className="text-sm text-muted-foreground">{referrer.referrerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{referrer.totalReferrals}</p>
                        <p className="text-muted-foreground">Referrals</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{referrer.completedReferrals}</p>
                        <p className="text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">${referrer.totalRewards.toFixed(2)}</p>
                        <p className="text-muted-foreground">Rewards</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Referrals</CardTitle>
            <CardDescription>
              {filteredReferrals.length} referral{filteredReferrals.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Loading referrals...</p>
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No referrals found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred Email</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{referral.referrerName || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {referral.referrerEmail || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{referral.referredEmail}</TableCell>
                        <TableCell>
                          {referral.referredUserId ? (
                            <div>
                              <p className="font-medium">{referral.referredUserName}</p>
                              <Badge variant="outline" className="mt-1">
                                {referral.referredUserType}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not registered</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${referral.rewardAmount.toFixed(2)}</p>
                            {referral.rewardClaimed ? (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Claimed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Unclaimed
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(referral)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(referral.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Referral</DialogTitle>
              <DialogDescription>
                Update referral status and reward information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as 'pending' | 'completed' | 'expired' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reward Amount ($)</Label>
                <Input
                  type="number"
                  value={editForm.rewardAmount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, rewardAmount: parseFloat(e.target.value) || 0 })
                  }
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Reward Status</Label>
                <Select
                  value={editForm.rewardClaimed ? "claimed" : "unclaimed"}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, rewardClaimed: value === "claimed" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unclaimed">Unclaimed</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Update Referral</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ReferralManagement;
