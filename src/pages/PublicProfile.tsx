import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  User, MapPin, Edit, Share2, UserPlus, Users,
  BookOpen, Lock, Instagram, Globe, MessageCircle,
  Gamepad2, EyeOff, Plus, Calendar, Camera, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCosplayVestiaire } from "@/hooks/useCosplayVestiaire";
import { useAllCosplayPhotos } from "@/hooks/useAllCosplayPhotos";
import { useCosplayRegistrations } from "@/hooks/useCosplayRegistrations";
import { useOtakuLibrary, useAddOtakuLibraryItem } from "@/hooks/useOtakuCollections";
import { usePublicAchievements } from "@/hooks/useCosplayAchievements";
import { useFriendshipStatus, useSendFriendRequestWithContext, useCurrentEvents } from "@/hooks/useCosCard";
import { usePublicUserRoadmap } from "@/hooks/usePublicUserRoadmap";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { OTAKU_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SmartBackButton from "@/components/navigation/SmartBackButton";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import MemberLibraryGrid from "@/components/annuaire/MemberLibraryGrid";
import AchievementsTrophyShelf from "@/components/profile/AchievementsTrophyShelf";
import { PublicRoadmapTimeline } from "@/components/profile/PublicRoadmapTimeline";
import CosplayContestList from "@/components/profile/CosplayContestList";
import { CosplayerAgendaSection } from "@/components/profile/CosplayerAgenda";
import CosCardModal from "@/components/coscard/CosCardModal";
import MediaAddModal from "@/components/settings/MediaAddModal";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  EditableField, 
  EditableImage, 
  EditModeToggle, 
} from "@/components/profile/LiveProfileEditor";
import { useUpdateProfile, useUploadProfileImage } from "@/hooks/useUpdateProfile";
import { useCosplans } from "@/hooks/useCosplans";
import { 
  OtakuModal,
  CosplayModal,
  CreativeModal,
  SocialsModal,
  GamerModal,
} from "@/components/profile/modals";
import {
  CharacterDuelDisplay,
  MangaPantheon,
  OtakuDNA,
  GenreRadar,
  GamerIdentityCard,
  CosplayerCard,
  CreativeCard,
  VestiaireGallery,
  GamesGrid,
} from "@/components/profile/sections";

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  discord?: string;
  twitter?: string;
  website?: string;
  kofi?: string;
}

interface PrivacySettings {
  show_city?: boolean;
  show_otaku?: boolean;
  show_cosplay?: boolean;
  show_creator?: boolean;
  show_gamer?: boolean;
  show_achievements?: boolean;
  show_library?: boolean;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadProfileImage();
  const [isCosCardOpen, setIsCosCardOpen] = useState(false);
  const [selectedCosplay, setSelectedCosplay] = useState<any>(null);
  
