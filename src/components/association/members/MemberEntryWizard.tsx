/**
 * MemberEntryWizard
 *
 * Wizard 3 étapes pour intégrer ou modifier un membre dans l'association.
 *
 * NOTE IMPORTANTE — Pourquoi pas de <Select> ici ?
 * Les composants Shadcn <Select> utilisent un portail Radix qui rend le
 * menu dans <body>, hors du sous-arbre DOM du Sheet. Le FocusTrap et le
 * DismissableLayer de Radix Dialog interceptent les pointer-events sur ces
 * éléments "extérieurs", rendant le menu invisible ou non cliquable.
 * Solution définitive : remplacer tous les selects par des chip-buttons
 * (éléments <button> natifs), sans portail, sans z-index à gérer.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Shield,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  FileQuestion,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchUsersForAssociationInvite } from "@/hooks/useAssociationInvitations";
import {
  useAddMemberDirect,
  useUpdateMemberAssocData,
  type EngagementLevel,
  type BelongingStatus,
  type MembershipV2,
  type AddMemberResult,
} from "@/hooks/association/useAssociationMembersV2";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
} from "@/hooks/useAssociation";

// ──────────────────────────────────────────────
// Steps
// ──────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Sélection", subtitle: "Qui intégrer ?" },
  { id: 2, title: "Rôle & Statut", subtitle: "Quel rôle dans l'association ?" },
  { id: 3, title: "Confirmation", subtitle: "Récapitulatif avant validation" },
];

// ──────────────────────────────────────────────
// RÔLE — chips (sans portail, pur bouton)
// ──────────────────────────────────────────────

const ROLE_CHIPS: {
  value: AssociationRole;
  label: string;
  idle: string;
  active: string;
}[] = [
  {
    value: "president",
    label: "Président·e",
    idle: "border-[#E84A2B]/20 bg-[#E84A2B]/5 text-mp-ink-muted hover:border-[#E84A2B]/40 hover:text-[#E84A2B]",
    active: "border-[#E84A2B]/60 bg-[#E84A2B]/15 text-[#E84A2B] ring-1 ring-[#E84A2B]/25",
  },
  {
    value: "vice_president",
    label: "Vice-Président·e",
    idle: "border-[#F26B2E]/20 bg-[#F26B2E]/5 text-mp-ink-muted hover:border-[#F26B2E]/40 hover:text-[#F26B2E]",
    active: "border-[#F26B2E]/60 bg-[#F26B2E]/15 text-[#F26B2E] ring-1 ring-[#F26B2E]/25",
  },
  {
    value: "secretaire",
    label: "Secrétaire",
    idle: "border-amber-500/20 bg-amber-500/5 text-mp-ink-muted hover:border-amber-500/40 hover:text-amber-400",
    active: "border-amber-500/60 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  },
  {
    value: "tresorier",
    label: "Trésorier·ère",
    idle: "border-teal-500/20 bg-teal-500/5 text-mp-ink-muted hover:border-teal-500/40 hover:text-teal-400",
    active: "border-teal-500/60 bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25",
  },
  {
    value: "responsable",
    label: "Responsable",
    idle: "border-purple-500/20 bg-purple-500/5 text-mp-ink-muted hover:border-purple-500/40 hover:text-purple-400",
    active: "border-purple-500/60 bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/25",
  },
  {
    value: "benevole",
    label: "Bénévole",
    idle: "border-emerald-500/20 bg-emerald-500/5 text-mp-ink-muted hover:border-emerald-500/40 hover:text-emerald-400",
    active: "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  },
  {
    value: "membre",
    label: "Membre",
    idle: "border-slate-500/20 bg-slate-500/5 text-mp-ink-muted hover:border-slate-400/40 hover:text-slate-300",
    active: "border-slate-400/50 bg-slate-500/15 text-slate-200 ring-1 ring-slate-400/25",
  },
];

// ──────────────────────────────────────────────
// NIVEAU D'ENGAGEMENT — chips (3 valeurs spec)
// Mapping: "Membre actif"→adherent | "Bénévole"→benevole_actif | "Adhérent"→membre
// ──────────────────────────────────────────────

const ENGAGEMENT_CHIPS: {
  value: EngagementLevel;
  label: string;
  description: string;
  idle: string;
  active: string;
}[] = [
  {
    value: "adherent",
    label: "Membre actif",
    description: "Cotise et participe activement",
    idle: "border-blue-500/20 bg-blue-500/5 text-mp-ink-muted hover:border-blue-500/40 hover:text-blue-300",
    active: "border-blue-500/55 bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/25",
  },
  {
    value: "benevole_actif",
    label: "Bénévole",
    description: "Participe aux événements en tant que bénévole",
    idle: "border-emerald-500/20 bg-emerald-500/5 text-mp-ink-muted hover:border-emerald-500/40 hover:text-emerald-300",
    active: "border-emerald-500/55 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  },
  {
    value: "membre",
    label: "Adhérent",
    description: "Adhésion simple, accès standard",
    idle: "border-slate-500/20 bg-slate-500/5 text-mp-ink-muted hover:border-slate-400/40 hover:text-slate-300",
    active: "border-slate-400/50 bg-slate-500/15 text-slate-200 ring-1 ring-slate-400/25",
  },
];

// ──────────────────────────────────────────────
// STATUT D'ADHÉSION — radio-cards (4 valeurs spec)
// Mapping: valide | a_valider | invite | refuse
// ──────────────────────────────────────────────

const MEMBERSHIP_STATUS_OPTIONS: {
  value: BelongingStatus;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  idle: string;
  active: string;
  iconIdle: string;
  iconActive: string;
}[] = [
  {
    value: "valide",
    label: "Adhésion active",
    description: "Dossier complet et validé par le bureau",
    Icon: CheckCircle2,
    idle: "border-white/8 bg-white/2 hover:border-emerald-500/30 hover:bg-emerald-500/5",
    active: "border-emerald-500/45 bg-emerald-500/10 ring-1 ring-emerald-500/20",
    iconIdle: "text-mp-ink-muted",
    iconActive: "text-emerald-400",
  },
  {
    value: "a_valider",
    label: "En cours de traitement",
    description: "Dossier reçu, en attente de validation",
    Icon: Clock,
    idle: "border-white/8 bg-white/2 hover:border-orange-500/30 hover:bg-orange-500/5",
    active: "border-orange-500/45 bg-orange-500/10 ring-1 ring-orange-500/20",
    iconIdle: "text-mp-ink-muted",
    iconActive: "text-orange-400",
  },
  {
    value: "invite",
    label: "En attente du bulletin d'adhésion",
    description: "Formulaire d'adhésion non encore soumis",
    Icon: FileQuestion,
    idle: "border-white/8 bg-white/2 hover:border-yellow-500/30 hover:bg-yellow-500/5",
    active: "border-yellow-500/45 bg-yellow-500/10 ring-1 ring-yellow-500/20",
    iconIdle: "text-mp-ink-muted",
    iconActive: "text-yellow-400",
  },
  {
    value: "refuse",
    label: "Radié",
    description: "Adhésion refusée ou radiation de l'association",
    Icon: Ban,
    idle: "border-white/8 bg-white/2 hover:border-red-500/30 hover:bg-red-500/5",
    active: "border-red-500/45 bg-red-500/10 ring-1 ring-red-500/20",
    iconIdle: "text-mp-ink-muted",
    iconActive: "text-red-400",
  },
];

// Labels pour la récap
const BELONGING_RECAP_LABELS: Record<string, string> = {
  valide: "Adhésion active",
  a_valider: "En cours de traitement",
  dossier_commence: "En cours de traitement",
  invite: "En attente du bulletin d'adhésion",
  refuse: "Radié",
  archive: "Archivé·e",
};

const BELONGING_RECAP_COLORS: Record<string, string> = {
  valide: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  a_valider: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  dossier_commence: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  invite: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  refuse: "bg-red-500/15 text-red-300 border-red-500/30",
  archive: "bg-slate-500/15 text-mp-ink-muted border-slate-500/30",
};

// ──────────────────────────────────────────────
// Default belonging_status suggéré par rôle
// ──────────────────────────────────────────────

function defaultBelongingForRole(role: AssociationRole): BelongingStatus {
  if (["president", "vice_president", "secretaire", "tresorier", "responsable"].includes(role)) {
    return "valide";
  }
  return "a_valider";
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface MemberEntryWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
  /** Mode édition : membre existant pré-rempli */
  editMember?: MembershipV2 | null;
}

