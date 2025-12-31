import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireReferral?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireReferral = false,
  redirectTo = "/auth?mode=login" 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);

  // Grace period: if a token exists but user isn't hydrated yet, wait briefly
  useEffect(() => {
    if (!requireAuth) return;
    if (loading) return;
    if (user) return;

    const token = localStorage.getItem('authToken');
    if (token && !syncing) {
      console.log('[ProtectedRoute] Token found but user not hydrated, syncing...');
      setSyncing(true);
      // Allow AuthContext a short window to hydrate from localStorage
      const t = setTimeout(() => {
        console.log('[ProtectedRoute] Sync complete');
        setSyncing(false);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [requireAuth, loading, user, syncing]);

  if (loading || syncing) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (requireAuth && !user) {
    // Redirect to auth page but save the location they were trying to go to
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // If user is already logged in and tries to access auth pages
    // Admin users: redirect to admin panel ONLY
    // Other users: redirect to student dashboard
    // This prevents admins from accessing student login page
    const destination = user.userType === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  // Check admin requirement
  if (requireAdmin && user && user.userType !== 'admin') {
    console.warn('[ProtectedRoute] Access denied - not an admin:', user);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page. Admin privileges required.</p>
          <button 
            onClick={() => window.history.back()} 
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Admin route access granted
  if (requireAdmin && user && user.userType === 'admin') {
    console.log('[ProtectedRoute] Admin access granted to:', user.email);
  }

  // Check referral requirement
  if (requireReferral && user && user.userType !== 'referral') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">This page is only accessible to referral users.</p>
          <button 
            onClick={() => window.history.back()} 
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
