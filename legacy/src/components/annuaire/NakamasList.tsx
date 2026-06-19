import { Users, User, Calendar } from "lucide-react";
import { useFriendsWithContext } from "@/hooks/useCosCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NakamasListProps {
  userId: string | undefined;
  onMemberClick?: (memberId: string) => void;
}

const NakamasList = ({ userId, onMemberClick }: NakamasListProps) => {
  const { data: friends, isLoading } = useFriendsWithContext(userId);

  if (isLoading) {
    return (
      <section className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-sakura" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <section className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <div className="flex flex-col items-center gap-3">
          <Users className="w-10 h-10 text-white/30" />
          <p className="text-white/60 text-sm">
            Aucun Nakama pour le moment
          </p>
          <p className="text-white/40 text-xs">
            Scannez des Cos-Cards en convention pour agrandir votre équipage !
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/5 rounded-xl p-4 border border-white/10">
      <h3 className="text-sakura font-display text-lg tracking-wide mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        🏴‍☠️ Nakamas ({friends.length})
      </h3>
      
      <div className="space-y-2">
        {friends.map((friendship) => {
          const friend = friendship.friend;
          const displayName = friend.display_name || friend.username || "Membre";
          
          // Build meeting context string
          let meetingText: string | null = null;
          if (friendship.meeting_event) {
            meetingText = `Rencontré à ${friendship.meeting_event.title}`;
          } else if (friendship.meeting_context) {
            meetingText = friendship.meeting_context;
          }
          
          return (
            <div
              key={friendship.id}
              onClick={() => onMemberClick?.(friend.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5",
                "hover:bg-white/10 hover:border-sakura/30 transition-all duration-200 cursor-pointer"
              )}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-sakura/30">
                {friend.avatar_url ? (
                  <img 
                    src={friend.avatar_url} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white/60" />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm truncate">
                  {displayName}
                </h4>
                {meetingText && (
                  <p className="text-white/40 text-xs truncate flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {meetingText}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default NakamasList;
