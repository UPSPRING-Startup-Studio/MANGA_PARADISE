import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Building2,
  Settings,
  ChevronLeft,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProPartnerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    label: "Tableau de bord",
    href: "/pro/dashboard",
    icon: BarChart3,
    description: "Vue d'ensemble",
  },
  {
    label: "Mes événements",
    href: "/pro/evenements",
    icon: CalendarDays,
    description: "Créer & gérer",
  },
  {
    label: "Ma structure",
    href: "/pro/structure",
    icon: Building2,
    description: "Fiche partenaire",
  },
  {
    label: "Demandes",
    href: "/pro/demandes",
    icon: MessageSquare,
    description: "Messages & échanges",
  },
  {
    label: "Paramètres",
    href: "/pro/parametres",
    icon: Settings,
    description: "Équipe & compte",
  },
];

const ProPartnerSidebar = ({ collapsed, onToggle }: ProPartnerSidebarProps) => {
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
            <Briefcase className="w-6 h-6 text-cyan-400" />
            <span className="font-display text-lg tracking-wide text-foreground">
              Espace Pro
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
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                "hover:bg-white/5",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon
              className={cn("w-5 h-5 shrink-0", collapsed && "mx-auto")}
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {item.description}
                </p>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground/50 text-center">
            Espace Pro v1.0
          </p>
        </div>
      )}
    </aside>
  );
};

export default ProPartnerSidebar;
