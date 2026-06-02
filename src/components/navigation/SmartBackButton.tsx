import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Drama, Calendar, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackDestination {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

const BACK_DESTINATIONS: Record<string, BackDestination> = {
  cosplay_planning: {
    label: "Retour au Line-Up",
    path: "/espace-membre/parametres?tab=cosplayer",
    icon: <Drama className="w-4 h-4" />,
  },
  agenda: {
    label: "Retour à l'agenda",
    path: "/agenda",
    icon: <Calendar className="w-4 h-4" />,
  },
  annuaire: {
    label: "Retour à l'annuaire",
    path: "/communaute/annuaire",
    icon: <Users className="w-4 h-4" />,
  },
  amis: {
    label: "Retour à mes amis",
    path: "/espace-membre/amis",
    icon: <Users className="w-4 h-4" />,
  },
  vestiaire: {
    label: "Retour au vestiaire",
    path: "/espace-membre/parametres?tab=cosplayer",
    icon: <Drama className="w-4 h-4" />,
  },
  events: {
    label: "Retour aux événements",
    path: "/agenda",
    icon: <Calendar className="w-4 h-4" />,
  },
};

interface SmartBackButtonProps {
  /** Default fallback destination if no context */
  fallbackPath?: string;
  fallbackLabel?: string;
  /** Custom class name */
  className?: string;
  /** Variant styling */
  variant?: "default" | "ghost" | "outline" | "special";
}

const SmartBackButton = ({ 
  fallbackPath = "/",
  fallbackLabel = "Retour",
  className,
  variant = "ghost",
}: SmartBackButtonProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check for `from` parameter in URL
  const fromParam = searchParams.get("from");
  
  // Determine the back destination
  const getBackDestination = (): BackDestination => {
    // Priority 1: Check `from` URL parameter
    if (fromParam && BACK_DESTINATIONS[fromParam]) {
      return BACK_DESTINATIONS[fromParam];
    }
    
    // Priority 2: Check if we have navigation history state
    const historyState = location.state as { from?: string } | null;
    if (historyState?.from && BACK_DESTINATIONS[historyState.from]) {
      return BACK_DESTINATIONS[historyState.from];
    }
    
    // Priority 3: Use fallback
    return {
      label: fallbackLabel,
      path: fallbackPath,
      icon: <Home className="w-4 h-4" />,
    };
  };
  
  const destination = getBackDestination();
  const isSpecial = fromParam === "cosplay_planning";
  
  const handleClick = () => {
    navigate(destination.path);
  };
  
  // Special styling for cosplay planning return
  if (isSpecial && variant === "default") {
    return (
      <Button
        variant="outline"
        onClick={handleClick}
        className={cn(
          "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 gap-2",
          className
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        {destination.icon}
        {destination.label}
      </Button>
    );
  }
  
  return (
    <Button
      variant={variant === "special" ? "outline" : variant}
      onClick={handleClick}
      className={cn(
        variant === "ghost" && "hover:bg-card/50",
        className
      )}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {destination.label}
    </Button>
  );
};

export default SmartBackButton;
