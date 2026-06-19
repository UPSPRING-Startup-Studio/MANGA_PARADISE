import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useVolunteerMissions,
  useVolunteerAssignments,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  type VolunteerMission,
  type VolunteerAssignment,
} from "@/hooks/association/useVolunteerModule";
import {
  LEADER_ROLES,
  type Association,
  type AssociationRole,
} from "@/hooks/useAssociation";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VolunteerPlanning = () => {
  const { association, role: viewerRole } = useOutletContext<AssociationContext>();
  const associationId = association?.id;
  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;

  const [missionFilter, setMissionFilter] = useState("all");

  const { data: missions, isLoading: missionsLoading } = useVolunteerMissions(
    associationId,
    { status: "open" }
  );
  const { data: inProgressMissions } = useVolunteerMissions(
    associationId,
    { status: "in_progress" }
  );
  const { data: assignments, isLoading: assignmentsLoading } =
    useVolunteerAssignments(associationId);

  const allActiveMissions = useMemo(() => {
    const all = [...(missions || []), ...(inProgressMissions || [])];
    // Sort by start date
    return all
      .filter((m) => m.start_at)
      .sort(
        (a, b) =>
          new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime()
      );
  }, [missions, inProgressMissions]);

  // Group missions by day
  const groupedByDay = useMemo(() => {
    const groups: Record<string, VolunteerMission[]> = {};
    allActiveMissions.forEach((m) => {
      if (!m.start_at) return;
      const dayKey = new Date(m.start_at).toISOString().split("T")[0];
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(m);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allActiveMissions]);

  // Get assignments for a mission
  const getAssignmentsForMission = (missionId: string) =>
    (assignments || []).filter((a) => a.mission_id === missionId);

  const isLoading = missionsLoading || assignmentsLoading;

  if (!association) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-foreground">Planning</h1>
        <p className="text-muted-foreground mt-1">
          Vue planning des missions et affectations
        </p>
      </div>

      {/* Stats summary */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-foreground">
              {groupedByDay.length}
            </span>
            <span className="text-xs text-muted-foreground">
              jour{groupedByDay.length > 1 ? "s" : ""} planifié{groupedByDay.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-foreground">
              {allActiveMissions.length}
            </span>
            <span className="text-xs text-muted-foreground">missions actives</span>
          </div>
          {(() => {
            const unfilled = allActiveMissions.reduce(
              (sum, m) => sum + Math.max(m.slots_needed - m.slots_filled, 0),
              0
            );
            return unfilled > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-1.5">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">
                  {unfilled}
                </span>
                <span className="text-xs text-orange-300/80">
                  poste{unfilled > 1 ? "s" : ""} à pourvoir
                </span>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ))}
        </div>
      ) : groupedByDay.length > 0 ? (
        <div className="space-y-8">
          {groupedByDay.map(([dayKey, dayMissions]) => (
            <div key={dayKey}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E84A2B]/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#E84A2B]" />
                </div>
                <div>
                  <h3 className="text-lg font-display text-foreground capitalize">
                    {new Date(dayKey + "T12:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {dayMissions.length} mission{dayMissions.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Missions for this day */}
              <div className="space-y-3 ml-5 border-l-2 border-border/30 pl-6">
                {dayMissions.map((mission) => {
                  const missionAssignments = getAssignmentsForMission(mission.id);
                  const confirmed = missionAssignments.filter((a) =>
                    ["confirmed", "checked_in", "completed"].includes(a.status)
                  ).length;
                  const isFull = confirmed >= mission.slots_needed;

                  return (
                    <Card
                      key={mission.id}
                      className={cn(
                        "p-4 bg-[#111827]/40 border-border/30 transition-all",
                        isFull
                          ? "border-l-2 border-l-emerald-500/50"
                          : "border-l-2 border-l-orange-500/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-foreground text-sm">
                              {mission.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] border",
                                PRIORITY_COLORS[mission.priority]
                              )}
                            >
                              {PRIORITY_LABELS[mission.priority]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] border",
                                MISSION_STATUS_COLORS[mission.status]
                              )}
                            >
                              {MISSION_STATUS_LABELS[mission.status]}
                            </Badge>
                          </div>

                          {/* Time & location */}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {mission.start_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(mission.start_at)}
                                {mission.end_at && ` – ${formatTime(mission.end_at)}`}
                              </span>
                            )}
                            {mission.zone && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {mission.zone}
                              </span>
                            )}
                          </div>

                          {/* Capacity */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  isFull ? "text-emerald-400" : "text-orange-400"
                                )}
                              >
                                {confirmed}/{mission.slots_needed}
                              </span>
                            </div>
                            {isFull ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <span className="text-[10px] text-orange-400">
                                {mission.slots_needed - confirmed} manquant
                                {mission.slots_needed - confirmed > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          {/* Assigned volunteers */}
                          {missionAssignments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {missionAssignments.slice(0, 6).map((a) => (
                                <span
                                  key={a.id}
                                  className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full border",
                                    ASSIGNMENT_STATUS_COLORS[a.status]
                                  )}
                                >
                                  {a.profile?.display_name ||
                                    a.profile?.username ||
                                    "Bénévole"}
                                </span>
                              ))}
                              {missionAssignments.length > 6 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{missionAssignments.length - 6}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Aucun planning
          </h2>
          <p className="text-muted-foreground max-w-md">
            Les missions ouvertes avec des dates apparaîtront ici sous forme de
            planning. Crée des missions avec des créneaux pour les voir ici.
          </p>
        </div>
      )}
    </div>
  );
};

export default VolunteerPlanning;
