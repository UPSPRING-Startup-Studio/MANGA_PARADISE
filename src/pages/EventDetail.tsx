import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  ArrowLeft,
  Edit,
  X,
  Share2,
  Loader2,
  CheckCircle2,
  Scroll,
  Euro,
  Building,
  ChevronDown,
  ChevronUp,
  CalendarPlus,
  CalendarCheck,
  Drama,
  Store,
  ListMusic,
  Users2,
  Trophy,
  Sparkles,
  Swords,
} from "lucide-react";
import { PartyFinderModal } from "@/components/cosplay/PartyFinderModal";
import { EventPartyFinderOverview } from "@/components/cosplay/EventPartyFinderOverview";
import { useEvent } from "@/hooks/useEvents";
import {
  useEventParticipants,
  useIsRegistered,
  useRegisterToEvent,
  useUnregisterFromEvent,
  useUpdateParticipation
} from "@/hooks/useEventParticipants";
import { useJoinParty } from "@/hooks/useEventParties";
import { useAcceptInvitation } from "@/hooks/usePartyInvitations";
import { useSyncLineupForEvent, useCleanupLineupsForEvent } from "@/hooks/useUnifiedLineups";
import { useExhibitorRequest, useExhibitorEligibility } from "@/hooks/useEventExhibitors";
import { isExhibitorEligible } from "@/types/exhibitor";
import { useScheduleFavorites, useMeetupParticipation } from "@/hooks/useScheduleFavorites";
import { useMeetups, CreateMeetupData } from "@/hooks/useMeetups";
import { useEventSchedule, EventScheduleItem } from "@/hooks/useEventSchedule";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import RSVPModal, { RSVPData } from "@/components/events/RSVPModal";
import { EventRegistrationModal, RegistrationData } from "@/components/events/EventRegistrationModal";
import ExhibitorRequestModal from "@/components/events/ExhibitorRequestModal";
import ArtistAlleySection from "@/components/events/ArtistAlleySection";
import ParticipantGrid from "@/components/events/ParticipantGrid";
import EventCountdown from "@/components/events/EventCountdown";
import EventQuestsBoard from "@/components/events/EventQuestsBoard";
import PartyLobby from "@/components/events/PartyLobby";
import FriendsParticipatingBanner from "@/components/events/FriendsParticipatingBanner";
import EventScheduleTimeline, { ScheduleSlot, FriendParticipant } from "@/components/events/EventScheduleTimeline";
import CosplayMeetupsSection, { CosplayMeetup } from "@/components/events/CosplayMeetupsSection";
import { MeetupFormData } from "@/components/events/CreateMeetupModal";
import MyPlanningFAB from "@/components/events/MyPlanningFAB";
import SmartBackButton from "@/components/navigation/SmartBackButton";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { ContestCountdown } from "@/components/events/ContestCountdown";
import EventLocationMap from "@/components/events/EventLocationMap";
import PastEventBanner from "@/components/events/PastEventBanner";
import EventContributionBanner from "@/components/events/EventContributionBanner";
import EventCommunityGallery from "@/components/events/EventCommunityGallery";
import AddPhotosToEventSheet from "@/components/events/AddPhotosToEventSheet";
import EventShareBlock from "@/components/events/EventShareBlock";
import { useEventContentCounts } from "@/hooks/useEventContentCounts";
import eventsSpace from "@/assets/events-space.jpg";
import { format, parseISO, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { ScheduleDay } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Party Finder Modal state (agnostic mode: eventId pre-filled)
  const [partyFinderOpen, setPartyFinderOpen] = useState(false);
  
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: participants = [] } = useEventParticipants(eventId);
  const { data: myRegistration, refetch: refetchRegistration } = useIsRegistered(eventId, user?.id);

  // Early isPastEvent — used to gate network-heavy hooks below
  const isPastEvent = event?.date ? !isAfter(parseISO(event.date), new Date()) : false;

  // For past events, pass undefined to disable hooks that hit missing tables
  const liveEventId = isPastEvent ? undefined : eventId;

  const registerMutation = useRegisterToEvent();
  const unregisterMutation = useUnregisterFromEvent();
  const updateMutation = useUpdateParticipation();
  const joinPartyMutation = useJoinParty();
  const acceptInvitationMutation = useAcceptInvitation();
  const syncLineupMutation = useSyncLineupForEvent();
  const cleanupLineupsMutation = useCleanupLineupsForEvent();

  // Exhibitor request — only for live events
  const { data: exhibitorRequest } = useExhibitorRequest(liveEventId, user?.id);

  // Check if user is eligible for exhibitor (creator, pro, admin roles) — only for live events
  const { data: eligibilityData } = useExhibitorEligibility(isPastEvent ? undefined : user?.id);
  const isExhibitorEligibleUser = eligibilityData?.isEligible ?? false;
  const userRole = eligibilityData?.role ?? null;

  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [exhibitorModalOpen, setExhibitorModalOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [autoJoinProcessed, setAutoJoinProcessed] = useState(false);
  const [activeTab, setActiveTab] = useState<"programme" | "meetups">("programme");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [addPhotosSheetOpen, setAddPhotosSheetOpen] = useState(false);

  // Schedule favorites and meetup participation hooks — local storage only, no network
  const { favorites: favoriteSlots, toggleFavorite, removeFavorite } = useScheduleFavorites(liveEventId);
  const { joinedMeetups, joinMeetup: localJoinMeetup, leaveMeetup: localLeaveMeetup, isJoined } = useMeetupParticipation(liveEventId);

  // Supabase meetups hook — only for live events (table may not exist)
  const {
    meetups: dbMeetups,
    isLoading: meetupsLoading,
    createMeetup,
    joinMeetup: dbJoinMeetup,
    leaveMeetup: dbLeaveMeetup
  } = useMeetups(liveEventId);

  // Current user profile
  const { profile: currentUserProfile } = useProfile();

  // Real schedule data — only for live events (avoids 404 on past events with no schedule)
  const { data: dbScheduleItems = [], isLoading: scheduleLoading, error: scheduleError } = useEventSchedule(liveEventId);

  // Contest config — only for live events
  const { data: contestActivity } = useQuery({
    queryKey: ["contestActivity", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("event_schedule")
        .select("contest_config")
        .eq("event_id", eventId)
        .eq("category", "contest")
        .limit(1)
        .single();

      if (error) return null;

      return data;
    },
    enabled: !!liveEventId,
  });

  // Convert database schedule items to ScheduleSlot format
  const realSchedule: ScheduleSlot[] = useMemo(() => {
    if (dbScheduleItems.length === 0) return [];

    return dbScheduleItems.map((item) => ({
      id: item.id,
      time: item.time,
      endTime: item.end_time || undefined,
      title: item.title,
      type: item.category as ScheduleSlot["type"],
      category: item.category,
      location: item.location || undefined,
      description: item.description || undefined,
      day: item.day_date || undefined,
    }));
  }, [dbScheduleItems]);

  // Demo multi-day schedule data with categories (DISABLED - show empty state instead)
  const demoSchedule: ScheduleSlot[] = useMemo(() => {
    // DISABLED: Always return empty to force real data display
    // If we have real data, don't show demo
    if (realSchedule.length > 0) return [];
    
    // Return empty - no fallback demo data
    return [];
  }, [realSchedule.length]);

  // Demo meetups data with real cosplay avatars
  const demoMeetups: CosplayMeetup[] = useMemo(() => {
    // Import real avatars for authentic look
    const realAvatars = [
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044479/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.27.53_lvsgmb.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044489/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.06_c4x9tj.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044556/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.13_fdbjcy.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044546/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.03_bup3qv.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044522/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.38_aclsfk.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044508/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.25_zewu3q.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044618/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.30.14_o1gvtf.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044594/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.51_hlxinj.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044570/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.26_rbptp3.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044690/Cosplay-Tanjiro-Lucas-P_eqtjer.jpg",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044754/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.32.29_pc5acn.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044816/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.33.29_del6by.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044962/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.37_c8xqpu.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044940/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.25_ts7q9x.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044927/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.09_tkpunv.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044905/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.34.35_yzqkt6.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044964/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.58_eqr0e3.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045062/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.18_ee7n7k.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045091/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.53_uhot2v.png",
      "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045071/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.39_pfid8z.png"
    ];
    
    const participantNames = ["Yuki", "Sakura", "Hiro", "Mei", "Ren", "Aiko", "Kaito", "Hana", "Sora", "Miku"];
    
    return [
      {
        id: "m1",
        universe: "My Hero Academia",
        title: "Rassemblement My Hero Academia",
        imageUrl: "https://res.cloudinary.com/dkw8snibz/image/upload/v1768041786/IMG_3962_aue6qq.jpg",
        time: "14:00",
        location: "Play Azur Festival",
        currentParticipants: 24,
        maxParticipants: 40,
        organizerName: "DekuCosplay",
        organizerAvatar: realAvatars[0],
        isFeatured: true,
        isJoined: isJoined("m1"),
        description: "Héros et Vilains, rassemblez-vous ! Photo de groupe épique avec tous les quirks !",
        participants: [
          { id: "p1", name: participantNames[0], avatarUrl: realAvatars[1] },
          { id: "p2", name: participantNames[1], avatarUrl: realAvatars[2] },
          { id: "p3", name: participantNames[2], avatarUrl: realAvatars[3] },
          { id: "p4", name: participantNames[3], avatarUrl: realAvatars[4] },
          { id: "p5", name: participantNames[4], avatarUrl: realAvatars[5] },
          { id: "p6", name: participantNames[5], avatarUrl: realAvatars[6] },
        ],
      },
      {
        id: "m2",
        universe: "Demon Slayer",
        title: "Rassemblement Demon Slayer",
        imageUrl: "https://res.cloudinary.com/dkw8snibz/image/upload/v1768041995/PXL_20240713_094802328.RAW-01.COVER_kmyial.jpg",
        time: "15:30",
        location: "Play Azur Festival",
        currentParticipants: 32,
        maxParticipants: 50,
        organizerName: "TanjiroCos",
        organizerAvatar: realAvatars[9], // Tanjiro avatar
        isJoined: isJoined("m2"),
        description: "On refait la scène de combat de l'épisode final ! Venez nombreux avec vos Nichirin !",
        participants: [
          { id: "p7", name: participantNames[6], avatarUrl: realAvatars[7] },
          { id: "p8", name: participantNames[7], avatarUrl: realAvatars[8] },
          { id: "p9", name: participantNames[8], avatarUrl: realAvatars[10] },
          { id: "p10", name: participantNames[9], avatarUrl: realAvatars[11] },
          { id: "p11", name: "Akira", avatarUrl: realAvatars[12] },
        ],
      },
      {
        id: "m3",
        universe: "Cosplay Général",
        title: "Rassemblement Cosplay TOUS",
        imageUrl: "https://res.cloudinary.com/dkw8snibz/image/upload/v1768042181/Cosplay-Garden-V3-3_172226_idigge.jpg",
        time: "16:30",
        location: "Play Azur Festival",
        currentParticipants: 48,
        maxParticipants: 100,
        organizerName: "CosplayTeam",
        organizerAvatar: realAvatars[14],
        isJoined: isJoined("m3"),
        isFeatured: true,
        description: "Tous les cosplayers sont les bienvenus ! Grand rassemblement photo pour immortaliser cette journée épique !",
        participants: [
          { id: "p12", name: "Luna", avatarUrl: realAvatars[13] },
          { id: "p13", name: "Kenji", avatarUrl: realAvatars[15] },
          { id: "p14", name: "Nami", avatarUrl: realAvatars[16] },
          { id: "p15", name: "Ryu", avatarUrl: realAvatars[17] },
          { id: "p16", name: "Emi", avatarUrl: realAvatars[18] },
          { id: "p17", name: "Taro", avatarUrl: realAvatars[19] },
        ],
      },
    ];
  }, [isJoined]);

  // Get favorite slot objects for the FAB
  const favoriteSlotObjects = useMemo(() => 
    demoSchedule.filter(slot => favoriteSlots.includes(slot.id)),
    [demoSchedule, favoriteSlots]
  );

  // Combine DB meetups with demo meetups (demo as fallback)
  const combinedMeetups: CosplayMeetup[] = useMemo(() => {
    // Convert DB meetups to CosplayMeetup format
    const formattedDbMeetups: CosplayMeetup[] = dbMeetups.map(m => ({
      id: m.id,
      universe: m.theme,
      title: m.title,
      imageUrl: m.cover_image || "https://res.cloudinary.com/dkw8snibz/image/upload/v1768042181/Cosplay-Garden-V3-3_172226_idigge.jpg",
      time: m.start_time.slice(0, 5),
      location: m.location,
      currentParticipants: m.current_participants,
      maxParticipants: m.max_participants,
      organizerName: m.organizer?.display_name || m.organizer?.username || "Organisateur",
      organizerAvatar: m.organizer?.avatar_url || undefined,
      organizerId: m.organizer_id,
      isJoined: m.isJoined,
      description: m.description || undefined,
      participants: m.participants?.map(p => ({
        id: p.user_id,
        name: p.profile?.display_name || "Participant",
        avatarUrl: p.profile?.avatar_url || undefined,
      })) || [],
    }));
    
    // Return DB meetups + demo meetups as fallback
    return [...formattedDbMeetups, ...demoMeetups];
  }, [dbMeetups, demoMeetups]);

  const joinedMeetupObjects = useMemo(() => 
    combinedMeetups.filter(meetup => joinedMeetups.includes(meetup.id) || meetup.isJoined),
    [combinedMeetups, joinedMeetups]
  );

  // Meetup handlers
  const handleJoinMeetup = async (meetupId: string) => {
    if (meetupId.startsWith("m")) {
      await localJoinMeetup(meetupId);
    } else {
      await dbJoinMeetup(meetupId);
    }
  };

  const handleLeaveMeetup = async (meetupId: string) => {
    if (meetupId.startsWith("m")) {
      await localLeaveMeetup(meetupId);
    } else {
      await dbLeaveMeetup(meetupId);
    }
  };

  const handleCreateMeetup = async (data: MeetupFormData) => {
    await createMeetup({
      title: data.title,
      theme: data.universe,
      location: data.location,
      start_time: data.time,
      max_participants: data.maxParticipants,
      description: data.description || undefined,
      cover_image: data.coverPreviewUrl || undefined,
      event_id: eventId,
    });
    toast.success("Ton Meetup est en ligne ! +50 XP d'Organisateur 🎉");
  };

  // Demo friends per slot with real cosplay avatars
  const realAvatarsForFriends = [
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044479/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.27.53_lvsgmb.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044489/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.06_c4x9tj.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044556/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.13_fdbjcy.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044546/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.03_bup3qv.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044522/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.38_aclsfk.png",
  ];
  
  const friendsPerSlot: Record<string, FriendParticipant[]> = {
    "s2": [
      { id: "f1", name: "Yuki", avatarUrl: realAvatarsForFriends[0] },
      { id: "f2", name: "Hana", avatarUrl: realAvatarsForFriends[1] },
    ],
    "s5": [
      { id: "f1", name: "Yuki", avatarUrl: realAvatarsForFriends[0] },
      { id: "f3", name: "Kenji", avatarUrl: realAvatarsForFriends[2] },
      { id: "f4", name: "Mei", avatarUrl: realAvatarsForFriends[3] },
    ],
    "s6": [
      { id: "f2", name: "Hana", avatarUrl: realAvatarsForFriends[1] },
    ],
    "s11": [
      { id: "f1", name: "Yuki", avatarUrl: realAvatarsForFriends[0] },
      { id: "f2", name: "Hana", avatarUrl: realAvatarsForFriends[1] },
      { id: "f3", name: "Kenji", avatarUrl: realAvatarsForFriends[2] },
    ],
    "s13": [
      { id: "f4", name: "Mei", avatarUrl: realAvatarsForFriends[3] },
      { id: "f5", name: "Ryu", avatarUrl: realAvatarsForFriends[4] },
    ],
  };

  const participantsPerSlot: Record<string, number> = {
    "s1": 120,
    "s2": 85,
    "s3": 0,
    "s4": 42,
    "s5": 156,
    "s6": 210,
    "s7": 48,
    "s8": 95,
    "s9": 180,
    "s10": 320,
    "s11": 250,
    "s12": 65,
    "s13": 300,
  };

  const isRegistered = !!myRegistration;
  // isPastEvent is computed earlier (line ~105) for hook gating
  const spotsLeft = event?.max_attendees
    ? Math.max(0, event.max_attendees - participants.length)
    : null;

  // Content counts pour le bandeau mémoire des événements passés
  const pastIds = useMemo(() => (isPastEvent && eventId ? [eventId] : []), [isPastEvent, eventId]);
  const { data: pastContentCounts = {} } = useEventContentCounts(pastIds);
  const thisEventCounts = eventId ? pastContentCounts[eventId] : undefined;

  // SEO meta tags
  useEffect(() => {
    if (!event) return;
    const originalTitle = document.title;
    document.title = `${event.title} — Manga Paradise`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:")) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const desc = event.description
      ? event.description.slice(0, 160)
      : `Événement ${event.title} sur Manga Paradise.`;
    const img = event.cover_image || event.image_url || "";

    setMeta("description", desc);
    setMeta("og:title", event.title);
    setMeta("og:description", desc);
    setMeta("og:type", "event");
    if (img) setMeta("og:image", img);
    setMeta("og:url", window.location.href);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", event.title);
    setMeta("twitter:description", desc);
    if (img) setMeta("twitter:image", img);

    return () => {
      document.title = originalTitle;
    };
  }, [event]);

  // Check if coming from cosplay planning
  const fromCosplayPlanning = searchParams.get('from') === 'cosplay_planning';
  
  // Handle quick registration (simple visitor)
  const handleQuickRegister = async () => {
    if (!user?.id || !eventId) return;
    
    await registerMutation.mutateAsync({
      eventId,
      userId: user.id,
      role: "visitor",
    });
  };
  
  // Navigate to agenda
  const goToAgenda = () => {
    navigate("/espace-membre/billets");
  };

  // Generate QR Code URL
  const generateQRCodeUrl = (eventId: string, userId: string) => {
    const data = encodeURIComponent(JSON.stringify({
      type: "event_checkin",
      eventId,
      userId
    }));
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${data}`;
  };

  // Handle auto-join party after registration
  const autoJoinPartyId = searchParams.get('auto_join_party_id');
  
  useEffect(() => {
    const processAutoJoin = async () => {
      if (!autoJoinPartyId || !user?.id || !isRegistered || autoJoinProcessed) return;
      
      setAutoJoinProcessed(true);
      
      try {
        // First check if there's a pending invitation for this party
        const { data: invitation } = await supabase
          .from('party_invitations')
          .select('id')
          .eq('party_id', autoJoinPartyId)
          .eq('receiver_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();
        
        if (invitation) {
          // Accept the invitation
          await acceptInvitationMutation.mutateAsync({
            invitationId: invitation.id,
            partyId: autoJoinPartyId,
            userId: user.id,
          });
          toast.success("Inscription validée et groupe rejoint !");
        } else {
          // Just join the party directly
          await joinPartyMutation.mutateAsync({
            partyId: autoJoinPartyId,
            userId: user.id,
          });
          toast.success("Tu as rejoint le groupe !");
        }
        
        // Clean up the URL parameter
        searchParams.delete('auto_join_party_id');
        setSearchParams(searchParams, { replace: true });
      } catch (error) {
        console.error("Error auto-joining party:", error);
        toast.error("Impossible de rejoindre le groupe automatiquement");
        // Clean up even on error
        searchParams.delete('auto_join_party_id');
        setSearchParams(searchParams, { replace: true });
      }
    };
    
    processAutoJoin();
  }, [autoJoinPartyId, user?.id, isRegistered, autoJoinProcessed, searchParams, setSearchParams]);

  const handleRSVPSubmit = async (data: RSVPData) => {
    if (!user?.id || !eventId) return;

    if (isRegistered && myRegistration) {
      await updateMutation.mutateAsync({
        participationId: myRegistration.id,
        eventId,
        plannedCosplayId: data.plannedCosplayId,
        role: data.role,
        attendanceDetails: data.attendanceDetails,
        cosplayData: data.cosplayData,
      });
    } else {
      await registerMutation.mutateAsync({
        eventId,
        userId: user.id,
        plannedCosplayId: data.plannedCosplayId,
        role: data.role,
        attendanceDetails: data.attendanceDetails,
        cosplayData: data.cosplayData,
      });
    }

    // Sync unified lineup (best-effort, silent on error)
    if (event) {
      syncLineupMutation.mutate({
        userId: user.id,
        eventId,
        eventDate: event.date,
        cosplayVestiaireId: data.role === "cosplayer" ? data.plannedCosplayId : null,
      });
    }
  };

  // NEW: Handle registration from Visual Line-Up wizard
  const handleRegistrationSubmit = async (data: RegistrationData) => {
    if (!user?.id || !eventId) return;

    const cosplayVestiaireId = data.cosplay_data?.[0]?.cosplayId || null;

    await registerMutation.mutateAsync({
      eventId,
      userId: user.id,
      role: data.role,
      attendanceDates: data.attendance_dates,
      cosplayData: data.cosplay_data,
      plannedCosplayId: cosplayVestiaireId,
    });

    // Sync unified lineup (best-effort, silent on error)
    if (event) {
      syncLineupMutation.mutate({
        userId: user.id,
        eventId,
        eventDate: event.date,
        cosplayVestiaireId,
      });
    }

    setRsvpModalOpen(false);
  };

  const handleUnregister = async () => {
    if (!user?.id || !eventId) return;
    // Cleanup lineup entries before unregistering
    cleanupLineupsMutation.mutate({ userId: user.id, eventId });
    await unregisterMutation.mutateAsync({ eventId, userId: user.id });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event?.title,
        text: `Rejoins-moi à ${event?.title} !`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "upcoming" || status === "places-disponibles") {
      return <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30">Places disponibles</Badge>;
    }
    if (status === "places-limitees") {
      return <Badge className="bg-accent/20 text-accent border-accent/30">Places limitées</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive">Annulé</Badge>;
    }
    return <Badge variant="secondary">Complet</Badge>;
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      "Atelier": "🎨",
      "Projection": "🎬",
      "Gaming": "🎮",
      "Cosplay": "🎭",
      "Rencontre": "🤝",
      "Convention": "🎪",
      "general": "📅",
    };
    return map[category] || "📅";
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-4xl mb-4">Événement introuvable</h1>
          <p className="text-muted-foreground mb-8">
            Cet événement n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate("/agenda")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'agenda
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Format date display — utilise date_debut/date_fin (MVP Agenda) en priorité
  const eventAnyForDate = event as any;
  const dateDebutStr: string | null = eventAnyForDate.date_debut ?? null;
  const dateFinStr: string | null = eventAnyForDate.date_fin ?? null;

  const isMultiDay = event.schedule && event.schedule.length > 1;
  const formattedDate = (() => {
    if (isMultiDay && event.schedule) {
      return `Du ${format(parseISO(event.schedule[0].date), "d", { locale: fr })} au ${format(parseISO(event.schedule[event.schedule.length - 1].date), "d MMMM yyyy", { locale: fr })}`;
    }
    // Priorité: date_debut (MVP) > date (legacy)
    const primaryDate = dateDebutStr ?? event.date;
    if (primaryDate) {
      try {
        return format(new Date(primaryDate), "EEEE d MMMM yyyy", { locale: fr });
      } catch {
        return primaryDate;
      }
    }
    return "";
  })();

  // Type événement MVP (nouveau champ) avec fallback sur category
  const typeEvenement: string | null = eventAnyForDate.type_evenement ?? null;
  const typeEvenementLabel: Record<string, string> = {
    convention: "🎌 Convention",
    tournoi: "⚔️ Tournoi",
    atelier: "🎨 Atelier",
    meetup: "🤝 Meetup",
    concert: "🎵 Concert",
    exposition: "🖼️ Exposition",
    projection: "🎬 Projection",
    autre: "✨ Événement",
  };

  // Cover image MVP (priorité: cover_image > image_url)
  const coverImageUrl: string | null = eventAnyForDate.cover_image ?? event.image_url ?? null;

  // Helpers pour Google Calendar et .ics
  const buildGoogleCalendarUrl = () => {
    const startDate = dateDebutStr ?? event.date;
    const endDate = dateFinStr ?? eventAnyForDate.end_date ?? startDate;
    if (!startDate) return "#";

    const formatForGoogle = (d: string) => {
      try {
        return new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      } catch {
        return "";
      }
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`,
      details: event.description ?? "",
      location: [eventAnyForDate.adresse, eventAnyForDate.venue_name, eventAnyForDate.city]
        .filter(Boolean)
        .join(", "),
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const downloadICS = () => {
    const startDate = dateDebutStr ?? event.date;
    const endDate = dateFinStr ?? eventAnyForDate.end_date ?? startDate;
    if (!startDate) return;

    const formatForICS = (d: string) => {
      try {
        return new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      } catch {
        return "";
      }
    };

    const location = [eventAnyForDate.adresse, eventAnyForDate.venue_name, eventAnyForDate.city]
      .filter(Boolean)
      .join(", ");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Manga Paradise//Agenda//FR",
      "BEGIN:VEVENT",
      `UID:${event.id}@manga-paradise.fr`,
      `DTSTART:${formatForICS(startDate)}`,
      `DTEND:${formatForICS(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description ?? "").replace(/\n/g, "\\n")}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("📅 Fichier .ics téléchargé !");
  };

  // Build precise location parts (réutilise eventAnyForDate défini plus haut)
  const eventAny = eventAnyForDate;
  const venueName = eventAny.venue_name || null;
  const cityName = eventAny.city || null;
  const regionName = eventAny.region || null;

  // Parse price info
  const isPaid = event.price && event.price !== "Gratuit" && event.price !== "0€";
  const priceDisplay = isPaid ? event.price : "Gratuit";

  // Truncate description
  const MAX_DESC_LENGTH = 300;
  const descriptionText = event.description || "";
  const isLongDescription = descriptionText.length > MAX_DESC_LENGTH;
  const displayedDescription = showFullDescription 
    ? descriptionText 
    : descriptionText.slice(0, MAX_DESC_LENGTH);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Priorité: cover_image (MVP Agenda) > image_url (legacy) > placeholder */}
            <img
              src={coverImageUrl || eventsSpace}
              alt={event.title}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            {/* Smart Back Button + Breadcrumbs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {fromCosplayPlanning && (
                  <SmartBackButton 
                    fallbackPath="/espace-membre/parametres?tab=cosplayer"
                    fallbackLabel="Retour au Line-Up"
                    variant="default"
                    className="bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300"
                  />
                )}
                <SmartBackButton 
                  fallbackPath="/agenda" 
                  fallbackLabel="Retour à l'agenda"
                />
              </div>
              <Breadcrumbs currentPage={event.title} />
            </motion.div>

            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Category & Status — inclut le nouveau type_evenement MVP */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Badge type_evenement MVP (priorité) */}
                  {typeEvenement && typeEvenement !== "autre" ? (
                    <Badge
                      className="text-sm px-3 py-1 font-semibold"
                      style={{
                        background: "rgba(255,0,127,0.15)",
                        border: "1px solid rgba(255,0,127,0.4)",
                        color: "hsl(var(--mp-primary))",
                      }}
                    >
                      {typeEvenementLabel[typeEvenement] ?? typeEvenement}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {getCategoryEmoji(event.category)} {event.category}
                    </Badge>
                  )}
                  {getStatusBadge(event.status)}
                  {isPastEvent && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Événement passé
                    </Badge>
                  )}
                </div>

                {/* Title + Inscrit Badge */}
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="font-display text-4xl md:text-6xl leading-tight">
                    {event.title}
                  </h1>
                  {isRegistered && (
                    <Badge className="bg-turquoise/20 text-turquoise px-4 py-2 text-base">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Tu es inscrit(e) !
                    </Badge>
                  )}
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sakura" />
                    <span className="capitalize">{formattedDate}</span>
                  </div>
                  {event.time && !isMultiDay && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-sakura" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {/* Location in header - Venue, City */}
                  {(venueName || cityName) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-sakura" />
                      <span className="font-medium text-foreground">
                        {venueName && cityName 
                          ? `${venueName}, ${cityName}` 
                          : venueName || cityName}
                      </span>
                    </div>
                  )}
                  {/* Fallback to old location field in header */}
                  {!venueName && !cityName && event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-sakura" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {/* Price badge in header */}
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                        <Euro className="w-3 h-3" />
                        Payant
                      </Badge>
                    ) : (
                      <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30">
                        Gratuit
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contest Banner (if event has contest) */}
        {event.has_contest && (
          <section className="py-8 bg-gradient-to-r from-[hsl(var(--mp-saffron))]/10 via-[hsl(var(--mp-saffron))]/5 to-transparent border-y border-[hsl(var(--mp-saffron))]/20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-5xl mx-auto"
              >
                <Card className="bg-gradient-to-br from-black/60 via-black/40 to-transparent backdrop-blur-xl border-[hsl(var(--mp-saffron))]/30 shadow-[0_0_30px_rgba(255,215,0,0.2)] overflow-hidden">
                  <div className="relative p-6 md:p-8">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--mp-saffron))]/5 via-transparent to-[hsl(var(--mp-saffron))]/5 animate-pulse" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                      {/* Icon Section */}
                      <div className="flex-shrink-0">
                        <motion.div
                          animate={{
                            rotate: [0, -5, 5, -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                          }}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[hsl(var(--mp-saffron))] to-[#FFA500] flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                        >
                          <Trophy className="w-10 h-10 md:w-12 md:h-12 text-black" />
                        </motion.div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 text-center md:text-left space-y-3">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                          <h2 className="font-display text-2xl md:text-3xl text-[hsl(var(--mp-saffron))]">
                            🏆 Concours Cosplay Officiel
                          </h2>
                          <Badge className="bg-emerald-500/80 text-white border-0 backdrop-blur-sm">
                            ✓ Inscriptions Ouvertes
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm md:text-base">
                          Cet événement propose un <span className="text-[hsl(var(--mp-saffron))] font-semibold">concours cosplay</span> avec passage sur scène !
                        </p>

                        {/* Contest Countdown Timer */}
                        {contestActivity?.contest_config?.registration_deadline && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                              ⏰ Temps restant pour s'inscrire au Concours Cosplay
                            </p>
                            <ContestCountdown 
                              deadline={contestActivity.contest_config.registration_deadline}
                              className="max-w-md mx-auto md:mx-0"
                            />
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Drama className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                            <span>Solo, Duo, Groupe</span>
                          </div>
                          <span className="text-muted-foreground/50">•</span>
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                            <span>Passage sur scène</span>
                          </div>
                          <span className="text-muted-foreground/50">•</span>
                          <div className="flex items-center gap-1">
                            <Users2 className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                            <span>Jury professionnel</span>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="flex-shrink-0">
                        <Button
                          size="lg"
                          onClick={() => {
                            // Scroll to contest section (anchor #contest)
                            const contestSection = document.getElementById('contest');
                            if (contestSection) {
                              contestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="bg-gradient-to-r from-[hsl(var(--mp-saffron))] to-[#FFA500] hover:from-[#FFA500] hover:to-[hsl(var(--mp-saffron))] text-black font-display text-lg px-8 py-6 shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transition-all"
                        >
                          <Trophy className="w-5 h-5 mr-2" />
                          Je participe au concours
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* Past Event: Banner → Contribution CTA → Community Gallery → Share */}
        {isPastEvent && (
          <section className="pt-6 pb-0">
            <div className="container mx-auto px-4 max-w-4xl space-y-5">
              {/* 1. Bandeau mémoire */}
              <PastEventBanner
                hasPhotos={!!thisEventCounts?.photos}
                hasLineups={!!thisEventCounts?.lineups}
                hasParticipants={!!thisEventCounts?.participants}
              />

              {/* 2. CTA Contribution — registered participants only */}
              {isRegistered && user && (
                <EventContributionBanner
                  onAddPhotos={() => setAddPhotosSheetOpen(true)}
                  onViewMyCosplays={() => {
                    const el = document.getElementById("lineup");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              )}

              {/* 3. Community Gallery — always rendered on past events */}
              <motion.div
                id="photos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-5 sm:p-6 border-teal-500/25 bg-[#12121E]/80 backdrop-blur-md">
                  <EventCommunityGallery
                    eventId={event.id}
                    eventTitle={event.title}
                    isParticipant={isRegistered}
                    onAddPhotos={() => setAddPhotosSheetOpen(true)}
                  />
                </Card>
              </motion.div>

              {/* 4. Partage */}
              <EventShareBlock
                eventTitle={event.title}
                eventUrl={window.location.href}
              />
            </div>
          </section>
        )}

        {/* Share Block for non-past events */}
        {!isPastEvent && (
          <section className="pt-6 pb-0">
            <div className="container mx-auto px-4 max-w-4xl">
              <EventShareBlock
                eventTitle={event.title}
                eventUrl={window.location.href}
              />
            </div>
          </section>
        )}

        {/* Main Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {!isPastEvent && user ? (
                    isRegistered ? (
                      <>
                        <Button
                          size="lg"
                          onClick={() => setRsvpModalOpen(true)}
                          className="bg-turquoise hover:bg-turquoise/90 text-tokyo-night font-display gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier ma venue
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={handleUnregister}
                          disabled={unregisterMutation.isPending}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
                        >
                          {unregisterMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Annuler
                        </Button>
                      </>
                    ) : exhibitorRequest ? (
                      // User already has an exhibitor request
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={cn(
                            "px-4 py-2 text-sm",
                            exhibitorRequest.status === "approved" 
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : exhibitorRequest.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-destructive/20 text-destructive border-destructive/30"
                          )}
                        >
                          <Store className="w-4 h-4 mr-2" />
                          {exhibitorRequest.status === "approved" && "🟣 Stand Confirmé"}
                          {exhibitorRequest.status === "pending" && "🟠 Demande en cours"}
                          {exhibitorRequest.status === "rejected" && "Demande refusée"}
                        </Badge>
                        {exhibitorRequest.status !== "approved" && (
                          <Button
                            size="lg"
                            onClick={() => setRsvpModalOpen(true)}
                            className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display gap-2"
                          >
                            <Users className="w-5 h-5" />
                            Participer en visiteur
                          </Button>
                        )}
                      </div>
                    ) : isExhibitorEligibleUser ? (
                      // Creator can choose between visitor and exhibitor
                      <Button
                        size="lg"
                        onClick={() => setExhibitorModalOpen(true)}
                        className="bg-gradient-to-r from-purple-500 to-sakura hover:opacity-90 text-white font-display text-lg px-8 gap-2"
                      >
                        <Store className="w-5 h-5" />
                        Je participe !
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => setRsvpModalOpen(true)}
                        className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display text-lg px-8 gap-2"
                      >
                        <Users className="w-5 h-5" />
                        Je participe !
                      </Button>
                    )
                  ) : !user ? (
                    <Button
                      size="lg"
                      onClick={() => navigate("/auth")}
                      className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display gap-2"
                    >
                      Connecte-toi pour participer
                    </Button>
                  ) : null}
                  
                  {/* Quick Registration Button ("J'y vais !") */}
                  {!isPastEvent && user && (
                    <>
                      {isRegistered ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setShowTicketModal(true)}
                            className="bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20 gap-2"
                          >
                            <Ticket className="w-5 h-5" />
                            Voir mon billet
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleUnregister}
                            disabled={unregisterMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            title="Annuler mon inscription"
                          >
                            {unregisterMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="lg"
                          onClick={handleQuickRegister}
                          disabled={registerMutation.isPending}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-display gap-2"
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CalendarPlus className="w-5 h-5" />
                          )}
                          J'y vais !
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Partager
                  </Button>

                  {/* ── Boutons Agenda MVP ── */}
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="gap-2 border-[hsl(var(--mp-info))]/30 text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/10 hover:border-[hsl(var(--mp-info))]/60"
                  >
                    <a
                      href={buildGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Google Calendar
                    </a>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={downloadICS}
                    className="gap-2 border-[hsl(var(--mp-saffron))]/30 text-[hsl(var(--mp-saffron))] hover:bg-[hsl(var(--mp-saffron))]/10 hover:border-[hsl(var(--mp-saffron))]/60"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Télécharger .ics
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Countdown Banner */}
        {!isPastEvent && (
          <section className="pb-6">
            <div className="container mx-auto px-4 space-y-4">
              <EventCountdown
                eventDate={event.date}
                eventTime={event.time}
                eventTitle={event.title}
                eventLocation={event.location}
                eventDescription={event.description}
                isRegistered={isRegistered}
              />
              
              {/* Friends Participating Banner */}
              <FriendsParticipatingBanner eventId={event.id} />
            </div>
          </section>
        )}

        {/* Description Section - Before Grid */}
        {descriptionText && (
          <section className="pb-8">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 border-sakura/20 bg-card/50 backdrop-blur">
                  <h2 className="font-display text-xl mb-3 flex items-center gap-2">
                    📝 À propos de l'événement
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {displayedDescription}
                    {isLongDescription && !showFullDescription && "..."}
                  </p>
                  {isLongDescription && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-sakura hover:text-sakura/80 gap-1"
                    >
                      {showFullDescription ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Voir moins
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Voir plus
                        </>
                      )}
                    </Button>
                  )}
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* Artist Alley Section - After Description */}
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <ArtistAlleySection eventId={event.id} />
          </div>
        </section>
        {/* Programme & Meetups Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content with Tabs (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Programme / Meetups Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-6 bg-muted/30">
                    <TabsTrigger value="programme" className="gap-2 data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
                      <ListMusic className="w-4 h-4" />
                      Programme Officiel
                    </TabsTrigger>
                    <TabsTrigger value="meetups" className="gap-2 data-[state=active]:bg-turquoise/20 data-[state=active]:text-turquoise">
                      <Users2 className="w-4 h-4" />
                      Meet-ups
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="programme" className="mt-0">
                    <EventScheduleTimeline
                      schedule={realSchedule.length > 0 ? realSchedule : demoSchedule}
                      eventDate={event.date}
                      eventEndDate={event.end_date || undefined}
                      eventId={eventId}
                      friendsPerSlot={friendsPerSlot}
                      participantsPerSlot={participantsPerSlot}
                    />
                  </TabsContent>

                  <TabsContent value="meetups" className="mt-0">
                    <CosplayMeetupsSection
                      meetups={combinedMeetups}
                      onJoinMeetup={handleJoinMeetup}
                      onLeaveMeetup={handleLeaveMeetup}
                      onCreateMeetup={handleCreateMeetup}
                      isLoading={meetupsLoading}
                      currentUserName={currentUserProfile?.display_name || currentUserProfile?.username || "Nakama"}
                      currentUserAvatar={currentUserProfile?.avatar_url || undefined}
                    />
                  </TabsContent>
                </Tabs>

                {/* Visual Line-Up */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="p-6 border-sakura/20 bg-card/50 backdrop-blur">
                    <ParticipantGrid
                      eventId={event.id}
                      eventSchedule={event.schedule || undefined}
                    />
                  </Card>
                </motion.div>

                {/* Quests Section — only for live events (table may not exist) */}
                {!isPastEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="p-6 border-turquoise/20 bg-card/50 backdrop-blur">
                      <div className="flex items-center gap-2 mb-4">
                        <Scroll className="w-5 h-5 text-turquoise" />
                        <h3 className="font-display text-xl">Quêtes de l'événement</h3>
                      </div>
                      <EventQuestsBoard eventId={event.id} />
                    </Card>
                  </motion.div>
                )}

                {/* Party Finder Section — only for live events */}
                {!isPastEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Card className="p-6 border-[hsl(var(--mp-info))]/15 bg-black/40 backdrop-blur-md space-y-4">
                      {user ? (
                        <EventPartyFinderOverview
                          eventId={event.id}
                          userId={user.id}
                        />
                      ) : (
                        <div className="py-6 text-center space-y-2">
                          <Swords className="w-8 h-8 text-mp-ink-muted mx-auto" />
                          <p className="text-sm text-mp-ink-muted">
                            Connecte-toi pour accéder au Party Finder.
                          </p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Sidebar - Details (1/3) */}
              <div className="space-y-6">
                {/* Event Details Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="p-6 border-sakura/20 bg-card/50 backdrop-blur">
                    <h3 className="font-display text-lg mb-4">📋 Détails</h3>
                    
                    <div className="space-y-4">
                      {/* Date / Schedule */}
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-sakura mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground capitalize">{formattedDate}</p>
                          
                          {/* Multi-day schedule details */}
                          {isMultiDay && event.schedule && (
                            <div className="mt-2 space-y-1.5">
                              {event.schedule.map((day, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-2 py-1">
                                  <span className="font-medium capitalize">
                                    📅 {format(parseISO(day.date), "EEEE d", { locale: fr })}
                                  </span>
                                  <span className="text-sakura">:</span>
                                  <span>
                                    {day.start_time}
                                    {day.end_time && ` - ${day.end_time}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Single day time */}
                          {!isMultiDay && event.time && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {event.time}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Location with precise formatting - 2 distinct levels */}
                      {(venueName || cityName || regionName || event.location) && (
                        <>
                          <Separator />
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-sakura mt-0.5" />
                            <div className="flex-1 space-y-1">
                              {/* Venue name - Bold white */}
                              {venueName && (
                                <p className="font-semibold text-foreground text-base">
                                  {venueName}
                                </p>
                              )}
                              {/* City • Region - Smaller gray, on second line */}
                              {(cityName || regionName) && (
                                <p className="text-sm text-muted-foreground">
                                  {cityName}
                                  {cityName && regionName && (
                                    <span className="mx-1.5">•</span>
                                  )}
                                  {regionName && (
                                    <span className="text-muted-foreground/80">{regionName}</span>
                                  )}
                                </p>
                              )}
                              {/* Fallback to old location field */}
                              {!venueName && !cityName && event.location && (
                                <p className="text-foreground">{event.location}</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Participants count */}
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-turquoise mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">
                            {participants.length} inscrit{participants.length > 1 ? "s" : ""}
                          </p>
                          {event.max_attendees && (
                            <p className="text-sm text-muted-foreground">
                              {spotsLeft} place{spotsLeft !== 1 ? "s" : ""} restante{spotsLeft !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price Section */}
                      <Separator />
                      <div className="flex items-start gap-3">
                        {isPaid ? (
                          <Euro className="w-5 h-5 text-accent mt-0.5" />
                        ) : (
                          <Ticket className="w-5 h-5 text-turquoise mt-0.5" />
                        )}
                        <div>
                          <p className={cn(
                            "font-medium",
                            isPaid ? "text-foreground" : "text-turquoise font-bold"
                          )}>
                            {priceDisplay}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isPaid ? "Tarif d'entrée" : "Entrée libre"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Event Location Map - NEW */}
                {(venueName || cityName || event.location) && (
                  <EventLocationMap
                    address={venueName && cityName ? `${venueName}, ${cityName}` : event.location || ""}
                  />
                )}

                {/* Mini reminder */}
                {isRegistered && !isPastEvent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="p-4 bg-turquoise/10 border-turquoise/30">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🐌</span>
                        <div>
                          <p className="font-medium text-turquoise text-sm">
                            Tu recevras un rappel
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ton Den Den Mushi te préviendra 24h avant !
                          </p>
                        </div>
                      </div>
                    </Card>
        </motion.div>
      )}

      {/* My Planning FAB */}
      {user && (
        <MyPlanningFAB
          eventId={eventId}
          joinedMeetups={joinedMeetupObjects}
          onLeaveMeetup={handleLeaveMeetup}
        />
      )}
    </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* NEW: Visual Line-Up Registration Wizard */}
      {user && !isRegistered && (
        <EventRegistrationModal
          open={rsvpModalOpen}
          onOpenChange={setRsvpModalOpen}
          eventTitle={event.title}
          eventId={eventId}
          userId={user.id}
          onSubmit={handleRegistrationSubmit}
          isLoading={registerMutation.isPending}
          eventStartDate={event.date}
          eventEndDate={(event as any).end_date || null}
        />
      )}

      {/* OLD: RSVP Modal (for updates) */}
      {user && isRegistered && (
        <RSVPModal
          open={rsvpModalOpen}
          onOpenChange={setRsvpModalOpen}
          eventTitle={event.title}
          eventId={eventId}
          userId={user.id}
          onSubmit={handleRSVPSubmit}
          isLoading={registerMutation.isPending || updateMutation.isPending}
          existingParticipation={myRegistration ? {
            id: myRegistration.id,
            planned_cosplay_id: myRegistration.planned_cosplay_id,
            role: myRegistration.role,
            attendance_details: Array.isArray(myRegistration.attendance_details)
              ? myRegistration.attendance_details as unknown as import("@/components/events/RSVPModal").AttendanceDetail[]
              : null,
          } : null}
          eventStartDate={event.date}
          eventEndDate={(event as any).end_date || null}
          ticketingUrl={event.external_link || null}
        />
      )}
      
      {/* Exhibitor Request Modal (for creators) */}
      {user && eventId && (
        <ExhibitorRequestModal
          open={exhibitorModalOpen}
          onOpenChange={setExhibitorModalOpen}
          eventId={eventId}
          eventTitle={event.title}
          userId={user.id}
          userRole={userRole}
          onChooseVisitor={() => {
            // When user clicks "Visiteur", open the full RSVP wizard
            setRsvpModalOpen(true);
          }}
        />
      )}

      {/* Ticket QR Code Modal */}
      {user && event && (
        <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
          <DialogContent className="bg-mp-paper border-white/10 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-center">
                Mon Billet
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center">
              <h3 className="font-medium text-white mb-4">{event.title}</h3>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <img 
                  src={generateQRCodeUrl(event.id, user.id)}
                  alt="QR Code Billet"
                  className="w-48 h-48"
                />
              </div>

              <p className="text-xs text-white/50">
                Présente ce QR code à l'entrée de l'événement
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {fromCosplayPlanning && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 z-50 md:hidden"
        >
          <Button
            onClick={goToAgenda}
            className="bg-purple-500/90 backdrop-blur border border-purple-400/50 text-white shadow-lg shadow-purple-500/30 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Mon Agenda
          </Button>
        </motion.div>
      )}

      {/* Party Finder Modal — agnostic mode: eventId pre-filled, cosplayPlanId selected in Step 0 */}
      {user && eventId && (
        <PartyFinderModal
          open={partyFinderOpen}
          onClose={() => setPartyFinderOpen(false)}
          eventId={eventId}
        />
      )}

      {/* Add Photos to Event Sheet — past event community gallery contribution */}
      {user && eventId && isPastEvent && (
        <AddPhotosToEventSheet
          open={addPhotosSheetOpen}
          onOpenChange={setAddPhotosSheetOpen}
          eventId={eventId}
          eventTitle={event.title}
        />
      )}
    </div>
  );
};

export default EventDetail;
