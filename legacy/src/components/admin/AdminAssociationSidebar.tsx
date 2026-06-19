import { useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import {
  Users,
  CalendarDays,
  FileText,
  Settings,
  ChevronLeft,
  ChevronDown,
  Building2,
  UserPlus,
  BookUser,
  ClipboardList,
  ScrollText,
  Heart,
  Crown,
  Target,
  LayoutDashboard,
  UserCheck,
  Calendar,
  FileCheck2,
  Layers,
  Wrench,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminAssociationSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  associationName?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: typeof Users;
  description: string;
}

interface NavSection {
  section: string;
  icon: typeof Users;
  color: string;
  items: NavItem[];
}

/**
 * Build nav items relative to the admin association base path.
 */
function buildNavItems(basePath: string) {
  const mainNavItems: NavItem[] = [
    {
      label: "Tableau de bord",
      path: `${basePath}/dashboard`,
      icon: Building2,
      description: "Vue d'ensemble",
    },
    {
      label: "Membres",
      path: `${basePath}/membres`,
      icon: Users,
      description: "Gestion des membres",
    },
    {
      label: "Adhesions",
      path: `${basePath}/adhesions`,
      icon: ClipboardList,
      description: "Demandes d'adhesion",
    },
    {
      label: "Equipe / Bureau",
      path: `${basePath}/equipe`,
      icon: Crown,
      description: "Dirigeants & mandats",
    },
    {
      label: "Invitations",
      path: `${basePath}/invitations`,
      icon: UserPlus,
      description: "Inviter des membres",
    },
  ];

  const volunteerSection: NavSection = {
    section: "Benevolat",
    icon: Heart,
    color: "text-emerald-400",
    items: [
      {
        label: "Dashboard",
        path: `${basePath}/vol-dashboard`,
        icon: LayoutDashboard,
        description: "Vue d'ensemble benevolat",
      },
      {
        label: "Candidatures",
        path: `${basePath}/vol-candidatures`,
        icon: FileCheck2,
        description: "Demandes de benevolat",
      },
      {
        label: "Benevoles",
        path: `${basePath}/benevoles`,
        icon: Heart,
        description: "Profils & competences",
      },
      {
        label: "Missions",
        path: `${basePath}/vol-missions`,
        icon: Target,
        description: "Gestion des missions",
      },
      {
        label: "Affectations",
        path: `${basePath}/vol-affectations`,
        icon: UserCheck,
        description: "Benevoles → missions",
      },
      {
        label: "Planning",
        path: `${basePath}/vol-planning`,
        icon: Calendar,
        description: "Vue planning & shifts",
      },
      {
        label: "Templates",
        path: `${basePath}/vol-templates`,
        icon: Layers,
        description: "Modeles de missions",
      },
      {
        label: "Configuration",
        path: `${basePath}/vol-schema`,
        icon: Wrench,
        description: "Schema des fiches mission",
      },
    ],
  };

  const bottomNavItems: NavItem[] = [
    {
      label: "Evenements",
      path: `${basePath}/evenements`,
      icon: CalendarDays,
      description: "Evenements associatifs",
    },
    {
      label: "Formulaires",
      path: `${basePath}/formulaires`,
      icon: ScrollText,
      description: "Gestion des bulletins",
    },
    {
      label: "Documents",
      path: `${basePath}/documents`,
      icon: FileText,
      description: "Suivi documentaire",
    },
    {
      label: "Annuaire CRM",
      path: `${basePath}/contacts`,
      icon: BookUser,
      description: "Contacts & partenaires",
    },
    {
      label: "Parametres",
      path: `${basePath}/parametres`,
      icon: Settings,
      description: "Fiche & roles",
    },
  ];

  return { mainNavItems, volunteerSection, bottomNavItems };
}

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
          "hover:bg-white/5",
          isActive
            ? "bg-[#E84A2B]/10 text-[#E84A2B] border-l-2 border-[#E84A2B]"
            : "text-mp-ink-muted hover:text-slate-200"
        )
      }
    >
      <item.icon className={cn("w-5 h-5 shrink-0", collapsed && "mx-auto")} />
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.label}</p>
          <p className="text-xs text-mp-ink-muted truncate">{item.description}</p>
        </div>
      )}
    </NavLink>
  );
}

const AdminAssociationSidebar = ({
  collapsed,
  onToggle,
  associationName,
}: AdminAssociationSidebarProps) => {
  const { associationId } = useParams<{ associationId: string }>();
  const location = useLocation();
  const basePath = `/admin/associations/${associationId}`;
  const { mainNavItems, volunteerSection, bottomNavItems } =
    buildNavItems(basePath);

  const isVolunteerActive = volunteerSection.items.some((item) =>
    location.pathname.startsWith(item.path)
  );
  const [volExpanded, setVolExpanded] = useState(isVolunteerActive);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-slate-950 border-r border-mp-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="border-b border-mp-border">
        {/* Back link */}
        {!collapsed && (
          <NavLink
            to="/admin/associations"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-mp-ink-muted hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux associations
          </NavLink>
        )}

        <div className="h-14 flex items-center justify-between px-4 border-t border-mp-border/50">
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-5 h-5 text-[#E84A2B] shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-sm tracking-wide text-slate-100 truncate">
                  {associationName || "Association"}
                </p>
                <Badge className="bg-[#E84A2B]/15 text-[#E84A2B] border-[#E84A2B]/30 text-[9px] px-1.5 py-0">
                  Admin Global
                </Badge>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <ShieldCheck className="w-5 h-5 text-[#E84A2B]" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("shrink-0 hover:bg-white/5", collapsed && "mx-auto")}
          >
            <ChevronLeft
              className={cn(
                "w-5 h-5 transition-transform text-mp-ink-muted",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {/* Main nav */}
        {mainNavItems.map((item) => (
          <NavItemLink key={item.path} item={item} collapsed={collapsed} />
        ))}

        {/* Volunteer section (collapsible) */}
        <div className="pt-2 mt-2 border-t border-mp-border/50">
          {collapsed ? (
            <NavLink
              to={volunteerSection.items[0].path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center py-2.5 rounded-lg transition-all",
                  "hover:bg-white/5",
                  isVolunteerActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-mp-ink-muted hover:text-slate-200"
                )
              }
            >
              <Heart className="w-5 h-5" />
            </NavLink>
          ) : (
            <>
              <button
                onClick={() => setVolExpanded(!volExpanded)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/5",
                  isVolunteerActive
                    ? "text-emerald-400"
                    : "text-mp-ink-muted hover:text-slate-200"
                )}
              >
                <Heart className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm">Benevolat</p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    volExpanded && "rotate-180"
                  )}
                />
              </button>
              {volExpanded && (
                <div className="ml-4 pl-3 border-l border-emerald-500/20 space-y-0.5 mt-0.5">
                  {volunteerSection.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all text-sm",
                          "hover:bg-white/5",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-mp-ink-muted hover:text-slate-200"
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom nav */}
        <div className="pt-2 mt-2 border-t border-mp-border/50">
          {bottomNavItems.map((item) => (
            <NavItemLink key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="p-4 border-t border-mp-border">
          <p className="text-xs text-mp-ink-muted text-center">
            Back-Office Admin v2.0
          </p>
        </div>
      )}
    </aside>
  );
};

export default AdminAssociationSidebar;
