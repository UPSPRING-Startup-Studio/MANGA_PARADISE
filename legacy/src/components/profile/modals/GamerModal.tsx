import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { toast } from "sonner";
import { Gamepad2, Save, Copy, Check } from "lucide-react";

interface GamerIds {
  steam?: string;
  psn?: string;
  xbox?: string;
  nintendo?: string;
  riot?: string;
  battlenet?: string;
  discord?: string;
}

interface PrivacySettings {
  show_gamer?: boolean;
  [key: string]: boolean | undefined;
}

interface GamerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    is_gamer_mode_active?: boolean;
    gaming_platforms?: string[];
    gamer_ids?: GamerIds;
    gamer_play_style?: string;
    privacy_settings?: PrivacySettings;
  } | null;
}

const platformOptions = [
  { value: "pc", label: "PC", emoji: "🖥️" },
  { value: "ps5", label: "PlayStation", emoji: "🎮" },
  { value: "xbox", label: "Xbox", emoji: "🎮" },
  { value: "switch", label: "Switch", emoji: "🕹️" },
  { value: "mobile", label: "Mobile", emoji: "📱" },
  { value: "retro", label: "Rétro", emoji: "👾" },
];

export const gamertTagPlatforms = [
  { key: "steam", label: "Steam", icon: "🎮", placeholder: "SteamID ou pseudo" },
  { key: "psn", label: "PlayStation Network", icon: "🔵", placeholder: "PSN ID" },
  { key: "xbox", label: "Xbox Live", icon: "🟢", placeholder: "Gamertag Xbox" },
  { key: "nintendo", label: "Nintendo ID", icon: "🔴", placeholder: "Code Ami Nintendo" },
  { key: "riot", label: "Riot Games", icon: "⚔️", placeholder: "Pseudo#TAG" },
  { key: "battlenet", label: "Battle.net", icon: "💙", placeholder: "Pseudo#1234" },
  { key: "discord", label: "Discord", icon: "💬", placeholder: "pseudo" },
];

const playStyleOptions = [
  { value: "casual", label: "🎲 Détente / Casual" },
  { value: "tryhard", label: "🔥 Compétitif / Tryhard" },
  { value: "completionist", label: "🏆 Complétionniste" },
  { value: "explorer", label: "🗺️ Explorateur" },
  { value: "social", label: "👥 Social / Coop" },
  { value: "speedrunner", label: "⚡ Speedrunner" },
];

export const getPlayStyleLabel = (value: string): string => {
  const style = playStyleOptions.find(s => s.value === value);
  return style?.label || value;
};

export const GamerModal = ({ isOpen, onClose, profile }: GamerModalProps) => {
  const updateProfile = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  
  const [isPublic, setIsPublic] = useState(true);
  const [isGamerModeActive, setIsGamerModeActive] = useState(false);
  const [gamingPlatforms, setGamingPlatforms] = useState<string[]>([]);
  const [gamerIds, setGamerIds] = useState<GamerIds>({});
  const [playStyle, setPlayStyle] = useState("");

  useEffect(() => {
    if (profile && isOpen) {
      const privacySettings = profile.privacy_settings || {};
      setIsPublic(privacySettings.show_gamer !== false);
      setIsGamerModeActive(profile.is_gamer_mode_active || false);
      setGamingPlatforms(profile.gaming_platforms || []);
      setGamerIds(profile.gamer_ids || {});
      setPlayStyle(profile.gamer_play_style || "");
    }
  }, [profile, isOpen]);

  const togglePlatform = (platform: string) => {
    if (gamingPlatforms.includes(platform)) {
      setGamingPlatforms(gamingPlatforms.filter(p => p !== platform));
    } else {
      setGamingPlatforms([...gamingPlatforms, platform]);
    }
  };

  const updateGamerId = (key: string, value: string) => {
    setGamerIds({ ...gamerIds, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentPrivacy = profile?.privacy_settings || {};
      const updatedPrivacy = { ...currentPrivacy, show_gamer: isPublic };
      
      await updateProfile.mutateAsync({
        is_gamer_mode_active: isGamerModeActive,
        gaming_platforms: gamingPlatforms,
        gamer_ids: gamerIds as Record<string, string>,
        gamer_play_style: playStyle || null,
        privacy_settings: updatedPrivacy as Record<string, boolean>,
      });
      
      toast.success("Profil Gamer mis à jour !");
      onClose();
    } catch (error) {
      console.error("Error updating gamer profile:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-turquoise flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Modifier mon Profil Gamer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div>
              <p className="font-display text-foreground text-sm">Section publique</p>
              <p className="text-xs text-muted-foreground">Visible sur ta page publique</p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="data-[state=checked]:bg-turquoise"
            />
          </div>

          {/* Activation */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div>
              <p className="font-display text-foreground text-sm">Activer mon Profil Gamer</p>
              <p className="text-xs text-muted-foreground">Affiche l'onglet Gamer sur ta page</p>
            </div>
            <Switch
              checked={isGamerModeActive}
              onCheckedChange={setIsGamerModeActive}
              className="data-[state=checked]:bg-turquoise"
            />
          </div>

          {/* Platforms */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block">
              Mes Plateformes
            </Label>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((platform) => (
                <label 
                  key={platform.value}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-sm ${
                    gamingPlatforms.includes(platform.value)
                      ? "bg-turquoise/20 border-turquoise"
                      : "bg-muted border-transparent hover:border-turquoise/30"
                  }`}
                >
                  <Checkbox 
                    checked={gamingPlatforms.includes(platform.value)}
                    onCheckedChange={() => togglePlatform(platform.value)}
                    className="border-turquoise data-[state=checked]:bg-turquoise w-4 h-4"
                  />
                  <span>{platform.emoji}</span>
                  <span>{platform.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gamertags */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-3 block">
              Mes Gamertags
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gamertTagPlatforms.map((platform) => (
                <div key={platform.key}>
                  <Label className="font-body text-xs text-muted-foreground flex items-center gap-1">
                    <span>{platform.icon}</span>
                    {platform.label}
                  </Label>
                  <Input
                    value={gamerIds[platform.key as keyof GamerIds] || ""}
                    onChange={(e) => updateGamerId(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="mt-1 bg-muted border-border focus:border-turquoise text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Play Style */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 block">
              Mon style de jeu
            </Label>
            <Select value={playStyle} onValueChange={setPlayStyle}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Choisis ton style..." />
              </SelectTrigger>
              <SelectContent>
                {playStyleOptions.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-turquoise hover:bg-turquoise/90 text-header-bg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for copying gamertags
export const CopyableGamertag = ({ platform, value }: { platform: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const platformInfo = gamertTagPlatforms.find(p => p.key === platform);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value || !platformInfo) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
      <span>{platformInfo.icon}</span>
      <span className="font-body text-sm flex-1">{value}</span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-muted-foreground/20 rounded transition-colors"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};
