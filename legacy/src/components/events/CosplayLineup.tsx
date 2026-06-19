import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useEventParticipants, EventParticipant } from "@/hooks/useEventParticipants";
import { useFriendIds } from "@/hooks/useFriendships";
import { useAuth } from "@/contexts/AuthContext";
import { PhotoHuntButton } from "./PhotoHuntButton";

interface ParticipantCardProps {
  participant: EventParticipant;
  isFriend: boolean;
  index: number;
}

const ParticipantCard = ({ participant, isFriend, index }: ParticipantCardProps) => {
  const hasCosplay = !!participant.cosplay;
  const displayName = participant.user?.display_name || participant.user?.username || "Participant";
  const imageUrl = hasCosplay 
    ? participant.cosplay?.user_image_url 
    : participant.user?.avatar_url;
  
  const tooltipText = hasCosplay
    ? `${displayName} incarnera ${participant.cosplay?.character_name} (${participant.cosplay?.universe})`
    : `${displayName} participe`;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={cn(
              "relative group cursor-pointer",
              "aspect-[3/4] rounded-xl overflow-hidden",
              "border-2 transition-all duration-300",
              hasCosplay 
                ? "border-sakura shadow-glow-pink hover:border-sakura/80" 
                : "border-muted-foreground/30 hover:border-turquoise/50"
            )}
          >
            {/* Background image */}
            <div className="absolute inset-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-hero flex items-center justify-center">
                  <span className="text-4xl">
                    {hasCosplay ? "🎭" : "👤"}
                  </span>
                </div>
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Photo Hunt Button - Top Right floating */}
            <PhotoHuntButton
              participantId={participant.id}
              participantName={displayName}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />

            {/* Nakama badge - shifted down to avoid overlap with Photo Hunt button */}
            {isFriend && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-10 right-2"
              >
                <Badge
                  variant="secondary"
                  className="bg-turquoise/90 text-tokyo-night text-xs font-display px-2 py-0.5"
                >
                  Nakama
                </Badge>
              </motion.div>
            )}

            {/* Cosplay indicator */}
            {hasCosplay && (
              <div className="absolute top-2 left-2">
                <Badge 
                  variant="secondary"
                  className="bg-sakura/90 text-white text-xs px-2 py-0.5"
                >
                  🎭 Cosplay
                </Badge>
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-display text-sm text-white truncate tracking-wide">
                {displayName}
              </p>
              {hasCosplay && (
                <p className="text-xs text-white/70 truncate mt-0.5">
                  → {participant.cosplay?.character_name}
                </p>
              )}
            </div>

            {/* Hover glow effect */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-t",
              hasCosplay ? "from-sakura/20" : "from-turquoise/20",
              "to-transparent pointer-events-none"
            )} />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-tokyo-night border-sakura/30 text-foreground font-body"
        >
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface CosplayLineupProps {
  eventId: string;
  className?: string;
}

const CosplayLineup = ({ eventId, className }: CosplayLineupProps) => {
  const { user } = useAuth();
  const { data: participants = [], isLoading } = useEventParticipants(eventId);
  const { data: friendIds = [] } = useFriendIds(user?.id);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}>
        <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground font-body">
          Aucun participant inscrit pour le moment
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Sois le premier à rejoindre l'aventure !
        </p>
      </div>
    );
  }

  // Sort participants: cosplayers first, then friends
  const sortedParticipants = [...participants].sort((a, b) => {
    const aIsFriend = friendIds.includes(a.user_id);
    const bIsFriend = friendIds.includes(b.user_id);
    const aHasCosplay = a.role === "cosplayer";
    const bHasCosplay = b.role === "cosplayer";

    // Friends with cosplay first
    if (aIsFriend && aHasCosplay && !(bIsFriend && bHasCosplay)) return -1;
    if (bIsFriend && bHasCosplay && !(aIsFriend && aHasCosplay)) return 1;
    
    // Then cosplayers
    if (aHasCosplay && !bHasCosplay) return -1;
    if (bHasCosplay && !aHasCosplay) return 1;
    
    // Then friends
    if (aIsFriend && !bIsFriend) return -1;
    if (bIsFriend && !aIsFriend) return 1;
    
    return 0;
  });

  const cosplayCount = participants.filter(p => p.role === "cosplayer").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-wide text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-sakura" />
          Line-up ({participants.length})
        </h3>
        {cosplayCount > 0 && (
          <Badge variant="outline" className="border-sakura/50 text-sakura">
            🎭 {cosplayCount} cosplayeur{cosplayCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Grid of participants */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {sortedParticipants.map((participant, index) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            isFriend={friendIds.includes(participant.user_id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default CosplayLineup;
