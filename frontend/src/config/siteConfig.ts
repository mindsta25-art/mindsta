/**
 * Site Configuration
 * Centralized configuration for all hardcoded values in the application
 * Update these values as needed instead of changing them throughout the codebase
 */

export const siteConfig = {
  // Company Information
  company: {
    name: "Mindsta",
    tagline: "Learn • Grow • Excel",
    description: "A safe and engaging learning platform for everyone",
  },

  // Contact Information
  contact: {
    supportEmail: "support@mindsta.com",
    privacyEmail: "privacy@mindsta.com",
    adminEmail: "admin@mindsta.com",
    whatsappNumber: "2348152448471", // Format: country code + number (no + or spaces)
    whatsappMessage: "Hello! I have a question about Mindsta.",
    phone: "+234 815 244 8471",
  },

  // Social Media Links
  social: {
    facebook: "https://facebook.com/mindsta",
    twitter: "https://twitter.com/mindsta",
    instagram: "https://instagram.com/mindsta",
    linkedin: "https://linkedin.com/company/mindsta",
  },

  // Location Information
  location: {
    country: "Nigeria",
    city: "Lagos",
    address: "", // Add full address if needed
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
export const getWhatsAppUrl = (phoneNumber?: string, message?: string): string => {
  const phone = phoneNumber || siteConfig.contact.whatsappNumber;
  const msg = message || siteConfig.contact.whatsappMessage;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

export default siteConfig;
