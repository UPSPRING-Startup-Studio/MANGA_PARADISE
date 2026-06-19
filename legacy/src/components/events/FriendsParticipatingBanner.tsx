import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendIds } from "@/hooks/useFriendships";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { cn } from "@/lib/utils";

interface FriendsParticipatingBannerProps {
  eventId: string;
  className?: string;
}

const FriendsParticipatingBanner = ({ eventId, className }: FriendsParticipatingBannerProps) => {
  const { user } = useAuth();
  const { data: friendIds = [] } = useFriendIds(user?.id);
  const { data: participants = [] } = useEventParticipants(eventId);

  if (!user || friendIds.length === 0) return null;

  // Find friends who are participating
  const friendParticipants = participants.filter(p => 
    friendIds.includes(p.user_id) && p.user_id !== user.id
  );

  if (friendParticipants.length === 0) return null;

  // Get user info from participants
  const friendProfiles = friendParticipants
    .map(p => p.user)
    .filter(Boolean)
    .slice(0, 5); // Show max 5 avatars

  const extraCount = friendParticipants.length - 5;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl",
      "bg-gradient-to-r from-sakura/10 via-turquoise/10 to-accent/10",
      "border border-sakura/20",
      className
    )}>
      <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {friendParticipants.length} ami{friendParticipants.length > 1 ? "s" : ""} participe{friendParticipants.length > 1 ? "nt" : ""} :
        </span>
        
        <div className="flex items-center -space-x-2">
          {friendProfiles.map((profile, index) => (
            <Link
              key={profile.id}
              to={`/u/${profile.username}`}
              className="relative hover:z-10 transition-transform hover:scale-110"
              style={{ zIndex: friendProfiles.length - index }}
            >
              <Avatar className="w-8 h-8 border-2 border-background ring-1 ring-sakura/30">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-sakura/20 text-sakura text-xs">
                  {profile.display_name?.[0] || profile.username?.[0] || <User className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          ))}
          
          {extraCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                +{extraCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsParticipatingBanner;
