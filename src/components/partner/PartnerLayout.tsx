import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { 
  Building2, 
  BarChart3, 
  FileText, 
  Calendar, 
  FolderOpen, 
  HelpCircle, 
  Phone,
  LogOut,
  Loader2,
  Lock,
  Settings,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PartnerLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: BarChart3, label: "Accueil", path: "/partner-portal", requiresActive: false },
  { icon: FileText, label: "Modalités", path: "/partner-portal/modalites", requiresActive: true },
  { icon: Calendar, label: "Nos Actions", path: "/partner-portal/actions", requiresActive: true },
  { icon: FolderOpen, label: "Dossier Partenariat", path: "/partner-portal/dossier", requiresActive: true },
  { icon: Settings, label: "Réglages Convention", path: "/partner-portal/settings", requiresActive: false },
  { icon: HelpCircle, label: "FAQ Partenaire", path: "/partner-portal/faq", requiresActive: false },
  { icon: Phone, label: "Contact Direction", path: "/partner-portal/contact", requiresActive: false },
];

const PartnerLayout = ({ children }: PartnerLayoutProps) => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = profileLoading || rolesLoading;

  // Extended profile type
  const extendedProfile = profile as typeof profile & {
    partner_status?: string;
    partner_company_name?: string;
    partner_contact_name?: string;
  };

  const isPartner = roles.includes('partner');
  const partnerStatus = extendedProfile?.partner_status;
  const isActive = partnerStatus === 'active';
  const isPending = partnerStatus === 'pending';

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth?mode=partner");
        return;
      }

      if (!isPartner) {
        toast.error("Accès réservé aux partenaires");
        navigate("/");
        return;
      }

      // Allow pending partners to access the portal (limited view)
      if (!isActive && !isPending) {
        navigate("/");
      }
    }
  }, [user, isPartner, isActive, isPending, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavClick = (item: typeof menuItems[0], e: React.MouseEvent) => {
    if (item.requiresActive && !isActive) {
      e.preventDefault();
      toast.info("Cette section sera accessible après validation de votre dossier.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user || !isPartner || (!isActive && !isPending)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Sidebar - Glassmorphism Dark */}
      <aside className="w-64 bg-mp-paper/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed h-full">
        {/* Logo & Company */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Building2 className="w-6 h-6 text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate font-sans">
                {extendedProfile?.partner_company_name || "Partenaire"}
              </p>
              <p className="text-xs text-mp-ink-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Espace Pro
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isCurrentPath = location.pathname === item.path;
            const isLocked = item.requiresActive && !isActive;
            
            return (
              <Link
                key={item.path}
                to={isLocked ? "#" : item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm",
                  isCurrentPath && !isLocked
                    ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400"
                    : isLocked
                      ? "text-mp-ink-muted cursor-not-allowed"
                      : "text-mp-ink-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isLocked && "opacity-40")} />
                <span className={cn(isLocked && "opacity-40")}>{item.label}</span>
                {isLocked && <Lock className="w-3 h-3 ml-auto opacity-40" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-mp-ink-muted hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header Bar - Glassmorphism */}
        <header className="h-16 bg-mp-paper/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 flex items-center px-8">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-semibold">Manga Paradise</span>
            <span className="text-mp-ink-muted">•</span>
            <span className="text-mp-ink-muted text-sm">Portail Partenaire</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PartnerLayout;
