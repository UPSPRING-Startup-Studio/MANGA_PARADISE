import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Palette, Save, Briefcase, Wrench, Lightbulb, X, PenTool, Headphones, Laptop, FolderOpen
} from "lucide-react";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useRegisterDirty } from "@/contexts/UnsavedChangesContext";

const SettingsCreative = () => {
  const queryClient = useQueryClient();
  const { profile, updateProfile } = useProfile();
  
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  
  // Commission status
  const [commissionStatus, setCommissionStatus] = useState("closed");
  
  // Collaboration types
  const [collaborationTypes, setCollaborationTypes] = useState<string[]>([]);
  
  // Tools
  const [softwareSkills, setSoftwareSkills] = useState<string[]>([]);
  const [newSoftware, setNewSoftware] = useState("");
  const [hardwareEquipment, setHardwareEquipment] = useState("");
  
  // Existing fields
  const [creativeDomains, setCreativeDomains] = useState<string[]>([]);
  const [collaborations, setCollaborations] = useState<string[]>([]);
  const [inspirations, setInspirations] = useState<string[]>([]);
  
  // ADN Créatif state
  const [toolPreference, setToolPreference] = useState("");
  const [workflowVibe, setWorkflowVibe] = useState("");
  const [creativeNightmare, setCreativeNightmare] = useState("");
  const [projectHabit, setProjectHabit] = useState("");

  // ── Dirty state detection ──────────────────────────────────────────────────
  type CreativeSnapshot = {
    isCreatorMode: boolean;
    commissionStatus: string;
    collaborationTypes: string[];
    softwareSkills: string[];
    hardwareEquipment: string;
    creativeDomains: string[];
    collaborations: string[];
    inspirations: string[];
    toolPreference: string;
    workflowVibe: string;
    creativeNightmare: string;
    projectHabit: string;
  };
  const [savedSnapshot, setSavedSnapshot] = useState<CreativeSnapshot | null>(null);
  const handleSaveRef = useRef<() => Promise<void>>();

  const currentFormValues = useMemo<CreativeSnapshot>(() => ({
    isCreatorMode, commissionStatus, collaborationTypes, softwareSkills,
    hardwareEquipment, creativeDomains, collaborations, inspirations,
    toolPreference, workflowVibe, creativeNightmare, projectHabit,
  }), [isCreatorMode, commissionStatus, collaborationTypes, softwareSkills,
      hardwareEquipment, creativeDomains, collaborations, inspirations,
      toolPreference, workflowVibe, creativeNightmare, projectHabit]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  useRegisterDirty("settings-creative", isDirty, async () => { await handleSaveRef.current?.(); });

  const domainOptions = [
    "Cosplay", "Dessin", "Couture", "Props 3D", "Maquillage", 
    "Photo", "Vidéo", "Pixel Art", "Écriture", "Musique"
  ];

  const collaborationOptions = [
    "Shootings photo", "Concours", "Ateliers", "Création Merch", 
    "Tutos vidéo", "Streams", "Conventions"
  ];

  const inspirationOptions = [
    "Shonen", "Shojo", "Seinen", "Fantasy", "Sci-Fi", 
    "Kawaii", "Dark Fantasy", "Cyberpunk", "Isekai"
  ];

  const collaborationTypeOptions = [
    { value: "paid", label: "Rémunéré uniquement" },
    { value: "tfp", label: "TFP / Collab gratuite" },
    { value: "trade", label: "Échange de services" },
  ];

  const commonSoftware = [
    "Photoshop", "Illustrator", "Procreate", "Clip Studio Paint",
    "Blender", "Maya", "ZBrush", "Lightroom", "Premiere Pro", 
    "After Effects", "DaVinci Resolve", "Figma"
  ];

  // ADN Créatif options
  const toolPreferenceOptions = [
    { value: "digital", label: "Team Digital (Tablette/iPad)" },
    { value: "tradi", label: "Team Tradi (Papier/Crayon)" },
    { value: "3d", label: "Team 3D / Modeling" },
    { value: "video", label: "Team Vidéo / Montage" },
    { value: "photo", label: "Team Photo" },
    { value: "mixed", label: "Team Mixte" },
  ];

  const workflowVibeOptions = [
    { value: "silence", label: "Silence absolu" },
    { value: "anime_playlist", label: "Playlist Anime à fond" },
    { value: "podcast", label: "Podcast / Vidéo en fond" },
    { value: "discord", label: "En vocal sur Discord" },
    { value: "caffeine", label: "Café / Monster en intraveineuse" },
  ];

  const creativeNightmareOptions = [
    { value: "crash", label: "Crash sans sauvegarde" },
    { value: "wrong_layer", label: "Dessiner sur le mauvais calque" },
    { value: "ink_bleed", label: "L'encre qui bave" },
    { value: "render_99", label: "Le rendu qui plante à 99%" },
    { value: "corrupt_file", label: "Corrompre son fichier de sauvegarde" },
    { value: "shaky_hand", label: "La main qui tremble" },
  ];

  const projectHabitOptions = [
    { value: "finisher", label: "Je finis tout ce que je commence" },
    { value: "wip_cemetery", label: "Le cimetière des 500 WIPs" },
    { value: "restart_sketch", label: "Je recommence 10 fois le croquis" },
    { value: "night_poster", label: "Je poste à 3h du matin" },
    { value: "perfectionist", label: "Perfectionniste maladif" },
  ];

  useEffect(() => {
    if (profile) {
      const creatorMode = profile.is_creator_profile_active || false;
      const domains = profile.creator_domains || [];
      const collabs = profile.collaboration_interests || [];
      const insps = profile.inspiration_universes || [];
      const extProfile = profile as any;
      const commStatus = extProfile.creative_commission_status || "closed";
      const collabTypes = extProfile.creative_collaboration_types || [];
      const software = extProfile.creative_software_skills || [];
      const hardware = extProfile.creative_hardware_equipment || "";
      const toolPref = extProfile.creative_tool_preference || "";
      const workflow = extProfile.creative_workflow_vibe || "";
      const nightmare = extProfile.creative_nightmare || "";
      const projHabit = extProfile.creative_project_habit || "";

      setIsCreatorMode(creatorMode);
      setCreativeDomains(domains);
      setCollaborations(collabs);
      setInspirations(insps);
      setCommissionStatus(commStatus);
      setCollaborationTypes(collabTypes);
      setSoftwareSkills(software);
      setHardwareEquipment(hardware);
      setToolPreference(toolPref);
      setWorkflowVibe(workflow);
      setCreativeNightmare(nightmare);
      setProjectHabit(projHabit);

      // Capture baseline for dirty detection (first load only)
      setSavedSnapshot((prev) => prev ?? {
        isCreatorMode: creatorMode,
        commissionStatus: commStatus,
        collaborationTypes: collabTypes,
        softwareSkills: software,
        hardwareEquipment: hardware,
        creativeDomains: domains,
        collaborations: collabs,
        inspirations: insps,
        toolPreference: toolPref,
        workflowVibe: workflow,
        creativeNightmare: nightmare,
        projectHabit: projHabit,
      });
    }
  }, [profile]);

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const addSoftware = () => {
    if (newSoftware.trim() && !softwareSkills.includes(newSoftware.trim())) {
      setSoftwareSkills([...softwareSkills, newSoftware.trim()]);
      setNewSoftware("");
    }
  };

  const removeSoftware = (software: string) => {
    setSoftwareSkills(softwareSkills.filter(s => s !== software));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const result = await updateProfile({
        is_creator_profile_active: isCreatorMode,
        creator_domains: creativeDomains,
        collaboration_interests: collaborations,
        inspiration_universes: inspirations,
        creative_commission_status: commissionStatus,
        creative_collaboration_types: collaborationTypes,
        creative_software_skills: softwareSkills,
        creative_hardware_equipment: hardwareEquipment || null,
        creative_tool_preference: toolPreference || null,
        creative_workflow_vibe: workflowVibe || null,
        creative_nightmare: creativeNightmare || null,
        creative_project_habit: projectHabit || null,
      } as any);

      if (result.error) {
        setSaveStatus("error");
        throw result.error;
      }
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Profil créatif enregistré !");
    } catch (error) {
      console.error("Error saving creative profile:", error);
      setSaveStatus("error");
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Keep ref in sync
  handleSaveRef.current = handleSave;

  const handleDiscard = () => {
    if (!savedSnapshot) return;
    setIsCreatorMode(savedSnapshot.isCreatorMode);
    setCommissionStatus(savedSnapshot.commissionStatus);
    setCollaborationTypes(savedSnapshot.collaborationTypes);
    setSoftwareSkills(savedSnapshot.softwareSkills);
    setHardwareEquipment(savedSnapshot.hardwareEquipment);
    setCreativeDomains(savedSnapshot.creativeDomains);
    setCollaborations(savedSnapshot.collaborations);
    setInspirations(savedSnapshot.inspirations);
    setToolPreference(savedSnapshot.toolPreference);
    setWorkflowVibe(savedSnapshot.workflowVibe);
    setCreativeNightmare(savedSnapshot.creativeNightmare);
    setProjectHabit(savedSnapshot.projectHabit);
    setSaveStatus("clean");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
    >
      <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
        <Palette className="w-6 h-6" />
        PROFIL CRÉATIF
      </h2>

      {/* Toggle Switch Principal */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-xl mb-6">
        <div>
          <h3 className="font-display text-lg text-foreground">Activer mon Profil Créateur</h3>
          <p className="font-body text-sm text-muted-foreground">
            Rejoins la communauté des créateurs Manga Paradise
          </p>
        </div>
        <Switch 
          checked={isCreatorMode}
          onCheckedChange={setIsCreatorMode}
          className="data-[state=checked]:bg-sakura"
        />
      </div>

      <AnimatePresence>
        {isCreatorMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 overflow-hidden"
          >
            {/* Section: Métier */}
            <div className="space-y-6 p-6 bg-muted/30 rounded-xl">
              <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sakura" />
                MON ACTIVITÉ
              </h3>

              {/* Statut des Commandes */}
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-3 block">
                  Statut des Commandes
                </Label>
                <RadioGroup 
                  value={commissionStatus} 
                  onValueChange={setCommissionStatus}
                  className="flex flex-wrap gap-3"
                >
                  {[
                    { value: "open", label: "✅ Ouvert aux commandes", color: "bg-green-500/10 border-green-500" },
                    { value: "waitlist", label: "⏳ Liste d'attente", color: "bg-amber-500/10 border-amber-500" },
                    { value: "closed", label: "🚫 Fermé", color: "bg-red-500/10 border-red-500" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
                        commissionStatus === option.value
                          ? option.color
                          : "border-transparent bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className="font-body text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Type de Collaboration */}
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-3 block">
                  Type de Collaboration Acceptée
                </Label>
                <div className="flex flex-wrap gap-3">
                  {collaborationTypeOptions.map((option) => (
                    <label 
                      key={option.value}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
                        collaborationTypes.includes(option.value)
                          ? "bg-sakura/20 border-sakura"
                          : "bg-muted border-transparent hover:border-sakura/30"
                      }`}
                    >
                      <Checkbox 
                        checked={collaborationTypes.includes(option.value)}
                        onCheckedChange={() => toggleArrayItem(collaborationTypes, setCollaborationTypes, option.value)}
                        className="border-sakura data-[state=checked]:bg-sakura"
                      />
                      <span className="font-body text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section: Boîte à Outils */}
            <div className="space-y-6 p-6 bg-muted/30 rounded-xl">
              <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                <Wrench className="w-5 h-5 text-turquoise" />
                MA BOÎTE À OUTILS
              </h3>

              {/* Logiciels */}
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-3 block">
                  Logiciels maîtrisés
                </Label>
                
                {/* Quick add common software */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {commonSoftware.filter(s => !softwareSkills.includes(s)).slice(0, 8).map((software) => (
                    <button
                      key={software}
                      onClick={() => setSoftwareSkills([...softwareSkills, software])}
                      className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-turquoise/20 hover:text-turquoise transition-colors"
                    >
                      + {software}
                    </button>
                  ))}
                </div>

                {/* Added software tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {softwareSkills.map((software) => (
                    <span 
                      key={software}
                      className="flex items-center gap-1 px-3 py-1 bg-turquoise/20 text-turquoise rounded-full text-sm"
                    >
                      {software}
                      <button 
                        onClick={() => removeSoftware(software)}
                        className="hover:bg-turquoise/30 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Custom input */}
                <div className="flex gap-2">
                  <Input
                    value={newSoftware}
                    onChange={(e) => setNewSoftware(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSoftware()}
                    placeholder="Ajouter un logiciel..."
                    className="bg-muted max-w-xs"
                  />
                  <Button 
                    onClick={addSoftware}
                    variant="outline"
                    size="sm"
                    className="border-turquoise text-turquoise hover:bg-turquoise/10"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Matériel */}
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-2 block">
                  Matériel utilisé
                </Label>
                <Textarea
                  value={hardwareEquipment}
                  onChange={(e) => setHardwareEquipment(e.target.value)}
                  placeholder="Ex: Canon EOS R5, Wacom Cintiq 22, Machine à coudre Singer..."
                  className="bg-muted resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Section: ADN Créatif */}
            <div className="space-y-6 p-6 bg-muted/30 rounded-xl">
              <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                🧬 MON ADN CRÉATIF
              </h3>
              <p className="text-sm text-muted-foreground">
                Révèle ta vraie nature d'artiste avec ces questions fun !
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bloc 1: Le Clan */}
                <div className="space-y-2">
                  <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-400" />
                    Ton arme de prédilection ?
                  </Label>
                  <Select value={toolPreference} onValueChange={setToolPreference}>
                    <SelectTrigger className="w-full bg-muted border-border">
                      <SelectValue placeholder="Choisis ton clan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {toolPreferenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloc 2: L'Ambiance */}
                <div className="space-y-2">
                  <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    Ton carburant pour créer ?
                  </Label>
                  <Select value={workflowVibe} onValueChange={setWorkflowVibe}>
                    <SelectTrigger className="w-full bg-muted border-border">
                      <SelectValue placeholder="Choisis ton ambiance..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowVibeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloc 3: La Douleur */}
                <div className="space-y-2">
                  <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-purple-400" />
                    Ta pire douleur d'artiste ?
                  </Label>
                  <Select value={creativeNightmare} onValueChange={setCreativeNightmare}>
                    <SelectTrigger className="w-full bg-muted border-border">
                      <SelectValue placeholder="Choisis ta douleur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {creativeNightmareOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloc 4: Les Projets */}
                <div className="space-y-2">
                  <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    Ton rapport aux projets (WIP) ?
                  </Label>
                  <Select value={projectHabit} onValueChange={setProjectHabit}>
                    <SelectTrigger className="w-full bg-muted border-border">
                      <SelectValue placeholder="Choisis ton style..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectHabitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Domaines */}
            <div className="space-y-6">
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Mes Domaines Créatifs
                </Label>
                <div className="flex flex-wrap gap-2">
                  {domainOptions.map((domain) => (
                    <button
                      key={domain}
                      onClick={() => toggleArrayItem(creativeDomains, setCreativeDomains, domain)}
                      className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                        creativeDomains.includes(domain)
                          ? "bg-sakura text-white"
                          : "bg-muted text-muted-foreground hover:bg-sakura/20 hover:text-sakura"
                      }`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collaborations */}
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-3 block">
                  Je suis intéressé(e) par...
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {collaborationOptions.map((collab) => (
                    <label 
                      key={collab}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        collaborations.includes(collab)
                          ? "bg-otk/20 border-2 border-otk"
                          : "bg-muted border-2 border-transparent hover:border-otk/30"
                      }`}
                    >
                      <Checkbox 
                        checked={collaborations.includes(collab)}
                        onCheckedChange={() => toggleArrayItem(collaborations, setCollaborations, collab)}
                        className="border-otk data-[state=checked]:bg-otk data-[state=checked]:text-header-bg"
                      />
                      <span className="font-body text-sm">{collab}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Univers d'inspiration */}
              <div>
                <Label className="font-body text-sm text-muted-foreground mb-3 block">
                  Univers d'inspiration
                </Label>
                <div className="flex flex-wrap gap-2">
                  {inspirationOptions.map((inspo) => (
                    <button
                      key={inspo}
                      onClick={() => toggleArrayItem(inspirations, setInspirations, inspo)}
                      className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                        inspirations.includes(inspo)
                          ? "bg-otk text-header-bg"
                          : "bg-muted text-muted-foreground hover:bg-otk/20 hover:text-otk"
                      }`}
                    >
                      {inspo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <Button 
        onClick={handleSave}
        disabled={saving}
        className="w-full md:w-auto mt-8 bg-sakura hover:bg-sakura/90 text-white font-display tracking-wide"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Enregistrement..." : "ENREGISTRER LES MODIFICATIONS"}
      </Button>

      <StickySaveBar
        status={saveStatus !== "clean" ? saveStatus : isDirty ? "dirty" : "clean"}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </motion.div>
  );
};

export default SettingsCreative;
