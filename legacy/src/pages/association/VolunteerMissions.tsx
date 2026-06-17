import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Star,
  MoreHorizontal,
  Pencil,
  CheckCircle,
  XCircle,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { LEADER_ROLES } from "@/hooks/useAssociation";
import {
  useVolunteerMissions,
  useCreateMission,
  useUpdateMission,
  type VolunteerMission,
  type MissionStatus,
  type MissionPriority,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/hooks/association/useVolunteerModule";
import {
  PARTICIPATION_OPTIONS,
  EXPERIENCE_LABELS,
} from "@/hooks/association/useAssociationMembersV2";
import { useAssociationEvents } from "@/hooks/useAssociationEvents";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface OutletCtx {
  association: Association;
  role: AssociationRole;
}

type StatusTab = "all" | MissionStatus;

interface MissionFormData {
  title: string;
  description: string;
  event_id: string | null;
  zone: string;
  pole: string;
  required_skills: string[];
  required_experience: string;
  slots_needed: number;
  start_at: string;
  end_at: string;
  priority: MissionPriority;
  status: MissionStatus;
  responsible_id: string | null;
  tags: string[];
  notes: string;
}

const EMPTY_FORM: MissionFormData = {
  title: "",
  description: "",
  event_id: null,
  zone: "",
  pole: "",
  required_skills: [],
  required_experience: "debutant",
  slots_needed: 1,
  start_at: "",
  end_at: "",
  priority: "medium",
  status: "draft",
  responsible_id: null,
  tags: [],
  notes: "",
};

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "draft", label: "Brouillon" },
  { value: "open", label: "Ouverte" },
  { value: "in_progress", label: "En cours" },
  { value: "complete", label: "Terminée" },
  { value: "cancelled", label: "Annulée" },
];

const EXPERIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "debutant", label: "Débutant·e" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "confirme", label: "Confirmé·e" },
  { value: "expert", label: "Expert·e" },
];

