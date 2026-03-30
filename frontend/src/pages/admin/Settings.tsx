import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useContactSettings } from "@/contexts/ContactSettingsContext";
import { getSystemSettings, updateSettingsSection, type GeneralSettings, type ContactSettings, type NotificationSettings, type SecuritySettings, type AppearanceSettings, type AdvancedSettings, type QuotesSettings, type QuoteItem } from "@/api";
import { 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Globe,
  Mail,
  Database,
  Palette,
  Save,
  Moon,
  Sun,
  User,
  Lock,
  Quote,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Loader2,
} from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { refreshContactSettings } = useContactSettings();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);

  // Account/Password Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: siteConfig.company.name,
    siteDescription: siteConfig.company.tagline,
    supportEmail: '',
    language: "en",
    timezone: "UTC",
  });

  // Contact Settings State
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    companyEmail: '',
    supportEmail: '',
    privacyEmail: '',
    adminEmail: '',
    phone: '',
    whatsappNumber: '',
    whatsappMessage: '',
    address: '',
    city: '',
    country: '',
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newUserAlerts: true,
    lessonCompletionAlerts: false,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<{
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    sessionTimeout: string;
    passwordMinLength: string;
    requireStrongPassword: boolean;
  }>({
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: "60",
    passwordMinLength: "8",
    requireStrongPassword: true,
  });

  // Appearance Settings State
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'system',
    primaryColor: '#8b5cf6',
    logoUrl: '',
  });

  // Do NOT apply theme changes in real-time - only on save
  // This prevents the theme from changing just by clicking the Settings menu

  // Advanced Settings State
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    backupFrequency: 'daily',
    lessonsPerPage: 12,
    leaderboardPerPage: 10,
    myLearningPerPage: 9,
  });

  // Quotes Settings State
  const [quotesSettings, setQuotesSettings] = useState<QuotesSettings>({
    customQuotesEnabled: false,
    dailyQuotes: [],
  });
  const [newQuote, setNewQuote] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');

  // Load settings on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const settings = await getSystemSettings();
        setGeneralSettings(settings.general);
        setContactSettings(settings.contact);
        setNotificationSettings(settings.notifications);
        setSecuritySettings({
          requireEmailVerification: settings.security.requireEmailVerification,
          enableTwoFactor: settings.security.enableTwoFactor,
          sessionTimeout: String(settings.security.sessionTimeout ?? 60),
          passwordMinLength: String(settings.security.passwordMinLength ?? 8),
          requireStrongPassword: settings.security.requireStrongPassword,
        });
        setAppearanceSettings(settings.appearance);
        setAdvancedSettings(settings.advanced);
        if (settings.quotes) setQuotesSettings(settings.quotes);
      } catch (error) {
        console.error('Failed to load settings', error);
        toast({ title: 'Failed to load settings', description: 'Please try again.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleSaveSettings = async (section: 'general' | 'contact' | 'notifications' | 'security' | 'appearance' | 'advanced' | 'quotes') => {
    try {
      setSaving(true);
      let payload: any = {};
      if (section === 'general') payload = generalSettings;
      if (section === 'contact') payload = contactSettings;
      if (section === 'notifications') payload = notificationSettings;
      if (section === 'security') {
        payload = {
          requireEmailVerification: securitySettings.requireEmailVerification,
          enableTwoFactor: securitySettings.enableTwoFactor,
          sessionTimeout: parseInt(securitySettings.sessionTimeout || '60', 10),
          passwordMinLength: parseInt(securitySettings.passwordMinLength || '8', 10),
          requireStrongPassword: securitySettings.requireStrongPassword,
        } as SecuritySettings;
      }
      if (section === 'appearance') payload = appearanceSettings;
      if (section === 'advanced') payload = advancedSettings;
      if (section === 'quotes') payload = quotesSettings;

      const updated = await updateSettingsSection(section, payload);
      // rehydrate from server in case of defaulting or normalization
      setGeneralSettings(updated.general);
      setContactSettings(updated.contact);
      setNotificationSettings(updated.notifications);
      setSecuritySettings({
        requireEmailVerification: updated.security.requireEmailVerification,
        enableTwoFactor: updated.security.enableTwoFactor,
        sessionTimeout: String(updated.security.sessionTimeout ?? 60),
        passwordMinLength: String(updated.security.passwordMinLength ?? 8),
        requireStrongPassword: updated.security.requireStrongPassword,
      });
      setAppearanceSettings(updated.appearance);
      setAdvancedSettings(updated.advanced);
      if (updated.quotes) setQuotesSettings(updated.quotes);

      // Refresh contact settings context if contact settings were updated
      if (section === 'contact') {
        console.log('[Settings] Contact settings saved, refreshing context...');
        await refreshContactSettings();
        console.log('[Settings] Contact context refresh triggered');
      }

      toast({ title: 'Settings Saved', description: `${section[0].toUpperCase()}${section.slice(1)} settings have been updated successfully.` });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

    setChangingPassword(true);
    
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
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to change password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your platform configuration and preferences
          </p>
        </div>

        {/* Settings Tabs */}
  <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Mail className="w-4 h-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <Quote className="w-4 h-4" />
              Quotes
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Database className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your admin account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        required
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={changingPassword} className="gap-2">
                    <Lock className="w-4 h-4" />
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic platform configuration and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value as GeneralSettings['language'] })}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('general')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Settings */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Manage all email addresses and contact details used throughout the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Email Addresses</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={contactSettings.companyEmail}
                        onChange={(e) => setContactSettings({ ...contactSettings, companyEmail: e.target.value })}
                        placeholder="info@company.com"
                      />
                      <p className="text-xs text-muted-foreground">General company inquiries</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={contactSettings.supportEmail}
                        onChange={(e) => setContactSettings({ ...contactSettings, supportEmail: e.target.value })}
                        placeholder="support@company.com"
                      />
                      <p className="text-xs text-muted-foreground">Customer support requests</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privacyEmail">Privacy Email</Label>
                      <Input
                        id="privacyEmail"
                        type="email"
                        value={contactSettings.privacyEmail}
                        onChange={(e) => setContactSettings({ ...contactSettings, privacyEmail: e.target.value })}
                        placeholder="privacy@company.com"
                      />
                      <p className="text-xs text-muted-foreground">Privacy and data requests</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={contactSettings.adminEmail}
                        onChange={(e) => setContactSettings({ ...contactSettings, adminEmail: e.target.value })}
                        placeholder="admin@company.com"
                      />
                      <p className="text-xs text-muted-foreground">Administrative notifications</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Phone & WhatsApp</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contactSettings.phone}
                        onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                      <p className="text-xs text-muted-foreground">Main contact number</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                      <Input
                        id="whatsappNumber"
                        type="tel"
                        value={contactSettings.whatsappNumber}
                        onChange={(e) => setContactSettings({ ...contactSettings, whatsappNumber: e.target.value })}
                        placeholder="+1234567890"
                      />
                      <p className="text-xs text-muted-foreground">WhatsApp contact (no spaces)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappMessage">WhatsApp Default Message</Label>
                    <Textarea
                      id="whatsappMessage"
                      value={contactSettings.whatsappMessage}
                      onChange={(e) => setContactSettings({ ...contactSettings, whatsappMessage: e.target.value })}
                      rows={2}
                      placeholder="Hello! I'd like to know more about..."
                    />
                    <p className="text-xs text-muted-foreground">Pre-filled message for WhatsApp chat</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Physical Address</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={contactSettings.address}
                      onChange={(e) => setContactSettings({ ...contactSettings, address: e.target.value })}
                      placeholder="123 Main Street, Suite 100"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={contactSettings.city}
                        onChange={(e) => setContactSettings({ ...contactSettings, city: e.target.value })}
                        placeholder="Abuja"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={contactSettings.country}
                        onChange={(e) => setContactSettings({ ...contactSettings, country: e.target.value })}
                        placeholder="Nigeria"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('contact')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Contact Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New User Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new users register
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.newUserAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newUserAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lesson Completion Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications when students complete lessons
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.lessonCompletionAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lessonCompletionAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important system notifications and updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly performance reports
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReports: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monthly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive monthly analytics reports
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.monthlyReports}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, monthlyReports: checked })}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('notifications')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage authentication and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Verification Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify their email address
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireEmailVerification}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireEmailVerification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable 2FA for admin accounts
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enableTwoFactor: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Strong Passwords</Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce strong password requirements
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireStrongPassword}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireStrongPassword: checked })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('security')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="theme">Admin Theme Preference</Label>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Switch
                        id="theme"
                        checked={theme === 'dark'}
                        onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      />
                      <span className="ml-2">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ✨ Admin Theme
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current theme: <span className="font-semibold capitalize">{appearanceSettings.theme}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input id="primaryColor" type="color" className="w-20 h-10" value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                    />
                    <Input value={appearanceSettings.primaryColor} readOnly className="flex-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Platform Logo URL</Label>
                  <Input id="logoUrl" type="text" value={appearanceSettings.logoUrl} onChange={(e) => setAppearanceSettings({ ...appearanceSettings, logoUrl: e.target.value })} placeholder="https://..." />
                  <p className="text-xs text-muted-foreground">Provide a public URL to your logo image (PNG/SVG)</p>
                </div>

                <Button onClick={() => handleSaveSettings('appearance')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Settings */}
          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="w-5 h-5" />
                  Daily Quote Management
                </CardTitle>
                <CardDescription>
                  Control the motivational quotes displayed to students on their home page.
                  When custom quotes are enabled, only your quotes will be shown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Use Custom Quotes</p>
                    <p className="text-sm text-muted-foreground">
                      Override the default quotes with your own curated list
                    </p>
                  </div>
                  <Switch
                    checked={quotesSettings.customQuotesEnabled}
                    onCheckedChange={(val) => setQuotesSettings({ ...quotesSettings, customQuotesEnabled: val })}
                  />
                </div>

                {/* Add new quote */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-sm font-semibold">Add New Quote</h3>
                  <div className="space-y-2">
                    <Label>Quote Text</Label>
                    <Textarea
                      placeholder="Enter the motivational quote..."
                      value={newQuote}
                      onChange={(e) => setNewQuote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input
                      placeholder="Author name (e.g. Nelson Mandela)"
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      if (!newQuote.trim()) return;
                      setQuotesSettings({
                        ...quotesSettings,
                        dailyQuotes: [
                          ...quotesSettings.dailyQuotes,
                          { quote: newQuote.trim(), author: newQuoteAuthor.trim() || 'Unknown' },
                        ],
                      });
                      setNewQuote('');
                      setNewQuoteAuthor('');
                    }}
                    disabled={!newQuote.trim()}
                  >
                    <Plus className="w-4 h-4" />
                    Add Quote
                  </Button>
                </div>

                {/* Quote list */}
                {quotesSettings.dailyQuotes.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Your Quotes ({quotesSettings.dailyQuotes.length})
                    </h3>
                    {quotesSettings.dailyQuotes.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                      >
                        <Quote className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium italic text-sm leading-relaxed">"{q.quote}"</p>
                          <p className="text-xs text-muted-foreground mt-1">— {q.author}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() =>
                            setQuotesSettings({
                              ...quotesSettings,
                              dailyQuotes: quotesSettings.dailyQuotes.filter((_, i) => i !== idx),
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Quote className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No custom quotes yet. Add one above.</p>
                    <p className="text-xs mt-1">Default system quotes will be used until custom quotes are added and enabled.</p>
                  </div>
                )}

                <Button onClick={() => handleSaveSettings('quotes')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Quotes Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4">            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Advanced configuration options and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select value={advancedSettings.backupFrequency} onValueChange={(v) => setAdvancedSettings({ ...advancedSettings, backupFrequency: v as AdvancedSettings['backupFrequency'] })}>
                    <SelectTrigger id="backupFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Manual Backup</Label>
                  <p className="text-xs text-muted-foreground">Download a full JSON export of all app data (users, lessons, payments, referrals, etc.).</p>
                  <Button
                    variant="outline"
                    disabled={backupLoading}
                    onClick={async () => {
                      setBackupLoading(true);
                      try {
                        const token = localStorage.getItem('authToken');
                        const apiBase = import.meta.env.VITE_API_URL
                          ? import.meta.env.VITE_API_URL
                          : import.meta.env.PROD
                          ? 'https://api.mindsta.com.ng/api'
                          : 'http://localhost:3000/api';
                        const res = await fetch(`${apiBase}/admin/backup`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) throw new Error('Backup failed');
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mindsta-backup-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: 'Backup Downloaded', description: 'All app data exported successfully.' });
                      } catch (err: any) {
                        toast({ title: 'Backup Failed', description: err.message || 'Could not generate backup.', variant: 'destructive' });
                      } finally {
                        setBackupLoading(false);
                      }
                    }}
                    className="gap-2"
                  >
                    {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {backupLoading ? 'Generating Backup…' : 'Download Backup'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonsPerPage">lessons Per Page (Browse)</Label>
                  <Select value={String(advancedSettings.lessonsPerPage)} onValueChange={(v) => setAdvancedSettings({ ...advancedSettings, lessonsPerPage: Number(v) })}>
                    <SelectTrigger id="lessonsPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 lessons</SelectItem>
                      <SelectItem value="12">12 lessons</SelectItem>
                      <SelectItem value="18">18 lessons</SelectItem>
                      <SelectItem value="24">24 lessons</SelectItem>
                      <SelectItem value="36">36 lessons</SelectItem>
                      <SelectItem value="48">48 lessons</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Number of lessons to display per page on the browse page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaderboardPerPage">Entries Per Page (Leaderboard)</Label>
                  <Select value={String(advancedSettings.leaderboardPerPage ?? 10)} onValueChange={(v) => setAdvancedSettings({ ...advancedSettings, leaderboardPerPage: Number(v) })}>
                    <SelectTrigger id="leaderboardPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 entries</SelectItem>
                      <SelectItem value="10">10 entries</SelectItem>
                      <SelectItem value="15">15 entries</SelectItem>
                      <SelectItem value="20">20 entries</SelectItem>
                      <SelectItem value="25">25 entries</SelectItem>
                      <SelectItem value="50">50 entries</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Number of students to display per page on the leaderboard
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="myLearningPerPage">lessons Per Page (My Learning)</Label>
                  <Select value={String(advancedSettings.myLearningPerPage ?? 9)} onValueChange={(v) => setAdvancedSettings({ ...advancedSettings, myLearningPerPage: Number(v) })}>
                    <SelectTrigger id="myLearningPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 lessons</SelectItem>
                      <SelectItem value="6">6 lessons</SelectItem>
                      <SelectItem value="9">9 lessons</SelectItem>
                      <SelectItem value="12">12 lessons</SelectItem>
                      <SelectItem value="18">18 lessons</SelectItem>
                      <SelectItem value="24">24 lessons</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Number of lessons to display per page on the My Learning page
                  </p>
                </div>

                <Button onClick={() => handleSaveSettings('advanced')} disabled={saving || loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <div className="space-y-2">
                    <Button variant="outline" disabled className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                      Clear All Cache
                    </Button>
                    <Button variant="outline" onClick={() => handleSaveSettings('advanced')} disabled={saving || loading} className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                      Reset All Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
