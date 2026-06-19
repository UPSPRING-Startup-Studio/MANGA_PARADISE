import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Clock, MapPin, Users, QrCode, X, Heart,
  Ticket, Loader2, Drama, UserCircle, ChevronRight, CalendarDays, Pencil, Store
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RSVPModal, { AttendanceDetail, RSVPData } from "@/components/events/RSVPModal";
import { useUpdateParticipation } from "@/hooks/useEventParticipants";
import { useMyExhibitorRequests, useCancelExhibitorRequest } from "@/hooks/useEventExhibitors";
import { usePastEventsWithMemoryStats } from "@/hooks/useEventMemories";
import { useUserContestRegistrations, type UserContestRegistration } from "@/hooks/useUserContestRegistrations";
import MemoriesTimeline from "@/components/memories/MemoriesTimeline";
import EventTicketQRCode from "@/components/events/EventTicketQRCode";
import { ContestActivityModule, type ContestRegistrationData } from "@/components/events/ContestActivityModule";
import { ContestDetailModal } from "@/components/events/ContestDetailModal";
import { cn } from "@/lib/utils";

// Helper function to parse attendance_details from JSONB
const parseAttendanceDetails = (details: any): AttendanceDetail[] | null => {
  if (!details) return null;
  if (Array.isArray(details)) return details as AttendanceDetail[];
  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  }
  return null;
};

