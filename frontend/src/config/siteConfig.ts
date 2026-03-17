/**
 * Site Configuration
 * Centralized configuration for all hardcoded values in the application
 * 
 * NOTE: Contact details (emails, phone, address) are now managed from the admin panel
 * and loaded dynamically via ContactSettingsContext. Use the useContactSettings() hook
 * to access contact information instead of hardcoding here.
 */

export const siteConfig = {
  // Company Information (editable via Admin Panel > Settings > General)
  company: {
    name: "Mindsta",
    tagline: "Every Child Can Do Well",
    description: "Curriculum-aligned learning platform for Grades 1-6",
  },

  // Social Media Links
  social: {
    facebook: "https://facebook.com/mindsta",
    twitter: "https://twitter.com/mindsta",
    instagram: "https://instagram.com/mindsta",
    linkedin: "https://linkedin.com/company/mindsta",
  },

  // Currency
  currency: {
    symbol: "₦",
    code: "NGN",
    name: "Nigerian Naira",
  },

  // Default Values
  defaults: {
    lessonPrice: 5000,
    itemsPerPage: 12,
  },

  // Legal
  legal: {
    lastUpdated: "November 14, 2025",
    companyRegistration: "", // Add if needed
  },

  // Feature Flags
  features: {
    enableReferrals: true,
    enablePayments: true,
    enableWhatsApp: true,
  },
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return `${siteConfig.currency.symbol}${amount.toLocaleString()}`;
};

// Helper function to get WhatsApp URL
// NOTE: Pass contact settings from useContactSettings() hook
export const getWhatsAppUrl = (whatsappNumber: string, message: string): string => {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

export default siteConfig;
