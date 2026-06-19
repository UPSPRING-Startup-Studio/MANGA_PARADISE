import { User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationResultCardProps {
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    city: string | null;
    bio: string | null;
  };
  searchCity: string;
  onClick: () => void;
}

const LocationResultCard = ({ profile, onClick }: LocationResultCardProps) => {
  const displayName = profile.display_name || profile.username || "Membre";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer",
        "bg-card backdrop-blur-md rounded-2xl",
        "border border-border/50 hover:border-primary/40",
        "p-5 transition-all duration-300",
        "hover:transform hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      {/* Avatar & Info */}
      <div className="flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-primary/20">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors truncate">
            {displayName}
          </h3>
          {profile.username && profile.display_name && (
            <p className="text-muted-foreground text-sm truncate">@{profile.username}</p>
          )}
        </div>
      </div>

      {/* Location Badge */}
      {profile.city && (
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-primary font-medium">{profile.city}</span>
        </div>
      )}

      {/* Hover indicator */}
      <span className="absolute bottom-3 right-3 text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        Voir le profil →
      </span>
    </div>
  );
};

export default LocationResultCard;
