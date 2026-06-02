import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  ArrowRight,
  SearchX,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useVolunteerAssignments,
  useVolunteerMissions,
  useUpdateAssignmentStatus,
  useCreateAssignment,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  type VolunteerAssignment,
  type AssignmentStatus,
} from "@/hooks/association/useVolunteerModule";
import {
  useAssociationMembers,
  LEADER_ROLES,
  type Association,
  type AssociationRole,
} from "@/hooks/useAssociation";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import { toast } from "sonner";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const VolunteerAssignments = () => {
  const { association, role: viewerRole } = useOutletContext<AssociationContext>();
  const associationId = association?.id;
  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;
  const gov = useAssociationGovernance();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const { data: assignments, isLoading } = useVolunteerAssignments(
    associationId,
    statusFilter !== "all" ? { status: statusFilter as AssignmentStatus } : undefined
  );
  const updateStatus = useUpdateAssignmentStatus();

  const filtered = useMemo(() => {
    if (!assignments) return [];
    if (!search.trim()) return assignments;
    const q = search.toLowerCase();
    return assignments.filter(
      (a) =>
        (a.profile?.display_name || "").toLowerCase().includes(q) ||
        (a.profile?.username || "").toLowerCase().includes(q) ||
        (a.mission?.title || "").toLowerCase().includes(q)
    );
  }, [assignments, search]);

  const stats = useMemo(() => {
    if (!assignments) return { proposed: 0, confirmed: 0, checkedIn: 0, completed: 0 };
    return {
      proposed: assignments.filter((a) => a.status === "proposed").length,
      confirmed: assignments.filter((a) => a.status === "confirmed").length,
      checkedIn: assignments.filter((a) => a.status === "checked_in").length,
      completed: assignments.filter((a) => a.status === "completed").length,
    };
  }, [assignments]);

  if (!association) return null;

  return (
    <div className="space-y-6">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Affectations</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des affectations bénévoles aux missions
          </p>
        </div>
        {isLeader && (
          <Button
            onClick={() => setCreateSheetOpen(true)}
            disabled={!gov.canManageAssignments}
            className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90 shrink-0"
          >
            <UserCheck className="h-4 w-4" />
            Nouvelle affectation
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Proposées" count={stats.proposed} color="text-cyan-400" />
        <StatPill label="Confirmées" count={stats.confirmed} color="text-green-400" />
        <StatPill label="Check-in" count={stats.checkedIn} color="text-emerald-400" />
        <StatPill label="Terminées" count={stats.completed} color="text-blue-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par bénévole ou mission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#111827]/60 border-border/40"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-[#111827]/60 border-border/40">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(ASSIGNMENT_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isLeader={isLeader}
              onUpdateStatus={(status) => {
                if (!gov.canManageAssignments) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
                updateStatus.mutate({ assignmentId: assignment.id, status });
              }}
              isUpdating={updateStatus.isPending}
              canManageAssignments={gov.canManageAssignments}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Aucune affectation
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            {statusFilter !== "all"
              ? "Aucune affectation avec ce filtre."
              : "Commence par affecter des bénévoles aux missions ouvertes."}
          </p>
        </div>
      )}

      {/* Create Sheet */}
      {associationId && (
        <CreateAssignmentSheet
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          associationId={associationId}
          canManageAssignments={gov.canManageAssignments}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
      <span className={cn("text-sm font-medium", color)}>{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function AssignmentCard({
  assignment,
  isLeader,
  onUpdateStatus,
  isUpdating,
  canManageAssignments = true,
}: {
  assignment: VolunteerAssignment;
  isLeader: boolean;
  onUpdateStatus: (status: AssignmentStatus) => void;
  isUpdating: boolean;
  canManageAssignments?: boolean;
}) {
  const name = assignment.profile?.display_name || assignment.profile?.username || "Bénévole";
  const statusClass = ASSIGNMENT_STATUS_COLORS[assignment.status] || "";
  const missionTitle = assignment.mission?.title || "Mission";
  const shiftLabel = assignment.shift
    ? `${new Date(assignment.shift.start_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - ${new Date(assignment.shift.end_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : null;

  return (
    <Card className="p-4 bg-[#111827]/40 border-border/30 hover:border-border/50 transition-all">
      <div className="flex items-center gap-4">
        {/* Volunteer */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={assignment.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-[#E84A2B]/20 text-[#E84A2B] text-sm">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">{name}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{missionTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] border", statusClass)}>
              {ASSIGNMENT_STATUS_LABELS[assignment.status]}
            </Badge>
            {assignment.mission?.zone && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {assignment.mission.zone}
              </span>
            )}
            {shiftLabel && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {shiftLabel}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isLeader && !isUpdating && (
          <div className="flex gap-1.5 shrink-0">
            {assignment.status === "proposed" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canManageAssignments}
                  className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  onClick={() => onUpdateStatus("confirmed")}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canManageAssignments}
                  className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => onUpdateStatus("cancelled")}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            {assignment.status === "confirmed" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={!canManageAssignments}
                className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => onUpdateStatus("checked_in")}
              >
                <UserCheck className="w-4 h-4 mr-1" /> Check-in
              </Button>
            )}
            {assignment.status === "checked_in" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canManageAssignments}
                  className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  onClick={() => onUpdateStatus("completed")}
                >
                  <Check className="w-4 h-4 mr-1" /> Terminer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canManageAssignments}
                  className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => onUpdateStatus("absent")}
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}
        {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Create Assignment Sheet
// ──────────────────────────────────────────────

function CreateAssignmentSheet({
  open,
  onOpenChange,
  associationId,
  canManageAssignments = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
  canManageAssignments?: boolean;
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMission, setSelectedMission] = useState("");

  const { data: members } = useAssociationMembers(associationId);
  const { data: missions } = useVolunteerMissions(associationId, { status: "open" });
  const createAssignment = useCreateAssignment();

  const volunteers = useMemo(
    () =>
      (members || []).filter((m) =>
        ["benevole", "responsable", "membre"].includes(m.role) && m.is_active
      ),
    [members]
  );

  const handleSubmit = () => {
    if (!canManageAssignments) { toast.error("Action non autorisée"); return; }
    if (!selectedUser || !selectedMission) return;
    createAssignment.mutate(
      {
        association_id: associationId,
        user_id: selectedUser,
        mission_id: selectedMission,
      },
      {
        onSuccess: () => {
          setSelectedUser("");
          setSelectedMission("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-[#0D0D0D] border-l border-border/50"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">Nouvelle affectation</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Bénévole</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-[#111827]/60 border-border/40">
                <SelectValue placeholder="Choisir un bénévole..." />
              </SelectTrigger>
              <SelectContent>
                {volunteers.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id}>
                    {v.profile?.display_name || v.profile?.username || "Bénévole"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Mission</Label>
            <Select value={selectedMission} onValueChange={setSelectedMission}>
              <SelectTrigger className="bg-[#111827]/60 border-border/40">
                <SelectValue placeholder="Choisir une mission..." />
              </SelectTrigger>
              <SelectContent>
                {(missions || []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title} ({m.slots_filled}/{m.slots_needed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/30">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedUser || !selectedMission || createAssignment.isPending || !canManageAssignments}
              className="flex-1 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
            >
              {createAssignment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Affecter"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default VolunteerAssignments;
