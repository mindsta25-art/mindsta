import mongoose from 'mongoose';

const GeneralSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Mindsta' },
  siteDescription: { type: String, default: 'A safe and engaging learning platform for grades 1-6' },
  supportEmail: { type: String, default: 'support@mindsta.com' },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'UTC' },
}, { _id: false });

const NotificationSchema = new mongoose.Schema({
  emailNotifications: { type: Boolean, default: true },
  newUserAlerts: { type: Boolean, default: true },
  lessonCompletionAlerts: { type: Boolean, default: false },
  systemAlerts: { type: Boolean, default: true },
  weeklyReports: { type: Boolean, default: true },
  monthlyReports: { type: Boolean, default: true },
}, { _id: false });

const SecuritySchema = new mongoose.Schema({
  requireEmailVerification: { type: Boolean, default: true },
  enableTwoFactor: { type: Boolean, default: false },
  sessionTimeout: { type: Number, default: 60 },
  passwordMinLength: { type: Number, default: 8 },
  requireStrongPassword: { type: Boolean, default: true },
}, { _id: false });

const AppearanceSchema = new mongoose.Schema({
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  primaryColor: { type: String, default: '#8b5cf6' },
  logoUrl: { type: String, default: '' },
}, { _id: false });

const AdvancedSchema = new mongoose.Schema({
  backupFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
  coursesPerPage: { type: Number, default: 12, min: 6, max: 48 },
}, { _id: false });

const SalesStatsSchema = new mongoose.Schema({
  totalSales: { type: Number, default: 0 }, // Total number of sales transactions
  totalRevenue: { type: Number, default: 0 }, // Total revenue in kobo (divide by 100 for Naira)
  totalItems: { type: Number, default: 0 }, // Total items sold across all transactions
  lastSaleDate: { type: Date, default: null },
  monthlySales: { type: Number, default: 0 }, // Current month sales count
  monthlyRevenue: { type: Number, default: 0 }, // Current month revenue in kobo (divide by 100 for Naira)
  lastMonthReset: { type: Date, default: () => new Date() },
}, { _id: false });

const SystemSettingsSchema = new mongoose.Schema({
  general: { type: GeneralSchema, default: () => ({}) },
  notifications: { type: NotificationSchema, default: () => ({}) },
  security: { type: SecuritySchema, default: () => ({}) },
  appearance: { type: AppearanceSchema, default: () => ({}) },
  advanced: { type: AdvancedSchema, default: () => ({}) },
  salesStats: { type: SalesStatsSchema, default: () => ({}) },
}, { timestamps: true });

// Singleton constraint: ensure only one settings document
SystemSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);
export default SystemSettings;
