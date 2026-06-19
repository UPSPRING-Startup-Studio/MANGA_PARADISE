import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Search, Plus, Upload, AlertTriangle, 
  BookOpen, Tv, Sparkles, Image as ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  title: string;
  image: string;
}

export interface MediaData {
  id: string;
  title: string;
  image: string;
  isNew: boolean;
}

interface MediaAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: MediaData) => void;
  type: "manga" | "anime" | "game";
}

// Simulated database
const MANGA_DATABASE: MediaItem[] = [
  { id: "m1", title: "One Piece", image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=450&fit=crop" },
  { id: "m2", title: "Naruto", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=450&fit=crop" },
  { id: "m3", title: "Berserk", image: "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=300&h=450&fit=crop" },
  { id: "m4", title: "Attack on Titan", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=450&fit=crop" },
  { id: "m5", title: "Dragon Ball", image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=300&h=450&fit=crop" },
];

const ANIME_DATABASE: MediaItem[] = [
  { id: "a1", title: "Demon Slayer", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=200&fit=crop" },
  { id: "a2", title: "Jujutsu Kaisen", image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=200&fit=crop" },
  { id: "a3", title: "Frieren", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=200&fit=crop" },
  { id: "a4", title: "My Hero Academia", image: "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=200&fit=crop" },
  { id: "a5", title: "Spy x Family", image: "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=400&h=200&fit=crop" },
];

const GAME_DATABASE: MediaItem[] = [
  { id: "g1", title: "Final Fantasy XVI", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=300&h=400&fit=crop" },
  { id: "g2", title: "Elden Ring", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop" },
  { id: "g3", title: "Genshin Impact", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop" },
  { id: "g4", title: "Persona 5", image: "https://images.unsplash.com/photo-1493711662062-fa541f7f77c4?w=300&h=400&fit=crop" },
  { id: "g5", title: "Monster Hunter", image: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300&h=400&fit=crop" },
];

const MediaAddModal = ({ isOpen, onClose, onAdd, type }: MediaAddModalProps) => {
  const [step, setStep] = useState<"search" | "create">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Create form states
  const [newTitle, setNewTitle] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const database = type === "manga" ? MANGA_DATABASE : type === "anime" ? ANIME_DATABASE : GAME_DATABASE;
  const isManga = type === "manga";
  const isGame = type === "game";
  const typeLabel = isManga ? "Manga" : isGame ? "Jeu" : "Anime";

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = database.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectExisting = (item: MediaItem) => {
    onAdd({
      id: item.id,
      title: item.title,
      image: item.image,
      isNew: false
    });
    handleClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!imagePreview) {
      toast.error(isManga ? "La jaquette est requise" : "Le logo est requis");
      return;
    }

    onAdd({
      id: `new-${Date.now()}`,
      title: newTitle,
      image: imagePreview,
      isNew: true
    });
    toast.success(`${typeLabel} ajouté à la base commune !`);
    handleClose();
  };

  const handleClose = () => {
    setStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setNewTitle("");
    setImagePreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden border border-border/50"
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-sakura/20 to-turquoise/20 border-b border-border/30">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            {isManga ? (
              <BookOpen className="w-8 h-8 text-sakura" />
            ) : isGame ? (
              <ImageIcon className="w-8 h-8 text-turquoise" />
            ) : (
              <Tv className="w-8 h-8 text-turquoise" />
            )}
            <div>
              <h2 className="font-display text-xl text-foreground tracking-wide">
                {isManga ? "AJOUTER UN MANGA" : isGame ? "AJOUTER UN JEU" : "AJOUTER UN ANIME"}
              </h2>
              <p className="text-sm text-muted-foreground font-body">
                {isManga ? "Enrichis ta Mangathèque" : isGame ? "Enrichis ta Ludothèque" : "Complète ta Watchlist"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={`Rechercher ${isManga ? "un manga" : isGame ? "un jeu" : "un anime"}...`}
                    className="pl-10 bg-muted border-border focus:border-sakura h-12"
                    autoFocus
                  />
                </div>

                {/* Search results */}
                {showResults && (
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-border/30 rounded-lg p-2 bg-muted/30">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectExisting(item)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sakura/10 transition-colors text-left"
                        >
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className={`${isManga || isGame ? "w-10 h-14" : "w-16 h-10"} object-cover rounded`}
                          />
                          <span className="font-body text-foreground">{item.title}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="font-body text-sm mb-3">Aucun résultat trouvé</p>
                        <Button
                          onClick={() => {
                            setStep("create");
                            setNewTitle(searchQuery);
                          }}
                          variant="outline"
                          className="border-turquoise text-turquoise hover:bg-turquoise/10"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Créer une nouvelle fiche
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Create new button when no search */}
                {!showResults && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground mb-3 font-body">
                      {isManga ? "L'œuvre n'est pas dans la base ?" : isGame ? "Le jeu n'est pas référencé ?" : "L'anime n'est pas référencé ?"}
                    </p>
                    <Button
                      onClick={() => setStep("create")}
                      variant="outline"
                      className="border-turquoise text-turquoise hover:bg-turquoise/10"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Créer une nouvelle fiche
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {step === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Back button */}
                <button
                  onClick={() => setStep("search")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  ← Retour à la recherche
                </button>

                {/* Title input */}
                <div>
                  <Label className="font-body text-sm text-muted-foreground">
                    Titre {isManga ? "du Manga" : isGame ? "du Jeu" : "de l'Anime"}
                  </Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isManga ? "Ex: Chainsaw Man" : isGame ? "Ex: Elden Ring" : "Ex: Solo Leveling"}
                    className="mt-1 bg-muted border-border focus:border-sakura"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <Label className="font-body text-sm text-muted-foreground mb-2 block">
                    {isManga ? "Jaquette (Couverture)" : isGame ? "Jaquette du Jeu" : "Logo Officiel"}
                  </Label>
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-sakura ${
                      imagePreview ? "border-sakura/50" : "border-border"
                    } ${(isManga || isGame) ? "aspect-[2/3] max-w-[150px]" : "aspect-[16/9] max-w-[280px]"}`}
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs text-center font-body">
                          {isManga ? "Ajouter la couverture" : isGame ? "Ajouter la jaquette" : "Ajouter le logo (PNG transparent)"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Disclaimer */}
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-body">
                      <p className="text-orange-400 font-semibold mb-1">Attention</p>
                      <p className="text-orange-300/80">
                        {isManga 
                          ? "Merci d'uploader uniquement la couverture officielle du Tome 1 ou l'affiche promotionnelle."
                          : isGame
                          ? "Merci d'uploader uniquement la jaquette officielle ou la cover art du jeu."
                          : "Merci d'uploader uniquement le LOGO de l'anime (format PNG transparent idéalement)."
                        }
                      </p>
                      <p className="text-orange-300/60 mt-2 text-xs">
                        🚫 Interdit : Fanarts, images NSFW, screenshots non officiels.
                        <br />Toute fiche non conforme sera supprimée par la modération.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  onClick={handleCreate}
                  className="w-full bg-otk hover:bg-otk/90 text-header-bg font-display tracking-wide h-12"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  AJOUTER À LA BASE COMMUNE
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MediaAddModal;
