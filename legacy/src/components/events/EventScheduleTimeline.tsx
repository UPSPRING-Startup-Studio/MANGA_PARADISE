import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Clock, Bookmark, BookmarkCheck, Users, ChevronDown, ChevronUp,
  Mic2, Camera, Gamepad2, Drama, Music, Coffee, ShoppingBag, Award,
  Film, Palette, Globe, Dumbbell, Plane, Sparkles, MapPin, Radio, X, ExternalLink
} from "lucide-react";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useActivityParticipation } from "@/hooks/useActivityParticipation";
import { useApprovedContestants } from "@/hooks/useApprovedContestants";
import { useUserContestRegistrations } from "@/hooks/useUserContestRegistrations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import ParticipantStack from "./ParticipantStack";
import ActivityCard from "./ActivityCard";
import CosplayRegistrationModal, { type ContestConfig } from "./CosplayRegistrationModal";
import { ContestRegistrationButton } from "./ContestRegistrationButton";

export interface ScheduleSlot {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  type: "panel" | "concert" | "gaming" | "cosplay" | "meetup" | "workshop" | "shopping" | "contest" | "other";
  category?: string;
  location?: string;
  description?: string;
  day?: string; // e.g., "2025-01-25"
  image_url?: string; // Optional illustration image
  activity_image_url?: string; // Banner image (3:1 ratio, 1500x500px)
  external_link?: string; // External registration/info link
  contest_config?: ContestConfig | null; // Contest configuration from admin
  registration_deadline?: string; // ISO date string (YYYY-MM-DD) for registration deadline
}

export interface FriendParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ScheduleDay {
  date: string;
  label: string;
}

interface EventScheduleTimelineProps {
  schedule: ScheduleSlot[];
  eventDate: string;
  eventEndDate?: string;
  scheduleDays?: ScheduleDay[];
  eventId?: string;
  favoriteSlots?: string[]; // Legacy prop - now optional
  onToggleFavorite?: (slotId: string) => void; // Legacy prop - now optional
  friendsPerSlot?: Record<string, FriendParticipant[]>;
  participantsPerSlot?: Record<string, number>;
}

// Category filter configuration - includes both legacy and admin categories
const categoryFilters = [
  { id: "all", label: "Tout", icon: Sparkles, color: "bg-white/10 text-white" },
  { id: "animation", label: "Animation", icon: Sparkles, color: "bg-purple-500/20 text-purple-400" },
  { id: "conference", label: "Conférence", icon: Mic2, color: "bg-blue-500/20 text-blue-400" },
  { id: "meet_greet", label: "Meet & Greet", icon: Users, color: "bg-cyan-500/20 text-cyan-400" },
  { id: "concert", label: "Concert", icon: Music, color: "bg-pink-500/20 text-pink-400" },
  { id: "gaming", label: "Jeux Vidéo", icon: Gamepad2, color: "bg-green-500/20 text-green-400" },
  { id: "cosplay", label: "Cosplay", icon: Drama, color: "bg-sakura/20 text-sakura" },
  { id: "workshop", label: "Atelier", icon: Award, color: "bg-amber-500/20 text-amber-400" },
  { id: "contest", label: "Concours", icon: Award, color: "bg-orange-500/20 text-orange-400" },
  { id: "screening", label: "Projection", icon: Film, color: "bg-indigo-500/20 text-indigo-400" },
  { id: "other", label: "Autre", icon: Coffee, color: "bg-gray-500/20 text-gray-400" },
];

