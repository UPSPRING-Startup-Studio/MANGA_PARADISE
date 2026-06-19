import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drama, Save, Star, Users, Scissors } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

interface EditCosplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    cosplay_years_experience?: string | null;
    cosplay_specialties?: string[] | null;
    cosplay_collaboration_prefs?: string[] | null;
  };
}

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

export const EditCosplayModal = ({ isOpen, onClose, profile }: EditCosplayModalProps) => {
  const updateProfile = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  
  const [yearsExperience, setYearsExperience] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [collaborationPrefs, setCollaborationPrefs] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setYearsExperience(profile.cosplay_years_experience || "");
      setSpecialties(profile.cosplay_specialties || []);
      setCollaborationPrefs(profile.cosplay_collaboration_prefs || []);
    }
  }, [profile, isOpen]);

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        cosplay_years_experience: yearsExperience || null,
        cosplay_specialties: specialties,
        cosplay_collaboration_prefs: collaborationPrefs,
      } as any);
      toast.success("Profil cosplayer mis à jour !");
      onClose();
    } catch (error) {
      console.error("Error saving cosplay profile:", error);
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
            <Drama className="w-5 h-5" />
            Modifier mon Profil Cosplayer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Niveau d'Expérience */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 block flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              Niveau d'Expérience
            </Label>
            <Select value={yearsExperience} onValueChange={setYearsExperience}>
              <SelectTrigger className="bg-muted">
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
          </div>

          {/* Spécialités */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
              <Scissors className="w-4 h-4 text-sakura" />
              Mes Spécialités
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {specialtyOptions.map((specialty) => (
                <button
                  key={specialty.value}
                  type="button"
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

          {/* Collaborations */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
              <Users className="w-4 h-4 text-turquoise" />
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

// Helper function to get experience label
export const getExperienceLabel = (value: string | null | undefined): string => {
  if (!value) return "";
  const option = experienceOptions.find(o => o.value === value);
  return option?.label || value;
};

// Helper function to get specialty label
export const getSpecialtyLabel = (value: string): string => {
  const option = specialtyOptions.find(o => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
};

// Helper function to get collab pref label
export const getCollabPrefLabel = (value: string): string => {
  const option = collaborationPrefOptions.find(o => o.value === value);
  return option?.label || value;
};

export default EditCosplayModal;
