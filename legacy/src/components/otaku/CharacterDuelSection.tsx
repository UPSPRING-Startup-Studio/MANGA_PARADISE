import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, User, PlusCircle, Upload, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  useSearchCharacters, 
  useSearchUniverses,
  useCreateUniverse,
  useCreateCharacter,
  uploadCharacterImage,
  RefCharacterWithUniverse 
} from "@/hooks/useReferenceData";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CharacterDuelSectionProps {
  bestCharacter: RefCharacterWithUniverse | null;
  worstCharacter: RefCharacterWithUniverse | null;
  onSelectBest: (character: RefCharacterWithUniverse) => void;
  onSelectWorst: (character: RefCharacterWithUniverse) => void;
}

const CharacterDuelSection = ({
  bestCharacter,
  worstCharacter,
  onSelectBest,
  onSelectWorst,
}: CharacterDuelSectionProps) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalTarget, setModalTarget] = useState<"best" | "worst">("best");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newUniverseName, setNewUniverseName] = useState("");
  const [universeSearchQuery, setUniverseSearchQuery] = useState("");
  const debouncedUniverseSearch = useDebounce(universeSearchQuery, 300);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [selectedUniverseDisplayName, setSelectedUniverseDisplayName] = useState("");
  const [newCharacterImage, setNewCharacterImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: searchResults = [], isLoading } = useSearchCharacters(debouncedSearch);
  const { data: universeResults = [], isLoading: isLoadingUniverses } = useSearchUniverses(debouncedUniverseSearch);
  
  const createUniverseMutation = useCreateUniverse();
  const createCharacterMutation = useCreateCharacter();

  const openModal = (target: "best" | "worst") => {
    setModalTarget(target);
    setSearchQuery("");
    setShowCreateForm(false);
    resetCreateForm();
    setShowModal(true);
  };

  const resetCreateForm = () => {
    setNewCharacterName("");
    setNewUniverseName("");
    setUniverseSearchQuery("");
    setSelectedUniverseId(null);
    setSelectedUniverseDisplayName("");
    setNewCharacterImage(null);
    setImagePreview(null);
  };

  const handleSelect = (character: RefCharacterWithUniverse) => {
    if (modalTarget === "best") {
      onSelectBest(character);
    } else {
      onSelectWorst(character);
    }
    setShowModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCharacterImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectUniverse = (universe: { id: string; name: string }) => {
    setSelectedUniverseId(universe.id);
    setSelectedUniverseDisplayName(universe.name);
    setUniverseSearchQuery("");
  };

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim()) {
      toast.error("Le nom du personnage est requis");
      return;
    }
    if (!selectedUniverseId && !newUniverseName.trim()) {
      toast.error("Sélectionne ou crée un univers");
      return;
    }
    if (!user) {
      toast.error("Tu dois être connecté");
      return;
    }

    setIsCreating(true);
    try {
      // Get or create universe
      let universeId = selectedUniverseId;
      if (!universeId && newUniverseName.trim()) {
        const newUniverse = await createUniverseMutation.mutateAsync(newUniverseName.trim());
        universeId = newUniverse.id;
      }

      if (!universeId) {
        throw new Error("Impossible de déterminer l'univers");
      }

      // Upload image if provided
      let imageUrl: string | undefined;
      if (newCharacterImage) {
        imageUrl = await uploadCharacterImage(newCharacterImage, user.id);
      }

      // Create character
      const newCharacter = await createCharacterMutation.mutateAsync({
        name: newCharacterName.trim(),
        universeId,
        officialImageUrl: imageUrl,
      });

      // Select the new character
      handleSelect(newCharacter);
      toast.success(`${newCharacter.name} créé et sélectionné !`);
      resetCreateForm();
      setShowCreateForm(false);
    } catch (error: any) {
      console.error("Error creating character:", error);
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="relative">
        <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
          ⚔️ LE DUEL : MON BEST VS MON PIRE
        </h3>

        {/* VS Container */}
        <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden flex">
          
          {/* LEFT SIDE - The Glory (Best Character) */}
          <div
            onClick={() => openModal("best")}
            className="group relative flex-1 cursor-pointer overflow-hidden"
          >
            {/* Background gradient - Sakura/Light */}
            <div className="absolute inset-0 bg-gradient-to-br from-sakura/20 via-pink-100/30 to-amber-100/20 dark:from-sakura/30 dark:via-pink-900/20 dark:to-amber-900/10" />
            
            {/* Sakura petals decoration */}
            <div className="absolute top-4 left-4 text-4xl opacity-30">🌸</div>
            <div className="absolute bottom-20 right-8 text-2xl opacity-20">🌸</div>
            
            {/* Spotlight overlay - intensifies on hover */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,215,0,0.2)_0%,_transparent_70%)] opacity-50 group-hover:opacity-90 group-hover:scale-110 transition-all duration-500" />
            
            {/* Character image or placeholder */}
            {bestCharacter?.official_image_url ? (
              <img
                src={bestCharacter.official_image_url}
                alt={bestCharacter.name}
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-sakura/60">
                  <User className="w-16 h-16" />
                  <Button variant="outline" className="border-sakura/50 text-sakura hover:bg-sakura/10">
                    Choisir
                  </Button>
                </div>
              </div>
            )}
            
            {/* Golden glow overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Title badge */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <p className="font-display text-sm text-amber-300 tracking-wider mb-1">MON GOAT 👑</p>
              {bestCharacter && (
                <p className="text-white font-semibold text-lg truncate">{bestCharacter.name}</p>
              )}
              {bestCharacter?.universe && (
                <p className="text-white/70 text-xs truncate">{bestCharacter.universe.name}</p>
              )}
            </div>
          </div>

          {/* VS Badge - Center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-red-600 rounded-full blur-xl opacity-60 animate-pulse" />
              
              {/* Badge */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-4 border-white/30 flex items-center justify-center shadow-2xl">
                <span className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 via-white to-red-500 bg-clip-text text-transparent">
                  VS
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - The Shadow (Worst Character) */}
          <div
            onClick={() => openModal("worst")}
            className="group relative flex-1 cursor-pointer overflow-hidden"
          >
            {/* Background gradient - Dark/Red */}
            <div className="absolute inset-0 bg-gradient-to-bl from-gray-900/90 via-red-950/50 to-gray-800/90" />
            
            {/* Skull decoration */}
            <div className="absolute top-4 right-4 text-4xl opacity-20">💀</div>
            <div className="absolute bottom-20 left-8 text-2xl opacity-10">💀</div>
            
            {/* Character image or placeholder */}
            {worstCharacter?.official_image_url ? (
              <img
                src={worstCharacter.official_image_url}
                alt={worstCharacter.name}
                className="absolute inset-0 w-full h-full object-cover object-top filter grayscale blur-[2px] group-hover:grayscale-0 group-hover:blur-0 transition-all duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-red-500/60">
                  <User className="w-16 h-16" />
                  <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                    Choisir
                  </Button>
                </div>
              </div>
            )}
            
            {/* Dark fog overlay - lifts on hover */}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-500" />
            
            {/* Red reveal glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Title badge */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="font-display text-sm text-red-400 tracking-wider mb-1">MA HANTISE 💀</p>
              {worstCharacter && (
                <p className="text-white font-semibold text-lg truncate">{worstCharacter.name}</p>
              )}
              {worstCharacter?.universe && (
                <p className="text-white/70 text-xs truncate">{worstCharacter.universe.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {modalTarget === "best" ? (
                <>👑 Choisir mon GOAT</>
              ) : (
                <>💀 Choisir ma Hantise</>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {!showCreateForm ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un personnage..."
                  className="pl-10"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 min-h-[200px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {debouncedSearch.length < 2 
                      ? "Tape au moins 2 caractères pour rechercher"
                      : "Aucun personnage trouvé"
                    }
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {searchResults.map((character) => (
                      <motion.button
                        key={character.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={() => handleSelect(character)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                          modalTarget === "best"
                            ? "border-sakura/30 hover:bg-sakura/10 hover:border-sakura/50"
                            : "border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {character.official_image_url ? (
                            <img
                              src={character.official_image_url}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-foreground">{character.name}</p>
                          {character.universe && (
                            <p className="text-sm text-muted-foreground">{character.universe.name}</p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Create button - always visible */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setShowCreateForm(true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  ✨ Créer une nouvelle fiche personnage
                </Button>
              </div>
            </>
          ) : (
            /* Create Character Form */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetCreateForm();
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la recherche
              </button>
              
              {/* Character Name */}
              <div className="space-y-2">
                <Label htmlFor="character-name">Nom du Personnage</Label>
                <Input
                  id="character-name"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  placeholder="Ex: Naruto Uzumaki"
                  className="bg-muted"
                />
              </div>

              {/* Universe Selection */}
              <div className="space-y-2">
                <Label>Univers / Œuvre</Label>
                {selectedUniverseId ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="flex-1 text-sm">{selectedUniverseDisplayName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUniverseId(null);
                        setSelectedUniverseDisplayName("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={universeSearchQuery}
                        onChange={(e) => setUniverseSearchQuery(e.target.value)}
                        placeholder="Rechercher un univers..."
                        className="pl-10 bg-muted"
                      />
                    </div>
                    
                    {/* Universe search results */}
                    {universeSearchQuery.length >= 2 && (
                      <div className="max-h-32 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                        {isLoadingUniverses ? (
                          <div className="flex justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : universeResults.length > 0 ? (
                          universeResults.map((universe) => (
                            <button
                              key={universe.id}
                              onClick={() => handleSelectUniverse(universe)}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm"
                            >
                              {universe.name}
                            </button>
                          ))
                        ) : null}
                        
                        {/* Always show create new universe option */}
                        <button
                          onClick={() => {
                            setNewUniverseName(universeSearchQuery);
                            setSelectedUniverseId(null);
                            setSelectedUniverseDisplayName(`(Nouveau) ${universeSearchQuery}`);
                            // We'll create it on submit
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm text-sakura"
                        >
                          <PlusCircle className="w-3 h-3 inline mr-1" />
                          Créer "{universeSearchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label>Avatar (Format Carré)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-24 h-24 border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-sakura ${
                    imagePreview ? 'border-green-500/50' : 'border-border'
                  }`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">Ajouter</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleCreateCharacter}
                disabled={isCreating || !newCharacterName.trim() || (!selectedUniverseId && !newUniverseName.trim())}
                className={`w-full ${
                  modalTarget === "best"
                    ? "bg-sakura hover:bg-sakura/90"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <PlusCircle className="w-4 h-4 mr-2" />
                )}
                CRÉER ET SÉLECTIONNER
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CharacterDuelSection;
