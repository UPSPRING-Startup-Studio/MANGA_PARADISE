import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Users,
  Loader2,
  Filter,
  Palette,
  Heart,
  User,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEventParticipants, EventParticipant, AttendanceDetail } from "@/hooks/useEventParticipants";
import { useFriendIds } from "@/hooks/useFriendships";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ScheduleDay } from "@/hooks/useEvents";
import { useDayCosplays, getCosplayForDay } from "@/hooks/useDayCosplays";

interface LineUpGridProps {
  eventId: string;
  className?: string;
  eventSchedule?: ScheduleDay[];
}

type FilterType = "all" | "cosplay" | "volunteer" | "visitor";

const filterOptions: { value: FilterType; label: string; emoji: string }[] = [
  { value: "all", label: "Tous", emoji: "👥" },
  { value: "cosplay", label: "Cosplayeurs", emoji: "🎭" },
  { value: "volunteer", label: "Bénévoles", emoji: "🛡️" },
  { value: "visitor", label: "Visiteurs", emoji: "👤" },
];

const roleBadges: Record<string, { emoji: string; label: string; color: string }> = {
  visitor: { emoji: "👤", label: "Visiteur", color: "bg-muted text-muted-foreground" },
  volunteer: { emoji: "🛡️", label: "Bénévole", color: "bg-turquoise/90 text-tokyo-night" },
  exhibitor: { emoji: "🎪", label: "Exposant", color: "bg-accent/90 text-tokyo-night" },
  cosplayer: { emoji: "🎭", label: "Cosplayeur", color: "bg-sakura/90 text-white" },
};

// Day colors for multi-day events
const dayColors = [
  { bg: "bg-pink-500", border: "ring-pink-500", text: "text-pink-500", hover: "hover:bg-pink-500/90" },
  { bg: "bg-cyan-500", border: "ring-cyan-500", text: "text-cyan-500", hover: "hover:bg-cyan-500/90" },
  { bg: "bg-violet-500", border: "ring-violet-500", text: "text-violet-500", hover: "hover:bg-violet-500/90" },
  { bg: "bg-amber-500", border: "ring-amber-500", text: "text-amber-500", hover: "hover:bg-amber-500/90" },
  { bg: "bg-emerald-500", border: "ring-emerald-500", text: "text-emerald-500", hover: "hover:bg-emerald-500/90" },
];

interface DisplayItem {
  participant: EventParticipant;
  date: string;
  role: string;
  cosplayId: string | null;
  dayIndex: number;
}

interface CharacterCardProps {
  participant: EventParticipant;
  isFriend: boolean;
  index: number;
  cosplayInfo: {
    characterName: string;
    universe: string;
    imageUrl?: string;
  } | null;
  dayRole: string;
  dayLabel: string | null;
  dayColor: { bg: string; border: string; text: string; hover: string } | null;
}

