import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Users, Drama, BookOpen, MapPin, 
  SlidersHorizontal, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import ProfileResultCard from "@/components/search/ProfileResultCard";
import CosplayResultCard from "@/components/search/CosplayResultCard";
import LocationResultCard from "@/components/search/LocationResultCard";

type SearchTab = "profiles" | "characters" | "universes" | "location";

interface CosplayWithProfile {
  id: string;
  user_id: string;
  character_name: string;
  universe: string;
  user_image_url: string;
  profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    city: string | null;
    profile_visibility: string | null;
    privacy_settings: any;
  } | null;
}

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  profile_visibility: string | null;
  privacy_settings: any;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("profiles");
  const [locationRadius, setLocationRadius] = useState([50]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch all public profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["search-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, city, profile_visibility, privacy_settings")
        .or("profile_visibility.eq.public,profile_visibility.is.null")
        .or("partner_status.is.null,partner_status.neq.active");

      if (error) throw error;
      return data as ProfileResult[];
    },
  });

  // Fetch all cosplays with profile info
  const { data: cosplays, isLoading: cosplaysLoading } = useQuery({
    queryKey: ["search-cosplays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select(`
          id,
          user_id,
          character_name,
          universe,
          user_image_url,
          profile:profiles!cosplay_vestiaire_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            city,
            profile_visibility,
            privacy_settings
          )
        `);

      if (error) throw error;
      
      // Filter to only public profiles
      return (data as CosplayWithProfile[]).filter(c => 
        c.profile && (c.profile.profile_visibility === "public" || !c.profile.profile_visibility)
      );
    },
  });

  // Filter profiles based on search query (Profiles tab)
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!debouncedQuery.trim()) return profiles.slice(0, 20);
    
    const query = debouncedQuery.toLowerCase();
    return profiles.filter(p => 
      p.username?.toLowerCase().includes(query) ||
      p.display_name?.toLowerCase().includes(query) ||
      p.bio?.toLowerCase().includes(query)
    );
  }, [profiles, debouncedQuery]);

  // Filter cosplays by character name (Characters tab)
  const filteredByCharacter = useMemo(() => {
    if (!cosplays) return [];
    if (!debouncedQuery.trim()) return cosplays.slice(0, 20);
    
    const query = debouncedQuery.toLowerCase();
    return cosplays.filter(c => 
      c.character_name?.toLowerCase().includes(query)
    );
  }, [cosplays, debouncedQuery]);

  // Filter cosplays by universe (Universes tab)
  const filteredByUniverse = useMemo(() => {
    if (!cosplays) return [];
    if (!debouncedQuery.trim()) return cosplays.slice(0, 20);
    
    const query = debouncedQuery.toLowerCase();
    return cosplays.filter(c => 
      c.universe?.toLowerCase().includes(query)
    );
  }, [cosplays, debouncedQuery]);

  // Filter profiles by location (Location tab)
  const filteredByLocation = useMemo(() => {
    if (!profiles) return [];
    if (!debouncedQuery.trim()) return [];
    
    const query = debouncedQuery.toLowerCase();
    return profiles.filter(p => {
      // Check if user allows city visibility
      const privacy = p.privacy_settings as { show_city?: boolean } | null;
      if (privacy && privacy.show_city === false) return false;
      
      return p.city?.toLowerCase().includes(query);
    });
  }, [profiles, debouncedQuery]);

  const isLoading = profilesLoading || cosplaysLoading;

  const getResultCount = () => {
    switch (activeTab) {
      case "profiles": return filteredProfiles.length;
      case "characters": return filteredByCharacter.length;
      case "universes": return filteredByUniverse.length;
      case "location": return filteredByLocation.length;
      default: return 0;
    }
  };

  const handleProfileClick = (username: string | null) => {
    if (username) {
      navigate(`/u/${username}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl text-sakura tracking-wider mb-3">
              RECHERCHE AVANCÉE
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Trouve des cosplayers par personnage, univers ou localisation !
            </p>
          </motion.div>

          {/* Search Bar & Filters */}
          <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl py-4 mb-6 border-b border-border/30">
            <div className="flex flex-col gap-4">
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={
                      activeTab === "profiles" ? "Rechercher un pseudo..." :
                      activeTab === "characters" ? "Rechercher un personnage (ex: Zoro, Sailor Moon)..." :
                      activeTab === "universes" ? "Rechercher un univers (ex: One Piece, Naruto)..." :
                      "Rechercher une ville (ex: Paris, Lyon)..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 text-base bg-muted/30 border-border/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Filters Button */}
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-12 w-12">
                      <SlidersHorizontal className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filtres avancés</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {activeTab === "location" && (
                        <div>
                          <label className="text-sm font-medium mb-3 block">
                            Rayon de recherche : {locationRadius[0]} km
                          </label>
                          <Slider
                            value={locationRadius}
                            onValueChange={setLocationRadius}
                            min={10}
                            max={200}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      )}
                      
                      <p className="text-muted-foreground text-sm">
                        Plus de filtres bientôt disponibles !
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)}>
                <TabsList className="w-full grid grid-cols-4 h-auto p-1">
                  <TabsTrigger value="profiles" className="flex items-center gap-2 py-2.5">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Profils</span>
                  </TabsTrigger>
                  <TabsTrigger value="characters" className="flex items-center gap-2 py-2.5">
                    <Drama className="w-4 h-4" />
                    <span className="hidden sm:inline">Personnages</span>
                  </TabsTrigger>
                  <TabsTrigger value="universes" className="flex items-center gap-2 py-2.5">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Univers</span>
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2 py-2.5">
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">Localisation</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-muted-foreground text-sm mb-6">
            {debouncedQuery.trim() ? (
              <>
                {getResultCount()} résultat{getResultCount() !== 1 ? "s" : ""} trouvé
                {getResultCount() !== 1 ? "s" : ""}
              </>
            ) : (
              "Commence à taper pour rechercher..."
            )}
          </p>

          {/* Results Grid */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted/20 rounded-2xl h-48 animate-pulse"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {/* Profiles Tab */}
                {activeTab === "profiles" && filteredProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ProfileResultCard
                      profile={profile}
                      onClick={() => handleProfileClick(profile.username)}
                    />
                  </motion.div>
                ))}

                {/* Characters Tab */}
                {activeTab === "characters" && filteredByCharacter.map((cosplay, index) => (
                  <motion.div
                    key={cosplay.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <CosplayResultCard
                      cosplay={cosplay}
                      searchType="character"
                      onClick={() => handleProfileClick(cosplay.profile?.username || null)}
                    />
                  </motion.div>
                ))}

                {/* Universes Tab */}
                {activeTab === "universes" && filteredByUniverse.map((cosplay, index) => (
                  <motion.div
                    key={cosplay.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <CosplayResultCard
                      cosplay={cosplay}
                      searchType="universe"
                      onClick={() => handleProfileClick(cosplay.profile?.username || null)}
                    />
                  </motion.div>
                ))}

                {/* Location Tab */}
                {activeTab === "location" && filteredByLocation.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <LocationResultCard
                      profile={profile}
                      searchCity={debouncedQuery}
                      onClick={() => handleProfileClick(profile.username)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!isLoading && debouncedQuery.trim() && getResultCount() === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl text-muted-foreground mb-2">Aucun résultat trouvé</h3>
              <p className="text-muted-foreground/60">
                Essayez avec d'autres termes de recherche
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
