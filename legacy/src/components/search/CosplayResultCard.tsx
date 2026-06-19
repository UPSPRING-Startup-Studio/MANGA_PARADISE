import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CosplayResultCardProps {
  cosplay: {
    id: string;
    character_name: string;
    universe: string;
    user_image_url: string;
    profile: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  searchType: "character" | "universe";
  onClick: () => void;
}

const CosplayResultCard = ({ cosplay, searchType, onClick }: CosplayResultCardProps) => {
  const displayName = cosplay.profile?.display_name || cosplay.profile?.username || "Anonyme";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden",
        "rounded-2xl border border-border/50 hover:border-primary/40",
        "transition-all duration-300",
        "hover:transform hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      {/* Background Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={cosplay.user_image_url}
          alt={cosplay.character_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Universe Badge */}
        <Badge 
          variant="secondary" 
          className={cn(
            "absolute top-3 right-3 backdrop-blur-sm",
            searchType === "universe" ? "bg-primary/80 text-primary-foreground" : "bg-secondary/80"
          )}
        >
          {cosplay.universe}
        </Badge>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Character Name */}
        <h3 className={cn(
          "font-display text-xl tracking-wide mb-1",
          searchType === "character" ? "text-primary" : "text-foreground"
        )}>
          {cosplay.character_name}
        </h3>
        
        {/* Cosplayer Info */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-primary/20">
            {cosplay.profile?.avatar_url ? (
              <img
                src={cosplay.profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-muted-foreground text-sm">
            par <span className="text-foreground">{displayName}</span>
          </span>
        </div>
      </div>

      {/* Hover indicator */}
      <span className="absolute top-3 left-3 text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">
        Voir le profil →
      </span>
    </div>
  );
};

export default CosplayResultCard;
