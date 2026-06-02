import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, Sparkles, Target, Edit,
  Check, ArrowRight, Plus, Loader2,
  Flame, CalendarIcon, Euro, StickyNote, ArrowLeft, MapPin
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSearchUniverses,
  useSearchCharacters,
  useCreateUniverse,
  useCreateCharacter,
  uploadCharacterImage,
  RefUniverse,
  RefCharacterWithUniverse,
} from "@/hooks/useReferenceData";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { CosplayPlan, CosplanStatus } from "@/hooks/useCosplans";
import { CosplanImageUpload } from "./CosplanImageUpload";
import { CosplanTaskList } from "./CosplanTaskList";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpcomingEvents, Event } from "@/hooks/useEvents";

interface CosplanModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  editingPlan?: CosplayPlan | null;
  onSubmit: (data: {
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
  }) => Promise<void>;
}

type Step = "universe" | "character" | "create-char" | "details";

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

export const CosplanModal = ({ open, onClose, userId, editingPlan, onSubmit }: CosplanModalProps) => {
  const { user } = useAuth();
  const isEditMode = !!editingPlan;
  
  // Step management - skip steps in edit mode
  const [step, setStep] = useState<Step>(isEditMode ? "details" : "universe");
  
  // Universe search/selection
  const [universeQuery, setUniverseQuery] = useState("");
  const debouncedUniverseQuery = useDebounce(universeQuery, 350);
  const [selectedUniverse, setSelectedUniverse] = useState<RefUniverse | null>(null);
  const { data: universeResults = [], isLoading: universesLoading } = useSearchUniverses(debouncedUniverseQuery);
  const createUniverseMutation = useCreateUniverse();
  
  // Character search/selection
  const [characterQuery, setCharacterQuery] = useState("");
  const debouncedCharacterQuery = useDebounce(characterQuery, 350);
  const [selectedCharacter, setSelectedCharacter] = useState<RefCharacterWithUniverse | null>(null);
  const { data: characterResults = [], isLoading: charactersLoading } = useSearchCharacters(
    debouncedCharacterQuery,
    selectedUniverse?.id
  );
  const createCharacterMutation = useCreateCharacter();
  
  // New character creation
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterImage, setNewCharacterImage] = useState<string | null>(null);
  const [newCharacterImageFile, setNewCharacterImageFile] = useState<File | null>(null);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  
  // Plan details
  const [targetYear, setTargetYear] = useState(currentYear);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [budget, setBudget] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [autoProgress, setAutoProgress] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Fetch upcoming events for target event selection
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useUpcomingEvents();

  const universeInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Debounce flags for showing "no results"
  const [showUniverseNoResults, setShowUniverseNoResults] = useState(false);
  const [showCharacterNoResults, setShowCharacterNoResults] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingPlan && open) {
      setSelectedUniverse({ id: "", name: editingPlan.universe, created_at: "" });
      setSelectedCharacter({ 
        id: "", 
        name: editingPlan.character_name, 
        universe_id: "",
        official_image_url: editingPlan.image_url,
        created_at: ""
      });
      setTargetYear(editingPlan.target_year);
      setImageUrl(editingPlan.image_url);
      setIsPriority(editingPlan.priority > 0);
      setBudget(editingPlan.budget?.toString() || "");
      setDeadline(editingPlan.deadline ? parseISO(editingPlan.deadline) : undefined);
      setTargetEventId((editingPlan as any).target_event_id || null);
      setNotes(editingPlan.notes || "");
      setAutoProgress(editingPlan.auto_progress || false);
      setCurrentProgress(editingPlan.progress_level || 0);
      setStep("details");
    }
  }, [editingPlan, open]);

  useEffect(() => {
    if (debouncedUniverseQuery.length >= 2 && !universesLoading && universeResults.length === 0) {
      const timer = setTimeout(() => setShowUniverseNoResults(true), 200);
      return () => clearTimeout(timer);
    }
    setShowUniverseNoResults(false);
  }, [debouncedUniverseQuery, universeResults, universesLoading]);

  useEffect(() => {
    if (debouncedCharacterQuery.length >= 2 && !charactersLoading && characterResults.length === 0) {
      const timer = setTimeout(() => setShowCharacterNoResults(true), 200);
      return () => clearTimeout(timer);
    }
    setShowCharacterNoResults(false);
  }, [debouncedCharacterQuery, characterResults, charactersLoading]);

  // Auto-focus inputs
  useEffect(() => {
    if (open && step === "universe" && !isEditMode) {
      setTimeout(() => universeInputRef.current?.focus(), 100);
    }
    if (step === "character") {
      setTimeout(() => characterInputRef.current?.focus(), 100);
    }
  }, [open, step, isEditMode]);

  const handleSelectUniverse = (universe: RefUniverse) => {
    setSelectedUniverse(universe);
    setUniverseQuery(universe.name);
    setStep("character");
  };

  const handleCreateUniverse = async () => {
    if (!universeQuery.trim()) return;
    
    try {
      const newUniverse = await createUniverseMutation.mutateAsync(universeQuery.trim());
      setSelectedUniverse(newUniverse);
      setStep("character");
      toast.success(`Univers "${newUniverse.name}" ajouté !`);
    } catch (error) {
      console.error("Error creating universe:", error);
      toast.error("Erreur lors de la création de l'univers");
    }
  };

  const handleSelectCharacter = (character: RefCharacterWithUniverse) => {
    setSelectedCharacter(character);
    setCharacterQuery(character.name);
    // Use the character's official image as default
    if (character.official_image_url && !imageUrl) {
      setImageUrl(character.official_image_url);
    }
    setStep("details");
  };

  const handleCreateCharacterStart = () => {
    setNewCharacterName(characterQuery);
    setStep("create-char");
  };

  const handleNewCharacterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCharacterImage(reader.result as string);
        setNewCharacterImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNewCharacter = async () => {
    if (!selectedUniverse || !newCharacterName.trim() || !user) return;
    
    setIsCreatingCharacter(true);
    console.log("DEBUG COSPLAN - Creating new character:", {
      name: newCharacterName.trim(),
      universeId: selectedUniverse.id,
      hasImage: !!newCharacterImageFile
    });
    
    try {
      let charImageUrl: string | undefined = undefined;
      
      // Upload official image if provided
      if (newCharacterImageFile) {
        console.log("DEBUG COSPLAN - Uploading character image...");
        try {
          charImageUrl = await uploadCharacterImage(newCharacterImageFile, user.id);
          console.log("DEBUG COSPLAN - Image uploaded successfully:", charImageUrl);
        } catch (uploadError: any) {
          console.error("DEBUG COSPLAN - Image upload failed:", uploadError);
          toast.error(`Erreur upload image: ${uploadError.message || "Erreur inconnue"}`);
          // Continue without image - don't block character creation
        }
      }
      
      // Create character in DB
      console.log("DEBUG COSPLAN - Inserting character into ref_characters...");
      const newChar = await createCharacterMutation.mutateAsync({
        name: newCharacterName.trim(),
        universeId: selectedUniverse.id,
        officialImageUrl: charImageUrl,
      });
      
      console.log("DEBUG COSPLAN - Character created successfully:", newChar);
      
      setSelectedCharacter(newChar);
      if (charImageUrl && !imageUrl) {
        setImageUrl(charImageUrl);
      }
      setStep("details");
      toast.success(`Personnage "${newChar.name}" ajouté !`);
    } catch (error: any) {
      console.error("DEBUG COSPLAN - Error creating character:", error);
      console.error("DEBUG COSPLAN - Error code:", error.code);
      console.error("DEBUG COSPLAN - Error message:", error.message);
      console.error("DEBUG COSPLAN - Error details:", error.details);
      
      const errorMsg = error.message || "Erreur inconnue";
      toast.error(`Erreur lors de la création du personnage: ${errorMsg}`);
    } finally {
      setIsCreatingCharacter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharacter || !selectedUniverse) return;

    setLoading(true);
    try {
      await onSubmit({
        id: editingPlan?.id,
        character_name: selectedCharacter.name,
        universe: selectedUniverse.name,
        character_id: selectedCharacter.id || undefined,
        universe_id: selectedUniverse.id || undefined,
        target_year: targetYear,
        image_url: imageUrl,
        status: editingPlan?.status || 'wishlist',
        priority: isPriority ? 1 : 0,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
        target_event_id: targetEventId,
        notes: notes.trim() || null,
      });
      
      handleReset();
    } catch (error) {
      console.error("Error saving cosplan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("universe");
    setUniverseQuery("");
    setSelectedUniverse(null);
    setCharacterQuery("");
    setSelectedCharacter(null);
    setNewCharacterName("");
    setNewCharacterImage(null);
    setNewCharacterImageFile(null);
    setTargetYear(currentYear);
    setImageUrl(null);
    setIsPriority(false);
    setBudget("");
    setDeadline(undefined);
    setTargetEventId(null);
    setNotes("");
    setAutoProgress(false);
    setCurrentProgress(0);
    setShowUniverseNoResults(false);
    setShowCharacterNoResults(false);
    onClose();
  };

  const getStepIndex = (s: Step) => {
    const steps: Step[] = ["universe", "character", "create-char", "details"];
    return steps.indexOf(s);
  };

  const stepLabels = [
    { key: "universe", label: "1" },
    { key: "character", label: "2" },
    { key: "details", label: "3" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="max-w-2xl bg-header-bg border-sakura/30 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-sakura flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="w-6 h-6 text-otk" />
                MODIFIER LE PROJET
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-otk" />
                NOUVEAU PROJET COSPLAY
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps - Only show in create mode */}
        {!isEditMode && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {stepLabels.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm transition-all ${
                  step === s.key || (step === "create-char" && s.key === "character")
                    ? "bg-sakura text-white" 
                    : getStepIndex(step) > i 
                      ? "bg-otk text-header-bg" 
                      : "bg-white/10 text-white/40"
                }`}>
                  {getStepIndex(step) > i ? <Check className="w-4 h-4" /> : s.label}
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-8 h-0.5 ${getStepIndex(step) > i ? "bg-otk" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Universe Selection */}
          {step === "universe" && (
            <motion.div
              key="universe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Label className="text-white/80 font-body mb-2 block">
                  De quel univers vient ton personnage ?
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input 
                    ref={universeInputRef}
                    value={universeQuery}
                    onChange={(e) => setUniverseQuery(e.target.value)}
                    placeholder="Ex: Naruto, One Piece, Arcane..."
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-sakura"
                  />
                  {universesLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sakura animate-spin" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              {universeResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-white/60 text-sm font-body">Univers trouvés :</p>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {universeResults.map((uni) => (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => handleSelectUniverse(uni)}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-sakura hover:bg-sakura/10 transition-all group text-left"
                      >
                        <div className="flex-1">
                          <p className="font-display text-white">{uni.name}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-sakura transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* No Results - Create New */}
              {showUniverseNoResults && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-turquoise/10 border border-turquoise/30 rounded-xl"
                >
                  <p className="text-turquoise font-body mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Univers introuvable dans la base !
                  </p>
                  <Button 
                    type="button"
                    onClick={handleCreateUniverse}
                    disabled={createUniverseMutation.isPending}
                    className="bg-turquoise hover:bg-turquoise/90 text-header-bg font-display"
                  >
                    {createUniverseMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    AJOUTER "{universeQuery}"
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Character Selection */}
          {step === "character" && selectedUniverse && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-3 bg-otk/10 rounded-lg border border-otk/30 mb-4">
                <p className="text-sm text-white/60 font-body">
                  Univers sélectionné : <span className="text-otk font-semibold">{selectedUniverse.name}</span>
                </p>
              </div>

              <div>
                <Label className="text-white/80 font-body mb-2 block">
                  Quel personnage veux-tu incarner ?
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input 
                    ref={characterInputRef}
                    value={characterQuery}
                    onChange={(e) => setCharacterQuery(e.target.value)}
                    placeholder="Ex: Naruto Uzumaki, Luffy, Jinx..."
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-sakura"
                  />
                  {charactersLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sakura animate-spin" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              {characterResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-white/60 text-sm font-body">Personnages trouvés :</p>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {characterResults.map((char) => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => handleSelectCharacter(char)}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-sakura hover:bg-sakura/10 transition-all group text-left"
                      >
                        {char.official_image_url && (
                          <img 
                            src={char.official_image_url} 
                            alt={char.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-display text-white">{char.name}</p>
                          <p className="text-white/60 text-sm font-body">{char.universe?.name}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-sakura transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* No Results - Create New */}
              {showCharacterNoResults && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-turquoise/10 border border-turquoise/30 rounded-xl"
                >
                  <p className="text-turquoise font-body mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Personnage introuvable dans la base !
                  </p>
                  <Button 
                    type="button"
                    onClick={handleCreateCharacterStart}
                    className="bg-turquoise hover:bg-turquoise/90 text-header-bg font-display"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    CRÉER "{characterQuery}"
                  </Button>
                </motion.div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedUniverse(null);
                    setUniverseQuery("");
                    setStep("universe");
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: Create New Character */}
          {step === "create-char" && selectedUniverse && (
            <motion.div
              key="create-char"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-3 bg-turquoise/10 rounded-lg border border-turquoise/30 mb-4">
                <p className="text-sm text-turquoise font-body flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Création d'un nouveau personnage
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/80 font-body mb-2 block">
                    Nom du personnage
                  </Label>
                  <Input 
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    placeholder="Ex: Naruto Uzumaki"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-sakura"
                  />
                </div>

                <div>
                  <Label className="text-white/80 font-body mb-2 block">
                    Image officielle du personnage (optionnel)
                  </Label>
                  <div className="relative">
                    {newCharacterImage ? (
                      <div className="w-24 h-24 rounded-lg overflow-hidden relative group">
                        <img 
                          src={newCharacterImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewCharacterImage(null);
                            setNewCharacterImageFile(null);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm"
                        >
                          Changer
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-sakura/50 transition-colors">
                        <div className="text-center">
                          <Plus className="w-6 h-6 mx-auto text-white/40 mb-1" />
                          <span className="text-sm text-white/40">Ajouter une image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewCharacterImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep("character")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  type="button"
                  onClick={handleSubmitNewCharacter}
                  disabled={isCreatingCharacter || !newCharacterName.trim()}
                  className="bg-turquoise hover:bg-turquoise/90 text-header-bg font-display flex-1"
                >
                  {isCreatingCharacter ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  CRÉER LE PERSONNAGE
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Plan Details */}
          {step === "details" && selectedCharacter && selectedUniverse && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Selected Character Summary */}
              {!isEditMode && (
                <div className="p-3 bg-sakura/10 rounded-lg border border-sakura/30 mb-4">
                  <div className="flex items-center gap-3">
                    {selectedCharacter.official_image_url && (
                      <img 
                        src={selectedCharacter.official_image_url} 
                        alt={selectedCharacter.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-display text-white">{selectedCharacter.name}</p>
                      <p className="text-white/60 text-sm font-body">{selectedUniverse.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-white/80 flex items-center gap-2">
                    Image de référence
                    {imageUrl && <span className="text-xs text-otk">(Optionnel - Peut être changée)</span>}
                  </Label>
                  <CosplanImageUpload
                    userId={userId}
                    currentImageUrl={imageUrl}
                    onImageUploaded={setImageUrl}
                    onImageRemoved={() => setImageUrl(null)}
                  />
                </div>

                {/* Two-column layout on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Année cible</Label>
                      <Select 
                        value={targetYear.toString()} 
                        onValueChange={(v) => setTargetYear(parseInt(v))}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/80 flex items-center gap-1">
                        <Euro className="w-3 h-3" />
                        Budget estimé
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="ex: 200"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      />
                    </div>

                    {/* Target Event Selection */}
                    <div className="space-y-2">
                      <Label className="text-white/80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Événement cible (Optionnel)
                      </Label>
                      <Select 
                        value={targetEventId || "none"} 
                        onValueChange={(v) => {
                          if (v === "none") {
                            setTargetEventId(null);
                          } else {
                            setTargetEventId(v);
                            // Auto-set deadline to event date
                            const selectedEvent = upcomingEvents.find(e => e.id === v);
                            if (selectedEvent) {
                              setDeadline(parseISO(selectedEvent.date));
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Aucun événement" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="none">
                            <span className="text-white/60">Aucun événement</span>
                          </SelectItem>
                          {eventsLoading ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                              Chargement...
                            </SelectItem>
                          ) : upcomingEvents.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              <span className="text-white/40">Aucun événement à venir</span>
                            </SelectItem>
                          ) : (
                            upcomingEvents.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{event.title}</span>
                                  <span className="text-xs text-white/60">
                                    {format(parseISO(event.date), "PPP", { locale: fr })}
                                    {event.city && ` • ${event.city}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {targetEventId && (
                        <p className="text-xs text-turquoise flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          La date butoir sera automatiquement définie à la date de l'événement
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Deadline DatePicker - Only if no event selected */}
                    <div className="space-y-2">
                      <Label className="text-white/80 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        Date butoir {targetEventId && <span className="text-xs text-white/40">(Auto depuis événement)</span>}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!!targetEventId}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                              !deadline && "text-white/40",
                              targetEventId && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadline ? format(deadline, "PPP", { locale: fr }) : "Sélectionner une date"}
                          </Button>
                        </PopoverTrigger>
                        {!targetEventId && (
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={deadline}
                              onSelect={setDeadline}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        )}
                      </Popover>
                      {deadline && !targetEventId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeadline(undefined)}
                          className="text-xs text-white/50 hover:text-white/80"
                        >
                          Effacer la date
                        </Button>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="text-white/80 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />
                        Notes
                      </Label>
                      <Textarea
                        placeholder="ex: Inspirations, références, notes diverses..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={6}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Task List - Only show in edit mode when we have a plan ID */}
                {isEditMode && editingPlan?.id && (
                  <>
                    <Separator className="bg-white/10 my-4" />
                    <CosplanTaskList
                      planId={editingPlan.id}
                      userId={userId}
                      autoProgress={autoProgress}
                      currentProgress={currentProgress}
                      onAutoProgressChange={setAutoProgress}
                      onProgressChange={setCurrentProgress}
                    />
                  </>
                )}

                {/* Priority Switch */}
                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-white">Projet prioritaire</span>
                  </div>
                  <Switch
                    checked={isPriority}
                    onCheckedChange={setIsPriority}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {!isEditMode && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep("character")}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                  )}
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={handleReset}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-sakura hover:bg-sakura/90 flex-1 font-display"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {isEditMode ? "SAUVEGARDER" : "CRÉER LE PROJET"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
