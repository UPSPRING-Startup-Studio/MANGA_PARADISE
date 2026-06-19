import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Search,
  Filter,
  UserPlus,
  Check,
  X,
  Clock,
  FileText,
  Eye,
  MailPlus,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { LEADER_ROLES } from "@/hooks/useAssociation";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import { toast } from "sonner";
import {
  useVolunteerApplications,
  useUpdateApplicationStatus,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from "@/hooks/association/useVolunteerModule";
import type {
  VolunteerApplication,
  ApplicationStatus,
} from "@/hooks/association/useVolunteerModule";
import {
  INTERESTS_OPTIONS,
  PARTICIPATION_OPTIONS,
  EXPERIENCE_LABELS,
} from "@/hooks/association/useAssociationMembersV2";
import type { VolunteerExperience } from "@/hooks/association/useAssociationMembersV2";

// ──────────────────────────────────────────────
// Context type
// ──────────────────────────────────────────────

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const ALL_STATUSES: (ApplicationStatus | "all")[] = [
  "all",
  "invited",
  "started",
  "incomplete",
  "pending_review",
  "approved",
  "rejected",
  "archived",
];

const STATUS_TAB_LABELS: Record<ApplicationStatus | "all", string> = {
  all: "Toutes",
  invited: "Invite",
  started: "Commencee",
  incomplete: "Incomplete",
  pending_review: "A valider",
  approved: "Approuvee",
  rejected: "Refusee",
  archived: "Archivee",
};

const SOURCE_LABELS: Record<string, string> = {
  self: "Candidature",
  invitation: "Invitation",
  external: "Externe",
  promotion: "Promotion",
};

const SOURCE_COLORS: Record<string, string> = {
  self: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  invitation: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  external: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  promotion: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const EXPERIENCE_COLORS: Record<string, string> = {
  debutant: "bg-slate-500/20 text-slate-300",
  intermediaire: "bg-blue-500/20 text-blue-300",
  confirme: "bg-purple-500/20 text-purple-300",
  expert: "bg-amber-500/20 text-amber-300",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  semaine: "En semaine",
  weekend: "Week-end",
  conventions: "Conventions",
  soirees: "Soirees",
  festivals: "Festivals",
  vacances: "Vacances scolaires",
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getInitials(app: VolunteerApplication): string {
  if (app.first_name && app.last_name) {
    return `${app.first_name[0]}${app.last_name[0]}`.toUpperCase();
  }
  if (app.profile?.display_name) {
    return app.profile.display_name.slice(0, 2).toUpperCase();
  }
  if (app.email) {
    return app.email.slice(0, 2).toUpperCase();
  }
  return "??";
}

function getDisplayName(app: VolunteerApplication): string {
  if (app.profile?.display_name) return app.profile.display_name;
  if (app.first_name && app.last_name)
    return `${app.first_name} ${app.last_name}`;
  if (app.first_name) return app.first_name;
  return app.email || "Sans nom";
}

function getAvatarUrl(app: VolunteerApplication): string | null {
  return app.profile?.avatar_url || null;
}

function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "a l'instant";
  if (diffMins < 60) return `il y a ${diffMins}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 30) return `il y a ${diffDays}j`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)}mois`;
  return `il y a ${Math.floor(diffDays / 365)}an(s)`;
}

function getInterestLabel(value: string): { label: string; emoji: string } | null {
  const found = INTERESTS_OPTIONS.find((o) => o.value === value);
  return found ? { label: found.label, emoji: found.emoji } : null;
}

function getParticipationLabel(value: string): string {
  const found = PARTICIPATION_OPTIONS.find((o) => o.value === value);
  return found ? `${found.emoji} ${found.label}` : value;
}

// ──────────────────────────────────────────────
// Skeleton cards
// ──────────────────────────────────────────────

function ApplicationCardSkeleton() {
  return (
    <Card className="bg-[#111827]/40 border-border/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Detail Sheet
// ──────────────────────────────────────────────

function ApplicationDetailSheet({
  application,
  open,
  onOpenChange,
  isLeader,
  onUpdateStatus,
  isUpdating,
  canReviewSubmissions = true,
}: {
  application: VolunteerApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLeader: boolean;
  onUpdateStatus: (
    appId: string,
    status: ApplicationStatus,
    opts?: { reviewNotes?: string; rejectionReason?: string }
  ) => void;
  isUpdating: boolean;
  canReviewSubmissions?: boolean;
}) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  if (!application) return null;

  const availableKeys = Object.entries(application.availability || {})
    .filter(([, v]) => v)
    .map(([k]) => k);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-[#0D0D0D] border-border/30 overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="text-foreground font-display">
            Detail de la candidature
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            {relativeDate(application.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* ── Identity ── */}
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              {getAvatarUrl(application) && (
                <AvatarImage src={getAvatarUrl(application)!} />
              )}
              <AvatarFallback className="bg-sakura/20 text-sakura font-bold">
                {getInitials(application)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {getDisplayName(application)}
              </p>
              {application.email && (
                <p className="text-sm text-muted-foreground">
                  {application.email}
                </p>
              )}
              {application.phone && (
                <p className="text-xs text-muted-foreground">
                  {application.phone}
                </p>
              )}
            </div>
          </div>

          {/* ── Status + Source + Experience ── */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                APPLICATION_STATUS_COLORS[application.status]
              )}
            >
              {APPLICATION_STATUS_LABELS[application.status]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                SOURCE_COLORS[application.source] || "bg-gray-500/20 text-gray-300"
              )}
            >
              {SOURCE_LABELS[application.source] || application.source}
            </Badge>
            {application.experience_level && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  EXPERIENCE_COLORS[application.experience_level] ||
                    "bg-slate-500/20 text-slate-300"
                )}
              >
                {EXPERIENCE_LABELS[
                  application.experience_level as VolunteerExperience
                ] || application.experience_level}
              </Badge>
            )}
          </div>

          {/* ── Onboarding progress ── */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Progression onboarding
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sakura transition-all"
                  style={{
                    width: `${Math.round(((application.onboarding_step || 0) / 9) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {application.onboarding_step || 0}/9
              </span>
            </div>
          </div>

          {/* ── Location ── */}
          {(application.city || application.profile?.city) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ville</p>
              <p className="text-sm text-foreground">
                {application.city || application.profile?.city}
              </p>
            </div>
          )}

          {/* ── Interests ── */}
          {application.interests && application.interests.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Centres d'interet
              </p>
              <div className="flex flex-wrap gap-1.5">
                {application.interests.map((interest) => {
                  const info = getInterestLabel(interest);
                  return (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="text-xs bg-white/5 border-white/10 text-foreground"
                    >
                      {info ? `${info.emoji} ${info.label}` : interest}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Skills ── */}
          {application.skills && application.skills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Competences</p>
              <div className="flex flex-wrap gap-1.5">
                {application.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-xs bg-white/5 border-white/10 text-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Participation preferences ── */}
          {application.participation_preferences &&
            application.participation_preferences.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Preferences de participation
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {application.participation_preferences.map((pref) => (
                    <Badge
                      key={pref}
                      variant="outline"
                      className="text-xs bg-white/5 border-white/10 text-foreground"
                    >
                      {getParticipationLabel(pref)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* ── Availability ── */}
          {availableKeys.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Disponibilites
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableKeys.map((key) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  >
                    {AVAILABILITY_LABELS[key] || key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Languages ── */}
          {application.languages && application.languages.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Langues</p>
              <p className="text-sm text-foreground">
                {application.languages.join(", ")}
              </p>
            </div>
          )}

          {/* ── Motivation ── */}
          {application.motivation && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Motivation</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-white/[0.03] rounded-lg p-3 border border-border/20">
                {application.motivation}
              </p>
            </div>
          )}

          {/* ── Consent photo ── */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Consentement photo
            </p>
            <p className="text-sm text-foreground">
              {application.consent_photo ? "Oui" : "Non"}
            </p>
          </div>

          {/* ── Review notes (existing) ── */}
          {application.review_notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Notes de revue
              </p>
              <p className="text-sm text-foreground/80 bg-white/[0.03] rounded-lg p-3 border border-border/20">
                {application.review_notes}
              </p>
              {application.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Revu {relativeDate(application.reviewed_at)}
                  {application.reviewer?.display_name &&
                    ` par ${application.reviewer.display_name}`}
                </p>
              )}
            </div>
          )}

          {/* ── Rejection reason ── */}
          {application.rejection_reason && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Motif de refus
              </p>
              <p className="text-sm text-red-300/80 bg-red-500/[0.05] rounded-lg p-3 border border-red-500/20">
                {application.rejection_reason}
              </p>
            </div>
          )}

          {/* ── Invitation info ── */}
          {application.source === "invitation" &&
            application.invitation_message && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Message d'invitation
                </p>
                <p className="text-sm text-foreground/80 bg-white/[0.03] rounded-lg p-3 border border-border/20">
                  {application.invitation_message}
                </p>
              </div>
            )}

          {/* ── Review history (dates) ── */}
          <div className="space-y-1 text-xs text-muted-foreground border-t border-border/20 pt-4">
            <p>Cree le {new Date(application.created_at).toLocaleDateString("fr-FR")}</p>
            {application.submitted_at && (
              <p>
                Soumise le{" "}
                {new Date(application.submitted_at).toLocaleDateString("fr-FR")}
              </p>
            )}
            {application.approved_at && (
              <p>
                Approuvee le{" "}
                {new Date(application.approved_at).toLocaleDateString("fr-FR")}
              </p>
            )}
            {application.reviewed_at && (
              <p>
                Derniere revue le{" "}
                {new Date(application.reviewed_at).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>

          {/* ── Leader actions ── */}
          {isLeader && application.status === "pending_review" && (
            <div className="space-y-3 border-t border-border/20 pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </p>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Notes de revue (optionnel)
                </label>
                <Input
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ajouter une note..."
                  className="bg-white/5 border-border/30"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isUpdating || !canReviewSubmissions}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white flex-1"
                  onClick={() =>
                    onUpdateStatus(application.id, "approved", {
                      reviewNotes: reviewNotes || undefined,
                    })
                  }
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating || !canReviewSubmissions}
                  className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1"
                  onClick={() =>
                    onUpdateStatus(application.id, "rejected", {
                      reviewNotes: reviewNotes || undefined,
                      rejectionReason: rejectionReason || undefined,
                    })
                  }
                >
                  <X className="w-3.5 h-3.5" />
                  Refuser
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Motif de refus (optionnel)
                </label>
                <Input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Si refus, precisez..."
                  className="bg-white/5 border-border/30"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating || !canReviewSubmissions}
                className="w-full gap-1.5 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                onClick={() =>
                  onUpdateStatus(application.id, "incomplete", {
                    reviewNotes:
                      reviewNotes || "Merci de completer votre dossier",
                  })
                }
              >
                <FileText className="w-3.5 h-3.5" />
                Demander des complements
              </Button>
            </div>
          )}

          {isLeader && application.status === "incomplete" && (
            <div className="border-t border-border/20 pt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating || !canReviewSubmissions}
                className="w-full gap-1.5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() =>
                  onUpdateStatus(application.id, "incomplete", {
                    reviewNotes: "Relance envoyee",
                  })
                }
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MailPlus className="w-3.5 h-3.5" />
                )}
                Relancer
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

const VolunteerApplications = () => {
  const { association, role } = useOutletContext<AssociationContext>();
  const isLeader = role ? LEADER_ROLES.includes(role) : false;
  const gov = useAssociationGovernance();

  // ── Filters ──
  const [statusFilter, setStatusFilter] = useState<
    ApplicationStatus | "all"
  >("all");
  const [search, setSearch] = useState("");

  // ── Detail sheet ──
  const [selectedApp, setSelectedApp] =
    useState<VolunteerApplication | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Data ──
  const associationId = association?.id;
  const {
    data: applications,
    isLoading,
    error,
    refetch,
  } = useVolunteerApplications(associationId, {
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });

  const updateStatus = useUpdateApplicationStatus();

  // ── Stats ──
  const stats = useMemo(() => {
    if (!applications) return { pending_review: 0, approved: 0, incomplete: 0 };
    return {
      pending_review: applications.filter(
        (a) => a.status === "pending_review"
      ).length,
      approved: applications.filter((a) => a.status === "approved").length,
      incomplete: applications.filter(
        (a) => a.status === "incomplete" || a.status === "started"
      ).length,
    };
  }, [applications]);

  // We also fetch all apps (no filter) for stats when a filter is active
  const { data: allApplications } = useVolunteerApplications(
    statusFilter !== "all" ? associationId : undefined,
    {}
  );

  const globalStats = useMemo(() => {
    const source = statusFilter !== "all" ? allApplications : applications;
    if (!source) return { pending_review: 0, approved: 0, incomplete: 0 };
    return {
      pending_review: source.filter(
        (a) => a.status === "pending_review"
      ).length,
      approved: source.filter((a) => a.status === "approved").length,
      incomplete: source.filter(
        (a) => a.status === "incomplete" || a.status === "started"
      ).length,
    };
  }, [allApplications, applications, statusFilter]);

  // ── Handlers ──
  const handleUpdateStatus = (
    appId: string,
    status: ApplicationStatus,
    opts?: { reviewNotes?: string; rejectionReason?: string }
  ) => {
    if (!gov.canReviewSubmissions) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    updateStatus.mutate(
      {
        applicationId: appId,
        status,
        reviewNotes: opts?.reviewNotes,
        rejectionReason: opts?.rejectionReason,
      },
      {
        onSuccess: () => {
          setSheetOpen(false);
          setSelectedApp(null);
        },
      }
    );
  };

  const openDetail = (app: VolunteerApplication) => {
    setSelectedApp(app);
    setSheetOpen(true);
  };

  // ── No association ──
  if (!association) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Aucune association trouvee
        </h2>
        <p className="text-muted-foreground max-w-md">
          Tu n'es rattache a aucune association pour le moment.
        </p>
      </div>
    );
  }

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

      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Candidatures benevoles
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des candidatures de {association.name}
          </p>
        </div>
        {isLeader && (
          <Button className="gap-2 bg-sakura hover:bg-sakura/90">
            <UserPlus className="w-4 h-4" />
            Nouvelle candidature
          </Button>
        )}
      </div>

      {/* ═══ Stats badges ═══ */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/[0.08] border border-orange-500/20">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-medium text-orange-300">
            {globalStats.pending_review} a valider
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/[0.08] border border-green-500/20">
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium text-green-300">
            {globalStats.approved} approuvee(s)
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/[0.08] border border-yellow-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-medium text-yellow-300">
            {globalStats.incomplete} incomplete(s)
          </span>
        </div>
      </div>

      {/* ═══ Filters row ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as ApplicationStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-[#111827]/40 border-border/30">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_TAB_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="pl-9 bg-[#111827]/40 border-border/30"
          />
        </div>
      </div>

      {/* ═══ Status tabs ═══ */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
              statusFilter === s
                ? "bg-sakura/20 text-sakura border-sakura/30"
                : "bg-white/5 text-muted-foreground border-border/20 hover:bg-white/10 hover:text-foreground"
            )}
          >
            {STATUS_TAB_LABELS[s]}
          </button>
        ))}
      </div>

      {/* ═══ Error state ═══ */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/20 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Erreur lors du chargement des candidatures
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 border-white/10 hover:border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            Reessayer
          </Button>
        </div>
      )}

      {/* ═══ Loading state ═══ */}
      {isLoading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ═══ Empty state ═══ */}
      {!isLoading && !error && applications && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-border/20 mb-4">
            <FileText className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-display text-foreground mb-1">
            Aucune candidature
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {statusFilter !== "all"
              ? `Aucune candidature avec le statut "${STATUS_TAB_LABELS[statusFilter]}".`
              : "Il n'y a pas encore de candidatures benevoles pour cette association."}
          </p>
          {isLeader && (
            <Button className="mt-4 gap-2 bg-sakura hover:bg-sakura/90">
              <UserPlus className="w-4 h-4" />
              Creer une candidature
            </Button>
          )}
        </div>
      )}

      {/* ═══ Application cards list ═══ */}
      {!isLoading && !error && applications && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => {
            const interestsPreview = (app.interests || []).slice(0, 4);
            const skillsPreview = (app.skills || []).slice(0, 3);
            const hasMoreInterests = (app.interests || []).length > 4;
            const hasMoreSkills = (app.skills || []).length > 3;

            return (
              <Card
                key={app.id}
                className="bg-[#111827]/40 border-border/30 hover:border-border/50 transition-colors cursor-pointer group"
                onClick={() => openDetail(app)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      {getAvatarUrl(app) && (
                        <AvatarImage src={getAvatarUrl(app)!} />
                      )}
                      <AvatarFallback className="bg-sakura/20 text-sakura text-sm font-bold">
                        {getInitials(app)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Name + date */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {getDisplayName(app)}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {relativeDate(app.created_at)}
                        </span>
                      </div>

                      {/* Row 2: email */}
                      {app.email && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {app.email}
                        </p>
                      )}

                      {/* Row 3: Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* Status */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            APPLICATION_STATUS_COLORS[app.status]
                          )}
                        >
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </Badge>
                        {/* Source */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            SOURCE_COLORS[app.source] ||
                              "bg-gray-500/20 text-gray-300"
                          )}
                        >
                          {SOURCE_LABELS[app.source] || app.source}
                        </Badge>
                        {/* Experience level */}
                        {app.experience_level && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              EXPERIENCE_COLORS[app.experience_level] ||
                                "bg-slate-500/20 text-slate-300"
                            )}
                          >
                            {EXPERIENCE_LABELS[
                              app.experience_level as VolunteerExperience
                            ] || app.experience_level}
                          </Badge>
                        )}
                        {/* Onboarding step */}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-white/5 border-white/10 text-muted-foreground"
                        >
                          Etape {app.onboarding_step || 0}/9
                        </Badge>
                      </div>

                      {/* Row 4: Interests chips */}
                      {interestsPreview.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {interestsPreview.map((interest) => {
                            const info = getInterestLabel(interest);
                            return (
                              <span
                                key={interest}
                                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/70"
                              >
                                {info ? `${info.emoji} ${info.label}` : interest}
                              </span>
                            );
                          })}
                          {hasMoreInterests && (
                            <span className="text-[10px] text-muted-foreground px-1">
                              +{(app.interests || []).length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Row 5: Skills chips */}
                      {skillsPreview.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {skillsPreview.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-sakura/10 border border-sakura/20 text-sakura/80"
                            >
                              {skill}
                            </span>
                          ))}
                          {hasMoreSkills && (
                            <span className="text-[10px] text-muted-foreground px-1">
                              +{(app.skills || []).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions column */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(app);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {isLeader && app.status === "pending_review" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(app.id, "approved");
                            }}
                            disabled={updateStatus.isPending || !gov.canReviewSubmissions}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(app.id, "rejected");
                            }}
                            disabled={updateStatus.isPending || !gov.canReviewSubmissions}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(app.id, "incomplete", {
                                reviewNotes:
                                  "Merci de completer votre dossier",
                              });
                            }}
                            disabled={updateStatus.isPending || !gov.canReviewSubmissions}
                            title="Demander des complements"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {isLeader && app.status === "incomplete" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(app.id, "incomplete", {
                              reviewNotes: "Relance envoyee",
                            });
                          }}
                          disabled={updateStatus.isPending || !gov.canReviewSubmissions}
                          title="Relancer"
                        >
                          <MailPlus className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Detail Sheet ═══ */}
      <ApplicationDetailSheet
        application={selectedApp}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedApp(null);
        }}
        isLeader={isLeader}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateStatus.isPending}
        canReviewSubmissions={gov.canReviewSubmissions}
      />
    </div>
  );
};

export default VolunteerApplications;
