import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bookmark, BookmarkCheck, MapPin, Radio,
  Mic2, Music, Gamepad2, Drama, Users, Award, ShoppingBag, Coffee, Film, Palette, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

export interface ActivityCardProps {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  type: "panel" | "concert" | "gaming" | "cosplay" | "meetup" | "workshop" | "shopping" | "contest" | "other";
  category?: string;
  location?: string;
  description?: string;
  image_url?: string;
  isLive?: boolean;
  isFavorite?: boolean;
  isToggling?: boolean;
  onCardClick: () => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
  participantCount?: number;
  participantAvatars?: Array<{ id: string; name: string; avatarUrl?: string; username?: string }>;
  registrationDeadline?: string; // ISO date string (YYYY-MM-DD)
  isRegistrationClosed?: boolean;
  approvedContestantsCount?: number; // Number of approved contestants (for contests only)
  approvedContestantIds?: string[]; // User IDs of approved contestants (for filtering)
  userContestStatus?: "pending" | "approved" | "rejected" | "waitlist"; // User's contest registration status
}

// Category color mapping
const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
  panel: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  concert: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  gaming: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  cosplay: { bg: "bg-sakura/20", text: "text-sakura", border: "border-sakura/30" },
  meetup: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  workshop: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  shopping: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  contest: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  other: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
};

const slotTypeConfig: Record<string, { icon: React.ElementType }> = {
  panel: { icon: Mic2 },
  concert: { icon: Music },
  gaming: { icon: Gamepad2 },
  cosplay: { icon: Drama },
  meetup: { icon: Users },
  workshop: { icon: Award },
  shopping: { icon: ShoppingBag },
  contest: { icon: Award },
  other: { icon: Coffee },
};

// Helper: Check if description contains registration keywords
const hasRegistration = (description?: string): boolean => {
  if (!description) return false;
  const lowerDesc = description.toLowerCase();
  return lowerDesc.includes("inscription") || lowerDesc.includes("tally") || lowerDesc.includes("register");
};