// Helper: check if a slot is currently live
const isSlotLive = (slot: ScheduleSlot, eventDate: string): boolean => {
  const now = new Date();
  const slotDay = slot.day || eventDate;
  const today = format(now, "yyyy-MM-dd");
  
  // Only check if the slot is today
  if (slotDay !== today) return false;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Parse start time
  const [startH, startM] = slot.time.split(":").map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  
  // Parse end time (default: start + 60 min)
  let endMinutes = startMinutes + 60;
  if (slot.endTime) {
    const [endH, endM] = slot.endTime.split(":").map(Number);
    endMinutes = endH * 60 + (endM || 0);
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Helper: get readable category label with emoji
const getCategoryLabel = (category?: string): string => {
  const categoryMap: Record<string, string> = {
    animation: "✨ Animation",
    conference: "🎤 Conférence",
    meet_greet: "🤝 Meet & Greet",
    concert: "🎵 Concert",
    gaming: "🎮 Jeux Vidéo",
    cosplay: "🎭 Cosplay",
    workshop: "🛠️ Atelier",
    contest: "🏆 Concours",
    screening: "🎬 Projection",
    other: "☕ Autre",
  };
  return categoryMap[category || "other"] || "☕ Autre";
};

// Memoized component for activity detail action button
const ActivityDetailActionButton = memo(({ 
  slotId, 
  isFavorite, 
  isToggling, 
  onToggle 
}: {
  slotId: string;
  isFavorite: boolean;
  isToggling: boolean;
  onToggle: () => void;
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      disabled={isToggling}
      className={cn(
        "w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
        isFavorite
          ? "bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30"
          : "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-pink-500 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)]"
      )}
    >
      {isToggling ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Mise à jour...</span>
        </>
      ) : isFavorite ? (
        <>
          <BookmarkCheck className="w-4 h-4" />
          <span>Retirer de mon programme</span>
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" />
          <span>Ajouter à mon programme</span>
        </>
      )}
    </motion.button>
  );
});

ActivityDetailActionButton.displayName = "ActivityDetailActionButton";

const slotTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  panel: { icon: Mic2, color: "text-blue-400", bg: "bg-blue-500/20" },
  concert: { icon: Music, color: "text-purple-400", bg: "bg-purple-500/20" },
  gaming: { icon: Gamepad2, color: "text-green-400", bg: "bg-green-500/20" },
  cosplay: { icon: Drama, color: "text-sakura", bg: "bg-sakura/20" },
  meetup: { icon: Users, color: "text-turquoise", bg: "bg-turquoise/20" },
  workshop: { icon: Award, color: "text-amber-400", bg: "bg-amber-500/20" },
  shopping: { icon: ShoppingBag, color: "text-pink-400", bg: "bg-pink-500/20" },
  contest: { icon: Award, color: "text-orange-400", bg: "bg-orange-500/20" },
  other: { icon: Coffee, color: "text-gray-400", bg: "bg-gray-500/20" },
};

