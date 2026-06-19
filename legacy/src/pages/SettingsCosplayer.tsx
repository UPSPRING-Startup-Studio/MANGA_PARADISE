import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCosplayerProfile, useUpsertCosplayerProfile } from "@/hooks/useCosplayerProfile";
import { useCosplayVestiaire, useAddCosplay, useDeleteCosplay } from "@/hooks/useCosplayVestiaire";
import { useUserAchievements, useAddAchievement, useDeleteAchievement } from "@/hooks/useCosplayAchievements";
import { useLineupsByUser } from "@/hooks/useUnifiedLineups";
import { useCosplayWearCounts } from "@/hooks/useCosplayWearCount";
import { 
  useCosplans, 
  useCreateCosplan, 
  useUpdateCosplan, 
  useDeleteCosplan, 
  useTransferToVestiaire,
  CosplayPlan,
  CosplanStatus 
} from "@/hooks/useCosplans";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Drama, Save, Plus, Zap, Scissors, Star, Users, Calendar, Shirt, Trophy, Sparkles, Clock, CalendarDays,
  Timer, AlertTriangle, Heart, Target
} from "lucide-react";
import CosplayAddModal, { CosplayData } from "@/components/settings/CosplayAddModal";
import AchievementAddModal from "@/components/settings/AchievementAddModal";
import AchievementCard from "@/components/settings/AchievementCard";
import CosplayVSCard from "@/components/settings/CosplayVSCard";
import LineUpMakerModal from "@/components/cosplay/LineUpMakerModal";
import LineUpCard from "@/components/cosplay/LineUpCard";
import { CosplanCard } from "@/components/cosplay/CosplanCard";
import { CosplanModal } from "@/components/cosplay/CosplanModal";
import { TransferToVestiaireModal } from "@/components/cosplay/TransferToVestiaireModal";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useRegisterDirty } from "@/contexts/UnsavedChangesContext";

