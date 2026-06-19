import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Instagram, Globe, MessageCircle, Link2, Coffee } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

interface SocialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    discord?: string;
    twitter?: string;
    website?: string;
    kofi?: string;
  };
}

export const SocialsModal = ({ isOpen, onClose, socialLinks }: SocialsModalProps) => {
  const updateProfile = useUpdateProfile();
  const [saving, setSaving] = useState(false);
  
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [discord, setDiscord] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [kofi, setKofi] = useState("");

  useEffect(() => {
    if (socialLinks && isOpen) {
      setInstagram(socialLinks.instagram || "");
      setTiktok(socialLinks.tiktok || "");
      setDiscord(socialLinks.discord || "");
      setTwitter(socialLinks.twitter || "");
      setWebsite(socialLinks.website || "");
      setKofi(socialLinks.kofi || "");
    }
  }, [socialLinks, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const links = {
        instagram: instagram || undefined,
        tiktok: tiktok || undefined,
        discord: discord || undefined,
        twitter: twitter || undefined,
        website: website || undefined,
        kofi: kofi || undefined,
      };
      
      // Remove undefined keys
      Object.keys(links).forEach(key => {
        if (links[key as keyof typeof links] === undefined) {
          delete links[key as keyof typeof links];
        }
      });
      
      await updateProfile.mutateAsync({
        social_links: links,
      } as any);
      toast.success("Réseaux sociaux mis à jour !");
      onClose();
    } catch (error) {
      console.error("Error saving social links:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-xl text-sakura flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Modifier mes Réseaux Sociaux
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          {/* Instagram */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">@</span>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="ton_pseudo"
                className="bg-muted"
              />
            </div>
          </div>

          {/* TikTok */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              TikTok
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">@</span>
              <Input
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="ton_pseudo"
                className="bg-muted"
              />
            </div>
          </div>

          {/* Discord */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-500" />
              Discord
            </Label>
            <Input
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="pseudo#1234 ou @pseudo"
              className="bg-muted"
            />
          </div>

          {/* Twitter/X */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">@</span>
              <Input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="ton_pseudo"
                className="bg-muted"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-turquoise" />
              Site Web / Portfolio
            </Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://ton-site.com"
              className="bg-muted"
            />
          </div>

          {/* Ko-fi */}
          <div>
            <Label className="font-body text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-500" />
              Ko-fi
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">ko-fi.com/</span>
              <Input
                value={kofi}
                onChange={(e) => setKofi(e.target.value)}
                placeholder="ton_pseudo"
                className="bg-muted"
              />
            </div>
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

export default SocialsModal;
