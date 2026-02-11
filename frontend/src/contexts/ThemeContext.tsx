import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';
type UserRole = 'student' | 'admin' | 'referral';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');

  // Get storage key based on user role
  const getStorageKey = (role?: string): string => {
    if (!role) return 'theme-default';
    return `theme-${role}`;
  };

  // Load theme on mount and when user changes
  useEffect(() => {
    const userRole = user?.userType as UserRole | undefined;
    const storageKey = getStorageKey(userRole);
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme);
    } else {
      // Default theme based on role
      const defaultTheme: Theme = userRole === 'admin' ? 'dark' : 'light';
      setThemeState(defaultTheme);
    }
  }, [user?.userType]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Add role-specific class for additional styling
    const userRole = user?.userType;
    root.classList.remove('role-student', 'role-admin', 'role-referral');
    if (userRole) {
      root.classList.add(`role-${userRole}`);
    }
  }, [theme, user?.userType]);

  const setTheme = (newTheme: Theme) => {
    const userRole = user?.userType as UserRole | undefined;
    const storageKey = getStorageKey(userRole);
    
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