const EXPERIENCE_BADGE_COLORS: Record<string, string> = {
  debutant: "bg-slate-500/20 text-slate-300",
  intermediaire: "bg-blue-500/20 text-blue-300",
  confirme: "bg-purple-500/20 text-purple-300",
  expert: "bg-amber-500/20 text-amber-300",
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatDateTime(iso: string | null): string {
  if (!iso) return "---";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSkillLabel(value: string): { label: string; emoji: string } | null {
  const opt = PARTICIPATION_OPTIONS.find((o) => o.value === value);
  return opt ? { label: opt.label, emoji: opt.emoji } : null;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function MissionCardSkeleton() {
  return (
    <Card className="bg-[#111827]/40 border-border/30">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-8 w-full rounded" />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-[#111827]/60 border border-border/20 flex items-center justify-center mb-4">
        <Target className="w-9 h-9 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-1">
        Aucune mission trouvée
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Créez votre première mission bénévole pour commencer à organiser votre équipe.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Mission Card
// ──────────────────────────────────────────────

function MissionCard({
  mission,
  isLeader,
  onEdit,
  onStatusChange,
}: {
  mission: VolunteerMission;
  isLeader: boolean;
  onEdit: (m: VolunteerMission) => void;
  onStatusChange: (id: string, status: MissionStatus) => void;
}) {
  const fillPercent =
    mission.slots_needed > 0
      ? Math.min(
          Math.round((mission.slots_filled / mission.slots_needed) * 100),
          100
        )
      : 0;

  return (
    <Card className="bg-[#111827]/40 border-border/30 hover:border-[#E84A2B]/30 transition-colors group">
      <CardContent className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base truncate">
              {mission.title}
            </h3>
            {mission.event && (
              <p className="text-xs text-[#E84A2B] mt-0.5 truncate">
                {mission.event.title}
                {mission.event.city && ` — ${mission.event.city}`}
              </p>
            )}
          </div>

          {isLeader && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white shrink-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#1a1a2e] border-border/30"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(mission)}
                  className="text-gray-300 focus:text-white"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {mission.status === "draft" && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(mission.id, "open")}
                    className="text-green-400 focus:text-green-300"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publier
                  </DropdownMenuItem>
                )}
                {(mission.status === "open" ||
                  mission.status === "in_progress") && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(mission.id, "complete")}
                    className="text-emerald-400 focus:text-emerald-300"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terminer
                  </DropdownMenuItem>
                )}
                {mission.status !== "cancelled" &&
                  mission.status !== "complete" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(mission.id, "cancelled")}
                      className="text-red-400 focus:text-red-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Annuler
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {mission.description && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {mission.description}
          </p>
        )}

        {/* Zone / Pole badges */}
        {(mission.zone || mission.pole) && (
          <div className="flex flex-wrap gap-1.5">
            {mission.zone && (
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-xs"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {mission.zone}
              </Badge>
            )}
            {mission.pole && (
              <Badge
                variant="outline"
                className="bg-violet-500/10 text-violet-300 border-violet-500/30 text-xs"
              >
                {mission.pole}
              </Badge>
            )}
          </div>
        )}

        {/* Required skills chips */}
        {mission.required_skills && mission.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mission.required_skills.map((skill) => {
              const info = getSkillLabel(skill);
              return (
                <Badge
                  key={skill}
                  variant="outline"
                  className="bg-white/5 text-gray-300 border-border/20 text-xs"
                >
                  {info ? `${info.emoji} ${info.label}` : skill}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Status row: experience + priority + status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {mission.required_experience && (
            <Badge
              className={cn(
                "text-xs border-0",
                EXPERIENCE_BADGE_COLORS[mission.required_experience] ??
                  "bg-slate-500/20 text-slate-300"
              )}
            >
              <Star className="w-3 h-3 mr-1" />
              {EXPERIENCE_LABELS[
                mission.required_experience as keyof typeof EXPERIENCE_LABELS
              ] ?? mission.required_experience}
            </Badge>
          )}
          <Badge
            className={cn(
              "text-xs border-0",
              PRIORITY_COLORS[mission.priority]
            )}
          >
            {PRIORITY_LABELS[mission.priority]}
          </Badge>
          <Badge
            className={cn(
              "text-xs",
              MISSION_STATUS_COLORS[mission.status]
            )}
          >
            {MISSION_STATUS_LABELS[mission.status]}
          </Badge>
        </div>

        {/* Capacity bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {mission.slots_filled}/{mission.slots_needed} benevoles
            </span>
            <span className="text-gray-500">{fillPercent}%</span>
          </div>
          <Progress
            value={fillPercent}
            className="h-1.5 bg-white/5"
          />
        </div>

        {/* Schedule */}
        {(mission.start_at || mission.end_at) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              {formatDateTime(mission.start_at)}
              {mission.end_at && ` - ${formatDateTime(mission.end_at)}`}
            </span>
          </div>
        )}

        {/* Responsible */}
        {mission.responsible && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/10">
            <Avatar className="w-6 h-6">
              <AvatarImage src={mission.responsible.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[#E84A2B]/20 text-[#E84A2B] text-[10px]">
                {initials(mission.responsible.display_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-400 truncate">
              {mission.responsible.display_name ?? "Responsable"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Create / Edit Sheet
// ──────────────────────────────────────────────

function MissionFormSheet({
  open,
  onOpenChange,
  form,
  setForm,
  events,
  onSubmit,
  isEditing,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: MissionFormData;
  setForm: React.Dispatch<React.SetStateAction<MissionFormData>>;
  events: { id: string; title: string }[];
  onSubmit: () => void;
  isEditing: boolean;
  isPending: boolean;
}) {
  const [tagInput, setTagInput] = useState("");

  function toggleSkill(value: string) {
    setForm((f) => ({
      ...f,
      required_skills: f.required_skills.includes(value)
        ? f.required_skills.filter((s) => s !== value)
        : [...f.required_skills, value],
    }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-[#0D0D0D] border-border/30 overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white text-lg">
            {isEditing ? "Modifier la mission" : "Créer une mission"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">
              Titre <span className="text-[#E84A2B]">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Accueil visiteurs Hall A"
              className="bg-white/5 border-border/30 text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Détails de la mission..."
              className="bg-white/5 border-border/30 text-white min-h-[80px]"
            />
          </div>

          {/* Event */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Evenement lié</Label>
            <Select
              value={form.event_id ?? "none"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, event_id: v === "none" ? null : v }))
              }
            >
              <SelectTrigger className="bg-white/5 border-border/30 text-white">
                <SelectValue placeholder="Aucun événement" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-border/30">
                <SelectItem value="none">Aucun</SelectItem>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>
                    {evt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone + Pole */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Zone</Label>
              <Input
                value={form.zone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zone: e.target.value }))
                }
                placeholder="Ex: Hall A"
                className="bg-white/5 border-border/30 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Pole</Label>
              <Input
                value={form.pole}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pole: e.target.value }))
                }
                placeholder="Ex: Logistique"
                className="bg-white/5 border-border/30 text-white"
              />
            </div>
          </div>

          {/* Required skills */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Compétences requises</Label>
            <div className="flex flex-wrap gap-1.5">
              {PARTICIPATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSkill(opt.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-colors",
                    form.required_skills.includes(opt.value)
                      ? "bg-[#E84A2B]/20 text-[#E84A2B] border-[#E84A2B]/40"
                      : "bg-white/5 text-gray-400 border-border/20 hover:border-border/40"
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Required experience */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Expérience requise</Label>
            <Select
              value={form.required_experience}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, required_experience: v }))
              }
            >
              <SelectTrigger className="bg-white/5 border-border/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-border/30">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slots needed */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Nombre de bénévoles</Label>
            <Input
              type="number"
              min={1}
              value={form.slots_needed}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slots_needed: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              className="bg-white/5 border-border/30 text-white w-28"
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Début</Label>
              <Input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_at: e.target.value }))
                }
                className="bg-white/5 border-border/30 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Fin</Label>
              <Input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_at: e.target.value }))
                }
                className="bg-white/5 border-border/30 text-white"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Priorité</Label>
            <Select
              value={form.priority}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, priority: v as MissionPriority }))
              }
            >
              <SelectTrigger className="bg-white/5 border-border/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-border/30">
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Normale</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Ajouter un tag..."
                className="bg-white/5 border-border/30 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                className="border-border/30 text-gray-300"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-white/5 text-gray-300 border-border/20 cursor-pointer hover:border-red-500/40 hover:text-red-300 transition-colors"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-gray-300">Notes internes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Notes visibles uniquement par l'équipe..."
              className="bg-white/5 border-border/30 text-white min-h-[60px]"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={onSubmit}
            disabled={!form.title.trim() || isPending}
            className="w-full bg-[#E84A2B] hover:bg-[#E84A2B]/80 text-white"
          >
            {isPending
              ? "Enregistrement..."
              : isEditing
              ? "Mettre à jour"
              : "Créer la mission"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────
// Main page component
// ──────────────────────────────────────────────

function VolunteerMissions() {
  const { association, role } = useOutletContext<OutletCtx>();
  const isLeader = LEADER_ROLES.includes(role);
  const gov = useAssociationGovernance();

  // State
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<VolunteerMission | null>(
    null
  );
  const [form, setForm] = useState<MissionFormData>(EMPTY_FORM);

  // Queries
  const statusFilter =
    statusTab === "all" ? undefined : (statusTab as MissionStatus);
  const { data: missions, isLoading } = useVolunteerMissions(
    association?.id,
    { status: statusFilter }
  );
  const { data: events } = useAssociationEvents(association?.id);

  // Mutations
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();

  // Filtered missions (client-side search)
  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    if (!search.trim()) return missions;
    const q = search.toLowerCase();
    return missions.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.zone?.toLowerCase().includes(q) ||
        m.pole?.toLowerCase().includes(q) ||
        m.event?.title?.toLowerCase().includes(q)
    );
  }, [missions, search]);

  // Event list for select
  const eventOptions = useMemo(
    () => (events ?? []).map((e: any) => ({ id: e.id, title: e.title })),
    [events]
  );

  // Handlers
  function openCreate() {
    if (!gov.canManageMissions) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    setEditingMission(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  function openEdit(mission: VolunteerMission) {
    if (!gov.canManageMissions) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    setEditingMission(mission);
    setForm({
      title: mission.title,
      description: mission.description ?? "",
      event_id: mission.event_id,
      zone: mission.zone ?? "",
      pole: mission.pole ?? "",
      required_skills: mission.required_skills ?? [],
      required_experience: mission.required_experience ?? "debutant",
      slots_needed: mission.slots_needed,
      start_at: mission.start_at
        ? mission.start_at.slice(0, 16)
        : "",
      end_at: mission.end_at
        ? mission.end_at.slice(0, 16)
        : "",
      priority: mission.priority,
      status: mission.status,
      responsible_id: mission.responsible_id,
      tags: mission.tags ?? [],
      notes: mission.notes ?? "",
    });
    setSheetOpen(true);
  }

  function handleStatusChange(missionId: string, newStatus: MissionStatus) {
    if (!gov.canManageMissions) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    updateMission.mutate({ missionId, updates: { status: newStatus } });
  }

  function handleSubmit() {
    if (!gov.canManageMissions) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    if (!form.title.trim()) return;

    if (editingMission) {
      updateMission.mutate(
        {
          missionId: editingMission.id,
          updates: {
            title: form.title,
            description: form.description || null,
            event_id: form.event_id,
            zone: form.zone || null,
            pole: form.pole || null,
            required_skills: form.required_skills,
            required_experience: form.required_experience,
            slots_needed: form.slots_needed,
            start_at: form.start_at || null,
            end_at: form.end_at || null,
            priority: form.priority,
            status: form.status,
            responsible_id: form.responsible_id,
            tags: form.tags,
            notes: form.notes || null,
          },
        },
        { onSuccess: () => setSheetOpen(false) }
      );
    } else {
      createMission.mutate(
        {
          association_id: association.id,
          title: form.title,
          description: form.description || null,
          event_id: form.event_id,
          zone: form.zone || null,
          pole: form.pole || null,
          required_skills: form.required_skills,
          required_interests: [],
          required_experience: form.required_experience,
          slots_needed: form.slots_needed,
          start_at: form.start_at || null,
          end_at: form.end_at || null,
          priority: form.priority,
          status: form.status,
          responsible_id: form.responsible_id,
          tags: form.tags,
          notes: form.notes || null,
        },
        { onSuccess: () => setSheetOpen(false) }
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] space-y-6">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Missions benevoles
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organisez et suivez les missions de votre equipe
          </p>
        </div>
        {isLeader && (
          <Button
            onClick={openCreate}
            disabled={!gov.canManageMissions}
            className="bg-[#E84A2B] hover:bg-[#E84A2B]/80 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une mission
          </Button>
        )}
      </div>

      {/* Search + status tabs */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une mission..."
            className="pl-9 bg-white/5 border-border/30 text-white"
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                statusTab === tab.value
                  ? "bg-[#E84A2B]/20 text-[#E84A2B] border border-[#E84A2B]/30"
                  : "bg-white/5 text-gray-400 border border-transparent hover:text-gray-200 hover:bg-white/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <MissionCardSkeleton />
            <MissionCardSkeleton />
            <MissionCardSkeleton />
            <MissionCardSkeleton />
          </>
        ) : filteredMissions.length === 0 ? (
          <EmptyState />
        ) : (
          filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isLeader={isLeader}
              onEdit={openEdit}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Sheet */}
      <MissionFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        form={form}
        setForm={setForm}
        events={eventOptions}
        onSubmit={handleSubmit}
        isEditing={!!editingMission}
        isPending={createMission.isPending || updateMission.isPending}
      />
    </div>
  );
}

export default VolunteerMissions;
