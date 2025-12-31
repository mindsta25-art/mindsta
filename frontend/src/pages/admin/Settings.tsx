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
import { getSystemSettings, updateSettingsSection, type GeneralSettings, type NotificationSettings, type SecuritySettings, type AppearanceSettings, type AdvancedSettings } from "@/api";
import { 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Globe,
  Mail,
  Database,
  Palette,
  Save
} from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

const Settings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: siteConfig.company.name,
    siteDescription: siteConfig.company.tagline,
    supportEmail: siteConfig.contact.supportEmail,
    language: "en",
    timezone: "UTC",
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

  // Advanced Settings State
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    backupFrequency: 'daily',
    coursesPerPage: 12,
  });

  // Load settings on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const settings = await getSystemSettings();
        setGeneralSettings(settings.general);
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
      } catch (error) {
        console.error('Failed to load settings', error);
        toast({ title: 'Failed to load settings', description: 'Please try again.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleSaveSettings = async (section: 'general' | 'notifications' | 'security' | 'appearance' | 'advanced') => {
    try {
      setSaving(true);
      let payload: any = {};
      if (section === 'general') payload = generalSettings;
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

      const updated = await updateSettingsSection(section, payload);
      // rehydrate from server in case of defaulting or normalization
      setGeneralSettings(updated.general);
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              General
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
            <TabsTrigger value="advanced" className="gap-2">
              <Database className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

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
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={appearanceSettings.theme} onValueChange={(v) => setAppearanceSettings({ ...appearanceSettings, theme: v as AppearanceSettings['theme'] })}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
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

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Advanced configuration options and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="databaseUrl">Database Connection</Label>
                  <Input id="databaseUrl" type="text" placeholder="postgresql://..." readOnly />
                  <p className="text-xs text-muted-foreground">
                    Database connection string (read-only)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" type="password" value="sk_live_••••••••••••" readOnly />
                  <p className="text-xs text-muted-foreground">
                    API key for external integrations
                  </p>
                </div>

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
                  <Label htmlFor="coursesPerPage">Courses Per Page (Browse)</Label>
                  <Select value={String(advancedSettings.coursesPerPage)} onValueChange={(v) => setAdvancedSettings({ ...advancedSettings, coursesPerPage: Number(v) })}>
                    <SelectTrigger id="coursesPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 courses</SelectItem>
                      <SelectItem value="12">12 courses</SelectItem>
                      <SelectItem value="18">18 courses</SelectItem>
                      <SelectItem value="24">24 courses</SelectItem>
                      <SelectItem value="36">36 courses</SelectItem>
                      <SelectItem value="48">48 courses</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Number of courses to display per page on the browse page
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
