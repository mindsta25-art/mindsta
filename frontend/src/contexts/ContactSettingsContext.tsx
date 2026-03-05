import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSystemSettings, type ContactSettings } from '@/api';

interface ContactSettingsContextType {
  contactSettings: ContactSettings;
  loading: boolean;
  refreshContactSettings: () => Promise<void>;
}

const defaultContactSettings: ContactSettings = {
  companyEmail: 'info@mindsta.com',
  supportEmail: 'support@mindsta.com',
  privacyEmail: 'privacy@mindsta.com',
  adminEmail: 'admin@mindsta.com',
  phone: '+234 815 244 8471',
  whatsappNumber: '2348152448471',
  whatsappMessage: "Hello! I have a question about Mindsta.",
  address: '',
  city: 'Lagos',
  country: 'Nigeria',
};

// In-memory session cache — avoids re-fetching on every page navigation
let _settingsCache: ContactSettings | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const ContactSettingsContext = createContext<ContactSettingsContextType>({
  contactSettings: defaultContactSettings,
  loading: true,
  refreshContactSettings: async () => {},
});

export const useContactSettings = () => {
  const context = useContext(ContactSettingsContext);
  if (!context) {
    throw new Error('useContactSettings must be used within ContactSettingsProvider');
  }
  return context;
};

interface ContactSettingsProviderProps {
  children: ReactNode;
}

export const ContactSettingsProvider = ({ children }: ContactSettingsProviderProps) => {
  const [contactSettings, setContactSettings] = useState<ContactSettings>(defaultContactSettings);
  const [loading, setLoading] = useState(true);

  const loadContactSettings = async (bustCache = false) => {
    // Serve from cache if still fresh and not explicitly busted
    if (!bustCache && _settingsCache && Date.now() - _cacheTimestamp < CACHE_TTL_MS) {
      setContactSettings(_settingsCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use public endpoint that doesn't require admin auth
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const url = `${apiBaseUrl}/settings/public/contact${bustCache ? `?t=${Date.now()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contact settings: ${response.status}`);
      }
      
      const contactData = await response.json();
      _settingsCache = contactData;
      _cacheTimestamp = Date.now();
      setContactSettings(contactData);
    } catch (error) {
      console.error('[ContactSettings] Failed to load contact settings:', error);
      // Keep using default settings on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactSettings(false);
  }, []);

  const refreshContactSettings = async () => {
    await loadContactSettings(true); // Force cache bust on refresh
  };

  return (
    <ContactSettingsContext.Provider 
      value={{ 
        contactSettings, 
        loading,
        refreshContactSettings 
      }}
    >
      {children}
    </ContactSettingsContext.Provider>
  );
};

export default ContactSettingsContext;
