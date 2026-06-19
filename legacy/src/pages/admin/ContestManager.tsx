import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Drama,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ListChecks,
  Download,
  Settings,
  Loader2,
  Calendar,
  MapPin,
  Trophy,
  ListOrdered,
  Radio
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CandidateCard } from "@/components/admin/CandidateCard";
import { CandidateDetailSheet } from "@/components/admin/CandidateDetailSheet";
import { ContestConfigModal } from "@/components/admin/ContestConfigModal";
import { PassageOrderTab } from "@/components/admin/PassageOrderTab";

const ContestManager = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["admin-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch contest activities for this event
  const { data: contestActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["contest-activities", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .or("is_cosplay_contest.eq.true,category.eq.contest");

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch contest registrations
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ["contest-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_registrations" as any)
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const isLoading = eventLoading || activitiesLoading || registrationsLoading;

  // Calculate stats
  const stats = {
    total: registrations?.length || 0,
    pending: registrations?.filter((r: any) => r.status === "pending").length || 0,
    approved: registrations?.filter((r: any) => r.status === "approved").length || 0,
    rejected: registrations?.filter((r: any) => r.status === "rejected").length || 0,
    waitlist: registrations?.filter((r: any) => r.status === "waitlist").length || 0,
  };

  // Group registrations by status
  const candidatesByStatus = {
    pending: registrations?.filter((r: any) => r.status === "pending") || [],
    approved: registrations?.filter((r: any) => r.status === "approved") || [],
    rejected: registrations?.filter((r: any) => r.status === "rejected") || [],
    waitlist: registrations?.filter((r: any) => r.status === "waitlist") || [],
  };

  const handleCandidateClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setDetailSheetOpen(true);
  };

  const handleConfigClick = (activityId: string) => {
    setSelectedActivityId(activityId);
    setConfigModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Drama className="w-16 h-16 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Événement introuvable</p>
        <Button onClick={() => navigate("/admin/events")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux événements
        </Button>
      </div>
    );
  }

  // Get the first contest activity for config modal
  const firstContestActivity = contestActivities?.[0];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/events")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Drama className="w-6 h-6 text-sakura" />
                <h1 className="text-2xl font-display font-bold">Contest Manager</h1>
              </div>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(`/admin/contest-live/${eventId}`)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Radio className="w-4 h-4 mr-2" />
              🔴 LANCER LE LIVE
            </Button>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              Inscriptions Ouvertes
            </Badge>
            {event.date && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(event.date), "d MMM yyyy", { locale: fr })}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/10 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-sakura data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="candidates" className="data-[state=active]:bg-sakura data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Candidats ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="order" className="data-[state=active]:bg-sakura data-[state=active]:text-white">
              <ListOrdered className="w-4 h-4 mr-2" />
              Ordre de Passage ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-sakura data-[state=active]:text-white">
              <Download className="w-4 h-4 mr-2" />
              Fichiers & Export
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Inscrits</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-sakura opacity-50" />
                </div>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">À Valider</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-400 opacity-50" />
                </div>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Validés</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.approved}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" />
                </div>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Liste d'attente</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-1">{stats.waitlist}</p>
                  </div>
                  <ListChecks className="w-8 h-8 text-cyan-400 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Contest Activities */}
            {contestActivities && contestActivities.length > 0 && (
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <Drama className="w-5 h-5 text-sakura" />
                  Activités Concours
                </h3>
                <div className="space-y-3">
                  {contestActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.time}
                            </span>
                            {activity.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.contest_config?.prejudging_time && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                            Pré-judging : {activity.contest_config.prejudging_time}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigClick(activity.id)}
                          className="border-sakura/30 text-sakura hover:bg-sakura/10"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                Actions Rapides
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => firstContestActivity && handleConfigClick(firstContestActivity.id)}
                  disabled={!firstContestActivity}
                  className="border-sakura/30 text-sakura hover:bg-sakura/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier la Configuration
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="border-muted-foreground/30 text-muted-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter les Candidatures
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 2: Candidates (Kanban) */}
          <TabsContent value="candidates" className="mt-6">
            <Card className="p-6 bg-white/5 border-white/10">
              {stats.total === 0 ? (
                <div className="text-center py-12">
                  <Drama className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="font-display font-bold text-xl mb-2">Aucune inscription pour le moment</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Les participants peuvent s'inscrire via le formulaire de candidature sur la page de l'événement.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                      À valider : {stats.pending}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Validés : {stats.approved}
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                      Refusés : {stats.rejected}
                    </Badge>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      Liste d'attente : {stats.waitlist}
                    </Badge>
                  </div>
                </div>
              ) : (
                /* Kanban Board */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Column: Pending */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-950 py-2 z-10">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        À valider
                      </h4>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                        {stats.pending}
                      </Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {candidatesByStatus.pending.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-8 bg-white/5 rounded-lg border border-dashed border-white/10">
                          Aucune candidature en attente
                        </div>
                      ) : (
                        candidatesByStatus.pending.map((candidate) => (
                          <CandidateCard
                            key={candidate.id}
                            registration={candidate}
                            onClick={() => handleCandidateClick(candidate)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column: Approved */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-950 py-2 z-10">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Validés
                      </h4>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        {stats.approved}
                      </Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {candidatesByStatus.approved.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-8 bg-white/5 rounded-lg border border-dashed border-white/10">
                          Aucune candidature validée
                        </div>
                      ) : (
                        candidatesByStatus.approved.map((candidate) => (
                          <CandidateCard
                            key={candidate.id}
                            registration={candidate}
                            onClick={() => handleCandidateClick(candidate)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column: Rejected */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-950 py-2 z-10">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        Refusés
                      </h4>
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                        {stats.rejected}
                      </Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {candidatesByStatus.rejected.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-8 bg-white/5 rounded-lg border border-dashed border-white/10">
                          Aucune candidature refusée
                        </div>
                      ) : (
                        candidatesByStatus.rejected.map((candidate) => (
                          <CandidateCard
                            key={candidate.id}
                            registration={candidate}
                            onClick={() => handleCandidateClick(candidate)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column: Waitlist */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-950 py-2 z-10">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-cyan-400" />
                        Liste d'attente
                      </h4>
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        {stats.waitlist}
                      </Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {candidatesByStatus.waitlist.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-8 bg-white/5 rounded-lg border border-dashed border-white/10">
                          Aucune candidature en attente
                        </div>
                      ) : (
                        candidatesByStatus.waitlist.map((candidate) => (
                          <CandidateCard
                            key={candidate.id}
                            registration={candidate}
                            onClick={() => handleCandidateClick(candidate)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab 3: Ordre de Passage */}
          <TabsContent value="order" className="mt-6">
            {registrations && (
              <PassageOrderTab registrations={registrations} eventId={eventId!} />
            )}
          </TabsContent>

          {/* Tab 4: Files & Export */}
          <TabsContent value="files" className="mt-6">
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="text-center py-12">
                <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-display font-bold text-xl mb-2">Export des Fichiers</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Téléchargez un ZIP contenant tous les MP3, photos de référence et WIP des candidats validés.
                </p>
                <Button disabled className="gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger le ZIP (À venir)
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Candidate Detail Sheet */}
      {selectedCandidate && (
        <CandidateDetailSheet
          registration={selectedCandidate}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
        />
      )}

      {/* Contest Config Modal */}
      {selectedActivityId && firstContestActivity && (
        <ContestConfigModal
          activityId={selectedActivityId}
          currentConfig={(firstContestActivity as any).contest_config}
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
        />
      )}
    </div>
  );
};

export default ContestManager;
