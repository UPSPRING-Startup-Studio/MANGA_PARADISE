import { NavLink } from "react-router-dom";
import {
  Users,
  CalendarDays,
  ShoppingBag,
  Scroll,
  Shield,
  ChevronLeft,
  Landmark,
  Database,
  Swords,
  Store,
  Building2,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { 
    label: "Utilisateurs", 
    href: "/admin/users", 
    icon: Users,
    description: "L'Annuaire"
  },
  { 
    label: "Banque OTK", 
    href: "/admin/bank", 
    icon: Landmark,
    description: "Économie"
  },
  { 
    label: "Événements", 
    href: "/admin/events", 
    icon: CalendarDays,
    description: "L'Agenda"
  },
  { 
    label: "Exposants", 
    href: "/admin/exhibitors", 
    icon: Store,
    description: "Quartier Créateurs"
  },
  { 
    label: "Quêtes", 
    href: "/admin/quests", 
    icon: Scroll,
    description: "Game Master"
  },
  { 
    label: "Boutique", 
    href: "/admin/shop", 
    icon: ShoppingBag,
    description: "Le Bazar"
  },
  { 
    label: "Trophées", 
    href: "/admin/achievements", 
    icon: Scroll,
    description: "Modération Prix"
  },
  { 
    label: "Guildes", 
    href: "/admin/guilds", 
    icon: Swords,
    description: "Modération Guildes"
  },
  {
    label: "Associations",
    href: "/admin/associations",
    icon: Building2,
    description: "Module Associatif"
  },
  {
    label: "Partenaires",
    href: "/admin/partners",
    icon: Briefcase,
    description: "Espace Pro"
  },
  {
    label: "Database",
    href: "/admin/database",
    icon: Database,
    description: "Contenu & Vitrine"
  },
];

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
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
            <Shield className="w-6 h-6 text-sakura" />
            <span className="font-display text-lg tracking-wide text-foreground">Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("shrink-0 hover:bg-white/5", collapsed && "mx-auto")}
        >
          <ChevronLeft className={cn(
            "w-5 h-5 transition-transform text-muted-foreground",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
              "hover:bg-white/5",
              isActive 
                ? "bg-sakura/10 text-sakura border-l-2 border-sakura" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 shrink-0",
              collapsed && "mx-auto"
            )} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{item.description}</p>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground/50 text-center">
            Admin Panel v1.0
          </p>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;
