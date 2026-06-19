import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Search, Sparkles, Upload, AlertTriangle, 
  Zap, Check, ArrowRight, Plus, Loader2
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

export interface CosplayData {
  characterId: string;
  characterName: string;
  universeId: string;
  universeName: string;
  officialImageUrl: string;
  cosplayPhoto: string; // base64 data URL
}

interface CosplayAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: CosplayData) => Promise<void>;
}

type Step = "universe" | "character" | "create-char" | "upload" | "preview";

const CosplayAddModal = ({ isOpen, onClose, onAdd }: CosplayAddModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("universe");
  
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
  
  // Cosplay upload
  const [cosplayPhoto, setCosplayPhoto] = useState<string | null>(null);
  const [isSavingToVestiaire, setIsSavingToVestiaire] = useState(false);

  const universeInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Debounce flags for showing "no results"
  const [showUniverseNoResults, setShowUniverseNoResults] = useState(false);
  const [showCharacterNoResults, setShowCharacterNoResults] = useState(false);

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
    if (isOpen && step === "universe") {
      setTimeout(() => universeInputRef.current?.focus(), 100);
    }
    if (step === "character") {
      setTimeout(() => characterInputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

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
    setStep("upload");
  };

  const handleCreateCharacterStart = () => {
    setNewCharacterName(characterQuery);
    setStep("create-char");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "official" | "cosplay") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "official") {
          setNewCharacterImage(reader.result as string);
          setNewCharacterImageFile(file);
        } else {
          setCosplayPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNewCharacter = async () => {
    if (!selectedUniverse || !newCharacterName.trim() || !user) return;
    
    setIsCreatingCharacter(true);
    console.log("DEBUG VESTIAIRE - Creating new character:", {
      name: newCharacterName.trim(),
      universeId: selectedUniverse.id,
      hasImage: !!newCharacterImageFile
    });
    
    try {
      let charImageUrl: string | undefined = undefined;
      
      // Upload official image if provided
      if (newCharacterImageFile) {
        console.log("DEBUG VESTIAIRE - Uploading character image...");
        try {
          charImageUrl = await uploadCharacterImage(newCharacterImageFile, user.id);
          console.log("DEBUG VESTIAIRE - Image uploaded successfully:", charImageUrl);
        } catch (uploadError: any) {
          console.error("DEBUG VESTIAIRE - Image upload failed:", uploadError);
          toast.error(`Erreur upload image: ${uploadError.message || "Erreur inconnue"}`);
          // Continue without image - don't block character creation
        }
      }
      
      // Create character in DB
      console.log("DEBUG VESTIAIRE - Inserting character into ref_characters...");
      const newChar = await createCharacterMutation.mutateAsync({
        name: newCharacterName.trim(),
        universeId: selectedUniverse.id,
        officialImageUrl: charImageUrl,
      });
      
      console.log("DEBUG VESTIAIRE - Character created successfully:", newChar);
      
      setSelectedCharacter(newChar);
      setStep("upload");
      toast.success(`Personnage "${newChar.name}" ajouté !`);
    } catch (error: any) {
      console.error("DEBUG VESTIAIRE - Error creating character:", error);
      console.error("DEBUG VESTIAIRE - Error code:", error.code);
      console.error("DEBUG VESTIAIRE - Error message:", error.message);
      console.error("DEBUG VESTIAIRE - Error details:", error.details);
      console.error("DEBUG VESTIAIRE - Error hint:", error.hint);
      
      const errorMsg = error.message || "Erreur inconnue";
      toast.error(`Erreur lors de la création du personnage: ${errorMsg}`);
    } finally {
      setIsCreatingCharacter(false);
    }
  };

  const handleCosplayUploaded = () => {
    if (cosplayPhoto) {
      setStep("preview");
    }
  };

  const handleConfirm = async () => {
    if (!selectedCharacter || !selectedUniverse || !cosplayPhoto) return;

    if (!user) {
      toast.error("Connecte-toi pour enregistrer ton cosplay.");
      return;
    }

    console.log("DEBUG VESTIAIRE MODAL - handleConfirm called");
    console.log("DEBUG VESTIAIRE MODAL - selectedCharacter:", {
      id: selectedCharacter.id,
      name: selectedCharacter.name,
      official_image_url: selectedCharacter.official_image_url
    });
    console.log("DEBUG VESTIAIRE MODAL - selectedUniverse:", {
      id: selectedUniverse.id,
      name: selectedUniverse.name
    });
    console.log("DEBUG VESTIAIRE MODAL - cosplayPhoto length:", cosplayPhoto?.length);

    setIsSavingToVestiaire(true);
    try {
      console.log("DEBUG VESTIAIRE MODAL - Calling onAdd...");
      await onAdd({
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        universeId: selectedUniverse.id,
        universeName: selectedUniverse.name,
        officialImageUrl: selectedCharacter.official_image_url || "",
        cosplayPhoto: cosplayPhoto,
      });

      console.log("DEBUG VESTIAIRE MODAL - onAdd SUCCESS");
      handleReset();
    } catch (error: any) {
      console.error("DEBUG VESTIAIRE MODAL - onAdd ERROR:", error);
      console.error("DEBUG VESTIAIRE MODAL - Error code:", error.code);
      console.error("DEBUG VESTIAIRE MODAL - Error message:", error.message);
      console.error("DEBUG VESTIAIRE MODAL - Error details:", error.details);
      toast.error(`Impossible d'enregistrer ton cosplay: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsSavingToVestiaire(false);
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
    setCosplayPhoto(null);
    setShowUniverseNoResults(false);
    setShowCharacterNoResults(false);
    onClose();
  };

  const getStepIndex = (s: Step) => {
    const steps: Step[] = ["universe", "character", "create-char", "upload", "preview"];
    return steps.indexOf(s);
  };

  const stepLabels = [
    { key: "universe", label: "1" },
    { key: "character", label: "2" },
    { key: "upload", label: "3" },
    { key: "preview", label: "4" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="max-w-2xl bg-header-bg border-sakura/30 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-sakura flex items-center gap-2">
            <Zap className="w-6 h-6 text-otk" />
            NOUVELLE INCARNATION
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
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
                  Quel personnage incarnes-tu ?
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
                  variant="outline"
                  onClick={() => {
                    setSelectedUniverse(null);
                    setUniverseQuery("");
                    setStep("universe");
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Retour
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2b: Create New Character */}
          {step === "create-char" && selectedUniverse && (
            <motion.div
              key="create-char"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h3 className="font-display text-xl text-turquoise">🎮 NOUVEAU CHALLENGER !</h3>
                <p className="text-white/60 font-body text-sm">
                  Crée la fiche de ce personnage pour la communauté
                </p>
              </div>

              <div className="p-3 bg-otk/10 rounded-lg border border-otk/30">
                <p className="text-sm text-white/60 font-body">
                  Univers : <span className="text-otk font-semibold">{selectedUniverse.name}</span>
                </p>
              </div>

              <div>
                <Label className="text-white/80 font-body mb-1 block">Nom du Personnage</Label>
                <Input 
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  placeholder="Ex: Frieren"
                  className="bg-white/5 border-white/20 text-white focus:border-turquoise"
                />
              </div>

              {/* Official Image Upload */}
              <div>
                <Label className="text-white/80 font-body mb-2 block">Image Officielle du Personnage</Label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-turquoise/50 rounded-xl cursor-pointer bg-white/5 hover:bg-turquoise/10 transition-colors">
                  {newCharacterImage ? (
                    <img src={newCharacterImage} alt="Preview" className="h-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-turquoise/60" />
                      <p className="text-sm text-white/60 font-body">
                        <span className="font-semibold text-turquoise">Clique pour uploader</span> l'image officielle
                      </p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handlePhotoUpload(e, "official")} 
                  />
                </label>
              </div>

              {/* DISCLAIMER */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-destructive/10 border-2 border-destructive/40 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display text-destructive mb-2">⚠️ RÈGLES DE MODÉRATION</h4>
                    <p className="text-white/80 font-body text-sm leading-relaxed">
                      Upload une <strong className="text-white">image officielle</strong> (Artwork officiel, screenshot).
                    </p>
                    <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                      <p className="text-destructive font-body text-sm font-semibold mb-1">🚫 STRICTEMENT INTERDIT :</p>
                      <ul className="text-white/70 font-body text-xs space-y-1">
                        <li>• Fanarts (respect des artistes)</li>
                        <li>• Images NSFW ou grossières</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep("character")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleSubmitNewCharacter}
                  disabled={!newCharacterName.trim() || !newCharacterImageFile || isCreatingCharacter}
                  className="flex-1 bg-turquoise hover:bg-turquoise/90 text-header-bg font-display disabled:opacity-50"
                >
                  {isCreatingCharacter ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  AJOUTER À LA BASE COMMUNE
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Upload Cosplay Photo */}
          {step === "upload" && selectedCharacter && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h3 className="font-display text-xl text-sakura">📸 TA PHOTO COSPLAY</h3>
                <p className="text-white/60 font-body text-sm">
                  Upload ta meilleure photo en tant que <span className="text-otk font-semibold">{selectedCharacter.name}</span>
                </p>
              </div>

              {/* Character Preview */}
              <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl">
                {selectedCharacter.official_image_url && (
                  <img 
                    src={selectedCharacter.official_image_url} 
                    alt={selectedCharacter.name}
                    className="w-20 h-24 rounded-lg object-cover border-2 border-otk"
                  />
                )}
                <div>
                  <p className="font-display text-white">{selectedCharacter.name}</p>
                  <p className="text-white/60 text-sm font-body">{selectedUniverse?.name}</p>
                </div>
              </div>

              {/* Cosplay Upload */}
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-sakura/50 rounded-xl cursor-pointer bg-white/5 hover:bg-sakura/10 transition-colors">
                {cosplayPhoto ? (
                  <img src={cosplayPhoto} alt="Cosplay Preview" className="h-full object-contain rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-sakura/60" />
                    <p className="text-sm text-white/60 font-body text-center">
                      <span className="font-semibold text-sakura">Clique pour uploader</span><br />
                      ta photo de cosplay
                    </p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handlePhotoUpload(e, "cosplay")} 
                />
              </label>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep("character")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleCosplayUploaded}
                  disabled={!cosplayPhoto}
                  className="flex-1 bg-sakura hover:bg-sakura/90 text-white font-display disabled:opacity-50"
                >
                  PRÉVISUALISER LE RENDU VS
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Preview VS Card */}
          {step === "preview" && selectedCharacter && cosplayPhoto && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h3 className="font-display text-xl text-otk">⚡ PRÉVISUALISATION VS</h3>
                <p className="text-white/60 font-body text-sm">
                  Voici comment ta carte apparaîtra dans ton vestiaire
                </p>
              </div>

              {/* VS Card Preview */}
              <div className="relative aspect-[16/10] bg-header-bg rounded-xl overflow-hidden border-2 border-sakura/50 shadow-[0_0_30px_rgba(255,107,190,0.3)]">
                {/* Diagonal Split Images */}
                <div className="absolute inset-0 flex">
                  {/* Left Side - Cosplay (60%) */}
                  <div className="w-[60%] relative overflow-hidden">
                    <img 
                      src={cosplayPhoto} 
                      alt="Cosplay"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)" }}
                    />
                  </div>
                  
                  {/* Right Side - Original (40%) */}
                  <div className="w-[40%] relative overflow-hidden -ml-[5%]">
                    <img 
                      src={selectedCharacter.official_image_url || ""} 
                      alt={selectedCharacter.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                      style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)" }}
                    />
                    <div 
                      className="absolute inset-0 bg-header-bg/20" 
                      style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)" }} 
                    />
                  </div>
                </div>

                {/* VS Badge */}
                <div className="absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-sakura to-otk rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,107,190,0.5)] animate-pulse">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Character Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-header-bg via-header-bg/90 to-transparent p-4">
                  <p className="font-display text-lg text-white tracking-wider">{selectedCharacter.name}</p>
                  <p className="font-body text-sm text-white/50">{selectedUniverse?.name}</p>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 bg-header-bg/70 backdrop-blur-sm px-3 py-1 rounded text-xs font-display text-sakura">
                  TOI
                </div>
                <div className="absolute top-3 right-3 bg-header-bg/70 backdrop-blur-sm px-3 py-1 rounded text-xs font-display text-otk">
                  ORIGINAL
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep("upload")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Modifier
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={isSavingToVestiaire}
                  className="flex-1 bg-gradient-to-r from-sakura to-otk hover:opacity-90 text-white font-display disabled:opacity-50"
                >
                  {isSavingToVestiaire ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  AJOUTER AU VESTIAIRE
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CosplayAddModal;

export type { CosplayData as CosplayAddData };