  // Modal states for in-place editing
  const [showCosplayModal, setShowCosplayModal] = useState(false);
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [showOtakuModal, setShowOtakuModal] = useState(false);
  const [showGamerModal, setShowGamerModal] = useState(false);
  const [showSocialsModal, setShowSocialsModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<"manga" | "anime" | "game">("manga");
  
  // Fetch profile by username
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Check if this is current user's profile
  const isOwnProfile = user?.id === profile?.id;
  
  // Fetch related data
  const { data: cosplays, isLoading: cosplaysLoading } = useCosplayVestiaire(profile?.id);
  const { photos: allCosplayPhotos = [], stats: photoStats } = useAllCosplayPhotos(profile?.id);
  const { data: cosplayRegistrations, isLoading: registrationsLoading } = useCosplayRegistrations(profile?.id);
  const { data: library, isLoading: libraryLoading } = useOtakuLibrary(profile?.id);
  const { data: achievements, isLoading: achievementsLoading } = usePublicAchievements(profile?.id);
  const { data: friendshipStatus } = useFriendshipStatus(user?.id, profile?.id);
  const { data: currentEvents } = useCurrentEvents();
  const { data: cosplans } = useCosplans(profile?.id);
  const { data: roadmapActivities, isLoading: roadmapLoading } = usePublicUserRoadmap(profile?.id);
  const { data: currentEventFavorites } = useUserFavorites(currentEvents?.[0]?.id);
  const addLibraryItem = useAddOtakuLibraryItem();
  const sendFriendRequest = useSendFriendRequestWithContext();

  const handleSendFriendRequest = async () => {
    if (!user?.id || !profile?.id) {
      toast.error("Vous devez être connecté");
      return;
    }
    
    try {
      await sendFriendRequest.mutateAsync({
        requesterId: user.id,
        addresseeId: profile.id,
        meetingEventId: currentEvents?.[0]?.id || null,
        meetingContext: null,
      });
      toast.success("Demande de Nakama envoyée !");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleShare = () => {
    setIsCosCardOpen(true);
  };

  // Handle private profile
  if (!isLoading && profile?.profile_visibility === "private" && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Lock className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-2">Profil Privé</h1>
          <p className="text-muted-foreground">Ce profil n'est pas accessible au public.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Footer />
      </div>
    );
  }

  // Handle not found
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-2">Profil introuvable</h1>
          <p className="text-muted-foreground">L'utilisateur @{username} n'existe pas.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || "Membre";
  const socialLinks: SocialLinks = (profile.social_links as SocialLinks) || {};
  const privacySettings: PrivacySettings = ((profile as any).privacy_settings as PrivacySettings) || {
    show_city: true,
    show_otaku: true,
    show_cosplay: true,
    show_creator: true,
    show_gamer: true,
    show_achievements: true,
    show_library: true,
  };
  const otakuClass = profile.otaku_class ? OTAKU_CLASSES[profile.otaku_class as keyof typeof OTAKU_CLASSES] : null;
  const mangas = library?.filter((item) => item.type === "MANGA") || [];
  const hasCosplays = cosplays && cosplays.length > 0;
  const isCosplayerModeActive = (profile as any).is_cosplayer_mode_active === true;
  const hasCreatorProfile = profile.is_creator_profile_active && profile.creator_domains?.length > 0;
  
  // Extract extended profile data
  const extProfile = profile as any;
  const cosplaySpecialties = extProfile.cosplay_specialties || [];
  const cosplayYearsExperience = extProfile.cosplay_years_experience;
  const cosplayCollabPrefs = extProfile.cosplay_collaboration_prefs || [];
  const creativeCommissionStatus = extProfile.creative_commission_status;
  const creativeCollaborationTypes = extProfile.creative_collaboration_types || [];
  const creativeSoftwareSkills = extProfile.creative_software_skills || [];
  const creativeHardwareEquipment = extProfile.creative_hardware_equipment;
  const gamingPlatforms = extProfile.gaming_platforms || [];
  const favoriteGenres = extProfile.favorite_genres || [];
  const isGamerModeActive = extProfile.is_gamer_mode_active === true;
  const gamerIds = extProfile.gamer_ids || {};
  const gamerPlayStyle = extProfile.gamer_play_style;
  const games = library?.filter((item) => item.type === "GAME") || [];
  
  // ============================================
  // VISIBILITY LOGIC: Dynamic Tab Display
  // ============================================
  
  // For Owner: Always show tabs (even if private - with indicator)
  // For Visitor: Only show tabs that are public AND have content/active mode
  
  const showOtakuTab = isOwnProfile || (privacySettings.show_otaku !== false);
  const showCosplayTab = isOwnProfile || (privacySettings.show_cosplay !== false && isCosplayerModeActive);
  const showCreativeTab = isOwnProfile || (privacySettings.show_creator !== false && profile.is_creator_profile_active);
  const showGamerTab = isOwnProfile || (privacySettings.show_gamer !== false && isGamerModeActive);
  
  // Track if section is private (for owner visual indicator)
  const isOtakuPrivate = privacySettings.show_otaku === false;
  const isCosplayPrivate = privacySettings.show_cosplay === false;
  const isCreativePrivate = privacySettings.show_creator === false;
  const isGamerPrivate = privacySettings.show_gamer === false;
  
  // Respect privacy settings for city display
  const showCity = privacySettings.show_city !== false;
  const showAchievements = privacySettings.show_achievements !== false;
  const showLibrary = privacySettings.show_library !== false;

  // Helper function to check if section has data or in editing mode
  const shouldShowSection = (hasData: boolean) => isEditing || hasData;
  
  // Read tab from URL or determine default
  const urlTab = searchParams.get("tab");
  const getDefaultTab = () => {
    if (urlTab && ["otaku", "cosplayer", "creator", "gamer"].includes(urlTab)) {
      return urlTab;
    }
    if (showOtakuTab) return "otaku";
    if (showGamerTab) return "gamer";
    if (showCosplayTab) return "cosplayer";
    if (showCreativeTab) return "creator";
    return "otaku";
  };
  
  // Handle tab change with URL sync
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  // Count visible tabs
  const visibleTabsCount = [showOtakuTab, showGamerTab, showCosplayTab, showCreativeTab].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-20 pb-4">
        <div className="flex items-center justify-between">
          <SmartBackButton 
            fallbackPath="/communaute/annuaire" 
            fallbackLabel="Retour à l'annuaire"
          />
          <Breadcrumbs currentPage={displayName} />
        </div>
      </div>
      
      {/* Hero Zone */}
      <div className="relative">
        {/* Cover Image */}
        <div 
          className="h-48 md:h-64 w-full bg-gradient-hero relative"
          style={profile.cover_image_url ? {
            backgroundImage: `url(${profile.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Cover Edit Button */}
          {isOwnProfile && (
            <EditableImage
              imageUrl={profile.cover_image_url}
              onUpload={async (file) => {
                await uploadImage.mutateAsync({ file, type: 'cover' });
              }}
              isEditing={isEditing}
              type="cover"
            />
          )}
        </div>
        
        {/* Profile Info Block */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center relative",
                "bg-gradient-hero border-4 border-background shadow-xl overflow-hidden"
              )}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white/60" />
              )}
              
              {/* Avatar Edit Overlay */}
              {isOwnProfile && (
                <EditableImage
                  imageUrl={profile.avatar_url}
                  onUpload={async (file) => {
                    await uploadImage.mutateAsync({ file, type: 'avatar' });
                  }}
                  isEditing={isEditing}
                  type="avatar"
                />
              )}
            </motion.div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left pb-2">
              {/* Editable Display Name */}
              {isOwnProfile && isEditing ? (
                <EditableField
                  value={displayName}
                  onSave={async (value) => {
                    await updateProfile.mutateAsync({ display_name: value });
                  }}
                  isEditing={isEditing}
                  placeholder="Ton pseudo"
                  renderView={(val) => (
                    <h1 className="text-2xl md:text-3xl font-display text-foreground">{val}</h1>
                  )}
                />
              ) : (
                <h1 className="text-2xl md:text-3xl font-display text-foreground">{displayName}</h1>
              )}
              
              <p className="text-muted-foreground">@{profile.username}</p>
              
              {/* Editable City */}
              {showCity && (
                isOwnProfile && isEditing ? (
                  <EditableField
                    value={profile.city || ''}
                    onSave={async (value) => {
                      await updateProfile.mutateAsync({ city: value });
                    }}
                    isEditing={isEditing}
                    placeholder="Ta ville"
                    className="mt-1"
                    renderView={(val) => val ? (
                      <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                        <MapPin className="w-3 h-3" />
                        {val}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 flex items-center justify-center md:justify-start gap-1">
                        <MapPin className="w-3 h-3" />
                        Ajouter une ville
                      </p>
                    )}
                  />
                ) : profile.city ? (
                  <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {profile.city}
                  </p>
                ) : null
              )}
              
              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-3 flex-wrap">
                {socialLinks.instagram && (
                  <a 
                    href={`https://instagram.com/${socialLinks.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-sakura/20 transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-foreground" />
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a 
                    href={`https://tiktok.com/@${socialLinks.tiktok}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-sakura/20 transition-colors"
                  >
                    <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.discord && (
                  <div className="p-2 rounded-full bg-muted" title={socialLinks.discord}>
                    <MessageCircle className="w-4 h-4 text-foreground" />
                  </div>
                )}
                {socialLinks.website && (
                  <a 
                    href={socialLinks.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-sakura/20 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-foreground" />
                  </a>
                )}
                
                {/* Social Links Edit Button */}
                {isOwnProfile && isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSocialsModal(true)}
                    className="text-xs gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Modifier réseaux
                  </Button>
                )}
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex gap-2 pb-2">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </>
              ) : (
                <>
                  {friendshipStatus?.status === 'accepted' ? (
                    <Badge variant="secondary" className="px-3 py-1">
                      <Users className="w-3 h-3 mr-1" />
                      Nakama
                    </Badge>
                  ) : friendshipStatus?.status === 'pending' ? (
                    <Badge variant="outline" className="px-3 py-1">Demande envoyée</Badge>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleSendFriendRequest}
                      disabled={sendFriendRequest.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Nakama
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Check if any tabs are visible */}
        {visibleTabsCount === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-display text-lg mb-2">Profil Restreint</p>
            <p className="text-sm">Cet utilisateur a choisi de ne pas afficher de contenu public.</p>
          </div>
        ) : (
          <Tabs value={getDefaultTab()} onValueChange={handleTabChange} className="w-full">
            <TabsList className={cn(
              "w-full grid mb-6",
              visibleTabsCount === 4 ? "grid-cols-4" :
              visibleTabsCount === 3 ? "grid-cols-3" :
              visibleTabsCount === 2 ? "grid-cols-2" : "grid-cols-1"
            )}>
              {showOtakuTab && (
                <TabsTrigger 
                  value="otaku" 
                  className={cn(
                    "text-sm gap-1.5",
                    isOwnProfile && isOtakuPrivate && "opacity-60"
                  )}
                >
                  {isOwnProfile && isOtakuPrivate && <EyeOff className="w-3 h-3" />}
                  🎌 L'Otaku
                </TabsTrigger>
              )}
              {showGamerTab && (
                <TabsTrigger 
                  value="gamer" 
                  className={cn(
                    "text-sm gap-1.5",
                    isOwnProfile && isGamerPrivate && "opacity-60"
                  )}
                >
                  {isOwnProfile && isGamerPrivate && <EyeOff className="w-3 h-3" />}
                  🎮 Le Gamer
                </TabsTrigger>
              )}
              {showCosplayTab && (
                <TabsTrigger 
                  value="cosplayer" 
                  className={cn(
                    "text-sm gap-1.5",
                    isOwnProfile && isCosplayPrivate && "opacity-60"
                  )}
                >
                  {isOwnProfile && isCosplayPrivate && <EyeOff className="w-3 h-3" />}
                  🎭 Le Cosplayer
                </TabsTrigger>
              )}
              {showCreativeTab && (
                <TabsTrigger 
                  value="creator" 
                  className={cn(
                    "text-sm gap-1.5",
                    isOwnProfile && isCreativePrivate && "opacity-60"
                  )}
                >
                  {isOwnProfile && isCreativePrivate && <EyeOff className="w-3 h-3" />}
                  🎨 Le Créatif
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Tab: L'Otaku */}
            {showOtakuTab && (
              <TabsContent value="otaku" className="space-y-6">
                {/* Private Indicator for Owner */}
                {isOwnProfile && isOtakuPrivate && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed text-sm text-muted-foreground">
                    <EyeOff className="w-4 h-4" />
                    Cette section est privée - visible uniquement par vous
                  </div>
                )}
                
                {/* Edit Mode Button */}
                {isOwnProfile && isEditing && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowOtakuModal(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier mon profil Otaku
                    </Button>
                  </div>
                )}
                
                {/* Bio - Editable */}
                {(profile.bio || (isOwnProfile && isEditing)) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-6 border"
                  >
                    {isOwnProfile && isEditing ? (
                      <EditableField
                        value={profile.bio || ''}
                        onSave={async (value) => {
                          await updateProfile.mutateAsync({ bio: value });
                        }}
                        isEditing={isEditing}
                        placeholder="Décris-toi en quelques mots..."
                        multiline
                        renderView={(val) => val ? (
                          <p className="text-foreground whitespace-pre-wrap">{val}</p>
                        ) : (
                          <p className="text-muted-foreground/50 italic">Ajouter une bio...</p>
                        )}
                      />
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                    )}
                  </motion.div>
                )}

                {/* Character Duel (Best vs Worst) */}
                <CharacterDuelDisplay 
                  bestCharacterId={extProfile.best_character_id}
                  worstCharacterId={extProfile.worst_character_id}
                />
                
                {/* Otaku Class Card */}
                {otakuClass && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "rounded-xl p-6 border-2",
                      `bg-gradient-to-br ${otakuClass.color}`,
                      otakuClass.borderColor
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{otakuClass.emoji}</span>
                      <div>
                        <h3 className="text-xl font-display text-foreground">Classe : {otakuClass.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{otakuClass.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Manga Pantheon - Top 3 */}
                <MangaPantheon 
                  top3={extProfile.otaku_top3}
                />

                {/* Otaku DNA (Q&A) */}
                <OtakuDNA 
                  firstManga={extProfile.otaku_first_manga}
                  favoriteArtist={extProfile.otaku_favorite_artist}
                  japanDestination={extProfile.otaku_japan_destination}
                  japanMustBuy={extProfile.otaku_japan_must_buy}
                  conActivity={extProfile.otaku_con_activity}
                  socialNightmare={extProfile.otaku_social_nightmare}
                />

                {/* Genre Radar */}
                <GenreRadar 
                  stats={extProfile.otaku_stats}
                  genres={favoriteGenres}
                />
                
                {/* Mangathèque */}
                {showLibrary && (
                  libraryLoading ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                  ) : (mangas.length > 0 || (isOwnProfile && isEditing)) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-card rounded-xl p-6 border"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-turquoise" />
                          {isOwnProfile ? "Ma Mangathèque" : "Sa Mangathèque"}
                        </h3>
                        {isOwnProfile && isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMediaType("manga");
                              setShowMediaModal(true);
                            }}
                            className="gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                      {mangas.length > 0 ? (
                        <MemberLibraryGrid items={library || []} type="MANGA" />
                      ) : (
                        <p className="text-muted-foreground/50 italic text-sm text-center py-4">
                          Aucun manga dans la collection
                        </p>
                      )}
                    </motion.div>
                  )
                )}
                
                {/* Achievements */}
                {showAchievements && !achievementsLoading && achievements && achievements.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AchievementsTrophyShelf achievements={achievements} />
                  </motion.div>
                )}
              </TabsContent>
            )}
            
            {/* Tab: Le Gamer */}
            {showGamerTab && (
              <TabsContent value="gamer" className="space-y-6">
                {/* Private Indicator for Owner */}
                {isOwnProfile && isGamerPrivate && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed text-sm text-muted-foreground">
                    <EyeOff className="w-4 h-4" />
                    Cette section est privée - visible uniquement par vous
                  </div>
                )}
                
                {/* Edit Mode Button */}
                {isOwnProfile && isEditing && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowGamerModal(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier mon profil Gamer
                    </Button>
                  </div>
                )}
                
                {/* Gamer Identity Card - New Component */}
                <GamerIdentityCard 
                  playStyle={gamerPlayStyle}
                  platforms={gamingPlatforms}
                  gamerIds={gamerIds}
                  favoriteGenre={extProfile.gamer_favorite_genre}
                  mobileVice={extProfile.gamer_mobile_vice}
                  rageTrigger={extProfile.gamer_rage_trigger}
                  friendshipBreaker={extProfile.gamer_friendship_breaker}
                />

                {/* Games Grid */}
                <GamesGrid games={games} />

                {/* Ludothèque */}
                {showLibrary && (games.length > 0 || (isOwnProfile && isEditing)) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-xl p-6 border"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-display text-foreground flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-turquoise" />
                        {isOwnProfile ? "Ma Ludothèque" : "Sa Ludothèque"}
                      </h3>
                      {isOwnProfile && isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMediaType("game");
                            setShowMediaModal(true);
                          }}
                          className="gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter
                        </Button>
                      )}
                    </div>
                    {games.length > 0 ? (
                      <MemberLibraryGrid items={library || []} type="GAME" />
                    ) : (
                      <p className="text-muted-foreground/50 italic text-sm text-center py-4">
                        Aucun jeu dans la collection
                      </p>
                    )}
                  </motion.div>
                )}
              </TabsContent>
            )}
            
            {/* Tab: Le Cosplayer */}
            {showCosplayTab && (
              <TabsContent value="cosplayer" className="space-y-6">
                {/* Private Indicator for Owner */}
                {isOwnProfile && isCosplayPrivate && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed text-sm text-muted-foreground">
                    <EyeOff className="w-4 h-4" />
                    Cette section est privée - visible uniquement par vous
                  </div>
                )}
                
                {/* Edit Mode Button */}
                {isOwnProfile && isEditing && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowCosplayModal(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier infos Cosplay
                    </Button>
                  </div>
                )}

                {/* CosplayerCard Component - All-in-one */}
                <CosplayerCard
                  yearsExperience={cosplayYearsExperience}
                  specialties={cosplaySpecialties}
                  collaborationPrefs={cosplayCollabPrefs}
                  cosplayStyle={extProfile.cosplay_style}
                  motivation={extProfile.cosplay_motivation}
                  nightmare={extProfile.cosplay_nightmare}
                  conCrunch={extProfile.cosplay_con_crunch}
                  cosplans={cosplans || []}
                />

                {/* Cosplayer Agenda — upcoming events with planned costumes */}
                <CosplayerAgendaSection userId={profile?.id} />

                {/* Legacy "Prochains Line-Ups" replaced by CosplayerAgendaSection above */}

                {/* Cosplay Contest Registrations */}
                <CosplayContestList
                  registrations={cosplayRegistrations || []}
                  isLoading={registrationsLoading}
                />
                
                {/* Photos Cosplay Preview */}
                {allCosplayPhotos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card rounded-xl p-5 border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-display text-foreground flex items-center gap-2">
                        <Camera className="w-4 h-4 text-teal-400" />
                        Photos Cosplay
                      </h3>
                      {isOwnProfile && (
                        <button
                          onClick={() => navigate("/espace-membre/mes-photos")}
                          className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          Voir toutes ({photoStats?.totalPhotos ?? 0})
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {allCosplayPhotos.slice(0, 9).map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={photo.photo_url}
                            alt={photo.caption ?? "Photo cosplay"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    {allCosplayPhotos.length > 9 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        +{allCosplayPhotos.length - 9} autres photos
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Vestiaire Gallery - New Component */}
                {cosplaysLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <VestiaireGallery
                    cosplays={cosplays || []}
                    onSelect={setSelectedCosplay}
                    isOwnProfile={isOwnProfile}
                  />
                )}
              </TabsContent>
            )}
            
            {/* Tab: Le Créatif */}
            {showCreativeTab && (
              <TabsContent value="creator" className="space-y-6">
                {/* Private Indicator for Owner */}
                {isOwnProfile && isCreativePrivate && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed text-sm text-muted-foreground">
                    <EyeOff className="w-4 h-4" />
                    Cette section est privée - visible uniquement par vous
                  </div>
                )}
                
                {/* Edit Mode Button */}
                {isOwnProfile && isEditing && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowCreativeModal(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier mes compétences
                    </Button>
                  </div>
                )}

                {/* CreativeCard Component - All-in-one */}
                <CreativeCard 
                  commissionStatus={creativeCommissionStatus}
                  collaborationTypes={creativeCollaborationTypes}
                  domains={profile.creator_domains || []}
                  softwareSkills={creativeSoftwareSkills}
                  hardwareEquipment={creativeHardwareEquipment}
                  collaborationInterests={profile.collaboration_interests || []}
                  experienceLevel={profile.creator_experience_level}
                  toolPreference={extProfile.creative_tool_preference}
                  workflowVibe={extProfile.creative_workflow_vibe}
                  projectHabit={extProfile.creative_project_habit}
                  nightmare={extProfile.creative_nightmare}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
      
      {/* Cosplay Lightbox */}
      <Dialog open={!!selectedCosplay} onOpenChange={() => setSelectedCosplay(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedCosplay && (
            <div className="relative">
              <img
                src={selectedCosplay.user_image_url}
                alt={selectedCosplay.character_name}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-display text-xl">{selectedCosplay.character_name}</p>
                <p className="text-white/70">{selectedCosplay.universe}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Cos-Card Modal */}
      <CosCardModal isOpen={isCosCardOpen} onClose={() => setIsCosCardOpen(false)} />
      
      {/* Edit Mode Toggle - Floating Button */}
      {isOwnProfile && (
        <EditModeToggle 
          isEditing={isEditing} 
          onToggle={() => setIsEditing(!isEditing)} 
        />
      )}

      {/* Edit Modals */}
      <CosplayModal 
        isOpen={showCosplayModal} 
        onClose={() => setShowCosplayModal(false)} 
        profile={{
          is_cosplayer_mode_active: isCosplayerModeActive,
          cosplay_years_experience: cosplayYearsExperience,
          cosplay_specialties: cosplaySpecialties,
          cosplay_collaboration_prefs: cosplayCollabPrefs,
          privacy_settings: privacySettings,
        }}
      />
      <CreativeModal 
        isOpen={showCreativeModal} 
        onClose={() => setShowCreativeModal(false)} 
        profile={{
          is_creator_profile_active: profile.is_creator_profile_active,
          creative_commission_status: creativeCommissionStatus,
          creative_collaboration_types: creativeCollaborationTypes,
          creative_software_skills: creativeSoftwareSkills,
          creative_hardware_equipment: creativeHardwareEquipment,
          privacy_settings: privacySettings,
        }}
      />
      <OtakuModal 
        isOpen={showOtakuModal} 
        onClose={() => setShowOtakuModal(false)} 
        profile={{
          gaming_platforms: gamingPlatforms,
          favorite_genres: favoriteGenres,
          privacy_settings: privacySettings,
        }}
      />
      <GamerModal 
        isOpen={showGamerModal} 
        onClose={() => setShowGamerModal(false)} 
        profile={{
          is_gamer_mode_active: isGamerModeActive,
          gaming_platforms: gamingPlatforms,
          gamer_ids: gamerIds,
          gamer_play_style: gamerPlayStyle,
          privacy_settings: privacySettings as any,
        }}
      />
      <SocialsModal
        isOpen={showSocialsModal}
        onClose={() => setShowSocialsModal(false)}
        socialLinks={socialLinks}
      />
      <MediaAddModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        type={mediaType}
        onAdd={async (data) => {
          if (!user?.id) return;
          await addLibraryItem.mutateAsync({
            user_id: user.id,
            title: data.title,
            type: mediaType.toUpperCase() as "MANGA" | "ANIME" | "GAME",
            cover_url: data.image,
          });
          queryClient.invalidateQueries({ queryKey: ["public-profile", username] });
        }}
      />
      
      <Footer />
    </div>
  );
};

export default PublicProfile;
