import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Link, Save, Instagram, Globe, Coffee, Video, Heart
} from "lucide-react";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useRegisterDirty } from "@/contexts/UnsavedChangesContext";

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitch?: string;
  twitter?: string;
  discord?: string;
  artstation?: string;
  website?: string;
  kofi?: string;
  patreon?: string;
  tipeee?: string;
}

const SettingsSocials = () => {
  const { profile, updateProfile } = useProfile();
  
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");
  
  // Social links
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [artstation, setArtstation] = useState("");
  const [website, setWebsite] = useState("");
  
  // Support links
  const [kofi, setKofi] = useState("");
  const [patreon, setPatreon] = useState("");
  const [tipeee, setTipeee] = useState("");

  // ── Dirty state detection ──────────────────────────────────────────────────
  type SocialsSnapshot = {
    instagram: string; tiktok: string; youtube: string; twitch: string;
    twitter: string; discord: string; artstation: string; website: string;
    kofi: string; patreon: string; tipeee: string;
  };
  const [savedSnapshot, setSavedSnapshot] = useState<SocialsSnapshot | null>(null);
  const handleSaveRef = useRef<() => Promise<void>>();

  const currentFormValues = useMemo<SocialsSnapshot>(() => ({
    instagram, tiktok, youtube, twitch, twitter, discord, artstation, website, kofi, patreon, tipeee,
  }), [instagram, tiktok, youtube, twitch, twitter, discord, artstation, website, kofi, patreon, tipeee]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  useRegisterDirty("settings-socials", isDirty, async () => { await handleSaveRef.current?.(); });

  useEffect(() => {
    if (profile) {
      const links = (profile.social_links as SocialLinks) || {};
      const snap: SocialsSnapshot = {
        instagram: links.instagram || "",
        tiktok: links.tiktok || "",
        youtube: links.youtube || "",
        twitch: links.twitch || "",
        twitter: links.twitter || "",
        discord: links.discord || "",
        artstation: links.artstation || "",
        website: links.website || "",
        kofi: links.kofi || "",
        patreon: links.patreon || "",
        tipeee: links.tipeee || "",
      };
      setInstagram(snap.instagram);
      setTiktok(snap.tiktok);
      setYoutube(snap.youtube);
      setTwitch(snap.twitch);
      setTwitter(snap.twitter);
      setDiscord(snap.discord);
      setArtstation(snap.artstation);
      setWebsite(snap.website);
      setKofi(snap.kofi);
      setPatreon(snap.patreon);
      setTipeee(snap.tipeee);
      // Capture baseline for dirty detection (first load only)
      setSavedSnapshot((prev) => prev ?? snap);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const socialLinks: SocialLinks = {};
      if (instagram) socialLinks.instagram = instagram;
      if (tiktok) socialLinks.tiktok = tiktok;
      if (youtube) socialLinks.youtube = youtube;
      if (twitch) socialLinks.twitch = twitch;
      if (twitter) socialLinks.twitter = twitter;
      if (discord) socialLinks.discord = discord;
      if (artstation) socialLinks.artstation = artstation;
      if (website) socialLinks.website = website;
      if (kofi) socialLinks.kofi = kofi;
      if (patreon) socialLinks.patreon = patreon;
      if (tipeee) socialLinks.tipeee = tipeee;

      const result = await updateProfile({ social_links: socialLinks } as any);

      if (result.error) {
        setSaveStatus("error");
        throw result.error;
      }
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      toast.success("Réseaux sociaux enregistrés !");
    } catch (error) {
      console.error("Error saving social links:", error);
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
    setInstagram(savedSnapshot.instagram);
    setTiktok(savedSnapshot.tiktok);
    setYoutube(savedSnapshot.youtube);
    setTwitch(savedSnapshot.twitch);
    setTwitter(savedSnapshot.twitter);
    setDiscord(savedSnapshot.discord);
    setArtstation(savedSnapshot.artstation);
    setWebsite(savedSnapshot.website);
    setKofi(savedSnapshot.kofi);
    setPatreon(savedSnapshot.patreon);
    setTipeee(savedSnapshot.tipeee);
    setSaveStatus("clean");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
    >
      <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
        <Link className="w-6 h-6" />
        RÉSEAUX SOCIAUX
      </h2>

      <p className="text-sm text-muted-foreground mb-6">
        Ces liens seront affichés sur ta page publique et permettront à la communauté de te suivre.
      </p>

      {/* Section: Réseaux Sociaux */}
      <div className="space-y-6 mb-8">
        <h3 className="font-display text-lg text-foreground tracking-wide flex items-center gap-2">
          📱 Mes Réseaux
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Instagram className="w-4 h-4" />
              Instagram
            </Label>
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="ton_pseudo"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              TikTok
            </Label>
            <Input
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="@ton_pseudo"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Video className="w-4 h-4" />
              YouTube
            </Label>
            <Input
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="@ta_chaine"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              Twitch
            </Label>
            <Input
              value={twitch}
              onChange={(e) => setTwitch(e.target.value)}
              placeholder="ta_chaine"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </Label>
            <Input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="ton_pseudo"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </Label>
            <Input
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="ton_pseudo#1234"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.3 18.0c-.1-.1-.2-.2-.2-.3.7-7.3 4.4-13.5 4.6-13.8.1-.1.2-.2.3-.2 1.0-.3 8.0-1.8 13.8-.3.1.0.2.1.2.2.1.3 2.9 7.5 1.2 14.4.0.1-.1.2-.2.3-.4.2-3.2 1.9-7.8 1.9-1.2.0-2.5-.1-3.9-.4-.8.4-2.0 1.0-3.0 1.2-.8.2-1.5.1-2.0-.2-.6-.4-.9-1.0-1.0-1.8.0-.0-.1-.1-.2-.1-1.3-.5-1.8-1.0-1.9-1.0zM11.9 7.1c-2.3-.0-4.2 1.9-4.2 4.2s1.9 4.2 4.2 4.2c2.3.0 4.2-1.9 4.2-4.2s-1.9-4.2-4.2-4.2zM11.9 14.1c-1.6.0-2.8-1.3-2.8-2.8s1.3-2.8 2.8-2.8c1.6.0 2.8 1.3 2.8 2.8s-1.3 2.8-2.8 2.8zM17.2 6.1c-.6.0-1.0.5-1.0 1.0s.5 1.0 1.0 1.0c.6.0 1.0-.5 1.0-1.0s-.5-1.0-1.0-1.0z"/>
              </svg>
              ArtStation
            </Label>
            <Input
              value={artstation}
              onChange={(e) => setArtstation(e.target.value)}
              placeholder="ton_pseudo"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              Site Web Perso
            </Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://tonsite.com"
              className="bg-muted/50"
            />
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Section: Support */}
      <div className="space-y-6 mb-8">
        <h3 className="font-display text-lg text-foreground tracking-wide flex items-center gap-2">
          <Heart className="w-5 h-5 text-sakura" />
          Me Soutenir
        </h3>
        <p className="text-sm text-muted-foreground -mt-4">
          Liens vers tes plateformes de soutien financier.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Coffee className="w-4 h-4" />
              Ko-fi
            </Label>
            <Input
              value={kofi}
              onChange={(e) => setKofi(e.target.value)}
              placeholder="ton_pseudo"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.3 8.1c-.3-.2-.6-.2-.9-.1l-2.2.9c-.2.1-.4.3-.4.6v3.9l-1 .4V5.7c0-.3-.2-.5-.4-.6l-2.6-.9c-.3-.1-.6 0-.8.2-.2.2-.2.5-.2.8v5.7l-.9.3V4.8c0-.3-.2-.6-.5-.7L10 3.2c-.3-.1-.6 0-.8.2-.2.2-.2.5-.2.8v7.7l-.9.3V6c0-.3-.2-.5-.5-.6l-2.6-.9c-.2-.1-.4-.1-.6 0s-.3.2-.4.4c0 .1-.1.2-.1.3v8.6L1 16c-.1 0-.1.1-.2.1-.3.2-.5.5-.5.9v2.3c0 .5.3.9.7 1.1l6.3 2.5c.3.1.6.1.9 0l14-5.8c.4-.2.7-.5.7-1v-7.1c.1-.3-.2-.6-.6-.9zm-8.4 11l-6-2.4V9.4l6 2.4v7.3zm.7-8L9 8.8V4.4l5.6 2.3v4.4zm6.3 5.3l-5.6 2.3v-7.3l5.6-2.3v7.3z"/>
              </svg>
              Patreon
            </Label>
            <Input
              value={patreon}
              onChange={(e) => setPatreon(e.target.value)}
              placeholder="ton_pseudo"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              🇫🇷 Tipeee
            </Label>
            <Input
              value={tipeee}
              onChange={(e) => setTipeee(e.target.value)}
              placeholder="ton_pseudo"
              className="bg-muted/50"
            />
          </div>
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

export default SettingsSocials;
