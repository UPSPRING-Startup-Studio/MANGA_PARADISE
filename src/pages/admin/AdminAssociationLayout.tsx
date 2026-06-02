import { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { useAssociationById, type Association, type AssociationRole, type AdminStatus } from "@/hooks/useAssociation";
import { useChangeAdminStatus } from "@/hooks/useAdminAssociations";
import AdminAssociationSidebar from "@/components/admin/AdminAssociationSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Building2,
  ShieldCheck,
  ShieldOff,
  Shield,
  ChevronRight,
} from "lucide-react";

/**
 * Context shape passed to association child pages via Outlet context.
 * Same interface as AssociationLayout — pages can be reused unchanged.
 */
export interface AdminAssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
  isAdminMode: boolean;
  basePath: string;
  isBlocked: boolean;
  isRestricted: boolean;
}

const AdminAssociationLayout = () => {
  const navigate = useNavigate();
  const { associationId } = useParams<{ associationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: association, isLoading: assocLoading } = useAssociationById(associationId);
  const changeAdminStatus = useChangeAdminStatus();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoading = authLoading || adminLoading || assocLoading;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#E84A2B] mx-auto" />
          <p className="text-mp-ink-muted">Chargement du back-office...</p>
        </div>
      </div>
    );
  }

  // Access denied: not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-display text-3xl text-slate-50">Acces Refuse</h1>
          <p className="text-mp-ink-muted">
            Seuls les administrateurs globaux de la plateforme peuvent acceder
            au mode d'administration des associations.
          </p>
          <Button
            onClick={() => navigate("/admin/associations")}
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Association not found
  if (!association) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto">
            <Building2 className="w-10 h-10 text-mp-ink-muted" />
          </div>
          <h1 className="font-display text-3xl text-slate-50">
            Association introuvable
          </h1>
          <p className="text-mp-ink-muted">
            L'association demandee n'existe pas ou a ete supprimee.
          </p>
          <Button
            onClick={() => navigate("/admin/associations")}
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux associations
          </Button>
        </div>
      </div>
    );
  }

  const basePath = `/admin/associations/${associationId}`;
  const adminStatus = (association.admin_status || "active") as AdminStatus;
  const isBlocked = adminStatus === "blocked";
  const isRestricted = adminStatus === "restricted";

  // Context passed to all child pages (same shape as AssociationLayout)
  const outletContext: AdminAssociationContext = {
    association,
    role: "president" as const,
    isAdminMode: true,
    basePath,
    isBlocked,
    isRestricted,
  };

  const handleLiftStatus = () => {
    if (!associationId) return;
    changeAdminStatus.mutate({
      associationId,
      adminStatus: "active",
      reason: undefined,
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-950 dark">
      {/* Sidebar */}
      <AdminAssociationSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        associationName={association.name}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header with breadcrumb */}
        <header className="h-14 border-b border-mp-border flex items-center justify-between px-6 bg-mp-paper/50">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/admin/associations"
              className="text-mp-ink-muted hover:text-slate-200 transition-colors"
            >
              Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-mp-ink-muted" />
            <Link
              to="/admin/associations"
              className="text-mp-ink-muted hover:text-slate-200 transition-colors"
            >
              Associations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-mp-ink-muted" />
            <span className="text-slate-100 font-medium truncate max-w-[200px]">
              {association.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {adminStatus !== "active" && (
              <Badge
                className={`text-xs gap-1.5 ${
                  isBlocked
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {isBlocked ? (
                  <><ShieldOff className="w-3.5 h-3.5" />Bloquee</>
                ) : (
                  <><ShieldAlert className="w-3.5 h-3.5" />Restreinte</>
                )}
              </Badge>
            )}
            <Badge className="bg-[#E84A2B]/15 text-[#E84A2B] border-[#E84A2B]/30 text-xs gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Global
            </Badge>
          </div>
        </header>

        {/* Admin status banner — blocked or restricted */}
        {adminStatus !== "active" && (
          <div
            className={`px-6 py-3 flex items-center justify-between gap-4 ${
              isBlocked
                ? "bg-red-500/10 border-b border-red-500/20"
                : "bg-amber-500/10 border-b border-amber-500/20"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isBlocked ? (
                <ShieldOff className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isBlocked ? "text-red-300" : "text-amber-300"
                  }`}
                >
                  Association {isBlocked ? "bloquee" : "restreinte"} par l'administration
                </p>
                {association.admin_status_reason && (
                  <p className="text-xs text-mp-ink-muted mt-0.5">
                    Motif : {association.admin_status_reason}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              onClick={handleLiftStatus}
              disabled={changeAdminStatus.isPending}
            >
              {changeAdminStatus.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Shield className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isBlocked ? "Lever le blocage" : "Lever la restriction"}
            </Button>
          </div>
        )}

        {/* Admin mode banner (always shown) */}
        {adminStatus === "active" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">
              <span className="font-medium">Mode administration globale</span>
              {" — "}
              Vous administrez{" "}
              <span className="font-semibold text-amber-100">
                {association.name}
              </span>{" "}
              en tant qu'admin plateforme.
            </p>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
};

export default AdminAssociationLayout;
