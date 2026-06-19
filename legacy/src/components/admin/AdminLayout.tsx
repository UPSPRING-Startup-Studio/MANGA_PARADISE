import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRoles";
import AdminSidebar from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Shield } from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Redirect if not admin (only after role check completes)
    if (!roleLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-sakura mx-auto" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl">Accès Refusé</h1>
          <p className="text-muted-foreground">
            Tu n'as pas les permissions nécessaires pour accéder à cette zone.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background dark">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au site
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Connecté en tant que</span>
            <span className="font-medium text-sakura">Admin</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