const ActivityCardComponent = memo(({
  id,
  time,
  endTime,
  title,
  type,
  category,
  location,
  description,
  image_url,
  isLive = false,
  isFavorite = false,
  isToggling = false,
  onCardClick,
  onFavoriteClick,
  participantCount = 0,
  participantAvatars = [],
  registrationDeadline,
  isRegistrationClosed = false,
  approvedContestantsCount = 0,
  approvedContestantIds = [],
  userContestStatus,
}: ActivityCardProps) => {
  const navigate = useNavigate();
  
  const colorConfig = useMemo(() => {
    const key = (category?.toLowerCase() || type) as keyof typeof categoryColorMap;
    return categoryColorMap[key] || categoryColorMap.other;
  }, [category, type]);

  const IconComponent = slotTypeConfig[type]?.icon || Coffee;
  const hasRegistrationBadge = hasRegistration(description);

  // Check if this is a contest activity
  const isContest = type === "contest" || category?.toLowerCase() === "contest";

  // Filter spectators: exclude approved contestants from the participants list
  const realSpectators = useMemo(() => {
    if (!isContest || approvedContestantIds.length === 0) {
      return participantAvatars;
    }
    
    // Filter out participants who are approved contestants
    return participantAvatars.filter(
      (participant) => !approvedContestantIds.includes(participant.id)
    );
  }, [isContest, participantAvatars, approvedContestantIds]);

  // Calculate real spectator count
  const spectatorCount = isContest 
    ? participantCount - approvedContestantsCount 
    : participantCount;

  // Calculate registration deadline status
  const registrationStatus = useMemo(() => {
    if (!registrationDeadline) return null;
    
    try {
      const deadline = parseISO(registrationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysUntilDeadline = differenceInDays(deadline, today);
      
      if (daysUntilDeadline < 0) {
        return { type: "closed", message: "Inscriptions Closes" };
      } else if (daysUntilDeadline <= 3) {
        return { type: "urgent", message: `⏳ Fin dans ${daysUntilDeadline} jour${daysUntilDeadline > 1 ? "s" : ""}` };
      }
      return null;
    } catch (e) {
      console.error("Error parsing registration deadline:", e);
      return null;
    }
  }, [registrationDeadline]);
  
  // Handle avatar click - navigate to profile
  const handleAvatarClick = (e: React.MouseEvent, participantUsername: string) => {
    e.stopPropagation();
    navigate(`/profile/${participantUsername}`);
  };
  
  // Contest status style (for user's own registration)
  const contestStatusStyle = useMemo(() => {
    if (!userContestStatus) return null;
    
    switch (userContestStatus) {
      case "pending":
        return {
          borderColor: "border-amber-400",
          bgColor: "bg-amber-400/20",
          glowColor: "shadow-[0_0_20px_rgba(251,146,60,0.4)]",
          badgeBg: "bg-amber-400/30",
          badgeText: "text-amber-900",
          icon: "⏳",
          label: "Candidature en examen",
        };
      case "approved":
        return {
          borderColor: "border-green-400",
          bgColor: "bg-green-500/20",
          glowColor: "shadow-[0_0_20px_rgba(74,222,128,0.4)]",
          badgeBg: "bg-green-500/30",
          badgeText: "text-green-900",
          icon: "✅",
          label: "Inscription Validée",
        };
      case "rejected":
        return {
          borderColor: "border-red-400",
          bgColor: "bg-red-500/20",
          glowColor: "shadow-[0_0_20px_rgba(248,113,113,0.4)]",
          badgeBg: "bg-red-500/30",
          badgeText: "text-red-900",
          icon: "❌",
          label: "Candidature Refusée",
        };
      case "waitlist":
        return {
          borderColor: "border-blue-500",
          bgColor: "bg-blue-500/20",
          glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
          badgeBg: "bg-blue-500",
          badgeText: "text-white",
          icon: "ℹ️",
          label: "Sur liste d'attente",
        };
      default:
        return null;
    }
  }, [userContestStatus]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <div
        onClick={onCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onCardClick();
          }
        }}
        className={cn(
          "group relative rounded-xl border transition-all duration-300 cursor-pointer",
          "hover:shadow-lg hover:shadow-[hsl(var(--mp-primary))]/20",
          contestStatusStyle
            ? `${contestStatusStyle.borderColor} ${contestStatusStyle.bgColor} ${contestStatusStyle.glowColor} border-2`
            : isLive
              ? "bg-[hsl(var(--mp-primary))]/5 border-[hsl(var(--mp-primary))]/50 shadow-[0_0_20px_rgba(255,0,127,0.3)] ring-1 ring-[hsl(var(--mp-primary))]/30"
              : isFavorite
                ? "bg-sakura/5 border-sakura/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                : "bg-card/80 border-white/10 hover:border-white/20 hover:bg-card/90"
        )}
      >
        {/* LIVE Badge */}
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2.5 right-4 z-10"
          >
            <Badge className="bg-[hsl(var(--mp-primary))] text-white border-0 shadow-[0_0_12px_rgba(255,0,127,0.6)] gap-1.5 px-3 py-0.5 text-xs font-bold animate-pulse">
              <Radio className="w-3 h-3" />
              EN DIRECT
            </Badge>
          </motion.div>
        )}
        
        {/* Contest Status Badge (for user's own registration) */}
        {contestStatusStyle && !isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2.5 right-4 z-10"
          >
            <Badge className={cn(
              "border-0 gap-1.5 px-3 py-0.5 text-xs font-bold",
              contestStatusStyle.badgeBg,
              contestStatusStyle.badgeText,
              contestStatusStyle.glowColor
            )}>
              <span>{contestStatusStyle.icon}</span>
              {contestStatusStyle.label}
            </Badge>
          </motion.div>
        )}

        {/* Main Content - Chronological Layout: Time → Icon → Content → Action */}
        <div className="flex flex-row items-start w-full gap-4 md:gap-6 p-3 md:p-4">
          {/* BLOC 1: TIME (Fixed width ~80px, text-right) */}
          <div className="flex flex-col items-end text-right shrink-0 w-20 relative">
            <span className={cn("font-display font-bold text-lg md:text-xl leading-tight", isLive ? "text-[hsl(var(--mp-primary))]" : "text-foreground")}>
              {time}
            </span>
            {endTime && (
              <span className="text-xs text-muted-foreground mt-0.5">{endTime}</span>
            )}
            
            {/* Timeline Connector - Subtle vertical line */}
            <div className="absolute -bottom-3 right-0 w-px h-3 bg-gradient-to-b from-white/20 to-transparent" />
          </div>

          {/* BLOC 2: ICON (Colorful square, aligned to top) */}
          <div className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden mt-1",
            "border transition-all duration-300",
            colorConfig.bg,
            colorConfig.border,
            "group-hover:shadow-[0_0_12px_rgba(255,0,127,0.2)]"
          )}>
            {image_url ? (
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <IconComponent className={cn("w-6 h-6 md:w-7 md:h-7", colorConfig.text)} />
            )}
          </div>

          {/* BLOC 3: CONTENT (Flexible - Takes remaining space) */}
          <div className="flex-1 min-w-0 flex flex-col items-start text-left pt-1">
            {/* Ligne 1: Titre + Badge */}
            <div className="flex items-center gap-2 flex-wrap mb-1 w-full">
              <h4 className={cn(
                "font-bold text-base md:text-lg uppercase tracking-tight",
                isLive ? "text-[hsl(var(--mp-primary))]" : "text-foreground"
              )}>
                {title}
              </h4>
              {hasRegistrationBadge && (
                <Badge variant="secondary" className="text-xs shrink-0 gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  🎟️ Inscription
                </Badge>
              )}
              
              {/* Registration Deadline Badge */}
              {registrationStatus && (
                <Badge
                  className={cn(
                    "text-xs shrink-0 gap-1 font-semibold",
                    registrationStatus.type === "closed"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse"
                  )}
                >
                  {registrationStatus.type === "closed" ? "🚫" : "⏳"} {registrationStatus.message}
                </Badge>
              )}
            </div>

            {/* Ligne 2: Lieu */}
            {location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}

            {/* Social Proof - Participants (Always show if count > 0 OR if contest with contestants) */}
            {(participantCount > 0 || (isContest && approvedContestantsCount > 0)) && (
              <div className="flex items-center mt-2 relative z-10" onClick={(e) => e.stopPropagation()}>
                {realSpectators && realSpectators.length > 0 ? (
                  <>
                    {/* Avatars Stack - Only show spectators (not contestants) */}
                    {realSpectators.slice(0, 5).map((participant, index) => {
                      // Safely get first character of name
                      const firstChar = participant?.name ? participant.name.charAt(0).toUpperCase() : "?";
                      // Extract username from participant (assuming it has a username or id field)
                      const participantUsername = participant.username || participant.id || "";
                      
                      return (
                        <button
                          key={participant.id}
                          onClick={(e) => handleAvatarClick(e, participantUsername)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-gradient-to-br from-sakura to-purple-600 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-[hsl(var(--mp-primary))] hover:z-10 transition-all cursor-pointer",
                            index > 0 && "-ml-2"
                          )}
                          title={participant.name || "Participant"}
                        >
                          {participant.avatarUrl ? (
                            <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
                          ) : (
                            firstChar
                          )}
                        </button>
                      );
                    })}
                    {spectatorCount > 5 && (
                      <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-foreground -ml-2">
                        +{spectatorCount - 5}
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback: Show icon if no avatars but count > 0 */
                  isContest && approvedContestantsCount > 0 ? null : <Users className="w-4 h-4 text-muted-foreground mr-1" />
                )}
                
                {/* Double Counter for Contests: Contestants | Spectators */}
                {isContest ? (
                  <div className="flex items-center gap-2 ml-2">
                    {/* Contestants Count (Gold) */}
                    {approvedContestantsCount > 0 && (
                      <span className="text-xs font-bold text-[hsl(var(--mp-saffron))] flex items-center gap-1">
                        🏆 {approvedContestantsCount} Candidat{approvedContestantsCount > 1 ? "s" : ""}
                      </span>
                    )}
                    
                    {/* Separator */}
                    {approvedContestantsCount > 0 && spectatorCount > 0 && (
                      <span className="text-muted-foreground/50">•</span>
                    )}
                    
                    {/* Spectators Count (Gray) */}
                    {spectatorCount > 0 && (
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        👤 {spectatorCount} Spectateur{spectatorCount > 1 ? "s" : ""}
                      </span>
                    )}
                    
                    {/* Fallback if no one */}
                    {approvedContestantsCount === 0 && spectatorCount === 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        Aucun participant
                      </span>
                    )}
                  </div>
                ) : (
                  /* Standard Participant Count for non-contests */
                  <span className="text-xs text-muted-foreground font-medium ml-2">
                    {participantCount} participant{participantCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BLOC 3: ACTION (Droite - Ancré avec ml-auto) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFavoriteClick}
            className="shrink-0 md:ml-auto md:pl-2"
          >
            <Button
              size="icon"
              variant="ghost"
              disabled={isToggling}
              className={cn(
                "h-11 w-11 md:h-10 md:w-10 transition-all duration-300",
                isFavorite
                  ? "text-[hsl(var(--mp-primary))] hover:text-[hsl(var(--mp-primary))]/80 bg-[hsl(var(--mp-primary))]/10"
                  : "text-muted-foreground hover:text-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/10"
              )}
            >
              {isFavorite ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <BookmarkCheck className="w-5 h-5 fill-[hsl(var(--mp-primary))]" />
                </motion.div>
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

ActivityCardComponent.displayName = "ActivityCard";

export default ActivityCardComponent;
