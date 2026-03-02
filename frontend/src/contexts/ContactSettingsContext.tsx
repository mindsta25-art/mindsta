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
    try {
      setLoading(true);
      console.log('[ContactSettings] Loading contact settings...', bustCache ? '(cache busted)' : '');
      
      // Use public endpoint that doesn't require admin auth
      const url = `/settings/public/contact${bustCache ? `?t=${Date.now()}` : ''}`;
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiBaseUrl}${url}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contact settings: ${response.status}`);
      }
      
      const contactData = await response.json();
      console.log('[ContactSettings] Received contact data:', contactData);
      setContactSettings(contactData);
      console.log('[ContactSettings] Contact settings updated');
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
    console.log('[ContactSettings] Refreshing contact settings...');
    await loadContactSettings(true); // Force cache bust on refresh
    console.log('[ContactSettings] Refresh complete');
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
