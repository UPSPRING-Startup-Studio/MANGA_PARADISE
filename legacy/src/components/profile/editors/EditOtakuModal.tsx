import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Save, Gamepad2, X } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

interface EditOtakuModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    gaming_platforms?: string[] | null;
    favorite_genres?: string[] | null;
  };
}

const platformOptions = [
  { value: "pc", label: "PC", emoji: "🖥️" },
  { value: "ps5", label: "PlayStation", emoji: "🎮" },
  { value: "xbox", label: "Xbox", emoji: "🎮" },
  { value: "switch", label: "Switch", emoji: "🕹️" },
  { value: "mobile", label: "Mobile", emoji: "📱" },
  { value: "retro", label: "Rétro", emoji: "👾" },
];

const genreOptions = [
  "Shonen", "Shojo", "Seinen", "Josei", "Mecha", 
  "Isekai", "Slice of Life", "Romance", "Horror", "Sports"
];

export const EditOtakuModal = ({ isOpen, onClose, profile }: EditOtakuModalProps) => {
  const updateProfile = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  
  const [gamingPlatforms, setGamingPlatforms] = useState<string[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState("");

  useEffect(() => {
    if (profile) {
      setGamingPlatforms(profile.gaming_platforms || []);
      setFavoriteGenres(profile.favorite_genres || []);
    }
  }, [profile, isOpen]);

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const addGenre = () => {
    if (newGenre.trim() && !favoriteGenres.includes(newGenre.trim())) {
      setFavoriteGenres([...favoriteGenres, newGenre.trim()]);
      setNewGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        gaming_platforms: gamingPlatforms,
        favorite_genres: favoriteGenres,
      } as any);
      toast.success("Profil otaku mis à jour !");
      onClose();
    } catch (error) {
      console.error("Error saving otaku profile:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-sakura flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Modifier mon Profil Otaku
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plateformes Gaming */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-turquoise" />
              Mes Plateformes
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {platformOptions.map((platform) => (
                <label 
                  key={platform.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
                    gamingPlatforms.includes(platform.value)
                      ? "bg-turquoise/20 border-turquoise"
                      : "bg-muted border-transparent hover:border-turquoise/30"
                  }`}
                >
                  <Checkbox 
                    checked={gamingPlatforms.includes(platform.value)}
                    onCheckedChange={() => toggleArrayItem(gamingPlatforms, setGamingPlatforms, platform.value)}
                    className="border-turquoise data-[state=checked]:bg-turquoise"
                  />
                  <span className="text-lg">{platform.emoji}</span>
                  <span className="font-body text-sm">{platform.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Genres favoris */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block">
              ❤️ Genres favoris
            </Label>

            {/* Quick add common genres */}
            <div className="flex flex-wrap gap-2 mb-3">
              {genreOptions.filter(g => !favoriteGenres.includes(g)).map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setFavoriteGenres([...favoriteGenres, genre])}
                  className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-sakura/20 hover:text-sakura transition-colors"
                >
                  + {genre}
                </button>
              ))}
            </div>

            {/* Added genres */}
            <div className="flex flex-wrap gap-2 mb-3">
              {favoriteGenres.map((genre) => (
                <span 
                  key={genre}
                  className="flex items-center gap-1 px-3 py-1 bg-sakura/20 text-sakura rounded-full text-sm"
                >
                  {genre}
                  <button 
                    type="button"
                    onClick={() => removeGenre(genre)}
                    className="hover:bg-sakura/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2">
              <Input
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGenre())}
                placeholder="Ajouter un genre..."
                className="bg-muted"
              />
              <Button 
                type="button"
                onClick={addGenre}
                variant="outline"
                size="sm"
                className="border-sakura text-sakura hover:bg-sakura/10"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-sakura hover:bg-sakura/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Enregistrement..." : "Sauvegarder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get platform info
export const getPlatformInfo = (value: string): { label: string; emoji: string } => {
  const option = platformOptions.find(o => o.value === value);
  return option || { label: value, emoji: "🎮" };
};

export default EditOtakuModal;
