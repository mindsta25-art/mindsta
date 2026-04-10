import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatUserName } from "@/lib/stringUtils";
import { 
  getAllReferrals, 
  getReferralStats, 
  updateReferral, 
  deleteReferral,
  adminProcessPayout,
  type Referral,
  type ReferralStats,
  type ReferralTransactionItem
} from "@/api/referrals";
import { api } from "@/lib/apiClient";
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
  UserPlus,
  Receipt,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CreditCard
} from "lucide-react";

const ReferralManagement = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [transactions, setTransactions] = useState<ReferralTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [referralToDelete, setReferralToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [payingOut, setPayingOut] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [referralsData, statsData, transactionsData] = await Promise.all([
        getAllReferrals(),
        getReferralStats(),
        api.get('/referrals/admin/transactions').catch(() => []),
      ]);
      setReferrals(referralsData);
      setStats(statsData);
      setTransactions(transactionsData || []);
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

  const handleQuickPayout = async (referrerId: string, referrerName: string) => {
    setPayingOut(referrerId);
    try {
      const result = await adminProcessPayout(referrerId, 'Processed from transactions panel');
      toast({
        title: 'Payout Processed',
        description: `Commission paid to ${referrerName}`,
      });
      await fetchData();
    } catch (e: any) {
      toast({
        title: 'Payout Failed',
        description: e?.response?.data?.message || e?.message || 'Failed to process payout',
        variant: 'destructive',
      });
    } finally {
      setPayingOut(null);
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
  const handleDelete = async () => {
    if (!referralToDelete) return;

    try {
      await deleteReferral(referralToDelete);
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
    } finally {
      setReferralToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setReferralToDelete(id);
    setDeleteConfirmOpen(true);
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

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredReferrals.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReferrals = filteredReferrals.slice(startIndex, endIndex);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Management</h1>
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
                <div className="text-2xl font-bold">₦{stats.totalRewards.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{stats.claimedRewards.toLocaleString()} claimed
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
                        <p className="font-bold">₦{referrer.totalRewards.toLocaleString()}</p>
                        <p className="text-muted-foreground">Rewards</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referrals Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              <Users className="w-4 h-4 mr-2" />
              All Referrals
            </TabsTrigger>
            <TabsTrigger value="paid">
              <CheckCircle className="w-4 h-4 mr-2" />
              Paid Referrals
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <Receipt className="w-4 h-4 mr-2" />
              Recent Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
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
                      <TableHead>Referral Status</TableHead>
                      <TableHead>User Status</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatUserName(referral.referrerName) || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {referral.referrerEmail || "N/A"}
                            </p>
                            {referral.referrerType && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {referral.referrerType}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{referral.referredEmail}</p>
                        </TableCell>
                        <TableCell>
                          {referral.referredUserId ? (
                            <div>
                              <p className="font-medium">{formatUserName(referral.referredUserName) || "N/A"}</p>
                              <Badge variant="outline" className="mt-1">
                                {referral.referredUserType || "N/A"}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not registered yet</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell>
                          {referral.referredUserStatus ? (
                            <Badge 
                              variant={referral.referredUserStatus === 'active' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {referral.referredUserStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">₦{referral.rewardAmount.toLocaleString()}</p>
                            {referral.rewardClaimed ? (
                              <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-300">
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
                          <div className="text-sm">
                            <p>{new Date(referral.createdAt).toLocaleDateString()}</p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(referral.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.updatedAt ? (
                            <div className="text-sm">
                              <p>{new Date(referral.updatedAt).toLocaleDateString()}</p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(referral.updatedAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
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
                              onClick={() => confirmDelete(referral.id)}
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
            
            {/* Pagination Controls */}
            {!loading && filteredReferrals.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredReferrals.length)} of {filteredReferrals.length} referrals
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 / page</SelectItem>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Paid Referrals Tab */}
          <TabsContent value="paid" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paid Referrals</CardTitle>
                <CardDescription>Referrals who have completed lessons and received commissions</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReferrals.filter(r => r.rewardClaimed).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No paid referrals yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Referred User</TableHead>
                        <TableHead>Reward Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferrals.filter(r => r.rewardClaimed).map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{referral.referrerName}</p>
                              <p className="text-sm text-muted-foreground">{referral.referrerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{referral.referredUserName || 'Not signed up'}</p>
                              <p className="text-sm text-muted-foreground">{referral.referredEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{referral.rewardAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">Paid</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {/* Pending payout alert banner */}
            {transactions.filter((tx: any) => tx.status === 'pending').length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-700 dark:text-orange-400">
                    {transactions.filter((tx: any) => tx.status === 'pending').length} Pending Payout{transactions.filter((tx: any) => tx.status === 'pending').length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    Students have made purchases and commissions are awaiting payment. Use the Pay button on each row to process.
                  </p>
                </div>
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Commission transactions from course purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Purchase Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: any) => (
                        <TableRow
                          key={tx._id}
                          className={tx.status === 'pending' ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.referrerName || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{tx.referrerEmail || tx.referrerId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.studentName || 'Unknown'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{(tx.purchaseAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            ₦{(tx.commissionAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === 'paid' ? 'default' : 'secondary'}
                              className={tx.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-300 dark:border-orange-700' : ''}>
                              {tx.status === 'paid' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />Paid</>
                              ) : (
                                <><Clock className="w-3 h-3 mr-1" />Pending</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>
                              <p>{new Date(tx.createdAt).toLocaleDateString()}</p>
                              {tx.paidAt && (
                                <p className="text-xs text-green-600">Paid: {new Date(tx.paidAt).toLocaleDateString()}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {tx.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                onClick={() => handleQuickPayout(tx.referrerId, tx.referrerName || 'Referrer')}
                                disabled={payingOut === tx.referrerId}
                              >
                                {payingOut === tx.referrerId ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <CreditCard className="w-3 h-3 mr-1" />
                                )}
                                {payingOut === tx.referrerId ? 'Paying…' : 'Pay'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                <Label>Reward Amount (₦)</Label>
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={handleDelete}
          title="Delete Referral"
          description="Are you sure you want to delete this referral? This action cannot be undone."
          confirmText="Delete"
          destructive
        />
      </div>
    </AdminLayout>
  );
};

export default ReferralManagement;
