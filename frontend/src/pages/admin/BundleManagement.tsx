import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { siteConfig, formatCurrency } from "@/config/siteConfig";
import { 
  Plus, 
  Edit,
  Trash2,
  Package,
  Eye,
  EyeOff,
  DollarSign,
  Users
} from "lucide-react";

interface BundleSubject {
  name: string;
  lessonId?: string;
  price: number;
  term: string;
}

interface Bundle {
  _id: string;
  grade: string;
  name: string;
  description: string;
  subjects: BundleSubject[];
  bundlePrice: number;
  discountPercentage: number;
  isActive: boolean;
  features: string[];
  enrollmentCount: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const BundleManagement = () => {
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    grade: "",
    name: "Starter Bundle",
    description: "Complete package for this grade",
    bundlePrice: 0,
    isActive: true,
    displayOrder: 0,
    features: ["All essential subjects", "Complete term coverage", "Interactive lessons"],
  });

  const [subjects, setSubjects] = useState<BundleSubject[]>([
    { name: "", price: 0, term: "First Term" },
    { name: "", price: 0, term: "First Term" },
    { name: "", price: 0, term: "First Term" },
  ]);

  const grades = [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Common Entrance"
  ];

  const terms = ["First Term", "Second Term", "Third Term"];

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const data = await api.get('/bundles');
      setBundles(data);
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bundles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        grade: bundle.grade,
        name: bundle.name,
        description: bundle.description,
        bundlePrice: bundle.bundlePrice,
        isActive: bundle.isActive,
        displayOrder: bundle.displayOrder,
        features: bundle.features,
      });
      setSubjects(bundle.subjects);
    } else {
      setEditingBundle(null);
      setFormData({
        grade: "",
        name: "Starter Bundle",
        description: "Complete package for this grade",
        bundlePrice: 0,
        isActive: true,
        displayOrder: 0,
        features: ["All essential subjects", "Complete term coverage", "Interactive lessons"],
      });
      setSubjects([
        { name: "", price: 0, term: "First Term" },
        { name: "", price: 0, term: "First Term" },
        { name: "", price: 0, term: "First Term" },
      ]);
    }
    setIsDialogOpen(true);
  };

  const handleSubjectChange = (index: number, field: keyof BundleSubject, value: string | number) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setSubjects(updatedSubjects);

    // Auto-calculate bundle price if all subjects have prices
    if (field === "price") {
      const totalPrice = updatedSubjects.reduce((sum, s) => sum + (s.price || 0), 0);
      if (totalPrice > 0) {
        // Suggest 15% discount
        const suggestedPrice = Math.round(totalPrice * 0.85);
        setFormData(prev => ({ ...prev, bundlePrice: suggestedPrice }));
      }
    }
  };

  const addSubject = () => {
    setSubjects([...subjects, { name: "", price: 0, term: "First Term" }]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.grade) {
        toast({
          title: "Validation Error",
          description: "Please select a grade",
          variant: "destructive",
        });
        return;
      }

      const validSubjects = subjects.filter(s => s.name && s.price > 0);
      if (validSubjects.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one subject with a valid name and price",
          variant: "destructive",
        });
        return;
      }

      const totalPrice = validSubjects.reduce((sum, s) => sum + s.price, 0);
      if (formData.bundlePrice >= totalPrice) {
        toast({
          title: "Validation Error",
          description: "Bundle price must be less than the total individual prices",
          variant: "destructive",
        });
        return;
      }

      const bundleData = {
        ...formData,
        subjects: validSubjects,
      };

      if (editingBundle) {
        await api.put(`/bundles/${editingBundle._id}`, bundleData);
        toast({
          title: "Success",
          description: "Bundle updated successfully",
        });
      } else {
        await api.post('/bundles', bundleData);
        toast({
          title: "Success",
          description: "Bundle created successfully",
        });
      }

      setIsDialogOpen(false);
      fetchBundles();
    } catch (error: any) {
      console.error("Error saving bundle:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save bundle",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (bundleId: string) => {
    try {
      await api.patch(`/bundles/${bundleId}/toggle`, {});
      toast({
        title: "Success",
        description: "Bundle status updated",
      });
      fetchBundles();
    } catch (error) {
      console.error("Error toggling bundle:", error);
      toast({
        title: "Error",
        description: "Failed to update bundle status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      await api.delete(`/bundles/${bundleId}`);
      toast({
        title: "Success",
        description: "Bundle deleted successfully",
      });
      fetchBundles();
    } catch (error) {
      console.error("Error deleting bundle:", error);
      toast({
        title: "Error",
        description: "Failed to delete bundle",
        variant: "destructive",
      });
    }
  };

  const calculateSavings = (bundle: Bundle) => {
    const totalPrice = bundle.subjects.reduce((sum, s) => sum + s.price, 0);
    return totalPrice - bundle.bundlePrice;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8 text-green-600" />
              Bundle Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage subject bundles for each grade
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Bundle
          </Button>
        </div>

        {/* Bundles List */}
        <Card>
          <CardHeader>
            <CardTitle>All Bundles</CardTitle>
            <CardDescription>
              Manage bundle deals for all grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading bundles...</div>
            ) : bundles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bundles found. Create your first bundle!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundles.map((bundle) => (
                    <TableRow key={bundle._id}>
                      <TableCell className="font-medium">{bundle.grade}</TableCell>
                      <TableCell>{bundle.name}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {bundle.subjects.map((subject, idx) => (
                            <div key={idx}>{subject.name}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(bundle.bundlePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">
                          Save {formatCurrency(calculateSavings(bundle))} ({bundle.discountPercentage}%)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={bundle.isActive}
                            onCheckedChange={() => handleToggleActive(bundle._id)}
                          />
                          {bundle.isActive ? (
                            <Badge className="bg-green-500">
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{bundle.enrollmentCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(bundle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(bundle._id)}
                          >
                            <Trash2 className="w-4 h-4" />
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBundle ? "Edit Bundle" : "Create New Bundle"}
              </DialogTitle>
              <DialogDescription>
                Configure bundle details, subjects, and pricing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => setFormData({ ...formData, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bundle Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Starter Bundle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the bundle"
                  rows={2}
                />
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Subjects in Bundle *</Label>
                  <Button size="sm" variant="outline" onClick={addSubject}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Subject
                  </Button>
                </div>

                {subjects.map((subject, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-5">
                        <Label className="text-xs">Subject Name</Label>
                        <Input
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(index, "name", e.target.value)}
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Price (₦)</Label>
                        <Input
                          type="number"
                          value={subject.price}
                          onChange={(e) => handleSubjectChange(index, "price", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Term</Label>
                        <Select
                          value={subject.term}
                          onValueChange={(value) => handleSubjectChange(index, "term", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {terms.map((term) => (
                              <SelectItem key={term} value={term}>
                                {term}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 pt-6">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeSubject(index)}
                          disabled={subjects.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Individual Price</Label>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {formatCurrency(subjects.reduce((sum, s) => sum + (s.price || 0), 0))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bundle Price (Discounted) *</Label>
                  <Input
                    type="number"
                    value={formData.bundlePrice}
                    onChange={(e) => setFormData({ ...formData, bundlePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                  {formData.bundlePrice > 0 && (
                    <p className="text-xs text-green-600">
                      Customers save {formatCurrency(
                        subjects.reduce((sum, s) => sum + (s.price || 0), 0) - formData.bundlePrice
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this bundle visible to students
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="gap-2">
                  <Package className="w-4 h-4" />
                  {editingBundle ? "Update Bundle" : "Create Bundle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default BundleManagement;
