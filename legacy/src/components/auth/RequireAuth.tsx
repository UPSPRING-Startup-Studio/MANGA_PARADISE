import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Auth Guard Component - Protects routes from unauthenticated access
 * Redirects to /auth if user is not logged in
 * Shows loading state while checking authentication
 */
export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--mp-primary))]" />
          <p className="text-mp-ink-muted text-sm animate-pulse">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};
