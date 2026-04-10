import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, Mail, GraduationCap, Calendar, Save, AlertCircle,
  Shield, Eye, EyeOff, Lock, CheckCircle, BookOpen, Flame, Award,
  TrendingUp, ChevronRight, Pencil, X, KeyRound
} from 'lucide-react';
import { getStudentByUserId, updateStudentProfile } from '@/api';
import { getUserProgress } from '@/api/progress';
import { getEnrollments } from '@/api/enrollments';
import { api } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface StudentInfo {
  id: string;
  userId: string;
  fullName: string;
  grade: string;
  age: number;
  currentStreak?: number;
  longestStreak?: number;
  createdAt: string;
}

const Profile = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Stats
  const [completedCount, setCompletedCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);

  // Form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
        const [data, progress, enrollments] = await Promise.all([
          getStudentByUserId(user.id),
          getUserProgress(user.id),
          getEnrollments(),
        ]);
        if (data) {
          setStudentInfo(data);
          setFullName(data.fullName);
          setAge(data.age?.toString() || '');
          setGrade(data.grade);
        }
        setCompletedCount(progress.filter(p => p.completed).length);
        const uniqueSubjects = new Set(enrollments.map(e => `${e.subject}-${e.grade}-${e.term}`)).size;
        setEnrolledCount(uniqueSubjects);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
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
      });
      if (updated) {
        setStudentInfo(updated);
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.fullName = updated.fullName;
            localStorage.setItem('currentUser', JSON.stringify(parsed));
            refreshUser();
          } catch { /* ignore */ }
        }
        setEditMode(false);
        toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please re-enter your new password.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'New password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', { userId: user!.id, currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setShowPasswordSection(false);
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
    } catch (error: any) {
      toast({
        title: 'Failed to change password',
        description: error?.response?.data?.error || 'Please check your current password and try again.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const memberDays = studentInfo?.createdAt
    ? Math.floor((Date.now() - new Date(studentInfo.createdAt).getTime()) / 86_400_000)
    : 0;

  const passwordStrength = (p: string) => {
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '40%' };
    const score = [/[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    if (score === 0) return { label: 'Fair', color: 'bg-yellow-400', width: '55%' };
    if (score === 1) return { label: 'Good', color: 'bg-blue-500', width: '70%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const pwStrength = passwordStrength(newPassword);

  const stats = [
    { icon: Flame, label: 'Day Streak', value: studentInfo?.currentStreak ?? 0, sub: `Best: ${studentInfo?.longestStreak ?? 0}`, gradient: 'from-orange-500 to-red-500' },
    { icon: BookOpen, label: 'Subjects', value: enrolledCount, sub: 'enrolled', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Award, label: 'Completed', value: completedCount, sub: 'lessons', gradient: 'from-green-500 to-emerald-500' },
    { icon: TrendingUp, label: 'Member', value: memberDays, sub: 'days', gradient: 'from-purple-500 to-pink-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <StudentHeader studentName="" />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-4xl space-y-6 py-8">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <StudentHeader studentName={fullName} />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">

          {/* ── Hero / Avatar Banner ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <div className="h-36 sm:h-44 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 relative">
                <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 px-6 pt-0 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="relative flex-shrink-0 -mt-12 sm:-mt-14">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-white dark:ring-gray-800 shadow-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center">
                      <span className="text-white text-2xl sm:text-3xl font-extrabold select-none">
                        {fullName ? getInitials(fullName) : '??'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{fullName}</h1>
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-0 text-xs font-semibold">Student</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Grade {grade}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 pb-1">
                    {!editMode ? (
                      <Button onClick={() => setEditMode(true)} size="sm" variant="outline" className="gap-1.5 min-h-[40px] px-4">
                        <Pencil className="w-3.5 h-3.5" /> Edit Profile
                      </Button>
                    ) : (
                      <Button onClick={() => setEditMode(false)} size="sm" variant="ghost" className="gap-1.5 text-muted-foreground min-h-[40px] px-4">
                        <X className="w-3.5 h-3.5" /> Cancel Edit
                      </Button>
                    )}
                  </div>
                </div>
                {studentInfo?.createdAt && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Member since {formatDate(studentInfo.createdAt)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Stats Row ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            {stats.map((stat, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-2">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground/70">{stat.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── Personal Information ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}>
            <Card className="shadow-sm border border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Personal Information
                </CardTitle>
                {!editMode && <CardDescription>Click "Edit Profile" to make changes.</CardDescription>}
              </CardHeader>
              <CardContent className="pt-5">
                {editMode ? (
                  <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                        <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                          Email
                          <span className="text-[10px] text-muted-foreground font-normal bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">read-only</span>
                        </Label>
                        <Input id="email" value={user?.email || ''} disabled className="opacity-60" />
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Contact support to change your email.
                        </p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                        <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Your age" min="5" max="100" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="grade" className="text-sm font-medium">Grade</Label>
                        <Select value={grade} onValueChange={setGrade}>
                          <SelectTrigger id="grade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6].map(g => <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>)}
                            <SelectItem value="Common Entrance">Common Entrance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                      <Button type="submit" disabled={saving} className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white border-0 gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {[
                      { icon: User, label: 'Full Name', value: fullName },
                      { icon: Mail, label: 'Email', value: user?.email },
                      { icon: GraduationCap, label: 'Grade', value: `Grade ${grade}` },
                      { icon: Calendar, label: 'Age', value: age ? `${age} years` : '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Account Security ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Card className="shadow-sm border border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {/* Password row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Password</p>
                      <p className="text-xs text-muted-foreground">Keep your account secure</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowPasswordSection(v => !v)} className="flex-shrink-0 gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    {showPasswordSection ? 'Cancel' : 'Change Password'}
                  </Button>
                </div>

                {showPasswordSection && (
                  <motion.form
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleChangePassword}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4 bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Current Password</Label>
                      <div className="relative">
                        <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" required className="pr-10" />
                        <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">New Password</Label>
                      <div className="relative">
                        <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required className="pr-10" />
                        <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwStrength && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{pwStrength.label}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          required
                          className={`pr-10 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : ''}`}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords don't match</p>
                      )}
                      {confirmPassword && confirmPassword === newPassword && (
                        <p className="text-[11px] text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowPasswordSection(false)}>Cancel</Button>
                      <Button
                        type="submit" size="sm"
                        disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Shield className="w-3.5 h-3.5" /> {changingPassword ? 'Updating…' : 'Update Password'}
                      </Button>
                    </div>
                  </motion.form>
                )}

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Quick Links ──────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.26 }}>
            <Card className="shadow-sm border border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { label: 'My Learning', desc: 'View enrolled courses', href: '/my-learning', icon: BookOpen, gradient: 'from-cyan-500 to-blue-500' },
                    { label: 'Achievements', desc: 'Badges & milestones', href: '/achievements', icon: Award, gradient: 'from-amber-500 to-orange-500' },
                    { label: 'Progress', desc: 'Analytics & streaks', href: '/progress', icon: TrendingUp, gradient: 'from-indigo-500 to-violet-500' },
                    { label: 'Browse Courses', desc: 'Find new subjects', href: '/browse', icon: GraduationCap, gradient: 'from-emerald-500 to-cyan-500' },
                  ].map(link => (
                    <Link key={link.href} to={link.href}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-all group"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                        <link.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>

      <StudentFooter />
    </div>
  );
};

export default Profile;
