import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Route label mappings
const ROUTE_LABELS: Record<string, string> = {
  "": "Accueil",
  "agenda": "Agenda",
  "evenements": "Événements",
  "communaute": "Communauté",
  "annuaire": "Annuaire",
  "blog": "Blog",
  "boutique": "Boutique",
  "espace-membre": "Espace Membre",
  "parametres": "Paramètres",
  "amis": "Mes Amis",
  "profil": "Profil",
  "auth": "Connexion",
  "rejoindre": "Nous Rejoindre",
  "search": "Recherche",
};

// Category mappings for sections
const CATEGORY_PREFIXES: Record<string, string> = {
  "agenda": "Événements",
  "communaute": "Communauté",
  "espace-membre": "Mon Espace",
  "blog": "Blog",
};

interface BreadcrumbsProps {
  /** Override automatic breadcrumb generation */
  items?: BreadcrumbItem[];
  /** Current page title (last item) */
  currentPage?: string;
  /** Custom class */
  className?: string;
  /** Show home icon */
  showHome?: boolean;
}

const Breadcrumbs = ({
  items,
  currentPage,
  className,
  showHome = true,
}: BreadcrumbsProps) => {
  const location = useLocation();
  
  // Generate breadcrumbs from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with home
    if (showHome) {
      breadcrumbs.push({ label: "Accueil", href: "/" });
    }
    
    // Build path progressively
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip UUID-like segments (they're IDs)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      if (isUUID) {
        // Use currentPage for UUID segments if it's the last one
        if (isLast && currentPage) {
          breadcrumbs.push({ label: currentPage });
        }
        return;
      }
      
      // Get label from mappings or capitalize segment
      const label = ROUTE_LABELS[segment] || 
                   segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      
      breadcrumbs.push({
        label: isLast && currentPage ? currentPage : label,
        href: isLast ? undefined : currentPath,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = items || generateBreadcrumbs();
  
  // Don't render if only home
  if (breadcrumbs.length <= 1) return null;
  
  return (
    <nav 
      aria-label="Fil d'Ariane" 
      className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
              )}
              
              {item.href && !isLast ? (
                <Link 
                  to={item.href}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {isFirst && showHome && <Home className="w-3 h-3" />}
                  <span className={cn(isFirst && showHome && "sr-only md:not-sr-only")}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    "flex items-center gap-1",
                    isLast && "text-foreground font-medium"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isFirst && showHome && <Home className="w-3 h-3" />}
                  <span className={cn(
                    isFirst && showHome && "sr-only md:not-sr-only",
                    "line-clamp-1"
                  )}>
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
