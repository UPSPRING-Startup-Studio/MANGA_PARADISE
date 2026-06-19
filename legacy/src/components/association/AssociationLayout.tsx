import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyAssociation, type Association, type AdminStatus } from "@/hooks/useAssociation";
import { useIsAdmin } from "@/hooks/useUserRoles";
import AssociationSidebar from "./AssociationSidebar";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building2, ShieldOff, ShieldAlert } from "lucide-react";
import { ASSOCIATION_ROLE_LABELS } from "@/hooks/useAssociation";

/**
 * Hook interne : pour un admin plateforme sans membership,
 * récupère la première association active comme fallback.
 */
function useFirstAssociationFallback(enabled: boolean) {
  return useQuery({
    queryKey: ["first-association-fallback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("associations")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Association | null;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ──────────────────────────────────────────────
// Bandeau admin_status (blocked / restricted)
// ──────────────────────────────────────────────

function AdminStatusBanner({ association }: { association: Association }) {
  const adminStatus = (association.admin_status || "active") as AdminStatus;

  if (adminStatus === "active") return null;

  const isBlocked = adminStatus === "blocked";

  return (
    <div
      className={`px-6 py-3 flex items-center gap-3 ${
        isBlocked
          ? "bg-red-500/10 border-b border-red-500/20"
          : "bg-amber-500/10 border-b border-amber-500/20"
      }`}
    >
      {isBlocked ? (
        <ShieldOff className="h-5 w-5 text-red-400 shrink-0" />
      ) : (
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
      )}
      <div className="min-w-0">
        <p
          className={`text-sm font-medium ${
            isBlocked ? "text-red-300" : "text-amber-300"
          }`}
        >
          {isBlocked
            ? "Cette association est bloquée par l'administration plateforme. Aucune modification n'est possible."
            : "Cette association est sous restriction administrative. Certaines actions sont désactivées."}
        </p>
        {association.admin_status_reason && (
          <p className="text-xs text-mp-ink-muted mt-0.5">
            Motif : {association.admin_status_reason}
          </p>
        )}
      </div>
    </div>
  );
}

const AssociationLayout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: myAssociation, isLoading: assocLoading } = useMyAssociation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fallback pour admin sans membership
  const needsFallback = !assocLoading && !myAssociation && !!isAdmin;
  const { data: fallbackAssociation, isLoading: fallbackLoading } =
    useFirstAssociationFallback(needsFallback);

  const isLoading = authLoading || adminLoading || assocLoading || (needsFallback && fallbackLoading);

  // L'accès est autorisé si :
  // - admin plateforme, OU
  // - membre actif de l'association (quel que soit le rôle)
  const hasAccess = isAdmin || !!myAssociation;

  // Résoudre l'association et le rôle à exposer
  const resolvedAssociation = myAssociation?.association || fallbackAssociation || undefined;
  const resolvedRole = myAssociation?.role || (isAdmin ? "president" as const : undefined);

  // Admin status flags
  const adminStatus = (resolvedAssociation?.admin_status || "active") as AdminStatus;
  const isAssociationBlocked = adminStatus === "blocked";
  const isAssociationRestricted = adminStatus === "restricted";

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
          <Loader2 className="w-10 h-10 animate-spin text-sakura mx-auto" />
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
            <Building2 className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl">Accès Refusé</h1>
          <p className="text-muted-foreground">
            Tu n'as pas les permissions nécessaires pour accéder au back-office
            associatif. Contacte un responsable de l'association.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Label du rôle affiché dans la top bar
  const roleLabel = isAdmin && !myAssociation
    ? "Admin MP"
    : resolvedRole
      ? ASSOCIATION_ROLE_LABELS[resolvedRole]
      : "";

  return (
    <div className="min-h-screen flex bg-background dark">
      <AssociationSidebar
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
              {resolvedAssociation?.name || "Association"}
            </span>
            <span className="font-medium text-sakura">
              {roleLabel}
            </span>
          </div>
        </header>

        {/* Admin status banner */}
        {resolvedAssociation && (
          <AdminStatusBanner association={resolvedAssociation} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet
            context={{
              association: resolvedAssociation,
              role: resolvedRole,
              basePath: "/association",
              isBlocked: isAssociationBlocked,
              isRestricted: isAssociationRestricted,
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default AssociationLayout;
