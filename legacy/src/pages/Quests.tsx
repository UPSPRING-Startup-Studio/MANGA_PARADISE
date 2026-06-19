import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useUserRoles";
import {
  useAcceptQuest,
  useMyQuestSubmissions,
  useSubmitQuestProof,
  useVolunteerQuests,
} from "@/hooks/useVolunteerQuests";
import { QuestCard } from "@/components/quests/QuestCard";
import { QuestFilters } from "@/components/quests/QuestFilters";
import { QuestJournalCard } from "@/components/quests/QuestJournalCard";
import { StaffQuestPanel } from "@/components/quests/StaffQuestPanel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Backpack,
  Coins,
  Crown,
  Loader2,
  Scroll,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";

const Quests = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: isAdmin } = useIsAdmin();

  const { data: quests = [], isLoading: loadingQuests } = useVolunteerQuests();
  const { data: mySubmissions = [], isLoading: loadingSubmissions } =
    useMyQuestSubmissions();

  const acceptMutation = useAcceptQuest();
  const submitProofMutation = useSubmitQuestProof();

  // Filters
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Get accepted quest IDs
  const acceptedQuestIds = useMemo(
    () => new Set(mySubmissions.map((s) => s.quest_id)),
    [mySubmissions]
  );

  // Filter quests
  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (activeCategory && quest.category !== activeCategory) return false;
      if (activePriority && quest.priority !== activePriority) return false;
      return true;
    });
  }, [quests, activeCategory, activePriority]);

  // Stats
  const completedThisMonth = mySubmissions.filter((s) => {
    if (s.status !== "approved") return false;
    const date = new Date(s.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const monthlyGoal = 10;
  const progressPercent = Math.min((completedThisMonth / monthlyGoal) * 100, 100);

  const handleAcceptQuest = (questId: string) => {
    acceptMutation.mutate(questId);
  };

  const handleSubmitProof = (
    submissionId: string,
    proofText: string,
    proofLink?: string
  ) => {
    submitProofMutation.mutate({ submissionId, proofText, proofLink });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-header-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-sakura mx-auto" />
          <p className="text-white/60 font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-header-bg">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="rounded-[24px] overflow-hidden bg-gradient-to-br from-header-bg via-header-bg to-sakura/5 border border-border/40">
          {/* Hero Header */}
          <div className="relative overflow-hidden">
            {/* Cyberpunk grid background */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--sakura) / 0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--sakura) / 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            <div className="relative p-6 md:p-10 space-y-6">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
              >
                <h1 className="font-display text-4xl md:text-5xl flex items-center justify-center gap-3">
                  <Swords className="w-10 h-10 text-sakura" />
                  <span className="bg-gradient-to-r from-sakura via-accent to-sakura bg-clip-text text-transparent">
                    La Guilde des Aventuriers
                  </span>
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Accomplis des quêtes bénévoles pour l'association et gagne des récompenses !
                </p>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto"
              >
                {/* OTK Balance */}
                <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent/20">
                      <Coins className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mes OTK</p>
                      <p className="text-2xl font-display text-accent">
                        {profile?.otk_coins?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Monthly Progress */}
                <Card className="p-4 bg-gradient-to-br from-turquoise/10 to-turquoise/5 border-turquoise/30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-turquoise" />
                        <span className="text-sm text-muted-foreground">Ce mois-ci</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-turquoise border-turquoise/30"
                      >
                        {completedThisMonth}/{monthlyGoal}
                      </Badge>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                </Card>

                {/* XP */}
                <Card className="p-4 bg-gradient-to-br from-sakura/10 to-sakura/5 border-sakura/30">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sakura/20">
                      <Zap className="w-6 h-6 text-sakura" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mon XP</p>
                      <p className="text-2xl font-display text-sakura">
                        {profile?.xp?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 md:p-10 pt-0">
            <Tabs defaultValue="board" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 md:grid-cols-3">
                <TabsTrigger value="board" className="gap-2">
                  <Scroll className="w-4 h-4" />
                  <span className="hidden sm:inline">Tableau des</span> Quêtes
                </TabsTrigger>
                <TabsTrigger value="journal" className="gap-2">
                  <Backpack className="w-4 h-4" />
                  Mon Journal
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="staff" className="gap-2">
                    <Crown className="w-4 h-4" />
                    Référents
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Quest Board Tab */}
              <TabsContent value="board" className="space-y-6">
                <QuestFilters
                  activeCategory={activeCategory}
                  activePriority={activePriority}
                  onCategoryChange={setActiveCategory}
                  onPriorityChange={setActivePriority}
                />

                {loadingQuests ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-sakura" />
                  </div>
                ) : filteredQuests.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Swords className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl mb-2">
                      Aucune quête disponible
                    </h3>
                    <p className="text-muted-foreground">
                      {activeCategory || activePriority
                        ? "Essaie de modifier tes filtres"
                        : "Reviens plus tard pour de nouvelles missions !"}
                    </p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQuests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        onAccept={handleAcceptQuest}
                        isAccepting={acceptMutation.isPending}
                        isAccepted={acceptedQuestIds.has(quest.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Journal Tab */}
              <TabsContent value="journal" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Backpack className="w-5 h-5 text-sakura" />
                  <h2 className="font-display text-xl">Mon Journal de Quêtes</h2>
                  <Badge variant="outline">{mySubmissions.length}</Badge>
                </div>

                {loadingSubmissions ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-sakura" />
                  </div>
                ) : mySubmissions.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Backpack className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl mb-2">
                      Ton journal est vide
                    </h3>
                    <p className="text-muted-foreground">
                      Accepte ta première quête pour commencer l'aventure !
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {mySubmissions.map((submission) => (
                      <QuestJournalCard
                        key={submission.id}
                        submission={submission}
                        onSubmitProof={handleSubmitProof}
                        isSubmitting={submitProofMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Staff Tab */}
              {isAdmin && (
                <TabsContent value="staff">
                  <StaffQuestPanel />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Quests;

