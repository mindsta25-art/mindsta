import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { getCurrentUser, type AuthUser } from "@/api/auth";
import { scheduleTokenRefresh, cancelTokenRefresh } from "@/lib/apiClient";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: () => {},
  setUser: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    // Check for existing user on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Proactively refresh token if it expires within 7 days (keeps users logged in like Udemy)
    if (currentUser) scheduleTokenRefresh();

    // Listen for storage changes (multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'currentUser') {
        if (e.newValue !== e.oldValue) {
          refreshUser();
          // If token was removed in another tab, stop the scheduler
          if (e.key === 'authToken' && !e.newValue) cancelTokenRefresh();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      cancelTokenRefresh();
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, loading, refreshUser, setUser }),
    [user, loading, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
