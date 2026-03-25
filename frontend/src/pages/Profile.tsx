import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Mail, School, GraduationCap, Calendar, Save, AlertCircle } from 'lucide-react';
import { getStudentByUserId, updateStudentProfile } from '@/api';
import { useToast } from '@/hooks/use-toast';

interface StudentInfo {
  id: string;
  userId: string;
  fullName: string;
  grade: string;
  age: number;
  schoolName: string;
  createdAt: string;
}

const Profile = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getStudentByUserId(user.id);
        if (data) {
          setStudentInfo(data);
          setFullName(data.fullName);
          setAge(data.age?.toString() || '');
          setGrade(data.grade);
          setSchoolName(data.schoolName);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !studentInfo) return;

    try {
      setSaving(true);
      const updated = await updateStudentProfile(user.id, {
        fullName,
        age: age ? parseInt(age) : undefined,
        grade,
        schoolName,
      });

      if (updated) {
        setStudentInfo(updated);

        // Patch localStorage so the new name is immediately reflected in the header
        // and any other component that reads from AuthContext.
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.fullName = updated.fullName;
            localStorage.setItem('currentUser', JSON.stringify(parsed));
            refreshUser(); // sync AuthContext state from the updated localStorage entry
          } catch {
            // ignore JSON parse errors
          }
        }

        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentHeader studentName={fullName} />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <StudentHeader studentName={fullName} />

      <main className="pt-24 pb-16 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header with gradient */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg blur opacity-25"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-muted-foreground mt-1">Manage your personal information and preferences</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Summary Card - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="lg:col-span-1 border-2 border-indigo-100 dark:border-indigo-900 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30">
                  <CardTitle className="text-center">Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center pt-6">
                  <div className="relative mb-4 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <Avatar className="relative w-24 h-24 border-4 border-white dark:border-gray-800">
                      <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-2xl font-bold">
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                <h2 className="text-xl font-bold mb-1">{fullName}</h2>
                <p className="text-sm text-muted-foreground mb-3 break-all">{user?.email}</p>
                <Badge 
                  variant="secondary" 
                  className="mb-4 bg-gradient-to-r from-indigo-100 to-cyan-100 dark:from-indigo-900 dark:to-cyan-900 text-indigo-700 dark:text-indigo-300 border-0"
                >
                  Student
                </Badge>
                <Separator className="my-4" />
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-muted-foreground">Grade:</span>
                    <span className="font-semibold ml-auto text-indigo-700 dark:text-indigo-300">{grade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                    <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium ml-auto text-xs text-cyan-700 dark:text-cyan-300">
                      {studentInfo?.createdAt ? formatDate(studentInfo.createdAt) : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Edit Profile Form - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="border-2 border-purple-100 dark:border-purple-900 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Edit Profile
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="border-2 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {/* Age and Grade */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Enter your age"
                        min="5"
                        max="100"
                        className="border-2 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade" className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Grade
                      </Label>
                      <Select value={grade} onValueChange={setGrade}>
                        <SelectTrigger id="grade" className="border-2 focus:border-indigo-500">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((g) => (
                            <SelectItem key={g} value={g.toString()}>
                              Grade {g}
                            </SelectItem>
                          ))}
                          <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* School Name */}
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="flex items-center gap-2">
                      <School className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      School Name
                    </Label>
                    <Input
                      id="schoolName"
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Enter your school name"
                      className="border-2 focus:border-cyan-500 dark:focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default Profile;
