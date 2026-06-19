import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Globe, Eye, Save, 
  MapPin, Sparkles, Drama, Palette, Trophy, BookOpen, Gamepad2
} from "lucide-react";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useRegisterDirty } from "@/contexts/UnsavedChangesContext";

interface PrivacySettings {
  show_city: boolean;
  show_otaku: boolean;
  show_cosplay: boolean;
  show_creator: boolean;
  show_gamer: boolean;
  show_achievements: boolean;
  show_library: boolean;
}

const SettingsPublicProfile = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");
  const [isPublic, setIsPublic] = useState(true);
  const [username, setUsername] = useState("");
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    show_city: true,
    show_otaku: true,
    show_cosplay: true,
    show_creator: true,
    show_gamer: true,
    show_achievements: true,
    show_library: true,
  });

  // ── Dirty state detection ──────────────────────────────────────────────────
  type PublicSnapshot = { isPublic: boolean; username: string; privacySettings: PrivacySettings };
  const [savedSnapshot, setSavedSnapshot] = useState<PublicSnapshot | null>(null);
  const handleSaveRef = useRef<() => Promise<void>>();

  const currentFormValues = useMemo<PublicSnapshot>(() => ({
    isPublic, username, privacySettings,
  }), [isPublic, username, privacySettings]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  useRegisterDirty("settings-public", isDirty, async () => { await handleSaveRef.current?.(); });

  useEffect(() => {
    if (profile) {
      const pub = profile.profile_visibility === "public";
      const uname = profile.username || "";
      const privacy = (profile as any).privacy_settings as PrivacySettings | null;
      const pSettings: PrivacySettings = {
        show_city: privacy?.show_city ?? true,
        show_otaku: privacy?.show_otaku ?? true,
        show_cosplay: privacy?.show_cosplay ?? true,
        show_creator: privacy?.show_creator ?? true,
        show_gamer: privacy?.show_gamer ?? true,
        show_achievements: privacy?.show_achievements ?? true,
        show_library: privacy?.show_library ?? true,
      };

      setIsPublic(pub);
      setUsername(uname);
      setPrivacySettings(pSettings);

      // Capture baseline for dirty detection (first load only)
      setSavedSnapshot((prev) => prev ?? { isPublic: pub, username: uname, privacySettings: pSettings });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const result = await updateProfile({
        username: username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        profile_visibility: isPublic ? "public" : "private",
        privacy_settings: privacySettings,
      } as any);

      if (result.error) {
        setSaveStatus("error");
        throw result.error;
      }
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      toast.success("Modifications enregistrées !");
    } catch (error) {
      console.error("Error saving profile:", error);
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
    setIsPublic(savedSnapshot.isPublic);
    setUsername(savedSnapshot.username);
    setPrivacySettings(savedSnapshot.privacySettings);
    setSaveStatus("clean");
  };

  const handleViewProfile = () => {
    if (username) {
      window.open(`/u/${username}`, '_blank');
    }
  };

  const togglePrivacy = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const privacyOptions = [
    { 
      key: "show_city" as const, 
      label: "Afficher ma ville de résidence", 
      icon: MapPin,
      description: "Ex: Nice, Paris, Lyon..." 
    },
    { 
      key: "show_otaku" as const, 
      label: "Afficher mon Profil Otaku", 
      icon: Sparkles,
      description: "Classe, Bio, Mangathèque" 
    },
    { 
      key: "show_cosplay" as const, 
      label: "Afficher mon Vestiaire Cosplay", 
      icon: Drama,
      description: "Tes incarnations" 
    },
    { 
      key: "show_creator" as const, 
      label: "Afficher mon Profil Créatif", 
      icon: Palette,
      description: "Si activé" 
    },
    { 
      key: "show_gamer" as const, 
      label: "Afficher mon Profil Gamer", 
      icon: Gamepad2,
      description: "Jeux et plateformes" 
    },
    { 
      key: "show_achievements" as const, 
      label: "Afficher mes Succès & Badges", 
      icon: Trophy,
      description: "Récompenses de concours" 
    },
    { 
      key: "show_library" as const, 
      label: "Afficher ma Bibliothèque", 
      icon: BookOpen,
      description: "Mangas et Animes favoris" 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
    >
      <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
        <Globe className="w-6 h-6" />
        MA PAGE PUBLIQUE
      </h2>

      {/* Section A: En-tête & Prévisualisation */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div>
            <Label className="font-display text-base text-foreground">Activer mon profil public</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Rend ta page visible sur internet
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>

        <div className="space-y-2">
          <Label className="font-body text-sm text-muted-foreground">URL de ton profil</Label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-muted rounded-lg overflow-hidden">
              <span className="px-3 py-2 text-muted-foreground text-sm bg-muted/50 border-r border-border">
                {window.location.origin}/u/
              </span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0"
                placeholder="ton-pseudo"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleViewProfile}
              disabled={!username}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Voir
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Caractères autorisés : lettres, chiffres, underscores
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Section C: Confidentialité */}
      <div className="space-y-6 mb-8">
        <h3 className="font-display text-lg text-foreground tracking-wide flex items-center gap-2">
          🔒 Confidentialité - Ce que je montre
        </h3>
        <p className="text-sm text-muted-foreground -mt-4">
          Choisis précisément quelles informations sont visibles sur ta page publique.
        </p>

        <div className="space-y-3">
          {privacyOptions.map((option) => (
            <div 
              key={option.key}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sakura/10 flex items-center justify-center">
                  <option.icon className="w-5 h-5 text-sakura" />
                </div>
                <div>
                  <Label className="font-body text-sm text-foreground cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <Switch
                checked={privacySettings[option.key]}
                onCheckedChange={() => togglePrivacy(option.key)}
              />
            </div>
          ))}
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ <strong>Données toujours privées :</strong> Ton email, numéro de téléphone et nom de famille ne sont jamais affichés publiquement.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4 pt-4">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-sakura hover:bg-sakura/90 text-white font-display"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>

      <StickySaveBar
        status={saveStatus !== "clean" ? saveStatus : isDirty ? "dirty" : "clean"}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </motion.div>
  );
};

export default SettingsPublicProfile;