const SettingsCosplayer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  
  // Dedicated cosplayer profile hook with better debugging
  const { data: cosplayerProfile, isLoading: profileLoading } = useCosplayerProfile(user?.id);
  const upsertCosplayerProfile = useUpsertCosplayerProfile();
  
  // Cosplay data from Supabase
  const { data: cosplayItems = [] } = useCosplayVestiaire(user?.id);
  const addCosplayMutation = useAddCosplay();
  const deleteCosplayMutation = useDeleteCosplay();
  
  // Achievements data
  const { data: achievements = [] } = useUserAchievements(user?.id);
  const addAchievementMutation = useAddAchievement();
  const deleteAchievementMutation = useDeleteAchievement();

  // Lineups data (source of truth: event_lineups)
  const { data: lineups = [] } = useLineupsByUser(user?.id);
  
  // Wear counts for cosplays
  const { data: wearCounts = {} } = useCosplayWearCounts(user?.id);
  
  // Cosplans data
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data: cosplans = [] } = useCosplans(user?.id, selectedYear);
  const createCosplanMutation = useCreateCosplan();
  const updateCosplanMutation = useUpdateCosplan();
  const deleteCosplanMutation = useDeleteCosplan();
  const transferToVestiaireMutation = useTransferToVestiaire();
  
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");
  const [isCosplayerMode, setIsCosplayerMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Track if we loaded initial data
  const [showCosplayModal, setShowCosplayModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showLineUpModal, setShowLineUpModal] = useState(false);
  const [showCosplanModal, setShowCosplanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CosplayPlan | null>(null);
  const [transferPlan, setTransferPlan] = useState<CosplayPlan | null>(null);
  
  // New fields
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [collaborationPrefs, setCollaborationPrefs] = useState<string[]>([]);
  
  // ADN Cosplayer fields
  const [cosplayStyle, setCosplayStyle] = useState("");
  const [cosplayConCrunch, setCosplayConCrunch] = useState("");
  const [cosplayNightmare, setCosplayNightmare] = useState("");
  const [cosplayMotivation, setCosplayMotivation] = useState("");

  // ── Dirty state detection ──────────────────────────────────────────────────
  type CosplayerSnapshot = {
    isCosplayerMode: boolean;
    specialties: string[];
    yearsExperience: string;
    collaborationPrefs: string[];
    cosplayStyle: string;
    cosplayConCrunch: string;
    cosplayNightmare: string;
    cosplayMotivation: string;
  };
  const [savedSnapshot, setSavedSnapshot] = useState<CosplayerSnapshot | null>(null);
  const handleSaveRef = useRef<() => Promise<void>>();

  const currentFormValues = useMemo<CosplayerSnapshot>(() => ({
    isCosplayerMode,
    specialties,
    yearsExperience,
    collaborationPrefs,
    cosplayStyle,
    cosplayConCrunch,
    cosplayNightmare,
    cosplayMotivation,
  }), [isCosplayerMode, specialties, yearsExperience, collaborationPrefs,
      cosplayStyle, cosplayConCrunch, cosplayNightmare, cosplayMotivation]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  useRegisterDirty("settings-cosplayer", isDirty, async () => { await handleSaveRef.current?.(); });

  const specialtyOptions = [
    { value: "sewing", label: "Couture", emoji: "🧵" },
    { value: "armor", label: "Craft / Armure", emoji: "🛡️" },
    { value: "wig", label: "Wig Styling", emoji: "💇" },
    { value: "makeup", label: "FX Makeup", emoji: "💄" },
    { value: "performance", label: "Performance", emoji: "🎭" },
    { value: "model", label: "Modèle", emoji: "📸" },
  ];

  const experienceOptions = [
    { value: "beginner", label: "Débutant (0-1 an)" },
    { value: "intermediate", label: "Intermédiaire (2-3 ans)" },
    { value: "advanced", label: "Confirmé (4-6 ans)" },
    { value: "expert", label: "Vétéran / Pro (7+ ans)" },
  ];

  const collaborationPrefOptions = [
    { value: "photographers", label: "Photographes" },
    { value: "duo", label: "Binôme Cosplay" },
    { value: "group", label: "Groupe / Shooting collectif" },
    { value: "contest", label: "Partenaire Concours" },
    { value: "events", label: "Événements / Cons" },
  ];

  // ADN Cosplayer options
  const styleOptions = [
    "100% Fait Main",
    "Acheté & Customisé",
    "Full Achat / Commission",
    "Placard Cosplay",
    "Closet Cosplay"
  ];

  const conCrunchOptions = [
    "Prêt 1 mois avant (Mytho)",
    "La veille au soir",
    "Fini à l'hôtel à 4h du mat",
    "Fini sur place au scotch",
    "Toujours à l'heure"
  ];

  const nightmareOptions = [
    "L'envie pressante en armure",
    "La wig qui glisse",
    "L'accessoire qui casse",
    "Oublier une pièce chez soi",
    "La chaleur / Transpi",
    "Le maquillage qui coule"
  ];

  const motivationOptions = [
    "Le Craft & la Création",
    "Le Roleplay & Acting",
    "Les Photos & Shootings",
    "La Scène & Concours",
    "Rencontrer des gens",
    "Le défi technique"
  ];

  useEffect(() => {
    // Load from dedicated cosplayer profile hook - ONLY ONCE on initial load
    // Skip if already initialized to prevent overwriting user changes
    if (cosplayerProfile && !isInitialized) {
      console.log("DEBUG COSPLAYER - Loading profile data:", cosplayerProfile);
      
      // Load is_cosplayer_mode_active
      const isActive = cosplayerProfile.is_cosplayer_mode_active === true;
      console.log("DEBUG COSPLAYER - is_cosplayer_mode_active:", isActive);
      setIsCosplayerMode(isActive);
      
      // Load specialties (array)
      const loadedSpecialties = cosplayerProfile.cosplay_specialties || [];
      console.log("DEBUG COSPLAYER - specialties:", loadedSpecialties);
      setSpecialties(loadedSpecialties);
      
      // Load years experience
      const loadedExperience = cosplayerProfile.cosplay_years_experience || "";
      console.log("DEBUG COSPLAYER - years_experience:", loadedExperience);
      setYearsExperience(loadedExperience);
      
      // Load collaboration prefs (array)
      const loadedCollabPrefs = cosplayerProfile.cosplay_collaboration_prefs || [];
      console.log("DEBUG COSPLAYER - collaboration_prefs:", loadedCollabPrefs);
      setCollaborationPrefs(loadedCollabPrefs);
      
      // Load ADN Cosplayer fields
      const style = cosplayerProfile.cosplay_style || "";
      const conCrunch = cosplayerProfile.cosplay_con_crunch || "";
      const nightmare = cosplayerProfile.cosplay_nightmare || "";
      const motivation = cosplayerProfile.cosplay_motivation || "";
      setCosplayStyle(style);
      setCosplayConCrunch(conCrunch);
      setCosplayNightmare(nightmare);
      setCosplayMotivation(motivation);

      // Capture baseline for dirty detection
      setSavedSnapshot({
        isCosplayerMode: isActive,
        specialties: loadedSpecialties,
        yearsExperience: loadedExperience,
        collaborationPrefs: loadedCollabPrefs,
        cosplayStyle: style,
        cosplayConCrunch: conCrunch,
        cosplayNightmare: nightmare,
        cosplayMotivation: motivation,
      });
      
      console.log("DEBUG COSPLAYER - All data loaded successfully");
      setIsInitialized(true); // Mark as initialized
    }
  }, [cosplayerProfile, isInitialized]);

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleAddCosplay = async (data: CosplayData) => {
    if (!user) {
      toast.error("Connecte-toi pour enregistrer ton cosplay.");
      throw new Error("Not authenticated");
    }

    console.log("DEBUG SETTINGS - handleAddCosplay called with data:", {
      characterId: data.characterId,
      characterName: data.characterName,
      universeId: data.universeId,
      universeName: data.universeName,
      cosplayPhotoLength: data.cosplayPhoto?.length,
      officialImageUrl: data.officialImageUrl,
    });

    let cosplayFile: File;

    try {
      console.log("DEBUG SETTINGS - Converting base64 to File...");
      const response = await fetch(data.cosplayPhoto);
      const blob = await response.blob();
      cosplayFile = new File([blob], `cosplay-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
      console.log("DEBUG SETTINGS - File created:", {
        name: cosplayFile.name,
        size: cosplayFile.size,
        type: cosplayFile.type
      });
    } catch (error: any) {
      console.error("DEBUG SETTINGS - Error converting cosplay photo to file:", error);
      toast.error("Erreur lors du traitement de la photo");
      throw error;
    }

    console.log("DEBUG SETTINGS - Calling addCosplayMutation...");
    try {
      await addCosplayMutation.mutateAsync({
        userId: user.id,
        characterId: data.characterId,
        characterName: data.characterName,
        universeId: data.universeId,
        universeName: data.universeName,
        cosplayPhotoFile: cosplayFile,
        officialImageUrl: data.officialImageUrl,
      });
      console.log("DEBUG SETTINGS - addCosplayMutation SUCCESS");
    } catch (error: any) {
      console.error("DEBUG SETTINGS - addCosplayMutation ERROR:", error);
      console.error("DEBUG SETTINGS - Error code:", error.code);
      console.error("DEBUG SETTINGS - Error message:", error.message);
      throw error;
    }
  };

  const handleDeleteCosplay = (id: string, imageUrl: string) => {
    if (!user) return;
    deleteCosplayMutation.mutate({ id, userId: user.id, imageUrl });
  };

  const handleAddAchievement = async (data: {
    contestName: string;
    awardTitle: string;
    eventDate: string;
    proofFiles: File[];
  }) => {
    if (!user) {
      toast.error("Connecte-toi pour déclarer un prix.");
      throw new Error("Not authenticated");
    }

    await addAchievementMutation.mutateAsync({
      userId: user.id,
      contestName: data.contestName,
      awardTitle: data.awardTitle,
      eventDate: data.eventDate,
      proofFiles: data.proofFiles,
    });
  };

  const handleDeleteAchievement = (id: string, proofUrl: string) => {
    if (!user) return;
    deleteAchievementMutation.mutate({ id, userId: user.id, proofUrl });
  };

  // Cosplan handlers - unified for create and edit
  const handleCosplanSubmit = async (data: {
    id?: string;
    character_name: string;
    universe: string;
    character_id?: string;
    universe_id?: string;
    target_year: number;
    image_url?: string | null;
    status?: CosplanStatus;
    priority: number;
    budget?: number | null;
    deadline?: string | null;
    target_event_id?: string | null;
    notes?: string | null;
  }) => {
    if (!user) throw new Error("Not authenticated");
    
    if (data.id) {
      // Edit mode
      await updateCosplanMutation.mutateAsync({
        userId: user.id,
        id: data.id,
        character_name: data.character_name,
        universe: data.universe,
        target_year: data.target_year,
        image_url: data.image_url,
        priority: data.priority,
        budget: data.budget,
        deadline: data.deadline,
        target_event_id: data.target_event_id,
        notes: data.notes,
      });
    } else {
      // Create mode
      await createCosplanMutation.mutateAsync({
        userId: user.id,
        character_name: data.character_name,
        universe: data.universe,
        target_year: data.target_year,
        image_url: data.image_url || undefined,
        status: data.status || 'wishlist',
        priority: data.priority,
        budget: data.budget,
        deadline: data.deadline,
        target_event_id: data.target_event_id,
        notes: data.notes,
      });
    }
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    if (!user) return;
    updateCosplanMutation.mutate({ id, userId: user.id, progress_level: progress });
  };

  const handleUpdateStatus = (id: string, status: CosplanStatus) => {
    if (!user) return;
    updateCosplanMutation.mutate({ id, userId: user.id, status });
  };

  const handleDeleteCosplan = (id: string) => {
    if (!user) return;
    deleteCosplanMutation.mutate({ id, userId: user.id });
  };

  const handleTransferToVestiaire = async (plan: CosplayPlan, userImageUrl: string) => {
    if (!user) return;
    await transferToVestiaireMutation.mutateAsync({ plan, userId: user.id, userImageUrl });
  };

  // Immediate save for the switch toggle
  const handleSwitchToggle = async (checked: boolean) => {
    if (!user) {
      toast.error("Connecte-toi pour activer ton profil cosplayer");
      return;
    }
    
    setIsCosplayerMode(checked);
    
    console.log("DEBUG COSPLAYER - Switch toggled to:", checked);
    
    try {
      // Immediately save the switch state to profiles table
      await upsertCosplayerProfile.mutateAsync({
        userId: user.id,
        data: {
          is_cosplayer_mode_active: checked,
        },
      });
      
      console.log("DEBUG COSPLAYER - Switch state saved successfully");
      
      if (checked) {
        toast.success("Mode cosplayer activé ! 🎭", {
          description: "N'oublie pas de remplir tes spécialités et de sauvegarder"
        });
      } else {
        toast.success("Mode cosplayer désactivé", {
          description: "Tes données sont conservées pour une réactivation future"
        });
      }
    } catch (error) {
      console.error("Error saving switch state:", error);
      toast.error("Erreur lors de la sauvegarde du switch");
      // Revert the switch state on error
      setIsCosplayerMode(!checked);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Connecte-toi pour enregistrer ton profil");
      return;
    }
    
    setSaving(true);
    setSaveStatus("saving");
    console.log("DEBUG COSPLAYER - Starting save...");
    
    try {
      // Use the dedicated upsert hook
      await upsertCosplayerProfile.mutateAsync({
        userId: user.id,
        data: {
          is_cosplayer_mode_active: isCosplayerMode,
          cosplay_specialties: specialties,
          cosplay_years_experience: yearsExperience || "",
          cosplay_collaboration_prefs: collaborationPrefs,
          cosplay_style: cosplayStyle || "",
          cosplay_con_crunch: cosplayConCrunch || "",
          cosplay_nightmare: cosplayNightmare || "",
          cosplay_motivation: cosplayMotivation || "",
        },
      });
      
      console.log("DEBUG COSPLAYER - Save successful");
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      
      if (isCosplayerMode) {
        toast.success("Profil cosplayer activé et enregistré !", { icon: "🎭" });
      } else {
        toast.success("Profil enregistré ! Tes données sont conservées pour une réactivation future.", { icon: "✅" });
      }
    } catch (error) {
      console.error("Error saving cosplayer profile:", error);
      setSaveStatus("error");
      toast.error("Erreur lors de la sauvegarde. Vérifie la console pour plus de détails.");
    } finally {
      setSaving(false);
    }
  };

  // Keep ref in sync
  handleSaveRef.current = handleSave;

  const handleDiscard = () => {
    if (!savedSnapshot) return;
    setIsCosplayerMode(savedSnapshot.isCosplayerMode);
    setSpecialties(savedSnapshot.specialties);
    setYearsExperience(savedSnapshot.yearsExperience);
    setCollaborationPrefs(savedSnapshot.collaborationPrefs);
    setCosplayStyle(savedSnapshot.cosplayStyle);
    setCosplayConCrunch(savedSnapshot.cosplayConCrunch);
    setCosplayNightmare(savedSnapshot.cosplayNightmare);
    setCosplayMotivation(savedSnapshot.cosplayMotivation);
    setSaveStatus("clean");
  };

  // Group lineups by event and separate upcoming vs history
  const today = startOfDay(new Date());
  
  const groupedLineups = useMemo(() => {
    const groups: Record<string, typeof lineups> = {};
    lineups.forEach((lineup) => {
      const eventId = lineup.event_id;
      if (!groups[eventId]) groups[eventId] = [];
      groups[eventId].push(lineup);
    });
    return groups;
  }, [lineups]);

  const { upcomingLineups, historyLineups } = useMemo(() => {
    const upcoming: Array<{ eventId: string; lineups: typeof lineups }> = [];
    const history: Array<{ eventId: string; lineups: typeof lineups }> = [];
    
    Object.entries(groupedLineups).forEach(([eventId, eventLineups]) => {
      const eventInfo = eventLineups[0]?.event;
      if (!eventInfo) return;
      
      const eventEndDate = parseISO(eventInfo.end_date || eventInfo.date);
      
      if (isAfter(eventEndDate, today) || format(eventEndDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        upcoming.push({ eventId, lineups: eventLineups });
      } else {
        history.push({ eventId, lineups: eventLineups });
      }
    });
    
    // Sort upcoming by date ascending, history by date descending
    upcoming.sort((a, b) => {
      const dateA = a.lineups[0]?.event?.date || '';
      const dateB = b.lineups[0]?.event?.date || '';
      return dateA.localeCompare(dateB);
    });
    
    history.sort((a, b) => {
      const dateA = a.lineups[0]?.event?.date || '';
      const dateB = b.lineups[0]?.event?.date || '';
      return dateB.localeCompare(dateA);
    });
    
    return { upcomingLineups: upcoming, historyLineups: history };
  }, [groupedLineups, today]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
    >
      <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
        <Drama className="w-6 h-6" />
        PROFIL COSPLAYER
      </h2>

      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER : ACTIVATION & NIVEAU
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 bg-white/5 rounded-xl mb-6 space-y-4">
        {/* Switch Activation */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sakura" />
              Activer mon mode Cosplayer
            </h3>
            <p className="font-body text-sm text-muted-foreground">
              Affiche tes cosplays sur ton profil public et dans l'annuaire
            </p>
          </div>
          <Switch 
            checked={isCosplayerMode}
            onCheckedChange={handleSwitchToggle}
            className="data-[state=checked]:bg-sakura"
          />
        </div>

        {/* Niveau d'Expérience - juste en dessous */}
        <AnimatePresence>
          {isCosplayerMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-border/30"
            >
              <Label className="font-body text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                Niveau d'Expérience
              </Label>
              <Select value={yearsExperience} onValueChange={setYearsExperience}>
                <SelectTrigger className="max-w-xs bg-muted">
                  <SelectValue placeholder="Sélectionne ton niveau" />
                </SelectTrigger>
                <SelectContent>
                  {experienceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isCosplayerMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 overflow-hidden"
          >
            {/* ═══════════════════════════════════════════════════════════════════════════
                BLOC 1 : COMPÉTENCES & COLLABORATIONS (2 Colonnes)
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-5 bg-white/5 rounded-xl">
              <h3 className="font-display text-lg text-foreground flex items-center gap-2 mb-5">
                <Scissors className="w-5 h-5 text-sakura" />
                COMPÉTENCES & COLLABORATIONS
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne Gauche : Mes Spécialités */}
                <div>
                  <Label className="font-body text-sm text-muted-foreground mb-3 block">
                    Mes Spécialités
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {specialtyOptions.map((specialty) => (
                      <button
                        key={specialty.value}
                        onClick={() => toggleArrayItem(specialties, setSpecialties, specialty.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all text-left ${
                          specialties.includes(specialty.value)
                            ? "bg-sakura/20 border-2 border-sakura"
                            : "bg-muted border-2 border-transparent hover:border-sakura/30"
                        }`}
                      >
                        <span className="text-lg">{specialty.emoji}</span>
                        <span className="font-body text-sm">{specialty.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colonne Droite : Je cherche... */}
                <div>
                  <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Je cherche...
                  </Label>
                  <div className="space-y-2">
                    {collaborationPrefOptions.map((pref) => (
                      <label 
                        key={pref.value}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${
                          collaborationPrefs.includes(pref.value)
                            ? "bg-turquoise/20 border-turquoise"
                            : "bg-muted border-transparent hover:border-turquoise/30"
                        }`}
                      >
                        <Checkbox 
                          checked={collaborationPrefs.includes(pref.value)}
                          onCheckedChange={() => toggleArrayItem(collaborationPrefs, setCollaborationPrefs, pref.value)}
                          className="border-turquoise data-[state=checked]:bg-turquoise"
                        />
                        <span className="font-body text-sm">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                BLOC 1.5 : MON ADN COSPLAYER
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-5 bg-gradient-to-br from-sakura/10 to-sakura/5 border border-sakura/30 rounded-xl">
              <h3 className="font-display text-lg text-sakura flex items-center gap-2 mb-5">
                🧬 MON ADN COSPLAYER
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bloc 1: La Méthode */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-500" />
                    Ta philosophie du Cosplay ?
                  </Label>
                  <Select value={cosplayStyle} onValueChange={setCosplayStyle}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ta méthode..." />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloc 2: Con Crunch */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-500" />
                    Ton niveau de procrastination ?
                  </Label>
                  <Select value={cosplayConCrunch} onValueChange={setCosplayConCrunch}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ton timing..." />
                    </SelectTrigger>
                    <SelectContent>
                      {conCrunchOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloc 3: La Hantise */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Ta pire hantise en convention ?
                  </Label>
                  <Select value={cosplayNightmare} onValueChange={setCosplayNightmare}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ta hantise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nightmareOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloc 4: La Passion */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Ce que tu préfères dans le Cosplay ?
                  </Label>
                  <Select value={cosplayMotivation} onValueChange={setCosplayMotivation}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ta passion..." />
                    </SelectTrigger>
                    <SelectContent>
                      {motivationOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                BLOC 1.75 : MES OBJECTIFS COSPLAY (COSPLANS)
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-5 bg-gradient-to-br from-sakura/10 to-accent/10 border-2 border-sakura/30 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display text-lg text-sakura flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    🎯 MES OBJECTIFS COSPLAY
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Planifie tes projets et suis leur avancement
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Year Selector */}
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-[120px] bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear, currentYear + 1, currentYear + 2, currentYear + 3].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate('/espace-membre/vestiaire')}
                      variant="outline"
                      className="border-turquoise text-turquoise hover:bg-turquoise/10 font-display"
                    >
                      <Shirt className="w-4 h-4 mr-2" />
                      Aller au Vestiaire
                    </Button>
                    
                    <Button
                      onClick={() => setShowCosplanModal(true)}
                      className="bg-sakura hover:bg-sakura/90 text-white font-display"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Projet
                    </Button>
                  </div>
                </div>
              </div>

              {cosplans.length === 0 ? (
                <div className="text-center py-10 bg-background/50 rounded-lg">
                  <Target className="w-14 h-14 mx-auto text-sakura/40 mb-4" />
                  <p className="text-muted-foreground font-body mb-4">
                    Aucun projet pour {selectedYear}. Ajoute ton premier objectif cosplay !
                  </p>
                  <Button 
                    onClick={() => setShowCosplanModal(true)}
                    className="bg-sakura hover:bg-sakura/90 text-white font-display"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un projet
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {cosplans.map((plan) => (
                      <CosplanCard
                        key={plan.id}
                        plan={plan}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteCosplan}
                        onTransfer={(p) => setTransferPlan(p)}
                        onEdit={(p) => setEditingPlan(p)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                BLOC 2 : AGENDA & LINE-UPS (MISE EN AVANT)
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-purple-400 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    MES LINE-UPS & AGENDA
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Planifie tes cosplays pour les événements et partage-les !
                  </p>
                </div>
                <Button 
                  onClick={() => setShowLineUpModal(true)}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-display shadow-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  CRÉER MON LINE-UP
                </Button>
              </div>

              {/* Tabs pour À venir / Historique */}
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4 bg-background/50">
                  <TabsTrigger value="upcoming" className="flex items-center gap-2 data-[state=active]:bg-purple-500/20">
                    <CalendarDays className="w-4 h-4" />
                    À venir
                    {upcomingLineups.length > 0 && (
                      <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {upcomingLineups.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-muted">
                    <Clock className="w-4 h-4" />
                    Historique
                    {historyLineups.length > 0 && (
                      <span className="bg-muted-foreground/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {historyLineups.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Onglet À venir */}
                <TabsContent value="upcoming" className="mt-0">
                  {upcomingLineups.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                      {upcomingLineups.map(({ eventId, lineups: eventLineups }) => {
                        const firstLineup = eventLineups[0];
                        const eventInfo = firstLineup.event;
                        
                        return (
                          <LineUpCard
                            key={eventId}
                            eventId={eventId}
                            eventTitle={eventInfo?.title || 'Événement'}
                            eventDate={eventInfo?.date || ''}
                            eventEndDate={eventInfo?.end_date}
                            eventImageUrl={eventInfo?.image_url}
                            lineups={eventLineups}
                            variant="upcoming"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-background/50 rounded-lg">
                      <CalendarDays className="w-14 h-14 mx-auto text-purple-400/40 mb-4" />
                      <p className="text-muted-foreground font-body mb-4">
                        Aucun événement à venir planifié.
                      </p>
                      <Button 
                        onClick={() => setShowLineUpModal(true)}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-display"
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Planifier mon prochain événement
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Onglet Historique */}
                <TabsContent value="history" className="mt-0">
                  {historyLineups.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {historyLineups.map(({ eventId, lineups: eventLineups }) => {
                        const firstLineup = eventLineups[0];
                        const eventInfo = firstLineup.event;
                        
                        return (
                          <LineUpCard
                            key={eventId}
                            eventId={eventId}
                            eventTitle={eventInfo?.title || 'Événement'}
                            eventDate={eventInfo?.date || ''}
                            eventEndDate={eventInfo?.end_date}
                            eventImageUrl={eventInfo?.image_url}
                            lineups={eventLineups}
                            variant="history"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-background/50 rounded-lg">
                      <Clock className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-body text-lg mb-2">
                        Tu n'as pas encore d'événements passés avec Manga Paradise.
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        Ton aventure commence bientôt ! 🌸
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                BLOC 3 : MON VESTIAIRE (PORTFOLIO)
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-5 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                  <Drama className="w-5 h-5 text-turquoise" />
                  MON VESTIAIRE
                  <span className="text-sm font-body text-muted-foreground ml-1">
                    ({cosplayItems.length} costume{cosplayItems.length > 1 ? "s" : ""})
                  </span>
                </h3>
                <Button 
                  onClick={() => setShowCosplayModal(true)}
                  variant="outline"
                  className="border-turquoise text-turquoise hover:bg-turquoise/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Incarnation
                </Button>
              </div>

              {cosplayItems.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <Drama className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground font-body mb-4">
                    Ton vestiaire est vide ! Ajoute ta première incarnation.
                  </p>
                  <Button 
                    onClick={() => setShowCosplayModal(true)}
                    className="bg-gradient-to-r from-sakura to-otk hover:opacity-90 text-white font-display"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    CRÉER MON PREMIER VS
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cosplayItems.map((item) => (
                    <CosplayVSCard
                      key={item.id}
                      id={item.id}
                      characterName={item.character_name}
                      universe={item.universe}
                      cosplayPhoto={item.user_image_url}
                      officialImage={item.official_image_url}
                      wearCount={wearCounts[item.id] || 0}
                      onDelete={() => handleDeleteCosplay(item.id, item.user_image_url)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                BLOC 4 : PALMARÈS
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="p-5 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    PALMARÈS & DISTINCTIONS
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Déclare tes victoires en concours cosplay (vérification admin requise)
                  </p>
                </div>
                <Button 
                  onClick={() => setShowAchievementModal(true)}
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Déclarer un Prix
                </Button>
              </div>

              {achievements.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Trophy className="w-12 h-12 mx-auto text-accent/40 mb-3" />
                  <p className="text-muted-foreground font-body">
                    Aucun prix déclaré. Ajoute tes récompenses de concours !
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onDelete={handleDeleteAchievement}
                      showStatus
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CosplayAddModal 
        isOpen={showCosplayModal}
        onClose={() => setShowCosplayModal(false)}
        onAdd={handleAddCosplay}
      />

      <AchievementAddModal
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        onAdd={handleAddAchievement}
      />

      <LineUpMakerModal
        isOpen={showLineUpModal}
        onClose={() => setShowLineUpModal(false)}
      />

      <CosplanModal
        open={showCosplanModal || !!editingPlan}
        onClose={() => {
          setShowCosplanModal(false);
          setEditingPlan(null);
        }}
        userId={user?.id || ''}
        editingPlan={editingPlan}
        onSubmit={handleCosplanSubmit}
      />

      <TransferToVestiaireModal
        open={!!transferPlan}
        onClose={() => setTransferPlan(null)}
        plan={transferPlan}
        userId={user?.id || ''}
        onTransfer={handleTransferToVestiaire}
      />

      {/* Save Button (kept for fallback / explicit save action in page) */}
      <Button 
        onClick={handleSave}
        disabled={saving}
        className="w-full md:w-auto mt-8 bg-sakura hover:bg-sakura/90 text-white font-display tracking-wide"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Enregistrement..." : "ENREGISTRER LES MODIFICATIONS"}
      </Button>

      {/* Sticky save bar */}
      <StickySaveBar
        status={saveStatus !== "clean" ? saveStatus : isDirty ? "dirty" : "clean"}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </motion.div>
  );
};

export default SettingsCosplayer;
