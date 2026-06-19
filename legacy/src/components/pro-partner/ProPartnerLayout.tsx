import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { useMyProPartner, PRO_PARTNER_ROLE_LABELS } from "@/hooks/useProPartner";
import type { ProPartner, ProPartnerRole } from "@/hooks/useProPartner";
import ProPartnerSidebar from "./ProPartnerSidebar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Briefcase } from "lucide-react";

const ProPartnerLayout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: myPartner, isLoading: partnerLoading } = useMyProPartner();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoading = authLoading || adminLoading || partnerLoading;

  // Accès autorisé si : admin plateforme OU membre actif d'un partenaire
  const hasAccess = isAdmin || !!myPartner;

  const resolvedPartner = myPartner?.partner || undefined;
  const resolvedRole = myPartner?.role || (isAdmin ? "admin" as ProPartnerRole : undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!isLoading && !hasAccess && user) {
      navigate("/");
    }
  }, [authLoading, isLoading, user, hasAccess, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <p className="text-muted-foreground">
            Vérification des permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Briefcase className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl">Accès Refusé</h1>
          <p className="text-muted-foreground">
            Tu n'as pas les permissions nécessaires pour accéder à l'Espace Pro.
            Si tu es partenaire, contacte l'équipe Manga Paradise.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const roleLabel = isAdmin && !myPartner
    ? "Admin MP"
    : resolvedRole
      ? PRO_PARTNER_ROLE_LABELS[resolvedRole]
      : "";

  return (
    <div className="min-h-screen flex bg-background dark">
      <ProPartnerSidebar
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
            <span className="text-muted-foreground">
              {resolvedPartner?.name || "Espace Pro"}
            </span>
            <span className="font-medium text-cyan-400">
              {roleLabel}
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ partner: resolvedPartner, role: resolvedRole }} />
        </main>
      </div>
    </div>
  );
};

export default ProPartnerLayout;
