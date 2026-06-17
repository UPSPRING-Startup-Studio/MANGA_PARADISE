import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Shield, Star, Sparkles, Drama } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MemberCard, { MemberProfile } from "@/components/annuaire/MemberCard";
import MemberDetailPanel from "@/components/annuaire/MemberDetailPanel";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAnnuaireStats, useCosplayerUserIds, useAllCosplays } from "@/hooks/useOtakuCollections";

type FilterType = "all" | "bureau" | "staff" | "active" | "creators" | "cosplayers";

const filterOptions: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Tous", icon: Users },
  { value: "bureau", label: "Bureau", icon: Shield },
  { value: "staff", label: "Staff", icon: Star },
  { value: "creators", label: "Créateurs", icon: Sparkles },
  { value: "cosplayers", label: "Cosplayeurs", icon: Drama },
];

const Annuaire = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch collection stats for indicators
  const { data: stats } = useAnnuaireStats();
  const { data: cosplayerIds } = useCosplayerUserIds();
  const { data: allCosplays } = useAllCosplays();

  // Fetch all public profiles
  const { data: members, isLoading } = useQuery({
    queryKey: ["annuaire-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or("profile_visibility.eq.public,profile_visibility.is.null")
        .order("created_at", { ascending: true });

      if (error) throw error;
      // Filter out partners from the directory
      return (data as MemberProfile[]).filter(m => !(m as any).partner_status || (m as any).partner_status !== 'active');
    },
  });

  // Filter and search members
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    let result = members;

    // Apply filter
    switch (activeFilter) {
      case "bureau":
        result = result.filter((m) =>
          ["president", "vice_president", "treasurer", "secretary"].includes(m.role_function || "")
        );
        break;
      case "staff":
        result = result.filter((m) =>
          ["staff", "volunteer"].includes(m.role_function || "")
        );
        break;
      case "creators":
        result = result.filter((m) => m.is_creator_profile_active);
        break;
      case "cosplayers":
        result = result.filter((m) => cosplayerIds?.includes(m.id));
        break;
    }

    // Apply search - includes cosplay character names and universes
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) => {
        // Check profile fields
        const matchesProfile = 
          m.username?.toLowerCase().includes(query) ||
          m.display_name?.toLowerCase().includes(query) ||
          m.otaku_class?.toLowerCase().includes(query) ||
          m.favorite_manga?.toLowerCase().includes(query);
        
        // Check cosplay fields (character names and universes)
        const memberCosplays = allCosplays?.filter((c) => c.user_id === m.id) || [];
        const matchesCosplay = memberCosplays.some(
          (c) => 
            c.character_name?.toLowerCase().includes(query) ||
            c.universe?.toLowerCase().includes(query)
        );
        
        return matchesProfile || matchesCosplay;
      });
    }

    return result;
  }, [members, activeFilter, searchQuery, cosplayerIds, allCosplays]);

  // Calculate counts for each member
  const getMemberCounts = (memberId: string) => {
    const cosplayCount = stats?.cosplayCounts[memberId] || 0;
    const mangaCount = stats?.mangaCounts[memberId] || 0;
    const animeCount = stats?.animeCounts[memberId] || 0;
    return {
      cosplayCount,
      libraryCount: mangaCount + animeCount,
    };
  };

  const handleMemberClick = (member: MemberProfile) => {
    setSelectedMember(member);
    setIsPanelOpen(true);
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
            className="text-center mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl text-sakura tracking-wider mb-3">
              L'ANNUAIRE DES OTAKUS
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explorez les profils des passionnés qui font vivre la communauté !
            </p>
          </motion.div>

          {/* Search and Filters Bar */}
          <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl py-4 mb-8 border-b border-border/30">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher par pseudo, classe, manga ou personnage cosplayé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/30 border-border/50"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 flex-wrap justify-center">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      activeFilter === filter.value
                        ? "bg-sakura text-white"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-muted-foreground text-sm mb-6">
            {filteredMembers.length} membre{filteredMembers.length !== 1 ? "s" : ""} trouvé
            {filteredMembers.length !== 1 ? "s" : ""}
          </p>

          {/* Members Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-muted/20 rounded-2xl h-48 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl text-muted-foreground mb-2">Aucun membre trouvé</h3>
              <p className="text-muted-foreground/60">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredMembers.map((member, index) => {
                const counts = getMemberCounts(member.id);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MemberCard 
                      member={member} 
                      onClick={() => handleMemberClick(member)}
                      cosplayCount={counts.cosplayCount}
                      libraryCount={counts.libraryCount}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Member Detail Panel */}
      <MemberDetailPanel
        member={selectedMember}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
};

export default Annuaire;
