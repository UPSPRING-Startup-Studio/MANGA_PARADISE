import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Heart,
  Search,
  SearchX,
  Filter,
  ChevronDown,
  Star,
  Calendar,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  useAssociationVolunteers,
  useUpdateMemberEngagement,
  EXPERIENCE_LABELS,
  EXPERIENCE_COLORS,
  PARTICIPATION_OPTIONS,
  AVAILABILITY_OPTIONS,
  INTERESTS_OPTIONS,
  ENGAGEMENT_LABELS,
  ENGAGEMENT_COLORS,
  type MembershipV2,
  type VolunteerExperience,
} from "@/hooks/association/useAssociationMembersV2";
import { LEADER_ROLES, type Association, type AssociationRole } from "@/hooks/useAssociation";
import MemberEntryWizard from "@/components/association/members/MemberEntryWizard";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

function getDisplayName(m: MembershipV2): string {
  return m.profile?.display_name || m.profile?.username || "Bénévole";
}

const AssociationVolunteers = () => {
  const { association, role: viewerRole } = useOutletContext<AssociationContext>();
  const associationId = association?.id;

  const { data: volunteers, isLoading } = useAssociationVolunteers(associationId);
  const updateEngagement = useUpdateMemberEngagement();

  const [search, setSearch] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [detailMember, setDetailMember] = useState<MembershipV2 | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;
  const gov = useAssociationGovernance();

  // Derive all unique skills
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    (volunteers || []).forEach((v) =>
      v.participation_preferences?.forEach((s) => skills.add(s))
    );
    return Array.from(skills);
  }, [volunteers]);

  const filtered = useMemo(() => {
    let result = volunteers || [];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          getDisplayName(v).toLowerCase().includes(q) ||
          (v.profile?.username || "").toLowerCase().includes(q) ||
          (v.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    }

    if (experienceFilter !== "all") {
      result = result.filter(
        (v) => v.volunteer_experience === experienceFilter
      );
    }

    if (skillFilter !== "all") {
      result = result.filter((v) =>
        v.participation_preferences?.includes(skillFilter)
      );
    }

    return result;
  }, [volunteers, search, experienceFilter, skillFilter]);

  const stats = useMemo(() => {
    if (!volunteers) return { total: 0, actifs: 0, occasionnels: 0, experts: 0 };
    return {
      total: volunteers.length,
      actifs: volunteers.filter((v) => v.engagement_level === "benevole_actif").length,
      occasionnels: volunteers.filter((v) => v.engagement_level === "benevole_occasionnel").length,
      experts: volunteers.filter((v) => v.volunteer_experience === "expert" || v.volunteer_experience === "confirme").length,
    };
  }, [volunteers]);

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
          <h1 className="text-2xl font-display text-foreground">Bénévoles</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des bénévoles et de leurs compétences
          </p>
        </div>
        {isLeader && (
          <Button
            onClick={() => setWizardOpen(true)}
            disabled={!gov.canManageVolunteers}
            className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un bénévole
          </Button>
        )}
      </div>

      {/* Stats */}
      {!isLoading && volunteers && volunteers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatBadge
            icon={Heart}
            count={stats.total}
            label="bénévoles"
            color="text-emerald-400"
          />
          <StatBadge
            icon={Sparkles}
            count={stats.actifs}
            label="actifs"
            color="text-green-400"
          />
          <StatBadge
            icon={Calendar}
            count={stats.occasionnels}
            label="occasionnels"
            color="text-blue-400"
          />
          <StatBadge
            icon={Star}
            count={stats.experts}
            label="confirmés / experts"
            color="text-amber-400"
          />
        </div>
      )}

      {/* Filters */}
      {!isLoading && volunteers && volunteers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un bénévole..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#111827]/60 border-border/40"
            />
          </div>
          <Select value={experienceFilter} onValueChange={setExperienceFilter}>
            <SelectTrigger className="w-[180px] bg-[#111827]/60 border-border/40">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Expérience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute expérience</SelectItem>
              {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {allSkills.length > 0 && (
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-[200px] bg-[#111827]/60 border-border/40">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Mission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes missions</SelectItem>
                {allSkills.map((s) => {
                  const opt = PARTICIPATION_OPTIONS.find((o) => o.value === s);
                  return (
                    <SelectItem key={s} value={s}>
                      {opt ? `${opt.emoji} ${opt.label}` : s}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-[#111827]/40 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((vol) => (
            <VolunteerCard
              key={vol.id}
              volunteer={vol}
              onClick={() => setDetailMember(vol)}
            />
          ))}
        </div>
      ) : volunteers && volunteers.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="w-14 h-14 text-muted-foreground/25 mb-4" />
          <h2 className="text-lg font-display text-foreground mb-1">
            Aucun résultat
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Aucun bénévole ne correspond à tes critères.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Aucun bénévole
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            L'association n'a pas encore de bénévoles enregistrés. Ajoute-en ou
            promeut des membres existants.
          </p>
          {isLeader && (
            <Button
              onClick={() => setWizardOpen(true)}
              disabled={!gov.canManageVolunteers}
              className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
            >
              <UserPlus className="h-4 w-4" />
              Ajouter un bénévole
            </Button>
          )}
        </div>
      )}

      {/* Detail Sheet */}
      <VolunteerDetailSheet
        member={detailMember}
        onClose={() => setDetailMember(null)}
      />

      {/* Entry Wizard */}
      {associationId && (
        <MemberEntryWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          associationId={associationId}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function StatBadge({
  icon: Icon,
  count,
  label,
  color,
}: {
  icon: typeof Heart;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
      <Icon className={cn("h-4 w-4", color)} />
      <span className="text-sm text-foreground font-medium">{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function VolunteerCard({
  volunteer,
  onClick,
}: {
  volunteer: MembershipV2;
  onClick: () => void;
}) {
  const name = getDisplayName(volunteer);
  const expClass = EXPERIENCE_COLORS[volunteer.volunteer_experience] || "";
  const engClass = ENGAGEMENT_COLORS[volunteer.engagement_level] || "";
  const availCount = Object.values(volunteer.availability || {}).filter(Boolean).length;

  return (
    <Card
      className="p-4 bg-[#111827]/40 border-border/30 hover:border-emerald-500/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={volunteer.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-emerald-500/20 text-emerald-300">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-foreground truncate">{name}</p>
          </div>
          {volunteer.profile?.username && (
            <p className="text-xs text-muted-foreground">
              @{volunteer.profile.username}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge
              variant="outline"
              className={cn("text-[10px] border", engClass)}
            >
              {ENGAGEMENT_LABELS[volunteer.engagement_level]}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px]", expClass)}
            >
              {EXPERIENCE_LABELS[volunteer.volunteer_experience]}
            </Badge>
            {availCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] border-border/40 text-muted-foreground"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {availCount} dispo{availCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Interests preview */}
          {volunteer.interests && volunteer.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {volunteer.interests.slice(0, 4).map((interest) => {
                const opt = INTERESTS_OPTIONS.find((o) => o.value === interest);
                return (
                  <span key={interest} className="text-xs" title={opt?.label}>
                    {opt?.emoji}
                  </span>
                );
              })}
              {volunteer.interests.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{volunteer.interests.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Participation preferences preview */}
          {volunteer.participation_preferences &&
            volunteer.participation_preferences.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {volunteer.participation_preferences.slice(0, 3).map((pref) => {
                  const opt = PARTICIPATION_OPTIONS.find((o) => o.value === pref);
                  return opt ? (
                    <span
                      key={pref}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300/80"
                    >
                      {opt.emoji} {opt.label}
                    </span>
                  ) : null;
                })}
                {volunteer.participation_preferences.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{volunteer.participation_preferences.length - 3}
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </Card>
  );
}

function VolunteerDetailSheet({
  member,
  onClose,
}: {
  member: MembershipV2 | null;
  onClose: () => void;
}) {
  if (!member) return null;

  const name = getDisplayName(member);
  const availList = AVAILABILITY_OPTIONS.filter(
    (a) => member.availability?.[a.value]
  );

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-[#0D0D0D] border-l border-border/50"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Détail bénévole</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-4">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-lg">
                {name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-display text-foreground">{name}</h3>
              {member.profile?.username && (
                <p className="text-sm text-muted-foreground">
                  @{member.profile.username}
                </p>
              )}
              <div className="flex gap-1.5 mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs border",
                    ENGAGEMENT_COLORS[member.engagement_level]
                  )}
                >
                  {ENGAGEMENT_LABELS[member.engagement_level]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    EXPERIENCE_COLORS[member.volunteer_experience]
                  )}
                >
                  {EXPERIENCE_LABELS[member.volunteer_experience]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Interests */}
          {member.interests && member.interests.length > 0 && (
            <DetailSection title="Centres d'intérêt">
              <div className="flex flex-wrap gap-2">
                {member.interests.map((interest) => {
                  const opt = INTERESTS_OPTIONS.find((o) => o.value === interest);
                  return (
                    <Badge key={interest} variant="outline" className="text-xs border-border/40">
                      {opt?.emoji} {opt?.label || interest}
                    </Badge>
                  );
                })}
              </div>
            </DetailSection>
          )}

          {/* Participation preferences */}
          {member.participation_preferences &&
            member.participation_preferences.length > 0 && (
              <DetailSection title="Préférences de mission">
                <div className="flex flex-wrap gap-2">
                  {member.participation_preferences.map((pref) => {
                    const opt = PARTICIPATION_OPTIONS.find(
                      (o) => o.value === pref
                    );
                    return (
                      <Badge
                        key={pref}
                        variant="outline"
                        className="text-xs border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                      >
                        {opt?.emoji} {opt?.label || pref}
                      </Badge>
                    );
                  })}
                </div>
              </DetailSection>
            )}

          {/* Availability */}
          {availList.length > 0 && (
            <DetailSection title="Disponibilités">
              <div className="flex flex-wrap gap-2">
                {availList.map((a) => (
                  <Badge key={a.value} variant="outline" className="text-xs border-border/40">
                    <Calendar className="w-3 h-3 mr-1" />
                    {a.label}
                  </Badge>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <DetailSection title="Compétences">
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Languages */}
          {member.languages && member.languages.length > 0 && (
            <DetailSection title="Langues">
              <p className="text-sm text-foreground">
                {member.languages.join(", ")}
              </p>
            </DetailSection>
          )}

          {/* Consent */}
          <DetailSection title="Consentement photo">
            <p className="text-sm text-foreground">
              {member.consent_photo ? "✅ Accepté" : "❌ Non accepté"}
            </p>
          </DetailSection>

          {/* Member since */}
          <DetailSection title="Membre depuis">
            <p className="text-sm text-foreground">
              {new Date(member.joined_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </DetailSection>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  );
}

export default AssociationVolunteers;
