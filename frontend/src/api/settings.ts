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

export interface ContactSettings {
  companyEmail: string;
  supportEmail: string;
  privacyEmail: string;
  adminEmail: string;
  phone: string;
  whatsappNumber: string;
  whatsappMessage: string;
  address: string;
  city: string;
  country: string;
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
  lessonsPerPage: number;
  leaderboardPerPage: number;
  myLearningPerPage: number;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
}

export interface QuoteItem {
  quote: string;
  author: string;
}

export interface QuotesSettings {
  customQuotesEnabled: boolean;
  dailyQuotes: QuoteItem[];
}

export interface SystemSettingsDoc {
  _id: string;
  general: GeneralSettings;
  contact: ContactSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  advanced: AdvancedSettings;
  quotes: QuotesSettings;
  createdAt: string;
  updatedAt: string;
}

export type SettingsSection = keyof Pick<SystemSettingsDoc, 'general' | 'contact' | 'notifications' | 'security' | 'appearance' | 'advanced' | 'quotes'>;

export const getSystemSettings = (bustCache = false) => {
  const url = bustCache ? `/settings?t=${Date.now()}` : '/settings';
  return api.get(url) as Promise<SystemSettingsDoc>;
};

export const getSettingsSection = <K extends SettingsSection>(section: K) =>
  api.get(`/settings/${section}`) as Promise<SystemSettingsDoc[K]>;

export const updateSettingsSection = <K extends SettingsSection>(section: K, data: Partial<SystemSettingsDoc[K]>) =>
  api.put(`/settings/${section}`, data) as Promise<SystemSettingsDoc>;

export const getPublicAdvancedSettings = () =>
  api.get('/settings/public/advanced') as Promise<{ lessonsPerPage: number; leaderboardPerPage: number; myLearningPerPage: number }>;
