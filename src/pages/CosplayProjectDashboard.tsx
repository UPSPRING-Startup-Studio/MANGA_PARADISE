/**
 * CosplayProjectDashboard
 * The main dashboard for an in-progress cosplay project.
 * Route: /espace-membre/projets/:id
 *
 * Tabs:
 *  - Infos: ProjectInfosTab
 *  - Tâches: ProjectTasksTab
 *  - Dossiers & Photos: CosplayFolderTree + EnrichedPhotoGrid
 */

import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Info,
  KanbanSquare,
  FolderOpen,
  Euro,
  TrendingUp,
  Loader2,
  Flame,
  Calendar,
  Target,
  Sparkles,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCosplans, useUpdateCosplan } from "@/hooks/useCosplans";
import { ProjectInfosTab } from "@/components/cosplay/ProjectInfosTab";
import { ProjectTasksTab } from "@/components/cosplay/ProjectTasksTab";
import { CosplayFolderTree } from "@/components/cosplay/CosplayFolderTree";
import { EnrichedPhotoGrid } from "@/components/cosplay/photos/EnrichedPhotoGrid";
import { PhotoUploadSheet } from "@/components/cosplay/photos/PhotoUploadSheet";
import { PhotoViewer } from "@/components/cosplay/photos/PhotoViewer";
import type { PhotoViewerAction } from "@/components/cosplay/photos/PhotoViewer";
import { CaptionEditor } from "@/components/cosplay/photos/CaptionEditor";
import { EventAssociationSheet } from "@/components/cosplay/photos/EventAssociationSheet";
import { PhotoShareSheet } from "@/components/cosplay/photos/PhotoShareSheet";
import { useCosplayPhotos } from "@/hooks/useCosplayPhotos";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type TabId = "infos" | "tasks" | "folders" | "photos";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
}