const CharacterCard = ({
  participant,
  isFriend,
  index,
  cosplayInfo,
  dayRole,
  dayLabel,
  dayColor,
}: CharacterCardProps) => {
  const hasCosplay = !!cosplayInfo;
  const isCosplayer = dayRole === "cosplayer" || hasCosplay;
  const displayName = participant.user?.display_name || participant.user?.username || "Participant";

  // Use cosplay image if available, otherwise avatar
  const imageUrl = cosplayInfo?.imageUrl || participant.user?.avatar_url;

  const roleInfo = roleBadges[dayRole] || roleBadges["visitor"];

  const tooltipText = hasCosplay && cosplayInfo
    ? `${displayName} incarnera ${cosplayInfo.characterName}${cosplayInfo.universe ? ` (${cosplayInfo.universe})` : ""}`
    : `${displayName} participe en tant que ${roleInfo.label.toLowerCase()}`;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            className={cn(
              "relative group cursor-pointer",
              "aspect-[3/4] rounded-2xl overflow-hidden",
              "transition-all duration-300",
              dayColor
                ? `ring-2 ${dayColor.border}`
                : isCosplayer
                  ? "border-2 border-sakura shadow-glow-pink hover:border-sakura/80"
                  : "border-2 border-muted-foreground/30 hover:border-turquoise/50"
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
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <span className="text-4xl">
                    {hasCosplay ? "🎭" : "👤"}
                  </span>
                </div>
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Nakama badge */}
            {isFriend && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2"
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

            {/* Day label badge */}
            {dayLabel && (
              <div className="absolute bottom-12 left-2 right-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-display px-2 py-0.5 w-full text-center",
                    dayColor ? `${dayColor.bg} text-white` : "bg-muted/80 text-foreground"
                  )}
                >
                  {dayLabel}
                </Badge>
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-display text-sm text-white truncate tracking-wide">
                {displayName}
              </p>
              {hasCosplay && cosplayInfo && (
                <p className="text-xs text-white/70 truncate mt-0.5">
                  → {cosplayInfo.characterName}
                </p>
              )}
            </div>

            {/* Hover glow effect */}
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-t",
                isCosplayer ? "from-sakura/20" : "from-turquoise/20",
                "to-transparent pointer-events-none"
              )}
            />
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

const LineUpGrid = ({ eventId, className, eventSchedule }: LineUpGridProps) => {
  const { user } = useAuth();
  const { data: participants = [], isLoading } = useEventParticipants(eventId);
  const { data: friendIds = [] } = useFriendIds(user?.id);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Fetch all cosplays referenced in attendance_details
  const { data: cosplayMap = {} } = useDayCosplays(participants);

  // Determine if multi-day event
  const isMultiDay = eventSchedule && eventSchedule.length > 1;

  // Get current selected date string
  const selectedDate = selectedDayIndex !== null && eventSchedule
    ? eventSchedule[selectedDayIndex].date
    : null;

  // Get current day color
  const currentDayColor = selectedDayIndex !== null ? dayColors[selectedDayIndex % dayColors.length] : null;

  // Calculate stats
  const stats = useMemo(() => {
    const total = participants.length;
    const cosplayers = participants.filter(p => p.role === "cosplayer").length;
    const volunteers = participants.filter(p => p.role === "volunteer").length;
    const visitors = participants.filter(p => p.role === "visitor").length;

    return { total, cosplayers, volunteers, visitors };
  }, [participants]);

  // Build flattened display items: one entry per day-participation
  // Uses attendance_dates (new format) with fallback to attendance_details (legacy)
  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = [];

    for (const participant of participants) {
      // NEW FORMAT: Use attendance_dates + cosplay_data
      const attendanceDates = participant.attendance_dates as string[] | null;
      const cosplayData = participant.cosplay_data as Array<{
        character: string;
        universe: string;
        imageUrl?: string;
        cosplayId: string;
      }> | null;

      if (Array.isArray(attendanceDates) && attendanceDates.length > 0 && eventSchedule) {
        for (const date of attendanceDates) {
          const dayIdx = eventSchedule.findIndex(s => s.date === date);
          const cosplayId = cosplayData && cosplayData.length > 0 ? cosplayData[0].cosplayId : null;
          items.push({
            participant,
            date,
            role: participant.role || "visitor",
            cosplayId,
            dayIndex: dayIdx >= 0 ? dayIdx : 0,
          });
        }
      } else {
        // Fallback: single entry (for single-day events or missing attendance_dates)
        const cosplayId = cosplayData && cosplayData.length > 0 ? cosplayData[0].cosplayId : null;
        items.push({
          participant,
          date: eventSchedule?.[0]?.date || "",
          role: participant.role || "visitor",
          cosplayId,
          dayIndex: 0,
        });
      }
    }

    return items;
  }, [participants, eventSchedule]);

  // Filter display items by role and day
  const filteredDisplayItems = useMemo(() => {
    let filtered = [...displayItems];

    // Filter by role
    switch (activeFilter) {
      case "cosplay":
        filtered = filtered.filter(item => item.role === "cosplayer" || item.cosplayId);
        break;
      case "volunteer":
        filtered = filtered.filter(item => item.role === "volunteer");
        break;
      case "visitor":
        filtered = filtered.filter(item => item.role === "visitor" && !item.cosplayId);
        break;
    }

    // Filter by day if a specific day is selected
    if (selectedDate) {
      filtered = filtered.filter(item => item.date === selectedDate);
    }

    // Default sort: friends first, then cosplayers, then by registration date
    filtered = filtered.sort((a, b) => {
      const aIsFriend = friendIds.includes(a.participant.user_id);
      const bIsFriend = friendIds.includes(b.participant.user_id);
      const aHasCosplay = !!a.cosplayId || a.role === "cosplayer";
      const bHasCosplay = !!b.cosplayId || b.role === "cosplayer";

      if (aIsFriend && !bIsFriend) return -1;
      if (bIsFriend && !aIsFriend) return 1;
      if (aHasCosplay && !bHasCosplay) return -1;
      if (bHasCosplay && !aHasCosplay) return 1;
      return 0;
    });

    return filtered;
  }, [displayItems, activeFilter, friendIds, selectedDate]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-16", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  // Empty state
  if (participants.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
      >
        <div className="mb-6 relative">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl"
          >
            🌪️
          </motion.div>
        </div>
        <h3 className="font-display text-2xl text-foreground mb-2">
          Le calme avant la tempête...
        </h3>
        <p className="text-muted-foreground font-body mb-6 max-w-md">
          Aucun participant inscrit pour le moment. Sois le premier à rejoindre l'aventure !
        </p>
        <Button
          className="bg-gradient-to-r from-sakura to-otk hover:opacity-90 text-white font-display gap-2"
          size="lg"
        >
          <Zap className="w-5 h-5" />
          Je participe !
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with stats */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-display text-2xl text-foreground flex items-center gap-2">
            <span className="text-2xl">🎌</span>
            Visual Line-Up
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="border-turquoise/50">
              {stats.total} Participant{stats.total > 1 ? "s" : ""}
            </Badge>
            {stats.cosplayers > 0 && (
              <Badge variant="outline" className="border-sakura/50 text-sakura">
                🎭 {stats.cosplayers} Cosplayeur{stats.cosplayers > 1 ? "s" : ""}
              </Badge>
            )}
            {stats.volunteers > 0 && (
              <Badge variant="outline" className="border-turquoise/50 text-turquoise">
                🛡️ {stats.volunteers} Bénévole{stats.volunteers > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Day Filters - Only for multi-day events */}
        {isMultiDay && eventSchedule && (
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={selectedDayIndex === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDayIndex(null)}
              className={cn(
                "gap-1.5 transition-all",
                selectedDayIndex === null
                  ? "bg-turquoise hover:bg-turquoise/90 text-tokyo-night"
                  : "hover:border-turquoise/50"
              )}
            >
              Tous les jours
            </Button>
            {eventSchedule.map((day, idx) => {
              const dayDate = parseISO(day.date);
              const dayColor = dayColors[idx % dayColors.length];
              const isSelected = selectedDayIndex === idx;
              return (
                <Button
                  key={day.date}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={cn(
                    "gap-1.5 transition-all font-medium",
                    isSelected
                      ? `${dayColor.bg} ${dayColor.hover} text-white`
                      : `hover:border-current ${dayColor.text}`
                  )}
                >
                  <span className="capitalize">
                    {format(dayDate, "EEE d", { locale: fr })}
                  </span>
                </Button>
              );
            })}
          </div>
        )}

        {/* Role Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          {filterOptions.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "gap-1.5 transition-all",
                activeFilter === filter.value
                  ? "bg-sakura hover:bg-sakura/90 text-white"
                  : "hover:border-sakura/50"
              )}
            >
              <span className="text-sm">{filter.emoji}</span>
              <span className="hidden sm:inline">{filter.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Participants Grid - Portrait Cards */}
      {filteredDisplayItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {activeFilter === "all" && selectedDayIndex === null
              ? "Aucun participant inscrit pour le moment"
              : `Aucun participant trouvé avec ces filtres`}
          </p>
          {activeFilter === "all" && selectedDayIndex === null && (
            <p className="text-sm text-muted-foreground/70 mt-1">
              Sois le premier à rejoindre l'aventure !
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredDisplayItems.map((item, index) => {
              const { participant, date, role, cosplayId, dayIndex } = item;

              // NEW: Get cosplay from cosplay_data (Phase 2 format)
              const cosplayData = participant.cosplay_data as Array<{
                character: string;
                universe: string;
                imageUrl?: string;
                cosplayId: string;
              }> | null;

              // Fallback: Get cosplay from map (legacy format)
              const dayCosplay = cosplayId ? cosplayMap[cosplayId] : null;

              // Format day label for this specific item
              const itemDayLabel = eventSchedule && eventSchedule[dayIndex]
                ? format(parseISO(eventSchedule[dayIndex].date), "EEE d", { locale: fr })
                : null;

              // Get day color for this item
              const itemDayColor = dayColors[dayIndex % dayColors.length];

              // Build cosplay display info from cosplay_data (NEW) or cosplayMap (OLD)
              const cosplayDisplayInfo = cosplayData && cosplayData.length > 0 ? {
                characterName: cosplayData[0].character,
                universe: cosplayData[0].universe,
                imageUrl: cosplayData[0].imageUrl,
              } : dayCosplay ? {
                characterName: dayCosplay.character_name,
                universe: dayCosplay.universe,
                imageUrl: dayCosplay.user_image_url,
              } : null;

              return (
                <CharacterCard
                  key={`${participant.id}-${date}-${index}`}
                  participant={participant}
                  isFriend={friendIds.includes(participant.user_id)}
                  index={index}
                  cosplayInfo={cosplayDisplayInfo}
                  dayRole={role}
                  dayLabel={itemDayLabel}
                  dayColor={selectedDate || selectedDayIndex !== null ? currentDayColor : itemDayColor}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default LineUpGrid;
