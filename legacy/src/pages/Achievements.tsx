import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, Shield, Sparkles, Coins } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useBadges } from "@/hooks/useProfile";
import { useLeagueStats } from "@/hooks/useLeagueStats";
import LeagueCard from "@/components/achievements/LeagueCard";
import BadgeCard from "@/components/achievements/BadgeCard";

const Achievements = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { badges, userBadges, loading: badgesLoading } = useBadges();
  const { 
    currentLeague, 
    nextLeague, 
    userStats, 
    daysRemaining,
    progressPercent,
    questsRemaining,
    loading: leagueLoading 
  } = useLeagueStats();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading || leagueLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Chargement...</div>
      </div>
    );
  }

  // Get unlocked badge IDs
  const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  // Group badges by rarity for better display
  const badgesByRarity = {
    legendary: badges.filter(b => b.rarity === "legendary"),
    epic: badges.filter(b => b.rarity === "epic"),
    rare: badges.filter(b => b.rarity === "rare"),
    common: badges.filter(b => !b.rarity || b.rarity === "common")
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-header-bg via-primary/5 to-header-bg border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 py-12 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-10 h-10 text-yellow-400" />
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-primary to-purple-400">
                  Mes Badges & Ligue
                </h1>
                <Medal className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg">
                Progresse dans les ligues et collectionne des trophées légendaires
              </p>

              {/* Quick stats */}
              <div className="flex items-center justify-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{profile?.otk_coins || 0} OTK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">{profile?.xp || 0} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-bold text-purple-400">
                    {userBadges.length} / {badges.length} badges
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="league" className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted/50">
              <TabsTrigger value="league" className="gap-2">
                <Shield className="w-4 h-4" />
                Ma Ligue
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-2">
                <Trophy className="w-4 h-4" />
                Mes Trophées
              </TabsTrigger>
            </TabsList>

            {/* League Tab */}
            <TabsContent value="league" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <LeagueCard
                  currentLeague={currentLeague}
                  nextLeague={nextLeague}
                  userStats={userStats}
                  daysRemaining={daysRemaining}
                  progressPercent={progressPercent}
                  questsRemaining={questsRemaining}
                />

                {/* All leagues preview */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <h3 className="text-lg font-semibold mb-4 text-center">Toutes les Ligues</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "Classe C", color: "#CD7F32", quests: 0, rent: 0 },
                      { name: "Classe B", color: "#C0C0C0", quests: 3, rent: 500 },
                      { name: "Classe A", color: "hsl(var(--mp-saffron))", quests: 6, rent: 1500 },
                      { name: "Classe S", color: "#9333EA", quests: 10, rent: 3000 },
                    ].map((league, idx) => (
                      <Card
                        key={idx}
                        className={`p-4 text-center border-2 transition-all ${
                          currentLeague?.name.includes(league.name.split(" ")[1])
                            ? "scale-105 shadow-lg"
                            : "opacity-70"
                        }`}
                        style={{ 
                          borderColor: league.color + "60",
                          backgroundColor: currentLeague?.name.includes(league.name.split(" ")[1]) 
                            ? league.color + "10" 
                            : undefined
                        }}
                      >
                        <div 
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                          style={{ backgroundColor: league.color + "30" }}
                        >
                          <Shield className="w-6 h-6" style={{ color: league.color }} />
                        </div>
                        <p className="font-bold" style={{ color: league.color }}>{league.name}</p>
                        <p className="text-xs text-muted-foreground">{league.quests} quêtes/mois</p>
                        <p className="text-sm font-medium text-yellow-400">{league.rent} OTK</p>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-8">
              {/* Legendary badges */}
              {badgesByRarity.legendary.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-purple-400">👑</span> Badges Légendaires
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {badgesByRarity.legendary.map(badge => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isUnlocked={unlockedBadgeIds.has(badge.id)}
                        earnedAt={userBadges.find(ub => ub.badge_id === badge.id)?.earned_at}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Epic badges */}
              {badgesByRarity.epic.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-violet-400">💎</span> Badges Épiques
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {badgesByRarity.epic.map(badge => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isUnlocked={unlockedBadgeIds.has(badge.id)}
                        earnedAt={userBadges.find(ub => ub.badge_id === badge.id)?.earned_at}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rare badges */}
              {badgesByRarity.rare.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-blue-400">⭐</span> Badges Rares
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {badgesByRarity.rare.map(badge => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isUnlocked={unlockedBadgeIds.has(badge.id)}
                        earnedAt={userBadges.find(ub => ub.badge_id === badge.id)?.earned_at}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Common badges */}
              {badgesByRarity.common.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-mp-ink-muted">🏅</span> Badges Communs
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {badgesByRarity.common.map(badge => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isUnlocked={unlockedBadgeIds.has(badge.id)}
                        earnedAt={userBadges.find(ub => ub.badge_id === badge.id)?.earned_at}
                      />
                    ))}
                  </div>
                </div>
              )}

              {badges.length === 0 && (
                <Card className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun badge disponible</h3>
                  <p className="text-muted-foreground">
                    Les badges seront bientôt ajoutés par l'équipe.
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Achievements;
