import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AssociationSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof Users;
  description: string;
}

interface NavSection {
  section: string;
  icon: typeof Users;
  color: string;
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/association/dashboard",
    icon: Building2,
    description: "Vue d'ensemble",
  },
  {
    label: "Membres",
    href: "/association/membres",
    icon: Users,
    description: "Gestion des membres",
  },
  {
    label: "Adhésions",
    href: "/association/adhesions",
    icon: ClipboardList,
    description: "Demandes d'adhésion",
  },
  {
    label: "Équipe / Bureau",
    href: "/association/equipe",
    icon: Crown,
    description: "Dirigeants & mandats",
  },
  {
    label: "Invitations",
    href: "/association/invitations",
    icon: UserPlus,
    description: "Inviter des membres",
  },
];

const volunteerSection: NavSection = {
  section: "Bénévolat",
  icon: Heart,
  color: "text-emerald-400",
  items: [
    {
      label: "Dashboard",
      href: "/association/vol-dashboard",
      icon: LayoutDashboard,
      description: "Vue d'ensemble bénévolat",
    },
    {
      label: "Candidatures",
      href: "/association/vol-candidatures",
      icon: FileCheck2,
      description: "Demandes de bénévolat",
    },
    {
      label: "Bénévoles",
      href: "/association/benevoles",
      icon: Heart,
      description: "Profils & compétences",
    },
    {
      label: "Missions",
      href: "/association/vol-missions",
      icon: Target,
      description: "Gestion des missions",
    },
    {
      label: "Affectations",
      href: "/association/vol-affectations",
      icon: UserCheck,
      description: "Bénévoles → missions",
    },
    {
      label: "Planning",
      href: "/association/vol-planning",
      icon: Calendar,
      description: "Vue planning & shifts",
    },
    {
      label: "Templates",
      href: "/association/vol-templates",
      icon: Layers,
      description: "Modèles de missions",
    },
    {
      label: "Configuration",
      href: "/association/vol-schema",
      icon: Wrench,
      description: "Schéma des fiches mission",
    },
  ],
};

const bottomNavItems: NavItem[] = [
  {
    label: "Événements",
    href: "/association/evenements",
    icon: CalendarDays,
    description: "Événements associatifs",
  },
  {
    label: "Formulaires",
    href: "/association/formulaires",
    icon: ScrollText,
    description: "Gestion des bulletins",
  },
  {
    label: "Documents",
    href: "/association/documents",
    icon: FileText,
    description: "Suivi documentaire",
  },
  {
    label: "Annuaire CRM",
    href: "/association/contacts",
    icon: BookUser,
    description: "Contacts & partenaires",
  },
  {
    label: "Paramètres",
    href: "/association/parametres",
    icon: Settings,
    description: "Fiche & rôles",
  },
];

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
          "hover:bg-white/5",
          isActive
            ? "bg-sakura/10 text-sakura border-l-2 border-sakura"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      <item.icon className={cn("w-5 h-5 shrink-0", collapsed && "mx-auto")} />
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.label}</p>
          <p className="text-xs text-muted-foreground/70 truncate">
            {item.description}
          </p>
        </div>
      )}
    </NavLink>
  );
}

const AssociationSidebar = ({ collapsed, onToggle }: AssociationSidebarProps) => {
  const location = useLocation();
  const isVolunteerActive = volunteerSection.items.some(
    (item) => location.pathname.startsWith(item.href)
  );
  const [volExpanded, setVolExpanded] = useState(isVolunteerActive);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-[#1a1a1a] border-r border-border/50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sakura" />
            <span className="font-display text-lg tracking-wide text-foreground">
              Association
            </span>
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
              "w-5 h-5 transition-transform text-muted-foreground",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {/* Main nav */}
        {mainNavItems.map((item) => (
          <NavItemLink key={item.href} item={item} collapsed={collapsed} />
        ))}

        {/* Volunteer section (collapsible) */}
        <div className="pt-2 mt-2 border-t border-border/20">
          {collapsed ? (
            <NavLink
              to="/association/vol-dashboard"
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center py-2.5 rounded-lg transition-all",
                  "hover:bg-white/5",
                  isVolunteerActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
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
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm">Bénévolat</p>
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
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all text-sm",
                          "hover:bg-white/5",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-muted-foreground hover:text-foreground"
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
        <div className="pt-2 mt-2 border-t border-border/20">
          {bottomNavItems.map((item) => (
            <NavItemLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground/50 text-center">
            Back-Office Associatif v2.0
          </p>
        </div>
      )}
    </aside>
  );
};

export default AssociationSidebar;
