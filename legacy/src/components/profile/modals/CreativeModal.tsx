import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Palette, Save, Briefcase, Wrench, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

interface PrivacySettings {
  show_city?: boolean;
  show_otaku?: boolean;
  show_cosplay?: boolean;
  show_creator?: boolean;
  show_achievements?: boolean;
  show_library?: boolean;
}

interface CreativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    is_creator_profile_active?: boolean | null;
    creative_commission_status?: string | null;
    creative_collaboration_types?: string[] | null;
    creative_software_skills?: string[] | null;
    creative_hardware_equipment?: string | null;
    privacy_settings?: PrivacySettings | null;
  };
}

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

export const CreativeModal = ({ isOpen, onClose, profile }: CreativeModalProps) => {
  const updateProfile = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  
  const [isPublic, setIsPublic] = useState(true);
  const [isCreatorActive, setIsCreatorActive] = useState(false);
  const [commissionStatus, setCommissionStatus] = useState("closed");
  const [collaborationTypes, setCollaborationTypes] = useState<string[]>([]);
  const [softwareSkills, setSoftwareSkills] = useState<string[]>([]);
  const [newSoftware, setNewSoftware] = useState("");
  const [hardwareEquipment, setHardwareEquipment] = useState("");

  useEffect(() => {
    if (profile && isOpen) {
      setIsCreatorActive(profile.is_creator_profile_active === true);
      setCommissionStatus(profile.creative_commission_status || "closed");
      setCollaborationTypes(profile.creative_collaboration_types || []);
      setSoftwareSkills(profile.creative_software_skills || []);
      setHardwareEquipment(profile.creative_hardware_equipment || "");
      setIsPublic(profile.privacy_settings?.show_creator !== false);
    }
  }, [profile, isOpen]);

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
    try {
      const updatedPrivacy = {
        ...profile.privacy_settings,
        show_creator: isPublic,
      };
      
      await updateProfile.mutateAsync({
        is_creator_profile_active: isCreatorActive,
        creative_commission_status: commissionStatus,
        creative_collaboration_types: collaborationTypes,
        creative_software_skills: softwareSkills,
        creative_hardware_equipment: hardwareEquipment || null,
        privacy_settings: updatedPrivacy,
      } as any);
      toast.success("Profil créatif mis à jour !");
      onClose();
    } catch (error) {
      console.error("Error saving creative profile:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-xl text-sakura flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Modifier mon Profil Créatif
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Eye className="w-5 h-5 text-turquoise" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-body text-sm font-medium">
                  Rendre cette section publique
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? "Visible par tous les visiteurs" : "Visible uniquement par vous"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="data-[state=checked]:bg-turquoise"
            />
          </div>

          {/* Creator Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-sakura/10 border border-sakura/30">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-sakura" />
              <div>
                <p className="font-body text-sm font-medium">
                  Activer le Profil Créateur
                </p>
                <p className="text-xs text-muted-foreground">
                  Affiche l'onglet Créatif sur ton profil
                </p>
              </div>
            </div>
            <Switch
              checked={isCreatorActive}
              onCheckedChange={setIsCreatorActive}
              className="data-[state=checked]:bg-sakura"
            />
          </div>

          {/* Statut des Commandes */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sakura" />
              Statut des Commandes
            </Label>
            <RadioGroup 
              value={commissionStatus} 
              onValueChange={setCommissionStatus}
              className="flex flex-wrap gap-3"
            >
              {[
                { value: "open", label: "✅ Ouvert", color: "bg-green-500/10 border-green-500" },
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

          {/* Logiciels */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block flex items-center gap-2">
              <Wrench className="w-4 h-4 text-turquoise" />
              Logiciels maîtrisés
            </Label>
            
            {/* Quick add common software */}
            <div className="flex flex-wrap gap-2 mb-3">
              {commonSoftware.filter(s => !softwareSkills.includes(s)).slice(0, 6).map((software) => (
                <button
                  key={software}
                  type="button"
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
                    type="button"
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
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSoftware())}
                placeholder="Ajouter un logiciel..."
                className="bg-muted"
              />
              <Button 
                type="button"
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
              placeholder="Ex: Canon EOS R5, Wacom Cintiq 22..."
              className="bg-muted resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-background mt-auto">
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

// Helper function to get commission status info
export const getCommissionStatusInfo = (status: string | null | undefined): { label: string; color: string } => {
  switch (status) {
    case "open":
      return { label: "Ouvert aux commandes", color: "bg-green-500/20 text-green-500 border-green-500/30" };
    case "waitlist":
      return { label: "Liste d'attente", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" };
    case "closed":
    default:
      return { label: "Fermé", color: "bg-red-500/20 text-red-500 border-red-500/30" };
  }
};

// Helper function to get collab type label
export const getCollabTypeLabel = (value: string): string => {
  const option = collaborationTypeOptions.find(o => o.value === value);
  return option?.label || value;
};

export default CreativeModal;
