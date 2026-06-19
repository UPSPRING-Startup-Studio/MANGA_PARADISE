import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Calendar, Clock, Heart, Gamepad2, Palette, Users, Drama, BookOpen, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import MemberBadge from "./MemberBadge";
import { MemberProfile } from "./MemberCard";
import { useCosplayVestiaire, useOtakuLibrary } from "@/hooks/useOtakuCollections";
import { usePublicAchievements } from "@/hooks/useCosplayAchievements";
import { useAreFriends } from "@/hooks/useFriendships";
import { useAuth } from "@/contexts/AuthContext";
import MemberVSCarousel from "./MemberVSCarousel";
import MemberLibraryGrid from "./MemberLibraryGrid";
import AchievementsTrophyShelf from "@/components/profile/AchievementsTrophyShelf";
import MemberAgendaTab from "./MemberAgendaTab";
import NakamasList from "./NakamasList";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MemberDetailPanelProps {
  member: MemberProfile & {
    last_name?: string | null;
    gender?: string | null;
    birth_date?: string | null;
    city?: string | null;
    occupation_status?: string | null;
    favorite_character?: string | null;
    creator_domains?: string[] | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const tierColors = {
  gold: "border-accent",
  silver: "border-gray-400",
  bronze: "border-amber-600",
};

const roleLabels: Record<string, string> = {
  president: "Président",
  vice_president: "Vice-Président",
  treasurer: "Trésorier",
  secretary: "Secrétaire",
  staff: "Staff",
  volunteer: "Bénévole",
  member: "Membre",
};

const classLabels: Record<string, string> = {
  strategist: "Stratège",
  warrior: "Guerrier",
  healer: "Soigneur",
  mage: "Mage",
  assassin: "Assassin",
  tank: "Tank",
  shonen: "Shonen",
  shojo: "Shojo",
  seinen: "Seinen",
  josei: "Josei",
};

const genderLabels: Record<string, string> = {
  male: "Homme",
  female: "Femme",
  neutral: "Neutre",
  other: "Autre",
};

const MemberDetailPanel = ({ member, isOpen, onClose }: MemberDetailPanelProps) => {
  const { user } = useAuth();
  
  // Fetch cosplays, library and achievements for this member
  const { data: cosplays, isLoading: cosplaysLoading } = useCosplayVestiaire(member?.id);
  const { data: library, isLoading: libraryLoading } = useOtakuLibrary(member?.id);
  const { data: achievements, isLoading: achievementsLoading } = usePublicAchievements(member?.id);
  
  // Check if current user is friend with this member
  const { data: areFriends } = useAreFriends(user?.id, member?.id);

  if (!member) return null;

  const tier = (member.membership_tier || "bronze") as keyof typeof tierColors;
  const displayName = member.display_name || member.username || "Membre";
  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");
  const roleLabel = member.role_function ? roleLabels[member.role_function] || member.role_function : "Membre";
  const classLabel = member.otaku_class ? classLabels[member.otaku_class] || member.otaku_class : null;
  const genderLabel = member.gender ? genderLabels[member.gender] || member.gender : null;
  
  const anciennete = 0; // Removed member_since dependency

  const age = member.birth_date 
    ? Math.floor((Date.now() - new Date(member.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  const mangas = library?.filter((item) => item.type === "MANGA") || [];
  const animes = library?.filter((item) => item.type === "ANIME") || [];
  const hasCosplays = cosplays && cosplays.length > 0;
  const hasLibrary = library && library.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-tokyo-night z-[101] shadow-2xl overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Cover Image Area */}
            <div className="h-32 bg-gradient-hero relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-tokyo-night" />
            </div>

            {/* Profile Header */}
            <div className="px-6 -mt-12 relative z-10">
              <div className="flex items-end gap-4 mb-4">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center text-3xl",
                    "bg-gradient-hero border-4",
                    tierColors[tier],
                    "overflow-hidden flex-shrink-0 shadow-xl"
                  )}
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-white/60" />
                  )}
                </div>
                <div className="pb-2">
                  <h2 className="text-white font-display text-2xl tracking-wide">{displayName}</h2>
                  {fullName && <p className="text-white/60 text-sm">{fullName}</p>}
                </div>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2 mb-6">
                <MemberBadge type="role">{roleLabel}</MemberBadge>
                {classLabel && <MemberBadge type="class">{classLabel}</MemberBadge>}
                {member.is_creator_profile_active && <MemberBadge type="status">Créateur</MemberBadge>}
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="px-6 pb-8">
              <Tabs defaultValue="profil" className="w-full">
                <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
                  <TabsTrigger value="profil" className="flex-1 text-xs">👤 Profil</TabsTrigger>
                  <TabsTrigger value="agenda" className="flex-1 text-xs">📅 Agenda</TabsTrigger>
                  <TabsTrigger value="nakamas" className="flex-1 text-xs">🏴‍☠️ Nakamas</TabsTrigger>
                </TabsList>
                
                {/* Tab: Profil */}
                <TabsContent value="profil" className="space-y-6 mt-0">
                  {/* Identity Section */}
                  <section className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-sakura font-display text-lg tracking-wide mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Identité
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {genderLabel && (
                        <div>
                          <span className="text-white/40 block text-xs">Genre</span>
                          <span className="text-white">{genderLabel}</span>
                        </div>
                      )}
                      {age && (
                        <div>
                          <span className="text-white/40 block text-xs">Âge</span>
                          <span className="text-white">{age} ans</span>
                        </div>
                      )}
                      {member.city && (
                        <div className="col-span-2">
                          <span className="text-white/40 block text-xs">Ville</span>
                          <span className="text-white flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-turquoise" />
                            {member.city}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Associative Status */}
                  <section className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-sakura font-display text-lg tracking-wide mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Statut Associatif
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-white/40 block text-xs">Fonction</span>
                        <span className="text-white">{roleLabel}</span>
                      </div>
                      {classLabel && (
                        <div>
                          <span className="text-white/40 block text-xs">Classe</span>
                          <span className="text-accent">{classLabel}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-white/40 block text-xs">Ancienneté</span>
                        <span className="text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-turquoise" />
                          {anciennete} mois
                        </span>
                      </div>
                      {member.occupation_status && (
                        <div className="col-span-2">
                          <span className="text-white/40 block text-xs">Statut</span>
                          <span className="text-white capitalize">{member.occupation_status}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ADN Otaku */}
                  <section className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-sakura font-display text-lg tracking-wide mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      ADN Otaku
                    </h3>
                    <div className="space-y-3">
                      {member.favorite_manga && (
                        <div>
                          <span className="text-white/40 block text-xs mb-1">Manga Préféré</span>
                          <span className="text-accent font-medium">{member.favorite_manga}</span>
                        </div>
                      )}
                      {member.favorite_character && (
                        <div>
                          <span className="text-white/40 block text-xs mb-1">Personnage Préféré</span>
                          <span className="text-white">{member.favorite_character}</span>
                        </div>
                      )}
                      {member.favorite_activities && member.favorite_activities.length > 0 && (
                        <div>
                          <span className="text-white/40 block text-xs mb-2">Activités Favorites</span>
                          <div className="flex flex-wrap gap-1.5">
                            {member.favorite_activities.map((activity, i) => (
                              <MemberBadge key={i} type="activity">{activity}</MemberBadge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {member.is_creator_profile_active && member.creator_domains && member.creator_domains.length > 0 && (
                    <section className="bg-gradient-to-br from-sakura/10 to-accent/10 rounded-xl p-4 border border-sakura/30">
                      <h3 className="text-sakura font-display text-lg tracking-wide mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Profil Créatif
                      </h3>
                      <div>
                        <span className="text-white/40 block text-xs mb-2">Domaines de création</span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.creator_domains.map((domain, i) => (
                            <MemberBadge key={i} type="status">{domain}</MemberBadge>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Profil Cosplayeur Section */}
                  {cosplaysLoading ? (
                    <section className="bg-[#362F4B] rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Drama className="w-4 h-4 text-sakura" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="aspect-square rounded-lg" />
                        ))}
                      </div>
                    </section>
                  ) : hasCosplays && (
                    <section className="bg-[#362F4B] rounded-xl p-4 border border-sakura/20">
                      <h3 className="text-sakura font-display text-lg tracking-wide mb-3 flex items-center gap-2">
                        <Drama className="w-4 h-4" />
                        🎭 Profil Cosplayeur
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {cosplays.map((cosplay) => (
                          <div
                            key={cosplay.id}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden group cursor-pointer"
                          >
                            <img
                              src={cosplay.user_image_url}
                              alt={cosplay.character_name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-2">
                              <span className="text-white font-display text-sm tracking-wide">
                                {cosplay.character_name}
                              </span>
                              <span className="text-white/60 text-xs mt-1">
                                {cosplay.universe}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Achievements Section */}
                  {!achievementsLoading && achievements && achievements.length > 0 && (
                    <AchievementsTrophyShelf achievements={achievements} />
                  )}
                  
                  {libraryLoading ? (
                    <section className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-turquoise" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                        ))}
                      </div>
                    </section>
                  ) : hasLibrary && (
                    <section className="bg-gradient-to-br from-turquoise/5 to-accent/5 rounded-xl p-4 border border-turquoise/20">
                      <h3 className="text-turquoise font-display text-lg tracking-wide mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Sa Culture Otaku
                      </h3>
                      
                      {mangas.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Mangathèque
                          </h4>
                          <MemberLibraryGrid items={library} type="MANGA" />
                        </div>
                      )}
                      
                      {animes.length > 0 && (
                        <div>
                          <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Tv className="w-3 h-3" /> Watchlist
                          </h4>
                          <MemberLibraryGrid items={library} type="ANIME" />
                        </div>
                      )}
                    </section>
                  )}
                </TabsContent>
                
                {/* Tab: Agenda */}
                <TabsContent value="agenda" className="mt-0">
                  <MemberAgendaTab
                    memberId={member.id}
                    memberName={displayName}
                    isFriend={!!areFriends}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                {/* Tab: Nakamas */}
                <TabsContent value="nakamas" className="mt-0">
                  <NakamasList userId={member.id} />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberDetailPanel;
