import { useLocation, Navigate } from "react-router-dom";
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
  redirectTo = "/auth?mode=login",
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1️⃣ Wait for auth context to load
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // 2️⃣ If auth required but no user → redirect
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3️⃣ If no auth required (login/register pages) and user exists → redirect to dashboard/admin
  if (!requireAuth && user) {
    const destination = user.userType === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  // 4️⃣ Admin-only route
  if (requireAdmin && user?.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">Admin privileges required.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // 5️⃣ Referral-only route
  if (requireReferral && user?.userType !== "referral") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">Referral access only.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // 6️⃣ Route allowed → render children
  return <>{children}</>;
};
