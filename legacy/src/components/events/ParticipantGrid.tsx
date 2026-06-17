import { useState, useMemo, forwardRef } from "react";
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
  Search
} from "lucide-react";
import { PhotoHuntButton } from "./PhotoHuntButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useEventParticipants, EventParticipant } from "@/hooks/useEventParticipants";
import { useFriendIds } from "@/hooks/useFriendships";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ScheduleDay } from "@/hooks/useEvents";
import { useDayCosplays } from "@/hooks/useDayCosplays";
import { AttendanceDetail } from "@/hooks/useEventParticipants";

interface ParticipantGridProps {
  eventId: string;
  className?: string;
  eventSchedule?: ScheduleDay[];
}

type FilterType = "all" | "cosplay" | "volunteer" | "visitor";

const filterOptions: { value: FilterType; label: string; emoji: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Tous", emoji: "👥", icon: <Users className="w-4 h-4" /> },
  { value: "cosplay", label: "Cosplayeurs", emoji: "🎭", icon: <Palette className="w-4 h-4" /> },
  { value: "volunteer", label: "Bénévoles", emoji: "🛡️", icon: <Heart className="w-4 h-4" /> },
  { value: "visitor", label: "Visiteurs", emoji: "👤", icon: <User className="w-4 h-4" /> },
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

// No mock data - display real participants only

const ParticipantGrid = ({ eventId, className, eventSchedule }: ParticipantGridProps) => {
  const { user } = useAuth();
  const { data: participants = [], isLoading } = useEventParticipants(eventId);
  const { data: friendIds = [] } = useFriendIds(user?.id);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  
  // Display item interface for flattened view
  interface DisplayItem {
    participant: EventParticipant;
    date: string;
    role: string;
    cosplayId: string | null;
    dayIndex: number;
  }

  // Calculate stats - real data only, no mocks
  const stats = useMemo(() => {
    const total = participants.length;
    const cosplayers = participants.filter(p => p.role === "cosplayer").length;
    const volunteers = participants.filter(p => p.role === "volunteer").length;
    const visitors = participants.filter(p => p.role === "visitor").length;

    return { total, cosplayers, volunteers, visitors };
  }, [participants]);

  // Build flattened display items: one entry per day-participation
  // NEW: Use attendance_dates and cosplay_data instead of attendance_details
  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = [];

    for (const participant of participants) {
      // Try new format first (attendance_dates + cosplay_data)
      const attendanceDates = participant.attendance_dates as string[] | null;
      const cosplayData = participant.cosplay_data as Array<{
        character: string;
        universe: string;
        imageUrl?: string;
        cosplayId: string;
      }> | null;
      
      // Fallback to old format (attendance_details)
      const attendanceDetails = participant.attendance_details as AttendanceDetail[] | null;
      
      if (Array.isArray(attendanceDates) && attendanceDates.length > 0 && eventSchedule) {
        // NEW FORMAT: Use attendance_dates
        for (const date of attendanceDates) {
          const dayIdx = eventSchedule.findIndex(s => s.date === date);
          // Get cosplay for this participant (if any)
          const cosplayId = cosplayData && cosplayData.length > 0 ? cosplayData[0].cosplayId : null;
          
          items.push({
            participant,
            date,
            role: participant.role || "visitor",
            cosplayId,
            dayIndex: dayIdx >= 0 ? dayIdx : 0,
          });
        }
      } else if (Array.isArray(attendanceDetails) && attendanceDetails.length > 0 && eventSchedule) {
        // OLD FORMAT: Use attendance_details (backward compatibility)
        for (const detail of attendanceDetails) {
          const dayIdx = eventSchedule.findIndex(s => s.date === detail.date);
          items.push({
            participant,
            date: detail.date,
            role: detail.role || participant.role || "visitor",
            cosplayId: detail.cosplay_id || null,
            dayIndex: dayIdx >= 0 ? dayIdx : 0,
          });
        }
      } else {
        // Fallback: single entry with default data (for single-day events or missing data)
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

  // Filter display items by role, day, and search query
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

    // NEW: Filter by search query (participant name, character name, universe)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const displayName = (item.participant.user?.display_name || item.participant.user?.username || "").toLowerCase();
        
        // Get cosplay info from cosplay_data
        const cosplayData = item.participant.cosplay_data as Array<{
          character: string;
          universe: string;
        }> | null;
        
        const characterName = cosplayData && cosplayData.length > 0 ? cosplayData[0].character.toLowerCase() : "";
        const universe = cosplayData && cosplayData.length > 0 ? cosplayData[0].universe.toLowerCase() : "";
        
        return displayName.includes(query) || characterName.includes(query) || universe.includes(query);
      });
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
  }, [displayItems, activeFilter, friendIds, selectedDate, selectedDayIndex, searchQuery]);

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

        {/* NEW: Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un participant, personnage ou univers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/40 backdrop-blur-md border-white/10 focus:border-[hsl(var(--mp-info))] transition-colors"
          />
        </div>
      </div>

      {/* Loading State - After Header */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <Loader2 className="w-8 h-8 animate-spin text-sakura" />
        </motion.div>
      )}

      {/* Participants Grid - Portrait Cards */}
      {!isLoading && (
        <>
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
                  
                  // Fallback: Get cosplay from map using the specific cosplayId for this day (old format)
                  const dayCosplay = cosplayId ? cosplayMap[cosplayId] : null;
                  
                  // Format day label for this specific item
                  const itemDayLabel = eventSchedule && eventSchedule[dayIndex]
                    ? format(parseISO(eventSchedule[dayIndex].date), "EEE d", { locale: fr })
                    : null;
                  
                  // Get day color for this item
                  const itemDayColor = dayColors[dayIndex % dayColors.length];
                  
                  // Build cosplay display info from cosplay_data (NEW) or dayCosplay (OLD)
                  const cosplayDisplayInfo = cosplayData && cosplayData.length > 0 ? {
                    characterName: cosplayData[0].character,
                    universe: cosplayData[0].universe,
                    imageUrl: cosplayData[0].imageUrl,
                    role: role,
                  } : dayCosplay ? {
                    characterName: dayCosplay.character_name,
                    universe: dayCosplay.universe,
                    imageUrl: dayCosplay.user_image_url,
                    role: role,
                  } : null;

                  return (
                    <ParticipantCard
                      key={`${participant.id}-${date}-${index}`}
                      participant={participant}
                      isFriend={friendIds.includes(participant.user_id)}
                      index={index}
                      cosplayInfo={cosplayDisplayInfo}
                      dayRole={role}
                      dayLabel={itemDayLabel}
                      dayColor={selectedDate || selectedDayIndex !== null ? currentDayColor : itemDayColor}
                      isPhotographer={role === "photographer"}
                    />
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

// Individual Participant Card - Portrait Style
interface ParticipantCardProps {
  participant: EventParticipant;
  isFriend: boolean;
  index: number;
  cosplayInfo: { 
    characterName: string; 
    universe: string; 
    imageUrl?: string;
    role: string;
  } | null;
  dayRole: string;
  dayLabel: string | null;
  dayColor: { bg: string; border: string; text: string; hover: string } | null;
  isPhotographer?: boolean;
}

const ParticipantCard = forwardRef<HTMLDivElement, ParticipantCardProps>(({ 
  participant, 
  isFriend, 
  index, 
  cosplayInfo, 
  dayRole,
  dayLabel,
  dayColor,
  isPhotographer = false
}, ref) => {
  const hasCosplay = !!cosplayInfo;
  const isCosplayer = dayRole === "cosplayer" || hasCosplay;
  const displayName = participant.user?.display_name || participant.user?.username || "Participant";
  
  // Use cosplay image if available, otherwise avatar
  const imageUrl = cosplayInfo?.imageUrl 
    || participant.user?.avatar_url;

  // Special badge for photographers
  const roleInfo = isPhotographer 
    ? { emoji: "📷", label: "Photographe", color: "bg-amber-500/90 text-white" }
    : roleBadges[dayRole] || roleBadges["visitor"];

  const tooltipText = isPhotographer
    ? `${displayName} sera présent en tant que photographe`
    : hasCosplay && cosplayInfo
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
              // Day-colored ring when filtering by day
              dayColor 
                ? `ring-2 ${dayColor.border} shadow-lg`
                : isCosplayer 
                  ? "ring-2 ring-sakura/70 shadow-[0_0_20px_rgba(255,107,107,0.3)] hover:shadow-[0_0_30px_rgba(255,107,107,0.5)]" 
                  : "border-2 border-muted-foreground/20 hover:border-turquoise/50"
            )}
          >
            {/* Background image */}
            <div className="absolute inset-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sakura/20 via-background to-turquoise/20 flex items-center justify-center">
                  <span className="text-5xl">
                    {isCosplayer ? "🎭" : "👤"}
                  </span>
                </div>
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Role Badge - Top Left */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.03 + 0.1 }}
              className="absolute top-2 left-2"
            >
              <Badge 
                className={cn(
                  "text-[10px] font-display px-2 py-0.5 shadow-lg",
                  roleInfo.color
                )}
              >
                {roleInfo.emoji}
              </Badge>
            </motion.div>

            {/* Photo Hunt Button - Top Right (floating, always visible on hover) */}
            <PhotoHuntButton
              participantId={participant.id}
              participantName={displayName}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />

            {/* Nakama badge - Top Right (shifted down when Photo Hunt button is present) */}
            {isFriend && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.03 + 0.15 }}
                className="absolute top-10 right-2"
              >
                <Badge
                  className="bg-accent/90 text-tokyo-night text-[10px] font-display px-2 py-0.5 shadow-lg"
                >
                  ⭐
                </Badge>
              </motion.div>
            )}


            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-display text-sm text-white truncate drop-shadow-lg">
                {displayName}
              </p>
              {hasCosplay && cosplayInfo && (
                <p className={cn(
                  "text-xs truncate mt-0.5 flex items-center gap-1",
                  dayColor ? dayColor.text : "text-sakura/90"
                )}>
                  <span>→</span>
                  <span className="font-medium">{cosplayInfo.characterName}</span>
                </p>
              )}
              {!hasCosplay && dayRole !== "visitor" && (
                <p className="text-xs text-white/60 truncate mt-0.5">
                  {roleInfo.label}
                </p>
              )}
              
              {/* Day label badge */}
              {dayLabel && (
                <div className={cn(
                  "mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-medium",
                  dayColor ? `${dayColor.bg} text-white` : "bg-muted text-muted-foreground"
                )}>
                  {dayLabel}
                </div>
              )}
            </div>

            {/* Hover glow effect */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-t pointer-events-none",
              isCosplayer ? "from-sakura/20" : "from-turquoise/15",
              "to-transparent"
            )} />

            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-card border-sakura/30 text-foreground font-body max-w-xs"
        >
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ParticipantCard.displayName = "ParticipantCard";

export default ParticipantGrid;
