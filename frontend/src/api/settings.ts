import { api } from '@/lib/apiClient';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de';
export type ThemeOption = 'light' | 'dark' | 'system';
export type BackupFrequency = 'hourly' | 'daily' | 'weekly';

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  language: LanguageCode;
  timezone: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  newUserAlerts: boolean;
  lessonCompletionAlerts: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

export interface SecuritySettings {
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
  sessionTimeout: number; // minutes
  passwordMinLength: number;
  requireStrongPassword: boolean;
}

export interface AppearanceSettings {
  theme: ThemeOption;
  primaryColor: string; // hex
  logoUrl: string;
}

export interface AdvancedSettings {
  backupFrequency: BackupFrequency;
  coursesPerPage: number;
}

export interface SystemSettingsDoc {
  _id: string;
  general: GeneralSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  advanced: AdvancedSettings;
  createdAt: string;
  updatedAt: string;
}

export type SettingsSection = keyof Pick<SystemSettingsDoc, 'general' | 'notifications' | 'security' | 'appearance' | 'advanced'>;

export const getSystemSettings = () => api.get('/settings') as Promise<SystemSettingsDoc>;

export const getSettingsSection = <K extends SettingsSection>(section: K) =>
  api.get(`/settings/${section}`) as Promise<SystemSettingsDoc[K]>;

export const updateSettingsSection = <K extends SettingsSection>(section: K, data: Partial<SystemSettingsDoc[K]>) =>
  api.put(`/settings/${section}`, data) as Promise<SystemSettingsDoc>;
