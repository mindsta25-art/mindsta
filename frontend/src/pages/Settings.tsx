import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lock, 
  Bell, 
  Moon, 
  Shield, 
  Trash2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getStudentByUserId } from '@/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const pwStrength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [quizReminders, setQuizReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Privacy settings
  const [showProgress, setShowProgress] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  // Account deletion dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadStudentName = async () => {
      if (user) {
        try {
          const data = await getStudentByUserId(user.id);
          if (data) setStudentName(data.fullName);
        } catch (error) {
          console.error('Error loading student name:', error);
        }
      }
    };
    loadStudentName();
  }, [user]);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (user?.id) {
        try {
          const { getUserPreferences } = await import('@/api/auth');
          const prefs = await getUserPreferences(user.id);
          
          // Update notification preferences
          setEmailNotifications(prefs.notificationPreferences?.emailNotifications ?? true);
          setQuizReminders(prefs.notificationPreferences?.quizReminders ?? true);
          setProgressUpdates(prefs.notificationPreferences?.progressUpdates ?? true);
          setWeeklyReport(prefs.notificationPreferences?.weeklyReport ?? false);
          
          // Update privacy settings
          setShowProgress(prefs.privacySettings?.showProgress ?? true);
          setAllowAnalytics(prefs.privacySettings?.allowAnalytics ?? true);
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    };
    loadPreferences();
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (!currentPassword) {
      toast({
        title: 'Error',
        description: 'Current password is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { changePassword } = await import('@/api/auth');
      const result = await changePassword(user.id, currentPassword, newPassword);
      
      toast({
        title: '✅ Success',
        description: result.message || 'Password changed successfully',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to change password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { updateNotificationPreferences } = await import('@/api/auth');
      await updateNotificationPreferences(user.id, {
        emailNotifications,
        quizReminders,
        progressUpdates,
        weeklyReport,
      });
      
      toast({
        title: '✅ Settings Saved',
        description: 'Notification preferences updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to save notification preferences',
        variant: 'destructive',
      });
    }
  };

  const handleSavePrivacy = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { updatePrivacySettings } = await import('@/api/auth');
      await updatePrivacySettings(user.id, {
        showProgress,
        allowAnalytics,
      });
      
      toast({
        title: '✅ Settings Saved',
        description: 'Privacy settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to save privacy settings',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: 'Deletion cancelled',
        description: 'You must type DELETE exactly to confirm',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { deleteAccount } = await import('@/api/newsletter');
      await deleteAccount(user.id, deletePassword, deleteConfirmText);
      
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
      });

      localStorage.clear();
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: error.response?.data?.error || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletePassword('');
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <StudentHeader studentName={studentName} />

      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with gradient */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg blur opacity-25"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="security" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 p-1 border-2 border-indigo-100 dark:border-indigo-900">
              <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">Security</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">Notifications</TabsTrigger>
              <TabsTrigger value="privacy" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">Privacy</TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">Appearance</TabsTrigger>
            </TabsList>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card className="border-2 border-indigo-100 dark:border-indigo-900 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pwStrength.color}`}
                                style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${pwStrength.score <= 2 ? 'text-red-500' : pwStrength.score === 3 ? 'text-yellow-500' : pwStrength.score === 4 ? 'text-blue-500' : 'text-green-500'}`}>
                              {pwStrength.label}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {[
                              { test: newPassword.length >= 8, label: 'At least 8 characters' },
                              { test: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
                              { test: /[a-z]/.test(newPassword), label: 'Lowercase letter' },
                              { test: /[0-9]/.test(newPassword), label: 'Number' },
                            ].map(req => (
                              <li key={req.label} className={`flex items-center gap-1.5 text-xs ${req.test ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {req.test ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {req.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPw ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          className={`pr-10 ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500') : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
                        <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {passwordsMatch ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 dark:border-red-900 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="gap-2" onClick={() => { setDeletePassword(''); setDeleteConfirmText(''); setShowDeleteDialog(true); }}>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>

                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. All your progress, enrollments, achievements, and settings will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 py-2">
                        <div>
                          <Label htmlFor="delete-password" className="text-sm font-medium">Enter your password</Label>
                          <Input
                            id="delete-password"
                            type="password"
                            placeholder="Your current password"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="delete-confirm" className="text-sm font-medium">Type <span className="font-bold">DELETE</span> to confirm</Label>
                          <Input
                            id="delete-confirm"
                            type="text"
                            placeholder="DELETE"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={!deletePassword || deleteConfirmText !== 'DELETE'}
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border-2 border-purple-100 dark:border-purple-900 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="quizReminders">Quiz Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for pending quizzes
                      </p>
                    </div>
                    <Switch
                      id="quizReminders"
                      checked={quizReminders}
                      onCheckedChange={setQuizReminders}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="progressUpdates">Progress Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your learning progress
                      </p>
                    </div>
                    <Switch
                      id="progressUpdates"
                      checked={progressUpdates}
                      onCheckedChange={setProgressUpdates}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReport">Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly summary of your activities
                      </p>
                    </div>
                    <Switch
                      id="weeklyReport"
                      checked={weeklyReport}
                      onCheckedChange={setWeeklyReport}
                    />
                  </div>

                  <Button 
                    onClick={handleSaveNotifications} 
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <Card className="border-2 border-cyan-100 dark:border-cyan-900 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control how your data is used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showProgress">Show Progress</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your learning progress
                      </p>
                    </div>
                    <Switch
                      id="showProgress"
                      checked={showProgress}
                      onCheckedChange={setShowProgress}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowAnalytics">Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Help us improve by sharing anonymous usage data
                      </p>
                    </div>
                    <Switch
                      id="allowAnalytics"
                      checked={allowAnalytics}
                      onCheckedChange={setAllowAnalytics}
                    />
                  </div>

                  <Button 
                    onClick={handleSavePrivacy} 
                    className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Save className="w-4 h-4" />
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card className="border-2 border-indigo-100 dark:border-indigo-900 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30">
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how the app looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Switch
                      id="darkMode"
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      ✨ Your theme preference is Saved
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default Settings;
