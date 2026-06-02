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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  UserPlus,
  Loader2,
  Sparkles,
  User,
  Heart,
  Shield,
  Calendar,
  FileText,
  Star,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchUsersForAssociationInvite } from "@/hooks/useAssociationInvitations";
import {
  useCreateVolunteerApplication,
  type ApplicationSource,
} from "@/hooks/association/useVolunteerModule";
import {
  INTERESTS_OPTIONS,
  PARTICIPATION_OPTIONS,
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LABELS,
} from "@/hooks/association/useAssociationMembersV2";

// ──────────────────────────────────────────────
// Steps
// ──────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Identification", subtitle: "Qui es-tu ?", icon: User },
  { id: 2, title: "Profil minimum", subtitle: "Coordonnées", icon: UserPlus },
  { id: 3, title: "Pop Culture", subtitle: "Tes passions", icon: Heart },
  { id: 4, title: "Compétences", subtitle: "Ce que tu sais faire", icon: Shield },
  { id: 5, title: "Disponibilités", subtitle: "Quand es-tu libre ?", icon: Calendar },
  { id: 6, title: "Expérience", subtitle: "Ton parcours", icon: Star },
  { id: 7, title: "Documents", subtitle: "Engagements", icon: FileText },
  { id: 8, title: "Motivation", subtitle: "Pourquoi toi ?", icon: Sparkles },
  { id: 9, title: "Terminé !", subtitle: "Bienvenue", icon: PartyPopper },
];

type SourceType = "existing" | "invitation" | "external";

interface WizardState {
  sourceType: SourceType | null;
  selectedUser: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  interests: string[];
  participationPreferences: string[];
  availability: Record<string, boolean>;
  experienceLevel: string;
  languages: string[];
  skills: string[];
  consentPhoto: boolean;
  consentCharter: boolean;
  consentData: boolean;
  motivation: string;
}

const initialState: WizardState = {
  sourceType: null,
  selectedUser: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  interests: [],
  participationPreferences: [],
  availability: {},
  experienceLevel: "debutant",
  languages: ["francais"],
  skills: [],
  consentPhoto: false,
  consentCharter: false,
  consentData: false,
  motivation: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
}

const LANGUAGE_OPTIONS = [
  "francais",
  "anglais",
  "japonais",
  "espagnol",
  "allemand",
  "coreen",
  "chinois",
  "arabe",
  "portugais",
  "italien",
];