// ──────────────────────────────────────────────
// Wizard State
// ──────────────────────────────────────────────

interface WizardState {
  selectedUser: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  role: AssociationRole;
  engagementLevel: EngagementLevel;
  belongingStatus: BelongingStatus;
  title: string;
  notes: string;
}

function buildInitialState(editMember?: MembershipV2 | null): WizardState {
  if (editMember) {
    return {
      selectedUser: editMember.profile
        ? {
            id: editMember.user_id,
            username: editMember.profile.username,
            display_name: editMember.profile.display_name,
            avatar_url: editMember.profile.avatar_url,
          }
        : null,
      role: editMember.role,
      engagementLevel: editMember.engagement_level,
      belongingStatus: editMember.belonging_status,
      title: editMember.title || "",
      notes: editMember.notes || "",
    };
  }
  return {
    selectedUser: null,
    role: "membre",
    engagementLevel: "adherent",
    belongingStatus: "a_valider",
    title: "",
    notes: "",
  };
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

const MemberEntryWizard = ({
  open,
  onOpenChange,
  associationId,
  editMember,
}: MemberEntryWizardProps) => {
  const isEditMode = !!editMember;
  const [step, setStep] = useState(isEditMode ? 2 : 1);
  const [state, setState] = useState<WizardState>(() => buildInitialState(editMember));
  const [searchQuery, setSearchQuery] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<AddMemberResult | null>(null);

  const addMember = useAddMemberDirect();
  const updateMember = useUpdateMemberAssocData();

  const { data: searchResults = [], isLoading: isSearching } =
    useSearchUsersForAssociationInvite(associationId, searchQuery);

  // Reset à l'ouverture / fermeture
  useEffect(() => {
    if (!open) {
      setStep(isEditMode ? 2 : 1);
      setState(buildInitialState(editMember));
      setSearchQuery("");
      setSubmitError(null);
      setSuccessResult(null);
    }
  }, [open, editMember, isEditMode]);

  // Suggestion automatique du statut selon le rôle (seulement en mode création)
  useEffect(() => {
    if (!isEditMode) {
      setState((s) => ({
        ...s,
        belongingStatus: defaultBelongingForRole(s.role),
      }));
    }
  }, [state.role, isEditMode]);

  const totalSteps = STEPS.length;
  const progress = (step / totalSteps) * 100;

  const canProceed = useMemo(() => {
    if (successResult) return false;
    switch (step) {
      case 1: return !!state.selectedUser;
      case 2: return !!state.role && !!state.engagementLevel && !!state.belongingStatus;
      case 3: return true;
      default: return true;
    }
  }, [step, state, successResult]);

  const handleNext = () => {
    if (step === 3) {
      handleSubmit();
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > (isEditMode ? 2 : 1)) setStep(step - 1);
  };

  const handleSubmit = () => {
    setSubmitError(null);

    if (isEditMode && editMember) {
      updateMember.mutate(
        {
          membershipId: editMember.id,
          role: state.role,
          engagementLevel: state.engagementLevel,
          title: state.title || null,
          belongingStatus: state.belongingStatus,
          membershipStatus: state.belongingStatus === "valide" ? "active" : "invited",
          notes: state.notes || null,
        },
        {
          onSuccess: () => setSuccessResult({ action: "updated" }),
          onError: (err: Error) => setSubmitError(err.message),
        }
      );
    } else {
      if (!state.selectedUser) return;
      addMember.mutate(
        {
          associationId,
          userId: state.selectedUser.id,
          role: state.role,
          engagementLevel: state.engagementLevel,
          belongingStatus: state.belongingStatus,
          title: state.title || undefined,
        },
        {
          onSuccess: (result) => setSuccessResult(result),
          onError: (err: Error) => setSubmitError(err.message),
        }
      );
    }
  };

  const isSubmitting = addMember.isPending || updateMember.isPending;

  // ── Écran de succès ──────────────────────────

  if (successResult) {
    const wasUpdate = successResult.action === "updated";
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] bg-[#0E1420] border-l border-white/10 overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="sr-only">
              {wasUpdate ? "Fiche mise à jour" : "Membre ajouté"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-6 mt-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {wasUpdate ? "Fiche mise à jour" : "Membre ajouté"}
              </h2>
              <p className="text-sm text-mp-ink-muted max-w-[260px] mx-auto leading-relaxed">
                {wasUpdate
                  ? `La fiche de ${state.selectedUser?.display_name || state.selectedUser?.username || "ce membre"} a été mise à jour.`
                  : `${state.selectedUser?.display_name || state.selectedUser?.username || "Ce membre"} a été intégré·e en tant que `}
                {!wasUpdate && (
                  <span className="text-white font-semibold">
                    {ASSOCIATION_ROLE_LABELS[state.role]}
                  </span>
                )}
                {!wasUpdate && "."}
              </p>
              {wasUpdate && (
                <p className="text-xs text-mp-ink-muted mt-2">
                  Les modifications sont immédiatement visibles dans la liste.
                </p>
              )}
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#E84A2B] hover:bg-[#E84A2B]/85 w-44"
            >
              Fermer
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const currentStep = STEPS[step - 1];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] bg-[#0E1420] border-l border-white/10 overflow-y-auto p-0"
      >
        {/* ── Header fixe ── */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/8">
          <SheetTitle className="sr-only">
            {isEditMode ? "Modifier le membre" : "Ajouter un membre"}
          </SheetTitle>

          {/* Titre + icône */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-[#E84A2B]/12 border border-[#E84A2B]/20">
              {isEditMode ? (
                <Shield className="w-5 h-5 text-[#E84A2B]" />
              ) : (
                <Sparkles className="w-5 h-5 text-[#E84A2B]" />
              )}
            </div>
            <div>
              <p className="text-base font-bold text-white">
                {isEditMode ? "Modifier la fiche membre" : "Ajouter un membre"}
              </p>
              <p className="text-xs text-mp-ink-muted">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Indicateurs d'étapes */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                        isCurrent
                          ? "border-[#E84A2B] bg-[#E84A2B]/20 text-[#E84A2B]"
                          : isDone
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                          : "border-white/12 text-mp-ink-muted"
                      )}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : s.id}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium whitespace-nowrap",
                        isCurrent ? "text-[#E84A2B]" : isDone ? "text-mp-ink-muted" : "text-mp-ink-muted"
                      )}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-px mb-5 mx-2 transition-all",
                        isDone ? "bg-emerald-500/30" : "bg-white/8"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SheetHeader>

        {/* ── Contenu de l'étape ── */}
        <div className="px-6 py-5">
          {step === 1 && (
            <StepPersonSelection
              state={state}
              setState={setState}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
            />
          )}
          {step === 2 && (
            <StepRoleEngagement
              state={state}
              setState={setState}
              isEditMode={isEditMode}
            />
          )}
          {step === 3 && (
            <StepConfirmation
              state={state}
              isEditMode={isEditMode}
            />
          )}
        </div>

        {/* ── Erreur inline ── */}
        {submitError && (
          <div className="px-6 pb-2">
            <Alert
              variant="destructive"
              className="border-red-500/25 bg-red-500/8"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm leading-relaxed">
                {submitError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === (isEditMode ? 2 : 1) || isSubmitting}
            className="gap-1 text-mp-ink-muted hover:text-white hover:bg-white/6"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            onClick={
              submitError
                ? () => { setSubmitError(null); handleSubmit(); }
                : handleNext
            }
            disabled={!canProceed || isSubmitting}
            className="gap-1.5 bg-[#E84A2B] hover:bg-[#E84A2B]/85 min-w-[130px] font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                En cours…
              </>
            ) : submitError ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </>
            ) : step === 3 ? (
              <>
                <Check className="w-4 h-4" />
                {isEditMode ? "Enregistrer" : "Confirmer"}
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ──────────────────────────────────────────────
// Étape 1 : Sélection de la personne
// ──────────────────────────────────────────────

function StepPersonSelection({
  state,
  setState,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
}: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }[];
  isSearching: boolean;
}) {
  if (state.selectedUser) {
    return (
      <div className="space-y-4">
        <SectionLabel>Personne sélectionnée</SectionLabel>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#E84A2B]/25 bg-[#E84A2B]/6">
          <Avatar className="h-12 w-12 border-2 border-[#E84A2B]/20 shrink-0">
            <AvatarImage src={state.selectedUser.avatar_url || undefined} />
            <AvatarFallback className="bg-[#E84A2B]/12 text-[#E84A2B] font-bold text-base">
              {(state.selectedUser.display_name || state.selectedUser.username || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate text-base">
              {state.selectedUser.display_name || state.selectedUser.username}
            </p>
            {state.selectedUser.username && (
              <p className="text-xs text-mp-ink-muted mt-0.5">@{state.selectedUser.username}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setState((s) => ({ ...s, selectedUser: null }));
              setSearchQuery("");
            }}
            className="text-mp-ink-muted hover:text-white shrink-0 text-xs"
          >
            Changer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionLabel>Rechercher un utilisateur Manga Paradise</SectionLabel>
      <p className="text-xs text-mp-ink-muted">Minimum 2 caractères</p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mp-ink-muted" />
        <Input
          placeholder="Pseudo, nom…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/6 border-white/12 text-white placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B]/50 focus-visible:ring-0 h-11"
          autoFocus
        />
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-mp-ink-muted" />
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-12 text-sm text-mp-ink-muted">
          Aucun utilisateur trouvé pour «&nbsp;{searchQuery}&nbsp;»
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-1 max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-white/3 p-1.5">
          {searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                setState((s) => ({ ...s, selectedUser: user }));
                setSearchQuery("");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/8 active:bg-white/12 transition-colors text-left group"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-white/8 text-mp-ink-muted text-xs font-semibold">
                  {(user.display_name || user.username || "?")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.display_name || user.username}
                </p>
                {user.username && (
                  <p className="text-xs text-mp-ink-muted">@{user.username}</p>
                )}
              </div>
              <UserPlus className="w-4 h-4 text-mp-ink-muted group-hover:text-[#E84A2B] shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {searchQuery.length < 2 && (
        <div className="rounded-xl border border-white/6 bg-white/2 py-12 text-center">
          <Search className="w-8 h-8 text-mp-ink-soft mx-auto mb-3" />
          <p className="text-xs text-mp-ink-muted">Saisissez au moins 2 caractères pour chercher</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Étape 2 : Rôle & Engagement — CHIPS ONLY (pas de Select)
// ──────────────────────────────────────────────

function StepRoleEngagement({
  state,
  setState,
  isEditMode,
}: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  isEditMode: boolean;
}) {
  return (
    <div className="space-y-7">
      {/* En mode édition, rappel de la personne */}
      {isEditMode && state.selectedUser && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={state.selectedUser.avatar_url || undefined} />
            <AvatarFallback className="bg-[#E84A2B]/12 text-[#E84A2B] text-xs font-bold">
              {(state.selectedUser.display_name || state.selectedUser.username || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-white">
              {state.selectedUser.display_name || state.selectedUser.username}
            </p>
            {state.selectedUser.username && (
              <p className="text-xs text-mp-ink-muted">@{state.selectedUser.username}</p>
            )}
          </div>
        </div>
      )}

      {/* ── RÔLE ── */}
      <div className="space-y-3">
        <SectionLabel>Rôle dans l'association</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ROLE_CHIPS.map((chip) => {
            const isActive = state.role === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setState((s) => ({ ...s, role: chip.value }))}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer",
                  isActive ? chip.active : chip.idle
                )}
              >
                {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── NIVEAU D'ENGAGEMENT — chips horizontaux ── */}
      <div className="space-y-3">
        <SectionLabel>Niveau d'engagement</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ENGAGEMENT_CHIPS.map((chip) => {
            const isActive = state.engagementLevel === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setState((s) => ({ ...s, engagementLevel: chip.value }))}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer",
                  isActive ? chip.active : chip.idle
                )}
              >
                {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                {chip.label}
              </button>
            );
          })}
        </div>
        {/* Description du choix actif */}
        {(() => {
          const found = ENGAGEMENT_CHIPS.find((c) => c.value === state.engagementLevel);
          return found ? (
            <p className="text-xs text-mp-ink-muted pl-1">{found.description}</p>
          ) : null;
        })()}
      </div>

      {/* ── STATUT D'ADHÉSION — radio-cards ── */}
      <div className="space-y-3">
        <SectionLabel>Statut d'adhésion</SectionLabel>
        <div className="space-y-2">
          {MEMBERSHIP_STATUS_OPTIONS.map((opt) => {
            const isActive = state.belongingStatus === opt.value;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState((s) => ({ ...s, belongingStatus: opt.value }))}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 cursor-pointer",
                  isActive ? opt.active : opt.idle
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? opt.iconActive : opt.iconIdle
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      isActive ? "text-white" : "text-slate-300"
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-mp-ink-muted mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-4 h-4 rounded-full border border-white/30 bg-white/15 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TITRE / FONCTION (optionnel) ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-200">
          Titre / Fonction{" "}
          <span className="text-xs text-mp-ink-muted font-normal">(optionnel)</span>
        </Label>
        <Input
          placeholder="ex : Responsable cosplay, Trésorier adjoint…"
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          className="bg-white/6 border-white/12 text-white placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B]/50 focus-visible:ring-0 h-11"
        />
      </div>

      {/* ── NOTES INTERNES (édition seulement) ── */}
      {isEditMode && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-200">
            Notes internes{" "}
            <span className="text-xs text-mp-ink-muted font-normal">(réservées au bureau)</span>
          </Label>
          <Textarea
            placeholder="Observations visibles uniquement par les admins de l'association…"
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            className="bg-white/6 border-white/12 text-white placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B]/50 focus-visible:ring-0 min-h-[90px] resize-none"
          />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Étape 3 : Récapitulatif / Confirmation
// ──────────────────────────────────────────────

function StepConfirmation({
  state,
  isEditMode,
}: {
  state: WizardState;
  isEditMode: boolean;
}) {
  const roleChip = ROLE_CHIPS.find((c) => c.value === state.role);
  const engagementChip = ENGAGEMENT_CHIPS.find((c) => c.value === state.engagementLevel);
  const statusOpt = MEMBERSHIP_STATUS_OPTIONS.find((o) => o.value === state.belongingStatus);
  const statusColor = BELONGING_RECAP_COLORS[state.belongingStatus] || "bg-slate-500/15 text-mp-ink-muted border-slate-500/30";
  const statusLabel = BELONGING_RECAP_LABELS[state.belongingStatus] || state.belongingStatus;

  return (
    <div className="space-y-5">
      <p className="text-sm text-mp-ink-muted">
        Vérifiez les informations avant de {isEditMode ? "mettre à jour" : "confirmer l'intégration"}.
      </p>

      {/* Fiche personne */}
      {state.selectedUser && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-white/12 bg-white/4">
          <Avatar className="h-14 w-14 border-2 border-white/12 shrink-0">
            <AvatarImage src={state.selectedUser.avatar_url || undefined} />
            <AvatarFallback className="bg-[#E84A2B]/12 text-[#E84A2B] font-bold text-lg">
              {(state.selectedUser.display_name || state.selectedUser.username || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-white text-base">
              {state.selectedUser.display_name || state.selectedUser.username}
            </p>
            {state.selectedUser.username && (
              <p className="text-xs text-mp-ink-muted mt-0.5">@{state.selectedUser.username}</p>
            )}
          </div>
        </div>
      )}

      {/* Tableau récap */}
      <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden divide-y divide-white/6">
        <RecapRow label="Rôle">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold border",
              roleChip?.active || "bg-slate-500/20 text-slate-300 border-slate-500/30"
            )}
          >
            {ASSOCIATION_ROLE_LABELS[state.role]}
          </span>
        </RecapRow>

        <RecapRow label="Niveau d'engagement">
          <span className="text-sm font-semibold text-slate-200">
            {engagementChip?.label || state.engagementLevel}
          </span>
        </RecapRow>

        <RecapRow label="Statut d'adhésion">
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", statusColor)}>
            {statusLabel}
          </span>
        </RecapRow>

        {state.title && (
          <RecapRow label="Titre / Fonction">
            <span className="text-sm text-slate-300 font-medium">{state.title}</span>
          </RecapRow>
        )}

        {isEditMode && state.notes && (
          <RecapRow label="Notes internes">
            <span className="text-xs text-mp-ink-muted text-right max-w-[55%] leading-relaxed">
              {state.notes.length > 90 ? state.notes.slice(0, 90) + "…" : state.notes}
            </span>
          </RecapRow>
        )}
      </div>

      {/* Note profil global */}
      <div className="rounded-lg border border-white/6 bg-white/2 px-4 py-3">
        <p className="text-xs text-mp-ink-muted leading-relaxed">
          <span className="text-mp-ink-muted font-medium">Note :</span>{" "}
          {isEditMode
            ? "Seules les données associatives sont modifiées. Le profil global (pseudo, avatar, email) reste inchangé."
            : "Les données de profil (pseudo, avatar, email) sont gérées par l'utilisateur lui-même et ne peuvent pas être modifiées ici."}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helpers UI
// ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold text-slate-200 tracking-tight">{children}</p>
  );
}

function RecapRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-mp-ink-muted font-medium shrink-0">{label}</span>
      <div className="flex items-center justify-end">{children}</div>
    </div>
  );
}

export default MemberEntryWizard;
