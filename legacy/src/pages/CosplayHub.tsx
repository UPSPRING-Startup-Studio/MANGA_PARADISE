/**
 * CosplayHub
 * Fiche cosplay unifiée — remplace CosplayProjectDashboard + CosplayShowcase.
 * Route: /espace-membre/cosplay/:id
 *
 * Onglets:
 *  - overview : Vue d'ensemble (stats + galerie vitrine + preview lineup)
 *  - tasks    : Kanban tâches
 *  - photos   : Photos unifiées (WIP + showcase)
 *  - lineup   : Événements prévus
 *  - files    : Dossiers
 */

import { useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  KanbanSquare,
  Camera,
  Calendar,
  FolderOpen,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCosplayProject } from "@/hooks/useCosplayProject";
import { useUpdateCosplan } from "@/hooks/useCosplans";

// Tab components
import { CosplayHubHero } from "@/components/cosplay/hub/CosplayHubHero";
import { OverviewTab } from "@/components/cosplay/hub/OverviewTab";
import { ProjectTasksTab } from "@/components/cosplay/ProjectTasksTab";
import { PhotosTab } from "@/components/cosplay/hub/PhotosTab";
import { LineupTab } from "@/components/cosplay/hub/LineupTab";
import { FilesTab } from "@/components/cosplay/hub/FilesTab";

// ─── Tab Config ─────────────────────────────────────────────────────────────────

type TabId = "overview" | "tasks" | "photos" | "lineup" | "files";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  accent: string;
  /** If set, tab is only visible when cosplay status is in this list. null = always visible. */
  visibleWhen: string[] | null;
}

const TABS: TabConfig[] = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    icon: <Sparkles className="w-4 h-4" />,
    accent: "text-[hsl(var(--mp-primary))]",
    visibleWhen: null,
  },
  {
    id: "tasks",
    label: "Tâches",
    icon: <KanbanSquare className="w-4 h-4" />,
    accent: "text-[hsl(var(--mp-info))]",
    visibleWhen: null,
  },
  {
    id: "photos",
    label: "Photos",
    icon: <Camera className="w-4 h-4" />,
    accent: "text-teal-400",
    visibleWhen: null,
  },
  {
    id: "lineup",
    label: "Événements",
    icon: <Calendar className="w-4 h-4" />,
    accent: "text-[hsl(var(--mp-saffron))]",
    visibleWhen: ["started", "in_progress", "paused", "finished", "completed"],
  },
  {
    id: "files",
    label: "Dossiers",
    icon: <FolderOpen className="w-4 h-4" />,
    accent: "text-[hsl(var(--mp-saffron))]",
    visibleWhen: null,
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CosplayHub() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const { data: cosplay, isLoading } = useCosplayProject(id);
  const updateCosplan = useUpdateCosplan();

  // ── Live state from Kanban ──
  const [liveBudget, setLiveBudget] = useState(0);
  const [liveProgress, setLiveProgress] = useState<number | null>(null);

  // ── Tab management ──
  const isCompleted =
    cosplay?.status === "completed" || cosplay?.status === "finished";
  const defaultTab: TabId = isCompleted ? "overview" : "tasks";

  const paramTab = searchParams.get("tab") as TabId | null;
  const activeTab =
    paramTab && TABS.some((t) => t.id === paramTab) ? paramTab : defaultTab;

  const visibleTabs = TABS.filter(
    (tab) =>
      tab.visibleWhen === null ||
      tab.visibleWhen.includes(cosplay?.status ?? "")
  );

  const handleTabChange = (tabId: TabId) => {
    setSearchParams({ tab: tabId });
  };

  // ── Kanban callbacks ──
  const handleBudgetChange = useCallback(
    (budget: number) => setLiveBudget(budget),
    []
  );

  const handleProgressChange = useCallback(
    (progress: number) => {
      setLiveProgress(progress);
      if (cosplay && user && cosplay.auto_progress) {
        updateCosplan.mutate({
          id: cosplay.id,
          userId: user.id,
          progress_level: progress,
        });
      }
    },
    [cosplay, user, updateCosplan]
  );

  const effectiveProgress =
    cosplay?.auto_progress && liveProgress !== null
      ? liveProgress
      : cosplay?.progress_level ?? 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[hsl(var(--mp-primary))] animate-spin" />
          <p className="text-white/50 text-sm">Chargement du cosplay...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!cosplay) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/50 text-lg">Cosplay introuvable</p>
          <Button
            onClick={() => navigate("/espace-membre/vestiaire")}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux cosplays
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Hero ── */}
      <CosplayHubHero
        cosplay={cosplay}
        liveBudget={liveBudget}
        effectiveProgress={effectiveProgress}
      />

      {/* ── Tab Bar ── */}
      <div
        className={cn(
          "border-b border-white/10",
          isCompleted ? "max-w-6xl mx-auto px-6 md:px-8" : "max-w-6xl mx-auto px-4"
        )}
      >
        <div className="flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  activeTab === tab.id ? tab.accent : "text-current"
                )}
              >
                {tab.icon}
              </span>
              {tab.label}

              {activeTab === tab.id && (
                <motion.div
                  layoutId="cosplayHubActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div
        className={cn(
          "py-6",
          isCompleted
            ? "max-w-6xl mx-auto px-6 md:px-8"
            : "max-w-6xl mx-auto px-4"
        )}
      >
        {activeTab === "overview" && (
          <OverviewTab cosplay={cosplay} userId={user?.id ?? ""} />
        )}

        {activeTab === "tasks" && (
          <ProjectTasksTab
            planId={cosplay.id}
            userId={user?.id ?? ""}
            autoProgress={cosplay.auto_progress}
            onBudgetChange={handleBudgetChange}
            onProgressChange={handleProgressChange}
          />
        )}

        {activeTab === "photos" && (
          <PhotosTab cosplay={cosplay} userId={user?.id ?? ""} />
        )}

        {activeTab === "lineup" && (
          <LineupTab cosplay={cosplay} userId={user?.id ?? ""} />
        )}

        {activeTab === "files" && <FilesTab />}
      </div>
    </div>
  );
}