const VolunteerOnboardingWizard = ({ open, onOpenChange, associationId }: Props) => {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const createApplication = useCreateVolunteerApplication();
  const { data: searchResults = [], isLoading: isSearching } =
    useSearchUsersForAssociationInvite(associationId, searchQuery);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setState(initialState);
      setSearchQuery("");
      setSkillInput("");
    }
  }, [open]);

  const progress = (step / STEPS.length) * 100;

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!state.sourceType;
      case 2:
        if (state.sourceType === "existing") return !!state.selectedUser;
        return !!state.firstName && !!state.email;
      case 3: return state.interests.length > 0;
      case 4: return state.participationPreferences.length > 0;
      case 5: return Object.values(state.availability).some(Boolean);
      case 6: return !!state.experienceLevel;
      case 7: return state.consentCharter && state.consentData;
      case 8: return true;
      default: return true;
    }
  }, [step, state]);

  const handleNext = () => {
    if (step === 8) {
      handleSubmit();
    } else if (step < STEPS.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const source: ApplicationSource =
      state.sourceType === "existing"
        ? "self"
        : state.sourceType === "invitation"
        ? "invitation"
        : "external";

    createApplication.mutate(
      {
        association_id: associationId,
        user_id: state.selectedUser?.id || undefined,
        source,
        status: "pending_review",
        first_name: state.firstName || state.selectedUser?.display_name || null,
        last_name: state.lastName || null,
        email: state.email || null,
        phone: state.phone || null,
        city: state.city || null,
        interests: state.interests,
        skills: state.skills,
        participation_preferences: state.participationPreferences,
        availability: state.availability,
        experience_level: state.experienceLevel,
        languages: state.languages,
        consent_photo: state.consentPhoto,
        motivation: state.motivation || null,
        onboarding_step: 8,
        submitted_at: new Date().toISOString(),
      } as any,
      { onSuccess: () => setStep(9) }
    );
  };

  const toggleArray = (key: keyof WizardState, value: string) => {
    setState((s) => {
      const arr = s[key] as string[];
      return {
        ...s,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !state.skills.includes(trimmed)) {
      setState((s) => ({ ...s, skills: [...s.skills, trimmed] }));
      setSkillInput("");
    }
  };

  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-[#0D0D0D] border-l border-border/50"
      >
        <SheetHeader className="space-y-4">
          <SheetTitle className="sr-only">Candidature bénévole</SheetTitle>
          {step < 9 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-1.5" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StepIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-foreground font-medium">
                  {currentStep.title}
                </span>
                <span>—</span>
                <span>{currentStep.subtitle}</span>
                <span className="ml-auto">{step}/{STEPS.length - 1}</span>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 min-h-[400px]">
          {step === 1 && (
            <Step1Source state={state} setState={setState} />
          )}
          {step === 2 && (
            <Step2Profile
              state={state}
              setState={setState}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
            />
          )}
          {step === 3 && (
            <Step3Interests state={state} toggleArray={toggleArray} />
          )}
          {step === 4 && (
            <Step4Skills
              state={state}
              toggleArray={toggleArray}
              skillInput={skillInput}
              setSkillInput={setSkillInput}
              addSkill={addSkill}
              setState={setState}
            />
          )}
          {step === 5 && (
            <Step5Availability state={state} setState={setState} />
          )}
          {step === 6 && (
            <Step6Experience state={state} setState={setState} />
          )}
          {step === 7 && (
            <Step7Documents state={state} setState={setState} />
          )}
          {step === 8 && (
            <Step8Motivation state={state} setState={setState} />
          )}
          {step === 9 && (
            <Step9Done state={state} onClose={() => onOpenChange(false)} />
          )}
        </div>

        {step < 9 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/30">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed || createApplication.isPending}
              className="gap-1 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {createApplication.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === 8 ? (
                <><Check className="w-4 h-4" /> Envoyer ma candidature</>
              ) : (
                <>Suivant <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ── Step 1: Source ──

function Step1Source({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  const sources: { value: SourceType; label: string; desc: string; color: string }[] = [
    { value: "existing", label: "J'ai un compte Manga Paradise", desc: "Je recherche mon profil existant", color: "border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10" },
    { value: "invitation", label: "J'ai été invité·e", desc: "On m'a proposé de rejoindre l'équipe", color: "border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10" },
    { value: "external", label: "Candidature libre", desc: "Je postule sans compte existant", color: "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">Comment souhaites-tu candidater ?</p>
      {sources.map((src) => {
        const selected = state.sourceType === src.value;
        return (
          <button
            key={src.value}
            onClick={() => setState((s) => ({ ...s, sourceType: src.value }))}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
              selected ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30" : src.color
            )}
          >
            <div className="flex-1">
              <p className={cn("font-medium text-sm", selected ? "text-emerald-400" : "text-foreground")}>{src.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{src.desc}</p>
            </div>
            {selected && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Step 2: Profile ──

function Step2Profile({
  state, setState, searchQuery, setSearchQuery, searchResults, isSearching,
}: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[];
  isSearching: boolean;
}) {
  if (state.sourceType === "existing") {
    if (state.selectedUser) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Profil trouvé :</p>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <Avatar className="h-12 w-12">
              <AvatarImage src={state.selectedUser.avatar_url || undefined} />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-300">
                {(state.selectedUser.display_name || state.selectedUser.username || "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{state.selectedUser.display_name || state.selectedUser.username}</p>
              {state.selectedUser.username && <p className="text-xs text-muted-foreground">@{state.selectedUser.username}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setState((s) => ({ ...s, selectedUser: null })); setSearchQuery(""); }}>
              Changer
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Recherche ton profil (min. 2 caractères).</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pseudo, nom..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-[#111827]/60 border-border/40" />
        </div>
        {isSearching && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
        {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">Aucun résultat</p>
        )}
        {searchResults.length > 0 && (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {searchResults.map((u) => (
              <button key={u.id} onClick={() => { setState((s) => ({ ...s, selectedUser: u })); setSearchQuery(""); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#1a1a1a] text-xs">{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.display_name || u.username}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // External / invitation: manual fields
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Renseigne tes coordonnées.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Prénom *</Label>
          <Input value={state.firstName} onChange={(e) => setState((s) => ({ ...s, firstName: e.target.value }))} className="bg-[#111827]/60 border-border/40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nom</Label>
          <Input value={state.lastName} onChange={(e) => setState((s) => ({ ...s, lastName: e.target.value }))} className="bg-[#111827]/60 border-border/40" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Email *</Label>
        <Input type="email" value={state.email} onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))} className="bg-[#111827]/60 border-border/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Téléphone</Label>
        <Input value={state.phone} onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))} className="bg-[#111827]/60 border-border/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Ville</Label>
        <Input value={state.city} onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))} className="bg-[#111827]/60 border-border/40" />
      </div>
    </div>
  );
}

// ── Step 3: Interests ──

function Step3Interests({ state, toggleArray }: { state: WizardState; toggleArray: (key: keyof WizardState, v: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Qu'est-ce qui te passionne ? (minimum 1)</p>
      <div className="flex flex-wrap gap-2">
        {INTERESTS_OPTIONS.map((opt) => {
          const sel = state.interests.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => toggleArray("interests", opt.value)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-all",
                sel ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-border/40 bg-[#111827]/40 text-muted-foreground hover:bg-white/5"
              )}>
              <span>{opt.emoji}</span> <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Skills ──

function Step4Skills({
  state, toggleArray, skillInput, setSkillInput, addSkill, setState,
}: {
  state: WizardState;
  toggleArray: (key: keyof WizardState, v: string) => void;
  skillInput: string;
  setSkillInput: (v: string) => void;
  addSkill: () => void;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Sur quels types de missions veux-tu aider ? (minimum 1)</p>
        <div className="flex flex-wrap gap-2">
          {PARTICIPATION_OPTIONS.map((opt) => {
            const sel = state.participationPreferences.includes(opt.value);
            return (
              <button key={opt.value} onClick={() => toggleArray("participationPreferences", opt.value)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all",
                  sel ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-border/40 bg-[#111827]/40 text-muted-foreground hover:bg-white/5"
                )}>
                <span>{opt.emoji}</span> <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Compétences spécifiques (optionnel)</Label>
        <div className="flex gap-2">
          <Input placeholder="ex: Photoshop, couture, japonais..." value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className="bg-[#111827]/60 border-border/40" />
          <Button variant="outline" size="icon" onClick={addSkill} disabled={!skillInput.trim()}>
            <Check className="w-4 h-4" />
          </Button>
        </div>
        {state.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {state.skills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                onClick={() => setState((st) => ({ ...st, skills: st.skills.filter((sk) => sk !== s) }))}>
                {s} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 5: Availability ──

function Step5Availability({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Quand es-tu disponible pour aider ? (minimum 1)</p>
      <div className="grid grid-cols-2 gap-2">
        {AVAILABILITY_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 p-3 rounded-lg border border-border/30 bg-[#111827]/40 cursor-pointer hover:bg-white/5 transition-colors">
            <Checkbox checked={!!state.availability[opt.value]}
              onCheckedChange={(checked) => setState((s) => ({ ...s, availability: { ...s.availability, [opt.value]: !!checked } }))} />
            <span className="text-sm text-foreground">{opt.label}</span>
          </label>
        ))}
      </div>
      <div className="space-y-2 pt-2">
        <Label className="text-sm text-muted-foreground">Langues parlées</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => {
            const sel = state.languages.includes(lang);
            return (
              <button key={lang} onClick={() => {
                setState((s) => ({
                  ...s,
                  languages: sel ? s.languages.filter((l) => l !== lang) : [...s.languages, lang],
                }));
              }}
                className={cn("px-3 py-1.5 rounded-full border text-xs transition-all capitalize",
                  sel ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-border/40 bg-[#111827]/40 text-muted-foreground hover:bg-white/5"
                )}>
                {lang}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Step 6: Experience ──

function Step6Experience({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  const levels = [
    { value: "debutant", label: "Débutant·e", desc: "C'est ma première expérience bénévole", emoji: "🌱" },
    { value: "intermediaire", label: "Déjà bénévole", desc: "J'ai déjà aidé lors d'un ou deux événements", emoji: "🌿" },
    { value: "confirme", label: "Confirmé·e", desc: "J'ai staffé plusieurs événements / conventions", emoji: "🌳" },
    { value: "expert", label: "Responsable expérimenté·e", desc: "J'ai coordonné des équipes bénévoles", emoji: "🏆" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">Quel est ton niveau d'expérience ?</p>
      {levels.map((lvl) => {
        const sel = state.experienceLevel === lvl.value;
        return (
          <button key={lvl.value} onClick={() => setState((s) => ({ ...s, experienceLevel: lvl.value }))}
            className={cn("w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
              sel ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-border/30 bg-[#111827]/40 hover:bg-white/5"
            )}>
            <span className="text-2xl">{lvl.emoji}</span>
            <div className="flex-1">
              <p className={cn("font-medium text-sm", sel ? "text-emerald-400" : "text-foreground")}>{lvl.label}</p>
              <p className="text-xs text-muted-foreground">{lvl.desc}</p>
            </div>
            {sel && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Step 7: Documents / Consents ──

function Step7Documents({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Avant de finaliser, confirme ces engagements :</p>

      <label className="flex items-start gap-3 p-4 rounded-xl border border-border/30 bg-[#111827]/40 cursor-pointer hover:bg-white/5">
        <Checkbox checked={state.consentCharter}
          onCheckedChange={(v) => setState((s) => ({ ...s, consentCharter: !!v }))} className="mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Charte bénévole *</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Je m'engage à respecter la charte de l'association, les consignes de sécurité et les règles de bonne conduite.
          </p>
        </div>
      </label>

      <label className="flex items-start gap-3 p-4 rounded-xl border border-border/30 bg-[#111827]/40 cursor-pointer hover:bg-white/5">
        <Checkbox checked={state.consentData}
          onCheckedChange={(v) => setState((s) => ({ ...s, consentData: !!v }))} className="mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Données personnelles *</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            J'accepte que mes données soient traitées dans le cadre de la gestion du bénévolat, conformément au RGPD.
          </p>
        </div>
      </label>

      <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-[#111827]/40">
        <div>
          <p className="text-sm font-medium text-foreground">Droit à l'image</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            J'autorise la captation et l'utilisation de mon image lors des événements.
          </p>
        </div>
        <Switch checked={state.consentPhoto}
          onCheckedChange={(v) => setState((s) => ({ ...s, consentPhoto: v }))} />
      </div>
    </div>
  );
}

// ── Step 8: Motivation ──

function Step8Motivation({ state, setState }: { state: WizardState; setState: React.Dispatch<React.SetStateAction<WizardState>> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Dis-nous en quelques mots pourquoi tu souhaites devenir bénévole. (optionnel mais apprécié !)
      </p>
      <Textarea
        value={state.motivation}
        onChange={(e) => setState((s) => ({ ...s, motivation: e.target.value }))}
        placeholder="Ce qui me motive, c'est..."
        rows={6}
        className="bg-[#111827]/60 border-border/40 resize-none"
        maxLength={1000}
      />
      <p className="text-xs text-muted-foreground text-right">
        {state.motivation.length}/1000
      </p>
    </div>
  );
}

// ── Step 9: Done ──

function Step9Done({ state, onClose }: { state: WizardState; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <PartyPopper className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-xl font-display text-foreground mb-2">Candidature envoyée !</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ta candidature bénévole a été transmise à l'association.
          Tu recevras une réponse prochainement.
        </p>
      </div>
      <Button onClick={onClose} className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-600/90">
        Fermer
      </Button>
    </div>
  );
}

export default VolunteerOnboardingWizard;
