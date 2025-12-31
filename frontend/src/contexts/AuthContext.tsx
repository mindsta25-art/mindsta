import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { getCurrentUser, type AuthUser } from "@/api/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: () => {},
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
    console.log('🔄 AuthContext: Refreshing user', currentUser);
    setUser(currentUser);
  }, []);

  useEffect(() => {
    // Check for existing user on mount
    const currentUser = getCurrentUser();
    console.log('🚀 AuthContext: Initial user load', currentUser);
    setUser(currentUser);
    setLoading(false);

    // Listen for storage changes (multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('📦 AuthContext: Storage changed', { key: e.key, newValue: e.newValue ? 'exists' : 'null' });
      if (e.key === 'authToken' || e.key === 'currentUser') {
        // Only refresh if the values actually changed
        if (e.newValue !== e.oldValue) {
          refreshUser();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, loading, refreshUser }),
    [user, loading, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