const TABS: TabConfig[] = [
  {
    id: "infos",
    label: "Infos",
    icon: <Info className="w-4 h-4" />,
    accentColor: "text-[hsl(var(--mp-primary))]",
  },
  {
    id: "tasks",
    label: "Tâches",
    icon: <KanbanSquare className="w-4 h-4" />,
    accentColor: "text-[hsl(var(--mp-info))]",
  },
  {
    id: "folders",
    label: "Dossiers",
    icon: <FolderOpen className="w-4 h-4" />,
    accentColor: "text-[hsl(var(--mp-saffron))]",
  },
  {
    id: "photos",
    label: "Photos",
    icon: <Camera className="w-4 h-4" />,
    accentColor: "text-[#7CF6D3]",
  },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  wishlist: {
    label: "Wishlist",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  started: {
    label: "En cours",
    color: "bg-[hsl(var(--mp-info))]/15 text-[hsl(var(--mp-info))] border-[hsl(var(--mp-info))]/30",
  },
  in_progress: {
    label: "En cours",
    color: "bg-[hsl(var(--mp-info))]/15 text-[hsl(var(--mp-info))] border-[hsl(var(--mp-info))]/30",
  },
  paused: {
    label: "En pause",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  finished: {
    label: "Terminé",
    color: "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30",
  },
  completed: {
    label: "Terminé",
    color: "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30",
  },
};

const FALLBACK_STATUS = {
  label: "Statut inconnu",
  color: "bg-white/10 text-white/70 border-white/20",
};

const getProgressColor = (progress: number): string => {
  if (progress === 100) return "#00FF00";
  if (progress >= 75) return "#00FF88";
  if (progress >= 50) return "#00D4FF";
  return "hsl(var(--mp-info))";
};

const CosplayProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const initialTab = (() => {
    const param = searchParams.get("tab");
    if (
      param === "infos" ||
      param === "tasks" ||
      param === "folders" ||
      param === "photos"
    ) {
      return param as TabId;
    }
    return "tasks" as TabId;
  })();

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [liveBudget, setLiveBudget] = useState<number>(0);
  const [liveProgress, setLiveProgress] = useState<number | null>(null);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [viewerAction, setViewerAction] = useState<{
    type: PhotoViewerAction;
    photo: CosplayPhotoWithTags;
  } | null>(null);

  const { data: cosplans = [], isLoading } = useCosplans(user?.id);
  const { data: photos = [] } = useCosplayPhotos(id);
  const updateCosplanMutation = useUpdateCosplan();

  const plan = cosplans.find((p) => p.id === id);

  const effectiveProgress =
    plan?.auto_progress && liveProgress !== null
      ? liveProgress
      : plan?.progress_level ?? 0;

  const progressColor = getProgressColor(effectiveProgress);

  const handleViewerAction = useCallback(
    (action: PhotoViewerAction, photo: CosplayPhotoWithTags) => {
      setTimeout(() => setViewerAction({ type: action, photo }), 0);
    },
    []
  );

  const closeViewerAction = useCallback(() => {
    setViewerAction(null);
  }, []);

  const handleBudgetChange = useCallback((budget: number) => {
    setLiveBudget(budget);
  }, []);

  const handleProgressChange = useCallback(
    (progress: number) => {
      setLiveProgress(progress);
      if (plan && user && plan.auto_progress) {
        updateCosplanMutation.mutate({
          id: plan.id,
          userId: user.id,
          progress_level: progress,
        });
      }
    },
    [plan, user, updateCosplanMutation]
  );

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[hsl(var(--mp-primary))] animate-spin" />
          <p className="text-white/50 text-sm">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/50 text-lg">Projet introuvable</p>
          <Button
            onClick={() => navigate("/espace-membre")}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'espace membre
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[plan.status] ?? FALLBACK_STATUS;

  return (
    <>
      <div className="min-h-screen bg-slate-950">
        <div className="relative overflow-hidden">
          {plan.image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl scale-110"
              style={{ backgroundImage: `url(${plan.image_url})` }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6 pb-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <Button
                onClick={() => navigate("/espace-membre")}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Mes Projets
              </Button>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end pb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              >
                {plan.image_url ? (
                  <img
                    src={plan.image_url}
                    alt={plan.character_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white/20" />
                  </div>
                )}
                {plan.priority > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <Flame className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex-1 min-w-0"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs border", statusConfig.color)}
                  >
                    {statusConfig.label}
                  </Badge>
                  {plan.target_year && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-black/40 border-white/20 text-white/60"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {plan.target_year}
                    </Badge>
                  )}
                  {plan.deadline && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-black/40 border-white/20 text-white/60"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      {format(parseISO(plan.deadline), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </Badge>
                  )}
                </div>

                <h1 className="font-display text-3xl md:text-4xl text-white leading-tight truncate">
                  {plan.character_name}
                </h1>
                <p className="text-lg text-white/50 mt-1">{plan.universe}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 flex-shrink-0"
              >
                <div className="bg-black/40 backdrop-blur-md border border-[hsl(var(--mp-saffron))]/20 rounded-xl px-4 py-3 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Euro className="w-3.5 h-3.5 text-[hsl(var(--mp-saffron))]" />
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      Budget
                    </span>
                  </div>
                  <motion.p
                    className="text-xl font-bold text-[hsl(var(--mp-saffron))]"
                    key={liveBudget}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {liveBudget.toFixed(2)} €
                  </motion.p>
                </div>

                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--mp-info))]" />
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      Avancement
                    </span>
                  </div>
                  <motion.p
                    className="text-xl font-bold"
                    style={{ color: progressColor }}
                    key={effectiveProgress}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {effectiveProgress}%
                  </motion.p>
                  <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: progressColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${effectiveProgress}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      activeTab === tab.id ? tab.accentColor : "text-current"
                    )}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}

                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {activeTab === "infos" && (
              <motion.div
                key="infos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ProjectInfosTab plan={plan} />
              </motion.div>
            )}

            {activeTab === "tasks" && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ProjectTasksTab
                  planId={plan.id}
                  userId={user?.id ?? ""}
                  autoProgress={plan.auto_progress}
                  onBudgetChange={handleBudgetChange}
                  onProgressChange={handleProgressChange}
                />
              </motion.div>
            )}

            {activeTab === "folders" && (
              <motion.div
                key="folders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <CosplayFolderTree
                  selectedFolderId={null}
                  onSelectFolder={() => {}}
                />
              </motion.div>
            )}

            {activeTab === "photos" && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <button
                  onClick={() =>
                    navigate("/espace-membre/mes-photos?cosplay=" + plan.id)
                  }
                  className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors mb-2 focus:outline-none"
                >
                  <span>📷</span>
                  <span>Voir toutes mes photos cosplay →</span>
                </button>

                <EnrichedPhotoGrid
                  cosplayId={plan.id}
                  isOwner={user?.id === plan.user_id}
                  onPhotoClick={(_photo, index) => {
                    setSelectedPhotoIndex(index);
                    setPhotoViewerOpen(true);
                  }}
                  onAddClick={() => setUploadSheetOpen(true)}
                />

                <PhotoUploadSheet
                  cosplayId={plan.id}
                  open={uploadSheetOpen}
                  onOpenChange={setUploadSheetOpen}
                />

                {photoViewerOpen && (
                  <PhotoViewer
                    photos={photos}
                    initialIndex={selectedPhotoIndex}
                    isOwner={user?.id === plan.user_id}
                    onClose={() => setPhotoViewerOpen(false)}
                    onAction={handleViewerAction}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {viewerAction?.type === "caption" && (
        <CaptionEditor
          photo={viewerAction.photo}
          open
          onOpenChange={(open) => {
            if (!open) closeViewerAction();
          }}
          onSaved={closeViewerAction}
        />
      )}
      {viewerAction?.type === "event" && (
        <EventAssociationSheet
          photo={viewerAction.photo}
          open
          onOpenChange={(open) => {
            if (!open) closeViewerAction();
          }}
          onAssociated={closeViewerAction}
        />
      )}
      {viewerAction?.type === "share" && (
        <PhotoShareSheet
          photo={viewerAction.photo}
          open
          onOpenChange={(open) => {
            if (!open) closeViewerAction();
          }}
        />
      )}
    </>
  );
};

export default CosplayProjectDashboard;