// Fetch user's event registrations with event and cosplay details
const useMyRegistrations = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const [registrations, setRegistrations] = useState<any[]>([]);
  
  // Setup Realtime subscription
  useEffect(() => {
    if (!userId) return;

    console.log("🔄 DEBUG AGENDA - Setting up Realtime subscription for user:", userId);

    // Subscribe to changes in event_participants table for this user
    const subscription = supabase
      .channel(`event_participants:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "event_participants",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 DEBUG AGENDA - Realtime event received:", payload);
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ["my-registrations", userId] });
        }
      )
      .subscribe((status) => {
        console.log("🔄 DEBUG AGENDA - Subscription status:", status);
      });

    return () => {
      console.log("🔄 DEBUG AGENDA - Cleaning up Realtime subscription");
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);
  
  return useQuery({
    queryKey: ["my-registrations", userId],
    queryFn: async () => {
      if (!userId) {
        console.log("DEBUG AGENDA - No userId provided, returning empty array");
        return [];
      }

      console.log("🔍 DEBUG AGENDA - Fetching registrations for user:", userId);
      console.log("🔍 DEBUG AGENDA - Current timestamp:", new Date().toISOString());

      // Fetch with user filter - NO DATE FILTER, get ALL registrations
      // Include cosplay join via planned_cosplay_id -> cosplay_vestiaire
      const { data, error } = await supabase
        .from("event_participants")
        .select(`
          id,
          event_id,
          user_id,
          role,
          *,
          events (
            id, title, date, end_date, time, location, image_url, category, max_attendees, status,
            venue_name, city, region, schedule
          )
        `)
        .eq("user_id", userId)
        .order("registered_at", { ascending: false });

      if (error) {
        console.error("❌ DEBUG AGENDA - Query error:", error);
        console.error("❌ DEBUG AGENDA - Error code:", error.code);
        console.error("❌ DEBUG AGENDA - Error message:", error.message);
        console.error("❌ DEBUG AGENDA - Error details:", error.details);
        throw error;
      }

      console.log("✅ DEBUG AGENDA - SUCCESS! Data received for user:", data);
      console.log("✅ DEBUG AGENDA - Number of registrations:", data?.length || 0);
      
      // Log each registration for detailed debug
      if (data && data.length > 0) {
        data.forEach((reg, index) => {
          console.log(`🎫 DEBUG AGENDA - Registration ${index + 1}:`, {
            id: reg.id,
            event_id: reg.event_id,
            event_title: reg.events?.title || "NO EVENT TITLE",
            event_date: reg.events?.date || "NO DATE",
            role: reg.role,
            registered_at: reg.registered_at
          });
        });
      } else {
        console.warn("⚠️ DEBUG AGENDA - NO REGISTRATIONS FOUND for user:", userId);
        console.warn("⚠️ DEBUG AGENDA - This could mean:");
        console.warn("   1. User has no registrations in event_participants table");
        console.warn("   2. RLS policies are blocking access");
        console.warn("   3. user_id doesn't match any records");
      }
      
      return data || [];
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache at all (renamed from cacheTime in newer React Query)
    refetchOnMount: "always", // Force refetch on every mount
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests
  });
};

// Hook for managing favorites (local storage)
const useFavoriteEvents = () => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("event_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const isFavorite = (eventId: string) => favorites.includes(eventId);
  const getFavoriteIds = () => favorites;

  return { favorites, isFavorite, getFavoriteIds };
};

// Fetch favorite events that user is NOT registered to
const useFavoriteEventsData = (userId: string | undefined, favoriteIds: string[], registeredEventIds: string[]) => {
  return useQuery({
    queryKey: ["favorite-events", userId, favoriteIds, registeredEventIds],
    queryFn: async () => {
      // Filter out events user is already registered to
      const unregisteredFavorites = favoriteIds.filter(id => !registeredEventIds.includes(id));
      
      if (unregisteredFavorites.length === 0) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("id", unregisteredFavorites)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && favoriteIds.length > 0,
  });
};

// Role info helper
const getRoleInfo = (role: string) => {
  switch (role) {
    case "cosplayer":
      return { emoji: "🎭", label: "Cosplayeur", color: "text-sakura" };
    case "volunteer":
      return { emoji: "💚", label: "Bénévole", color: "text-turquoise" };
    case "exhibitor":
      return { emoji: "🏪", label: "Exposant", color: "text-accent" };
    default:
      return { emoji: "👤", label: "Visiteur", color: "text-white/60" };
  }
};

// Ticket Card Component - REFACTORÉ (Séparation Participation / Compétition)
const TicketCard = ({
  registration,
  onShowQR,
  onCancel,
  onEdit,
  cosplays = [],
  contestRegistration, // NEW: Optional contest data
  onContestClick, // NEW: Callback pour ouvrir la modal de détails
}: {
  registration: any;
  onShowQR: (event: any, userId: string) => void;
  onCancel: (registrationId: string) => void;
  onEdit?: (registration: any) => void;
  cosplays?: any[];
  contestRegistration?: UserContestRegistration; // NEW
  onContestClick?: (contestData: ContestRegistrationData) => void; // NEW
}) => {
  const event = registration.events;
  // Use the joined cosplay from Supabase, or fallback to finding it in the cosplays list
  const cosplay = registration.cosplay || (registration.planned_cosplay_id
    ? cosplays.find((c: any) => c.id === registration.planned_cosplay_id)
    : null);
  const attendanceDetails = parseAttendanceDetails(registration.attendance_details);
  const isCosplayer = registration.role === "cosplayer" && cosplay;
  const isMultiDay = attendanceDetails && attendanceDetails.length > 1;
  
  // Safety checks to prevent crashes
  if (!event) {
    console.warn("DEBUG AGENDA - TicketCard: No event data for registration:", registration.id);
    return null;
  }
  
  if (!event.date) {
    console.warn("DEBUG AGENDA - TicketCard: No date for event:", event.id, event.title);
    return null;
  }

  let eventDate;
  try {
    eventDate = parseISO(event.date);
  } catch (error) {
    console.error("DEBUG AGENDA - TicketCard: Invalid date format:", event.date, error);
    return null;
  }
  
  const isPast = eventDate < new Date();

  // Get cosplay by ID from the list
  const getCosplayById = (cosplayId: string | null) => {
    if (!cosplayId) return null;
    return cosplays.find((c: any) => c.id === cosplayId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group space-y-3"
    >
      {/* CARTE PRINCIPALE : PARTICIPATION ÉVÉNEMENT */}
      <Card className={cn(
        "overflow-hidden bg-white/50 backdrop-blur-md border-white/10 hover:border-sakura/30 transition-all duration-300",
        isPast && "opacity-60"
      )}>
        <div className="flex flex-col md:flex-row">
          {/* Date Block - Left */}
          <div className="bg-gradient-to-br from-sakura/20 to-primary/20 p-4 md:p-6 flex md:flex-col items-center justify-center md:min-w-[120px] border-b md:border-b-0 md:border-r border-white/10">
            <div className="text-center">
              {isMultiDay ? (
                <>
                  <div className="text-2xl md:text-3xl font-display text-white">
                    {format(eventDate, "dd")}-{format(parseISO(attendanceDetails[attendanceDetails.length - 1].date), "dd")}
                  </div>
                  <div className="text-sm md:text-base font-medium text-sakura uppercase tracking-wider">
                    {format(eventDate, "MMM", { locale: fr })}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl md:text-4xl font-display text-white">
                    {format(eventDate, "dd")}
                  </div>
                  <div className="text-sm md:text-base font-medium text-sakura uppercase tracking-wider">
                    {format(eventDate, "MMM", { locale: fr })}
                  </div>
                </>
              )}
              <div className="text-xs text-white/50 mt-1">
                {format(eventDate, "yyyy")}
              </div>
            </div>
          </div>

          {/* Event Info - Center */}
          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start gap-4">
              {/* Event Image */}
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover hidden sm:block"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <Link to={`/evenements/${event.id}`}>
                  <h3 className="font-display text-lg md:text-xl text-white hover:text-sakura transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                </Link>

                <div className="mt-2 space-y-1.5 text-sm text-white/60">
                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sakura shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {(event.venue_name || event.city || event.location) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sakura shrink-0" />
                      <span className="truncate">
                        {event.venue_name ? `${event.venue_name}, ${event.city || ''}` : event.location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category Badge */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white/80 border-0 text-xs">
                    {event.category}
                  </Badge>
                  {isPast && (
                    <Badge className="bg-slate-600/50 text-white/60 border-0 text-xs">
                      Passé
                    </Badge>
                  )}
                  {isMultiDay && (
                    <Badge className="bg-sakura/20 text-sakura border-0 text-xs">
                      {attendanceDetails.length} jours
                    </Badge>
                  )}
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                    <Ticket className="w-3 h-3 mr-1" />
                    Je participe
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Participation Status - Right */}
          <div className="border-t md:border-t-0 md:border-l border-white/10 p-4 md:p-5 md:min-w-[240px] bg-mp-paper/40">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Ma Participation</div>
            
            {/* Multi-day display */}
            {isMultiDay ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {attendanceDetails.map((detail) => {
                  const roleInfo = getRoleInfo(detail.role);
                  const dayCosplay = getCosplayById(detail.cosplay_id);
                  const dayDate = parseISO(detail.date);
                  
                  return (
                    <div key={detail.date} className="flex items-center gap-2 text-sm">
                      <span className="text-white/50 text-xs min-w-[60px]">
                        {format(dayDate, "EEE d", { locale: fr })}
                      </span>
                      <span className={cn("flex items-center gap-1", roleInfo.color)}>
                        <span>{roleInfo.emoji}</span>
                        <span className="text-xs">{roleInfo.label}</span>
                      </span>
                      {dayCosplay && (
                        <div className="flex items-center gap-1 ml-auto">
                          <img
                            src={dayCosplay.official_image_url}
                            alt={dayCosplay.character_name}
                            className="w-5 h-5 rounded-full object-cover border border-sakura/50"
                          />
                          <span className="text-xs text-sakura truncate max-w-[60px]">
                            {dayCosplay.character_name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {/* NEW: "Mon Cosplay du jour" (libre, hors concours) */}
                {isCosplayer && (
                  <div className="mb-3">
                    <div className="text-xs text-white/50 mb-2">Mon Cosplay du jour</div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={cosplay.official_image_url}
                          alt={cosplay.character_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-sakura/50"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sakura rounded-full flex items-center justify-center">
                          <Drama className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white truncate max-w-[140px]">
                          {cosplay.character_name}
                        </div>
                        <div className="text-xs text-white/40">Libre (hors concours)</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Role Badge */}
                {!isCosplayer && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-mp-cloud/50 flex items-center justify-center">
                      <UserCircle className="w-7 h-7 text-white/40" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80 flex items-center gap-1">
                        <span>👤</span> Visiteur
                      </div>
                      <div className="text-xs text-white/40">Civil</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
               <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-gradient-to-r from-sakura/20 to-primary/20 border-sakura/30 text-sakura hover:from-sakura/30 hover:to-primary/30 hover:text-sakura text-xs"
                onClick={() => onShowQR(event, registration.user_id)}
              >
                <Ticket className="w-3.5 h-3.5 mr-1" />
                Voir mon billet
              </Button>
              {!isPast && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-sakura/10 border-sakura/30 text-sakura hover:bg-sakura/20 hover:text-sakura text-xs"
                  onClick={() => onEdit(registration)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isPast && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  onClick={() => onCancel(registration.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* MODULE COMPÉTITION (si inscription concours) */}
      {contestRegistration && (
        <ContestActivityModule
          contestData={{
            id: contestRegistration.id,
            status: contestRegistration.status as any,
            character_name: contestRegistration.character_name,
            universe: contestRegistration.universe,
            format: contestRegistration.format,
            group_name: contestRegistration.group_name || undefined,
            passage_order: contestRegistration.passage_order || undefined,
            // MOCK DATA for demo (TODO: Add to database)
            passage_time: contestRegistration.status === "approved" ? "14:30" : undefined,
            judging_time: contestRegistration.status === "approved" ? "13:45" : undefined,
            contest_name: "Concours Cosplay",
            description: "Cosplay détaillé avec accessoires faits main",
            media_url: "https://example.com/audio.mp3",
            media_type: "audio",
          }}
          onClick={() => onContestClick?.({
            id: contestRegistration.id,
            status: contestRegistration.status as any,
            character_name: contestRegistration.character_name,
            universe: contestRegistration.universe,
            format: contestRegistration.format,
            group_name: contestRegistration.group_name || undefined,
            passage_order: contestRegistration.passage_order || undefined,
            passage_time: contestRegistration.status === "approved" ? "14:30" : undefined,
            judging_time: contestRegistration.status === "approved" ? "13:45" : undefined,
            contest_name: "Concours Cosplay",
            description: "Cosplay détaillé avec accessoires faits main",
            media_url: "https://example.com/audio.mp3",
            media_type: "audio",
          })}
        />
      )}
    </motion.div>
  );
};

// Contest status style helper
const getContestStatusStyle = (status: string) => {
  switch (status) {
    case "pending":
      return {
        bgColor: "bg-amber-400/20",
        borderColor: "border-amber-400",
        textColor: "text-amber-900",
        gradientFrom: "from-amber-400/30",
        gradientTo: "to-amber-500/20",
        glowColor: "shadow-[0_0_20px_rgba(251,146,60,0.4)]",
        icon: "⏳",
        label: "Candidature en examen",
      };
    case "approved":
      return {
        bgColor: "bg-green-500/20",
        borderColor: "border-green-400",
        textColor: "text-green-900",
        gradientFrom: "from-green-500/30",
        gradientTo: "to-emerald-600/20",
        glowColor: "shadow-[0_0_20px_rgba(74,222,128,0.4)]",
        icon: "✅",
        label: "Participation Confirmée",
      };
    case "rejected":
      return {
        bgColor: "bg-red-500/20",
        borderColor: "border-red-400",
        textColor: "text-red-900",
        gradientFrom: "from-red-500/30",
        gradientTo: "to-red-600/20",
        glowColor: "shadow-[0_0_20px_rgba(248,113,113,0.4)]",
        icon: "❌",
        label: "Candidature Refusée",
      };
    case "waitlist":
      return {
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-400",
        textColor: "text-blue-900",
        gradientFrom: "from-blue-500/30",
        gradientTo: "to-cyan-600/20",
        glowColor: "shadow-[0_0_20px_rgba(96,165,250,0.4)]",
        icon: "ℹ️",
        label: "Sur liste d'attente",
      };
    default:
      return {
        bgColor: "bg-white/5",
        borderColor: "border-white/10",
        textColor: "text-white/60",
        gradientFrom: "from-white/5",
        gradientTo: "to-white/5",
        glowColor: "",
        icon: "•",
        label: "Statut inconnu",
      };
  }
};

// Contest Ticket Card — "Billet Compétiteur"
const ContestTicketCard = ({
  contestReg,
  event,
}: {
  contestReg: UserContestRegistration;
  event: any;
}) => {
  const statusStyle = getContestStatusStyle(contestReg.status);

  let eventDate;
  try {
    eventDate = event?.date ? parseISO(event.date) : null;
  } catch {
    eventDate = null;
  }

  if (!event || !eventDate) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group"
    >
      <Card className={cn(
        "overflow-hidden backdrop-blur-md transition-all duration-300",
        statusStyle.borderColor,
        statusStyle.bgColor,
        statusStyle.glowColor,
        "border-2"
      )}>
        <div className="flex flex-col md:flex-row">
          {/* Date Block - Left with contest gradient */}
          <div className={cn(
            "p-4 md:p-6 flex md:flex-col items-center justify-center md:min-w-[120px] border-b md:border-b-0 md:border-r",
            statusStyle.borderColor,
            `bg-gradient-to-br ${statusStyle.gradientFrom} ${statusStyle.gradientTo}`
          )}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display text-white">
                {format(eventDate, "dd")}
              </div>
              <div className={cn("text-sm md:text-base font-medium uppercase tracking-wider", statusStyle.textColor)}>
                {format(eventDate, "MMM", { locale: fr })}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {format(eventDate, "yyyy")}
              </div>
            </div>
          </div>

          {/* Event Info - Center */}
          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start gap-4">
              {/* Event Image */}
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover hidden sm:block"
                />
              )}

              <div className="flex-1 min-w-0">
                <Link to={`/evenements/${event.id}`}>
                  <h3 className="font-display text-lg md:text-xl text-white hover:text-[hsl(var(--mp-saffron))] transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                </Link>

                <div className="mt-2 space-y-1.5 text-sm text-white/60">
                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[hsl(var(--mp-saffron))] shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {(event.venue_name || event.city || event.location) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[hsl(var(--mp-saffron))] shrink-0" />
                      <span className="truncate">
                        {event.venue_name ? `${event.venue_name}, ${event.city || ''}` : event.location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={cn(
                    "border-0 text-xs font-semibold",
                    statusStyle.bgColor,
                    statusStyle.textColor
                  )}>
                    {statusStyle.icon} {statusStyle.label}
                  </Badge>
                  <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-0 text-xs">
                    🎭 Compétiteur
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Contest Details - Right — "Billet Compétiteur" */}
          <div className={cn(
            "border-t md:border-t-0 md:border-l p-4 md:p-5 md:min-w-[260px]",
            statusStyle.borderColor,
            "bg-mp-paper/60"
          )}>
            <div className={cn(
              "text-xs uppercase tracking-wider mb-3 font-bold flex items-center gap-1",
              statusStyle.textColor
            )}>
              {statusStyle.icon} MA COMPÉTITION
            </div>

            {/* Cosplay Info (PRIORITY: contest cosplay) */}
            <div className="text-sm text-white/80 mb-2">
              <span className="text-[hsl(var(--mp-saffron))] font-semibold">🎭 Cosplay:</span>{" "}
              <span className="text-white font-medium">{contestReg.character_name}</span>
              {contestReg.universe && (
                <span className="text-white/50"> ({contestReg.universe})</span>
              )}
            </div>

            {/* Format */}
            {contestReg.format && (
              <div className="text-xs text-white/70 mb-1.5">
                <span className="text-[hsl(var(--mp-saffron))] font-semibold">📋 Format:</span>{" "}
                {contestReg.format}
              </div>
            )}

            {/* Group */}
            {contestReg.group_name && (
              <div className="text-xs text-white/70 mb-1.5">
                <span className="text-[hsl(var(--mp-saffron))] font-semibold">👥 Groupe:</span>{" "}
                {contestReg.group_name}
              </div>
            )}

            {/* Passage Order */}
            {contestReg.passage_order && (
              <div className="text-xs text-white/70 mb-1.5">
                <span className="text-[hsl(var(--mp-saffron))] font-semibold">🎬 Passage:</span>{" "}
                #{contestReg.passage_order}
              </div>
            )}

            {/* Link to event */}
            <div className="mt-3">
              <Link to={`/evenements/${event.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "w-full text-xs",
                    statusStyle.borderColor,
                    statusStyle.textColor,
                    "hover:bg-white/5"
                  )}
                >
                  <Ticket className="w-3.5 h-3.5 mr-1" />
                  Voir l'événement
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Favorite Event Card
const FavoriteEventCard = ({ 
  event, 
  onRegister 
}: { 
  event: any; 
  onRegister: (eventId: string) => void;
}) => {
  const eventDate = parseISO(event.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="overflow-hidden bg-white/40 backdrop-blur-md border-white/5 hover:border-pink-500/30 transition-all duration-300">
        <div className="relative h-32 overflow-hidden">
          <img 
            src={event.image_url || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Heart Icon */}
          <div className="absolute top-2 right-2">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </div>

          {/* Date Badge */}
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="text-xs text-white font-medium">
              {format(eventDate, "d MMM", { locale: fr })}
            </div>
          </div>
        </div>

        <div className="p-4">
          <h4 className="font-display text-sm text-white line-clamp-1 mb-2">{event.title}</h4>
          
          <div className="flex items-center gap-1 text-xs text-white/50 mb-3">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{event.location || "Lieu à confirmer"}</span>
          </div>

          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-sakura to-primary hover:from-sakura/90 hover:to-primary/90 text-white text-xs"
            onClick={() => onRegister(event.id)}
          >
            Je m'inscris
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

const MemberAgenda = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedEventForQR, setSelectedEventForQR] = useState<{ event: any; userId: string; checkInToken?: string } | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<any>(null);
  const [selectedContestDetail, setSelectedContestDetail] = useState<ContestRegistrationData | null>(null);
  
  const { data: registrations = [], isLoading, refetch, isFetching } = useMyRegistrations(user?.id);
  
  // Fetch ALL contest registrations for the current user
  const { data: allContestRegistrations = [] } = useUserContestRegistrations(user?.id);

  // 🔥 CRITICAL: Force refetch on page mount to invalidate any stale cache
  useEffect(() => {
    if (user?.id) {
      console.log("🔥 DEBUG AGENDA - Page mounted, forcing refetch for user:", user.id);
      // Invalidate all related queries to force fresh data
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      // Then refetch
      refetch();
    }
  }, [user?.id]); // Re-run when user ID changes
  const { getFavoriteIds, isFavorite } = useFavoriteEvents();
  const { data: exhibitorRequests = [] } = useMyExhibitorRequests(user?.id);
  const cancelExhibitorMutation = useCancelExhibitorRequest();
  const { data: pastEventsWithStats = [], isLoading: pastEventsLoading } = usePastEventsWithMemoryStats(user?.id);
  
  const registeredEventIds = registrations.map((r: any) => r.event_id);
  const { data: favoriteEvents = [] } = useFavoriteEventsData(user?.id, getFavoriteIds(), registeredEventIds);

  // Fetch user's cosplays for display
  const { data: userCosplays = [] } = useQuery({
    queryKey: ["user-cosplays", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateParticipation = useUpdateParticipation();

  // Cancel registration mutation
  const cancelMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("id", registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      toast.success("Inscription annulée");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation");
    },
  });

  // Quick register mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Non connecté");
      
      const { error } = await supabase
        .from("event_participants")
        .insert({
          event_id: eventId,
          user_id: user.id,
          role: "visitor",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-events"] });
      toast.success("Inscription confirmée !");
    },
    onError: () => {
      toast.error("Erreur lors de l'inscription");
    },
  });

  // Handle participation update
  const handleUpdateParticipation = async (data: RSVPData) => {
    if (!editingRegistration) return;
    
    await updateParticipation.mutateAsync({
      participationId: editingRegistration.id,
      eventId: editingRegistration.event_id,
      plannedCosplayId: data.plannedCosplayId,
      role: data.role,
      attendanceDetails: data.attendanceDetails,
    });
    
    queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    toast.success("Participation mise à jour !");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  if (!user) return null;

  // Show ALL registrations without any filtering
  const upcomingRegistrations = registrations || [];
  const pastRegistrations: any[] = [];
  
  // Count contest-only events (not in event_participants)
  const contestOnlyCount = allContestRegistrations.filter(
    (cr) => !upcomingRegistrations.some((r: any) => r.event_id === cr.event_id)
  ).length;
  const totalTickets = upcomingRegistrations.length + contestOnlyCount;
  
  console.log("📊 DEBUG AGENDA - Registrations:", upcomingRegistrations.length, "Contest regs:", allContestRegistrations.length, "Contest-only:", contestOnlyCount, "Total:", totalTickets);

  const generateQRCodeUrl = (eventId: string, userId: string) => {
    const data = encodeURIComponent(JSON.stringify({
      type: "event_checkin",
      eventId,
      userId
    }));
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${data}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura to-primary flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-white">Mon Agenda</h1>
          </div>
          <p className="text-white/60 ml-13">
            Tes inscriptions aux événements Manga Paradise
          </p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="upcoming" className="mb-8">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-white/60 border border-white/10 p-1 rounded-xl mb-8">
            <TabsTrigger 
              value="upcoming" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-sakura data-[state=active]:to-primary data-[state=active]:text-white font-medium"
            >
              📅 À Venir
            </TabsTrigger>
            <TabsTrigger 
              value="memories" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white font-medium"
            >
              🕰️ Mes Souvenirs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <Card className="bg-white/40 backdrop-blur-md border-white/5 p-4 text-center">
                <div className="text-2xl font-display text-white">{totalTickets}</div>
                <div className="text-xs text-white/50">À venir</div>
              </Card>
              <Card className="bg-white/40 backdrop-blur-md border-white/5 p-4 text-center">
                <div className="text-2xl font-display text-white">{pastRegistrations.length}</div>
                <div className="text-xs text-white/50">Participés</div>
              </Card>
              <Card className="bg-white/40 backdrop-blur-md border-white/5 p-4 text-center">
                <div className="text-2xl font-display text-pink-400">{favoriteEvents.length}</div>
                <div className="text-xs text-white/50">Favoris</div>
              </Card>
            </motion.div>

            {/* Upcoming Registrations */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Ticket className="w-5 h-5 text-sakura" />
            <h2 className="font-display text-xl text-white">Mes Billets</h2>
            <Badge className="bg-sakura/20 text-sakura border-0 ml-2">
              {totalTickets}
            </Badge>
          </div>

          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              <span className="ml-3 text-white/60">Chargement de vos billets...</span>
            </div>
          ) : totalTickets === 0 ? (
            <Card className="bg-white/40 backdrop-blur-md border-white/5 p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/60 mb-2">Tu n'es inscrit à aucun événement à venir</p>
              {/* DEBUG VISUEL - Affiche des infos si la liste est vide */}
              <div className="mt-4 p-4 bg-mp-paper/50 rounded-lg text-left text-xs font-mono">
                <p className="text-amber-400 mb-2">🔍 DEBUG INFO:</p>
                <p className="text-white/50">User ID: {user?.id || "Non défini"}</p>
                <p className="text-white/50">Registrations reçues: {registrations?.length || 0}</p>
                <p className="text-white/50">Loading: {isLoading ? "Oui" : "Non"}</p>
                <p className="text-white/50">Fetching: {isFetching ? "Oui" : "Non"}</p>
                <p className="text-white/40 mt-2">
                  👆 Ouvre la console (F12) pour voir les logs détaillés de la requête Supabase
                </p>
              </div>
              <Link to="/evenements" className="block mt-4">
                <Button className="bg-gradient-to-r from-sakura to-primary text-white">
                  Découvrir les événements
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {/* CONTEST TICKETS FIRST (Priority) */}
                {allContestRegistrations
                  .filter((cr: UserContestRegistration) => {
                    // Only show contest tickets that DON'T already have a matching event_participants entry
                    // (to avoid duplicates — if they have both, the TicketCard below will get the contest overlay)
                    return !upcomingRegistrations.some((r: any) => r.event_id === cr.event_id);
                  })
                  .map((cr: UserContestRegistration) => {
                    // We need event details — find from registrations or fetch
                    const matchingReg = upcomingRegistrations.find((r: any) => r.event_id === cr.event_id);
                    const event = matchingReg?.events;
                    
                    // If no event data available, create a minimal placeholder
                    // The ContestTicketCard will handle null gracefully
                    return (
                      <ContestTicketCard
                        key={`contest-${cr.id}`}
                        contestReg={cr}
                        event={event || { id: cr.event_id, title: "Événement", date: cr.created_at }}
                      />
                    );
                  })
                }
                
                {/* REGULAR TICKETS (with contest module if applicable) */}
                {upcomingRegistrations.map((registration: any) => {
                  // Check if this event has a contest registration
                  const contestReg = allContestRegistrations.find(
                    (cr: UserContestRegistration) => String(cr.event_id) === String(registration.event_id)
                  );
                  
                  return (
                    <TicketCard
                      key={registration.id}
                      registration={registration}
                      onShowQR={(event, userId) => setSelectedEventForQR({ event, userId, checkInToken: registration.check_in_token })}
                      onCancel={(id) => cancelMutation.mutate(id)}
                      onEdit={setEditingRegistration}
                      cosplays={userCosplays}
                      contestRegistration={contestReg}
                      onContestClick={setSelectedContestDetail}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Exhibitor Requests Section */}
        {exhibitorRequests.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Store className="w-5 h-5 text-purple-400" />
              <h2 className="font-display text-xl text-white">Mes Demandes de Stand</h2>
              <Badge className="bg-purple-500/20 text-purple-400 border-0 ml-2">
                {exhibitorRequests.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {exhibitorRequests.map((request: any) => {
                const eventDate = request.event?.date ? parseISO(request.event.date) : null;
                const isPast = eventDate && eventDate < new Date();

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className={cn(
                      "p-4 flex items-center gap-4 border-2",
                      request.status === "approved" 
                        ? "border-purple-500/50 bg-purple-500/5" 
                        : request.status === "pending"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-destructive/30 bg-destructive/5",
                      isPast && "opacity-60"
                    )}>
                      {/* Event Image */}
                      {request.event?.image_url && (
                        <img 
                          src={request.event.image_url} 
                          alt={request.event.title}
                          className="w-16 h-16 rounded-lg object-cover hidden sm:block"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <Link to={`/evenements/${request.event_id}`}>
                          <h4 className="font-display text-lg text-white hover:text-purple-400 transition-colors">
                            {request.event?.title || "Événement"}
                          </h4>
                        </Link>
                        <p className="text-sm text-white/60">
                          Stand: <span className="text-purple-300">{request.stand_name}</span>
                        </p>
                        {eventDate && (
                          <p className="text-xs text-white/40 mt-1">
                            {format(eventDate, "d MMMM yyyy", { locale: fr })}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <Badge 
                        className={cn(
                          "shrink-0",
                          request.status === "approved" 
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : request.status === "pending"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        )}
                      >
                        {request.status === "approved" && "🟣 Stand Confirmé"}
                        {request.status === "pending" && "🟠 En attente"}
                        {request.status === "rejected" && "❌ Refusé"}
                      </Badge>

                      {/* Cancel button for pending */}
                      {request.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelExhibitorMutation.mutate({
                            requestId: request.id,
                            eventId: request.event_id,
                            userId: user?.id || "",
                          })}
                          disabled={cancelExhibitorMutation.isPending}
                          className="text-white/40 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
        {favoriteEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-pink-400" />
              <h2 className="font-display text-xl text-white">Mes Événements Favoris</h2>
              <Badge className="bg-pink-500/20 text-pink-400 border-0 ml-2">
                {favoriteEvents.length}
              </Badge>
            </div>
            <p className="text-white/50 text-sm mb-4">
              Tu as liké ces événements mais tu n'es pas encore inscrit
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteEvents.map((event: any) => (
                <FavoriteEventCard 
                  key={event.id} 
                  event={event}
                  onRegister={(id) => registerMutation.mutate(id)}
                />
              ))}
            </div>
          </section>
        )}

          </TabsContent>

          <TabsContent value="memories">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <h2 className="font-display text-2xl text-amber-400 mb-2">🕰️ Capsules Temporelles</h2>
                <p className="text-white/50 text-sm">Revivez vos événements passés et enrichissez vos souvenirs</p>
              </div>
              
              <MemoriesTimeline 
                pastEvents={pastEventsWithStats}
                isLoading={pastEventsLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={!!selectedEventForQR} onOpenChange={() => setSelectedEventForQR(null)}>
        <DialogContent className="bg-mp-paper border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-center">
              Mon Billet
            </DialogTitle>
          </DialogHeader>
          
           {selectedEventForQR && (
             <div className="text-center space-y-4">
               <h3 className="font-medium text-white">{selectedEventForQR.event.title}</h3>
               
               <EventTicketQRCode
                 checkInToken={selectedEventForQR.checkInToken || selectedEventForQR.event.id}
                 eventId={selectedEventForQR.event.id}
                 eventTitle={selectedEventForQR.event.title}
                 size={200}
               />

               <p className="text-xs text-white/50">
                 Présente ce QR code à l'entrée de l'événement
               </p>
             </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Registration Modal */}
      {editingRegistration && (
        <RSVPModal
          open={!!editingRegistration}
          onOpenChange={(open) => !open && setEditingRegistration(null)}
          eventTitle={editingRegistration.events?.title || ""}
          eventId={editingRegistration.event_id}
          userId={user.id}
          onSubmit={handleUpdateParticipation}
          isLoading={updateParticipation.isPending}
          existingParticipation={{
            id: editingRegistration.id,
            planned_cosplay_id: editingRegistration.planned_cosplay_id,
            role: editingRegistration.role,
            attendance_details: parseAttendanceDetails(editingRegistration.attendance_details),
          }}
          eventStartDate={editingRegistration.events?.date}
          eventEndDate={editingRegistration.events?.end_date}
          ticketingUrl={editingRegistration.events?.external_link || null}
        />
      )}

      {/* Contest Detail Modal */}
      {selectedContestDetail && (
        <ContestDetailModal
          isOpen={!!selectedContestDetail}
          onClose={() => setSelectedContestDetail(null)}
          contestData={selectedContestDetail}
        />
      )}

      <Footer />
    </div>
  );
};

export default MemberAgenda;