export default function EventScheduleTimeline({
  schedule,
  eventDate,
  eventEndDate,
  scheduleDays,
  eventId,
  favoriteSlots: legacyFavoriteSlots,
  onToggleFavorite: legacyOnToggleFavorite,
  friendsPerSlot = {},
  participantsPerSlot = {},
}: EventScheduleTimelineProps) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(eventDate);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [now, setNow] = useState(new Date());
  const [selectedSlotForSheet, setSelectedSlotForSheet] = useState<ScheduleSlot | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  // Auth context
  const { user } = useAuth();

  // Use new Supabase-based favorites system
  const { isFavorite, toggleFavorite, isToggling } = useUserFavorites(eventId);
  
  // Fetch participation stats for all activities
  const { participationByActivity, refetch: refetchParticipation } = useActivityParticipation(eventId);
  
  // Fetch user's contest registrations for visual feedback
  const { data: userContestRegistrations = [] } = useUserContestRegistrations(user?.id);

  // Fetch approved contestants for the selected contest activity (for Sheet)
  const { data: approvedContestants = [] } = useApprovedContestants(
    selectedSlotForSheet?.id || null,
    !!selectedSlotForSheet && (selectedSlotForSheet.type === "contest" || selectedSlotForSheet.category?.toLowerCase() === "contest")
  );

  // Fetch ALL approved contestants for the event (for ActivityCard filtering)
  const { data: allApprovedContestants = [] } = useQuery({
    queryKey: ["allApprovedContestants", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("contest_registrations" as any)
        .select(`
          id,
          activity_id,
          user_id,
          status
        `)
        .eq("status", "approved")
        .in("activity_id", schedule.map((s) => s.id));
      
      if (error) {
        console.error("Error fetching all approved contestants:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!eventId && schedule.length > 0,
  });

  // Create a map of activity_id -> approved contestant user_ids
  const contestantsByActivity = useMemo(() => {
    const map: Record<string, { count: number; userIds: string[] }> = {};
    
    allApprovedContestants.forEach((contestant) => {
      const activityId = contestant.activity_id;
      if (!map[activityId]) {
        map[activityId] = { count: 0, userIds: [] };
      }
      map[activityId].count++;
      map[activityId].userIds.push(contestant.user_id);
    });
    
    return map;
  }, [allApprovedContestants]);


  // Update "now" every 30 seconds for live detection
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Generate days if multi-day event
  const days = useMemo(() => {
    if (scheduleDays && scheduleDays.length > 0) {
      return scheduleDays;
    }
    
    // If we have endDate, generate days between start and end
    if (eventEndDate) {
      const start = parseISO(eventDate);
      const end = parseISO(eventEndDate);
      const daysList: ScheduleDay[] = [];
      
      let current = start;
      while (current <= end) {
        daysList.push({
          date: format(current, "yyyy-MM-dd"),
          label: format(current, "EEEE d", { locale: fr }),
        });
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }
      return daysList;
    }
    
    // Single day
    return [{
      date: eventDate,
      label: format(parseISO(eventDate), "EEEE d MMMM", { locale: fr }),
    }];
  }, [eventDate, eventEndDate, scheduleDays]);

  const isMultiDay = days.length > 1;

   // Filter schedule by selected day and category
   const filteredSchedule = useMemo(() => {
     return schedule.filter((slot) => {
       let matchesDay = true;
       if (isMultiDay) {
         const slotDay = slot.day || eventDate;
         matchesDay = slotDay === selectedDay;
       }

       const matchesCategory = selectedCategory === "all" ||
         slot.category?.toLowerCase() === selectedCategory.toLowerCase() ||
         slot.type === selectedCategory;

       return matchesDay && matchesCategory;
     });
   }, [schedule, selectedDay, selectedCategory, eventDate, isMultiDay]);

   // Compute available categories dynamically based on current schedule
   const availableCategories = useMemo(() => {
     const categoriesInSchedule = new Set<string>();
     schedule.forEach((slot) => {
       const cat = slot.category?.toLowerCase() || slot.type;
       if (cat) categoriesInSchedule.add(cat);
     });
     
     // Filter categoryFilters to only show those with activities
     return categoryFilters.filter(
       (cat) => cat.id === "all" || categoriesInSchedule.has(cat.id)
     );
   }, [schedule]);

  return (
    <Card className="p-4 md:p-6 border-sakura/20 bg-card/50 backdrop-blur overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-sakura" />
          <h3 className="font-display text-lg md:text-xl">Programme Officiel</h3>
        </div>
        <Badge variant="outline" className="text-muted-foreground text-xs md:text-sm">
          {filteredSchedule.length} activité{filteredSchedule.length > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Day Tabs - Visual Line-Up Style (Pink Pills) */}
      {isMultiDay && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {days.map((day) => {
            const isSelected = selectedDay === day.date;
            return (
              <motion.button
                key={day.date}
                onClick={() => setSelectedDay(day.date)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "px-3 md:px-4 py-1.5 md:py-2 rounded-full font-medium text-xs md:text-sm capitalize transition-all duration-300",
                  isSelected
                    ? "bg-gradient-to-r from-sakura to-pink-400 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                    : "bg-white/10 border border-white/20 text-muted-foreground hover:bg-sakura/20 hover:border-sakura/40 hover:text-sakura"
                )}
              >
                {day.label}
              </motion.button>
            );
          })}
        </div>
      )}

       {/* Category Filter Chips - Horizontal Scroll - Dynamic based on available categories */}
       <div className="mb-6">
         <label className="text-xs text-muted-foreground block mb-2">Filtrer par catégorie :</label>
         <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
           {availableCategories.map((cat) => {
             const Icon = cat.icon;
             const isActive = selectedCategory === cat.id;
             
             return (
               <motion.button
                 key={cat.id}
                 onClick={() => setSelectedCategory(cat.id)}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className={cn(
                   "flex items-center gap-1.5 rounded-full px-2.5 md:px-3 py-1 md:py-1.5 text-xs font-medium transition-all shrink-0",
                   isActive
                     ? "bg-gradient-to-r from-sakura/80 to-purple-500/80 text-white shadow-md"
                     : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-white/10"
                 )}
               >
                 <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                 <span className="hidden sm:inline">{cat.label}</span>
               </motion.button>
             );
           })}
         </div>
       </div>

      {/* Schedule List */}
      <div className="space-y-2 md:space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredSchedule.map((slot, index) => {
            const isSlotFavorite = isFavorite(slot.id);
            const isLive = isSlotLive(slot, eventDate);
            
            // Get participation stats from the hook - normalize ID to lowercase
            const normalizedSlotId = String(slot.id).toLowerCase();
            const activityStats = participationByActivity[normalizedSlotId];
            const participantCount = activityStats?.participant_count || 0;
            
            // Transform participants to match ActivityCard expected format
            // Map avatar_url (from SQL) to avatarUrl (expected by component)
            const participants = (activityStats?.participants || []).map((p) => ({
              id: p.id,
              name: p.display_name || p.username,
              avatarUrl: p.avatar_url, // Map avatar_url to avatarUrl
              username: p.username,
            }));

            // Check if this is a contest activity
            const isContest = slot.type === "contest" || slot.category?.toLowerCase() === "contest";
            
            // Get approved contestants for this activity
            const activityContestants = contestantsByActivity[slot.id] || { count: 0, userIds: [] };
            
            // Check if current user has a contest registration for this activity
            const userContestReg = userContestRegistrations.find(
              (cr) => String(cr.activity_id) === String(slot.id)
            );

            return (
              <ActivityCard
                key={slot.id}
                id={slot.id}
                time={slot.time}
                endTime={slot.endTime}
                title={slot.title}
                type={slot.type}
                category={slot.category}
                location={slot.location}
                description={slot.description}
                image_url={slot.image_url}
                isLive={isLive}
                isFavorite={isSlotFavorite}
                isToggling={isToggling}
                onCardClick={() => setSelectedSlotForSheet(slot)}
                onFavoriteClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(slot.id);
                }}
                participantCount={participantCount}
                participantAvatars={participants}
                registrationDeadline={slot.contest_config?.registration_deadline}
                approvedContestantsCount={isContest ? activityContestants.count : 0}
                approvedContestantIds={isContest ? activityContestants.userIds : []}
                userContestStatus={userContestReg?.status}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {filteredSchedule.length === 0 && schedule.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Programme en cours de préparation</p>
          <p className="text-xs mt-1">Les activités seront bientôt disponibles</p>
        </div>
      )}

       {filteredSchedule.length === 0 && schedule.length > 0 && (
         <div className="text-center py-8 text-muted-foreground">
           <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
           <p>Aucune activité pour ces filtres</p>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => {
               setSelectedCategory("all");
             }}
             className="mt-2 text-sakura"
           >
             Réinitialiser les filtres
           </Button>
         </div>
       )}

       {/* Activity Details Sheet */}
       <Sheet open={!!selectedSlotForSheet} onOpenChange={(open) => !open && setSelectedSlotForSheet(null)}>
          <SheetContent className="w-full sm:max-w-[400px] flex flex-col p-0 overflow-hidden max-h-[85vh]">
            {selectedSlotForSheet && (
              <>
                {/* Hero Banner Image (Thinner - 3.5:1 ratio) */}
                {selectedSlotForSheet.activity_image_url && (
                  <div className="w-full h-32 overflow-hidden">
                    <img
                      src={selectedSlotForSheet.activity_image_url}
                      alt={selectedSlotForSheet.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content Container - Compact */}
                <div className="flex flex-col flex-1 overflow-hidden p-4">
                  <SheetHeader className="space-y-2 pb-3">
                    {/* Title - Smaller */}
                    <SheetTitle className="text-xl font-display font-bold uppercase tracking-tight leading-tight">
                      {selectedSlotForSheet.title}
                    </SheetTitle>
                    
                    {/* Time & Category - Compact */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-sakura" />
                        <span className="font-medium">
                          {selectedSlotForSheet.time}
                          {selectedSlotForSheet.endTime && ` → ${selectedSlotForSheet.endTime}`}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-medium">
                        {getCategoryLabel(selectedSlotForSheet.category)}
                      </Badge>
                    </div>
                  </SheetHeader>

                  {/* Compact Content */}
                  <div className="space-y-3 flex-1 overflow-y-auto pb-3">
                    {/* Location */}
                    {selectedSlotForSheet.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-sakura mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Lieu</p>
                          <p className="text-sm font-medium mt-0.5">{selectedSlotForSheet.location}</p>
                        </div>
                      </div>
                    )}

                    {/* Description - Compact with max height */}
                    {selectedSlotForSheet.description && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Description</p>
                        <p className="text-sm leading-snug text-muted-foreground max-h-[40vh] overflow-y-auto">{selectedSlotForSheet.description}</p>
                      </div>
                    )}

                    {/* Participants Section */}
                    {(() => {
                      const normalizedSlotId = String(selectedSlotForSheet.id).toLowerCase();
                      const activityStats = participationByActivity[normalizedSlotId];
                      const participantCount = activityStats?.participant_count || 0;
                      const participants = activityStats?.participants || [];

                      const isContest = selectedSlotForSheet.type === "contest" || selectedSlotForSheet.category?.toLowerCase() === "contest";

                      // Filter out approved contestants from the spectators list for contests
                      const filteredParticipants = isContest
                        ? participants.filter(
                            (p) => !approvedContestants.some((ac) => ac.user_id === p.id)
                          )
                        : participants;

                      const displayCount = isContest ? filteredParticipants.length : participantCount;
                      
                      // Show section if there are spectators OR if it's a contest (to show "0 spectateurs" when only contestants)
                      const shouldShowSection = displayCount > 0 || (isContest && approvedContestants.length > 0);

                      if (shouldShowSection) {
                        return (
                          <div className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                              <Users className="w-5 h-5 text-sakura" />
                              {isContest ? "Spectateurs intéressés" : "Qui participe ?"}
                            </h4>

                            {/* Résumé Social - Show count even if 0 for contests */}
                            {displayCount > 0 ? (
                              <p className="text-sm text-muted-foreground mb-4">
                                <span className="text-foreground font-bold">{displayCount} personne{displayCount > 1 ? "s" : ""}</span> {isContest ? `intéressée${displayCount > 1 ? "s" : ""}` : `participe${displayCount > 1 ? "nt" : ""}`}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground mb-4">
                                Aucun spectateur pour le moment
                              </p>
                            )}

                            {/* Liste des participants */}
                            {filteredParticipants.length > 0 && (
                              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {filteredParticipants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-sakura to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                      {participant.avatar_url ? (
                                        <img
                                          src={participant.avatar_url}
                                          alt={participant.display_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        participant.display_name?.charAt(0).toUpperCase() || "?"
                                      )}
                                    </div>

                                    {/* Nom */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{participant.display_name}</p>
                                      <p className="text-xs text-muted-foreground truncate">@{participant.username}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                     {/* Official Contestants Section - Only for contests with approved participants */}
                     {(selectedSlotForSheet.type === "contest" || selectedSlotForSheet.category?.toLowerCase() === "contest") && (
                       <>
                         {approvedContestants.length > 0 ? (
                           <div className="mt-6 pt-6 border-t border-white/10">
                             <h4 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                               <Award className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
                               🏆 Sélection Officielle
                             </h4>

                             {/* Summary */}
                             <p className="text-sm text-muted-foreground mb-4">
                               <span className="text-foreground font-bold">{approvedContestants.length} participant{approvedContestants.length > 1 ? "s" : ""} officiel{approvedContestants.length > 1 ? "s" : ""}</span> validé{approvedContestants.length > 1 ? "s" : ""} pour ce concours
                             </p>

                        {/* List of approved contestants */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {approvedContestants.map((contestant) => {
                            const displayName = contestant.profiles?.display_name || contestant.profiles?.username || "Participant";
                            const username = contestant.profiles?.username || "";
                            const avatarUrl = contestant.profiles?.avatar_url;
                            const initials = displayName.charAt(0).toUpperCase();

                            return (
                              <div
                                key={contestant.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[hsl(var(--mp-saffron))]/10 to-amber-600/10 border border-[hsl(var(--mp-saffron))]/30 hover:border-[hsl(var(--mp-saffron))]/50 transition-colors"
                              >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--mp-saffron))] to-amber-600 flex items-center justify-center text-sm font-bold text-black shrink-0">
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt={displayName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    initials
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-[hsl(var(--mp-saffron))]">{contestant.character_name}</p>
                                  <p className="text-xs text-muted-foreground">{contestant.universe}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Par {displayName} {username && `(@${username})`}
                                  </p>
                                </div>

                                {/* Passage Order Badge */}
                                {contestant.passage_order && (
                                  <div className="shrink-0">
                                    <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/50 font-bold">
                                      #{contestant.passage_order}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                         </div>
                           </div>
                         ) : (
                           <div className="mt-6 pt-6 border-t border-white/10">
                             <p className="text-sm text-muted-foreground italic">
                               Aucun participant officiel pour le moment
                             </p>
                           </div>
                         )}
                       </>
                     )}
                   </div>

                  {/* Action Buttons - Compact */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    {/* External Link Button */}
                    {selectedSlotForSheet.external_link && (
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-sakura to-pink-600 text-white font-bold hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all"
                      >
                        <a href={selectedSlotForSheet.external_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          S'inscrire / Voir plus
                        </a>
                      </Button>
                    )}

                    {/* Registration Button - Show for contest/inscription activities (fallback if no external link) */}
                    {!selectedSlotForSheet.external_link && (selectedSlotForSheet.type === "contest" ||
                      selectedSlotForSheet.description?.toLowerCase().includes("inscription") ||
                      selectedSlotForSheet.description?.toLowerCase().includes("tally")) && (
                      <ContestRegistrationButton
                        activityId={selectedSlotForSheet.id}
                        onRegisterClick={() => setRegistrationModalOpen(true)}
                        onViewPassClick={() => setRegistrationModalOpen(true)}
                        className="w-full"
                        registrationDeadline={selectedSlotForSheet.contest_config?.registration_deadline}
                      />
                    )}
                    
                    {/* Favorite Button */}
                    <ActivityDetailActionButton
                      slotId={selectedSlotForSheet.id}
                      isFavorite={isFavorite(selectedSlotForSheet.id)}
                      isToggling={isToggling}
                      onToggle={() => toggleFavorite(selectedSlotForSheet.id)}
                    />
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

       {/* Cosplay Registration Modal */}
       {selectedSlotForSheet && (
         <CosplayRegistrationModal
           open={registrationModalOpen}
           onOpenChange={setRegistrationModalOpen}
           activityId={selectedSlotForSheet.id}
           eventId={eventId}
           activityTitle={selectedSlotForSheet.title}
           contestConfig={selectedSlotForSheet.contest_config}
         />
       )}
     </Card>
   );
 }
