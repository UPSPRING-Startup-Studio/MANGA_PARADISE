import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  User, Palette, Shield, Sparkles, Lock, 
  Globe, Save, AlertTriangle, Trash2, Drama, 
  Code, ShieldCheck, Megaphone, Gamepad2
} from "lucide-react";
import SettingsPublicProfile from "@/pages/SettingsPublicProfile";
import SettingsSocials from "@/pages/SettingsSocials";
import SettingsCreative from "@/pages/SettingsCreative";
import SettingsCosplayer from "@/pages/SettingsCosplayer";
import SettingsOtaku from "@/pages/SettingsOtaku";
import SettingsGamer from "@/pages/SettingsGamer";
import AvatarUpload from "@/components/settings/AvatarUpload";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useUnsavedChanges, useRegisterDirty } from "@/contexts/UnsavedChangesContext";

type SettingsTab = "general" | "socials" | "public" | "otaku" | "gamer" | "creative" | "cosplayer" | "privacy" | "dev";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial tab from URL or default to "general"
  const urlTab = searchParams.get("tab") as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    urlTab && ["general", "socials", "public", "otaku", "gamer", "creative", "cosplayer", "privacy", "dev"].includes(urlTab)
      ? urlTab
      : "general"
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");

  // Form states for General tab
  const [civility, setCivility] = useState("neutral");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  
  // Privacy states
  const [profileVisibility, setProfileVisibility] = useState("members");
  const [imageRights, setImageRights] = useState(false);
  const [allowEventCheckin, setAllowEventCheckin] = useState(true);

  // Snapshot for dirty detection (general + privacy inline tabs only)
  const [savedSnapshot, setSavedSnapshot] = useState<{
    civility: string; firstName: string; lastName: string;
    birthDate: string; pseudo: string; phone: string; city: string;
    profileVisibility: string; imageRights: boolean; allowEventCheckin: boolean;
  } | null>(null);

  const currentFormValues = useMemo(() => ({
    civility, firstName, lastName, birthDate, pseudo, phone, city,
    profileVisibility, imageRights, allowEventCheckin,
  }), [civility, firstName, lastName, birthDate, pseudo, phone, city,
      profileVisibility, imageRights, allowEventCheckin]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  // Only guard on inline tabs (general / privacy) – sub-components guard themselves
  const isInlineTab = activeTab === "general" || activeTab === "privacy";

  // Ref-backed save handler so we can pass it stably to useRegisterDirty
  // before handleSave is defined (which happens after the early returns below)
  const handleSaveRef = useRef<() => Promise<void>>();

  // Context hook for guarding cross-tab navigation
  const { requestNavigation } = useUnsavedChanges();

  // Register dirty state with the global guard (inline tabs only)
  useRegisterDirty(
    "settings-general",
    isInlineTab && isDirty,
    async () => { await handleSaveRef.current?.(); }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Sync activeTab with URL and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    // Update URL when tab changes (without page reload)
    const currentTab = searchParams.get("tab");
    if (currentTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);
  
  // Listen for URL changes (e.g., back/forward navigation)
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as SettingsTab | null;
    if (tabFromUrl && tabFromUrl !== activeTab && 
        ["general", "socials", "public", "otaku", "gamer", "creative", "cosplayer", "privacy", "dev"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      const snapshot = {
        pseudo: profile.display_name || profile.username || "",
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        civility: profile.gender || "neutral",
        birthDate: profile.birth_date || "",
        phone: profile.phone || "",
        city: profile.city || "",
        profileVisibility: profile.profile_visibility || "members",
        imageRights: false,
        allowEventCheckin: profile.allow_event_checkin ?? true,
      };
      setPseudo(snapshot.pseudo);
      setFirstName(snapshot.firstName);
      setLastName(snapshot.lastName);
      setCivility(snapshot.civility);
      setBirthDate(snapshot.birthDate);
      setPhone(snapshot.phone);
      setCity(snapshot.city);
      setProfileVisibility(snapshot.profileVisibility);
      setAllowEventCheckin(snapshot.allowEventCheckin);
      // Set baseline for dirty detection (only on first load)
      setSavedSnapshot((prev) => prev ?? snapshot);
    }
  }, [profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-header-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sakura border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Si le profil n'existe pas, afficher un message d'erreur avec option de création
  if (!profile) {
    return (
      <div className="min-h-screen bg-header-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sakura to-turquoise flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl text-white mb-4">Profil non trouvé</h2>
          <p className="text-white/60 font-body mb-6">
            Votre compte utilisateur existe mais votre profil n'a pas encore été créé. 
            Cela peut arriver si l'inscription n'a pas été finalisée.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-sakura hover:bg-sakura/80 text-white font-display"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "general" as const, label: "Mes informations personnelles", icon: User },
    { id: "otaku" as const, label: "Mon Profil Otaku", icon: Sparkles },
    { id: "cosplayer" as const, label: "Mon Profil Cosplayer", icon: Drama },
    { id: "creative" as const, label: "Mon Profil Créatif", icon: Palette },
    { id: "gamer" as const, label: "Mon Profil Gamer", icon: Gamepad2 },
    { id: "socials" as const, label: "Réseaux Sociaux", icon: Globe },
    { id: "public" as const, label: "Ma Page Publique", icon: Megaphone },
    { id: "privacy" as const, label: "Confidentialité", icon: Shield },
    { id: "dev" as const, label: "Développement", icon: Code },
  ];

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const result = await updateProfile({
        display_name: pseudo,
        username: pseudo.toLowerCase().replace(/\s+/g, '_'),
        first_name: firstName || null,
        last_name: lastName || null,
        gender: civility,
        birth_date: birthDate || null,
        phone: phone || null,
        city: city || null,
        profile_visibility: profileVisibility,
        allow_event_checkin: allowEventCheckin,
      });

      if (result.error) {
        const errorMessage = result.error.message || JSON.stringify(result.error);
        console.error("Supabase error details:", result.error);
        setSaveStatus("error");
        alert(`Erreur Supabase: ${errorMessage}`);
        throw result.error;
      }
      // Update snapshot so the form is no longer dirty
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      toast.success("Modifications enregistrées !");
    } catch (error: unknown) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setSaveStatus("error");
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Keep the ref in sync so useRegisterDirty can call it
  handleSaveRef.current = handleSave;

  const handleDiscard = () => {
    if (!savedSnapshot) return;
    setCivility(savedSnapshot.civility);
    setFirstName(savedSnapshot.firstName);
    setLastName(savedSnapshot.lastName);
    setBirthDate(savedSnapshot.birthDate);
    setPseudo(savedSnapshot.pseudo);
    setPhone(savedSnapshot.phone);
    setCity(savedSnapshot.city);
    setProfileVisibility(savedSnapshot.profileVisibility);
    setImageRights(savedSnapshot.imageRights);
    setAllowEventCheckin(savedSnapshot.allowEventCheckin);
    setSaveStatus("clean");
  };

  return (
    <div className="min-h-screen bg-header-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl text-white tracking-wide mb-8"
        >
          PARAMÈTRES DU COMPTE
        </motion.h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-72 flex-shrink-0"
          >
            <div className="bg-card rounded-[16px] p-4 shadow-xl">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => requestNavigation(() => setActiveTab(tab.id))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body text-left transition-all ${
                      activeTab === tab.id
                        ? "bg-sakura/10 text-sakura border-l-4 border-sakura"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="flex-1">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.aside>

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0"
          >
            <AnimatePresence mode="wait">
              {/* Tab: Infos Générales */}
              {activeTab === "general" && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
                >
                  <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    INFOS GÉNÉRALES
                  </h2>

                  {/* Avatar Upload */}
                  <div className="mb-8 flex justify-center">
                    <AvatarUpload
                      currentAvatarUrl={profile.avatar_url}
                      userId={user.id}
                      onAvatarUpdate={(url) => {
                        updateProfile({ avatar_url: url });
                      }}
                    />
                  </div>

                  {/* Section Identité */}
                  <div className="mb-8">
                    <h3 className="font-display text-lg text-foreground tracking-wide mb-4">Identité</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="font-body text-sm text-muted-foreground mb-3 block">Civilité</Label>
                        <RadioGroup value={civility} onValueChange={setCivility} className="flex flex-wrap gap-4">
                          {[
                            { value: "mr", label: "Monsieur" },
                            { value: "mme", label: "Madame" },
                            { value: "neutral", label: "Neutre" },
                            { value: "other", label: "Préciser" },
                          ].map((option) => (
                            <div key={option.value} className="flex items-center gap-2">
                              <RadioGroupItem 
                                value={option.value} 
                                id={option.value}
                                className="border-sakura text-sakura"
                              />
                              <Label htmlFor={option.value} className="font-body text-sm cursor-pointer">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="lastName" className="font-body text-sm text-muted-foreground">Nom</Label>
                          <Input 
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Votre nom"
                            className="mt-1 bg-muted border-border focus:border-sakura"
                          />
                        </div>
                        <div>
                          <Label htmlFor="firstName" className="font-body text-sm text-muted-foreground">Prénom</Label>
                          <Input 
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Votre prénom"
                            className="mt-1 bg-muted border-border focus:border-sakura"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="birthDate" className="font-body text-sm text-muted-foreground">Date de naissance</Label>
                          <Input 
                            id="birthDate"
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="mt-1 bg-muted border-border focus:border-sakura"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pseudo" className="font-body text-sm text-muted-foreground">Pseudo</Label>
                          <Input 
                            id="pseudo"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            placeholder="Votre pseudo"
                            className="mt-1 bg-muted border-border focus:border-sakura"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Contact */}
                  <div className="mb-8">
                    <h3 className="font-display text-lg text-foreground tracking-wide mb-4">Contact</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="font-body text-sm text-muted-foreground flex items-center gap-2">
                          Email
                          <Lock className="w-3 h-3" />
                        </Label>
                        <Input 
                          id="email"
                          value={user.email || ""}
                          disabled
                          className="mt-1 bg-muted/50 border-border text-muted-foreground cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone" className="font-body text-sm text-muted-foreground">Téléphone</Label>
                          <Input 
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+33 6 00 00 00 00"
                            className="mt-1 bg-muted border-border focus:border-sakura"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city" className="font-body text-sm text-muted-foreground">Ville de résidence</Label>
                          <Input 
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Votre ville"
                            className="mt-1 bg-muted border-border focus:border-sakura"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto bg-sakura hover:bg-sakura/90 text-white font-display tracking-wide"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Enregistrement..." : "ENREGISTRER LES MODIFICATIONS"}
                  </Button>
                </motion.div>
              )}

              {/* Tab: Réseaux Sociaux */}
              {activeTab === "socials" && (
                <motion.div
                  key="socials"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsSocials />
                </motion.div>
              )}

              {/* Tab: Ma Page Publique */}
              {activeTab === "public" && (
                <motion.div
                  key="public"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsPublicProfile />
                </motion.div>
              )}

              {/* Tab: Mon Profil Otaku */}
              {activeTab === "otaku" && (
                <motion.div
                  key="otaku"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsOtaku />
                </motion.div>
              )}

              {/* Tab: Profil Gamer */}
              {activeTab === "gamer" && (
                <motion.div
                  key="gamer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsGamer />
                </motion.div>
              )}

              {/* Tab: Profil Créatif */}
              {activeTab === "creative" && (
                <motion.div
                  key="creative"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsCreative />
                </motion.div>
              )}

              {/* Tab: Profil Cosplayer */}
              {activeTab === "cosplayer" && (
                <motion.div
                  key="cosplayer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsCosplayer />
                </motion.div>
              )}

              {/* Tab: Confidentialité & RGPD */}
              {activeTab === "privacy" && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
                >
                  <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    CONFIDENTIALITÉ & RGPD
                  </h2>

                  <div className="space-y-8">
                    {/* Visibilité du Profil */}
                    <div>
                      <Label className="font-body text-sm text-muted-foreground mb-4 block">
                        Visibilité du Profil
                      </Label>
                      <RadioGroup value={profileVisibility} onValueChange={setProfileVisibility} className="space-y-3">
                        {[
                          { value: "public", label: "Public (Annuaire)", desc: "Visible par tous les visiteurs" },
                          { value: "members", label: "Membres Uniquement", desc: "Visible uniquement par les membres connectés" },
                          { value: "private", label: "Privé", desc: "Visible uniquement par vous" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                              profileVisibility === option.value
                                ? "bg-sakura/10 border-2 border-sakura"
                                : "bg-muted border-2 border-transparent hover:border-sakura/30"
                            }`}
                          >
                            <RadioGroupItem 
                              value={option.value} 
                              className="border-sakura text-sakura mt-1"
                            />
                            <div>
                              <span className="font-body font-medium">{option.label}</span>
                              <p className="font-body text-sm text-muted-foreground">{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Droit à l'image */}
                    <div>
                      <label className="flex items-start gap-4 p-4 bg-muted rounded-xl cursor-pointer">
                        <Checkbox 
                          checked={imageRights}
                          onCheckedChange={(checked) => setImageRights(checked as boolean)}
                          className="border-turquoise data-[state=checked]:bg-turquoise data-[state=checked]:text-header-bg mt-1"
                        />
                        <div>
                          <span className="font-body font-medium">Droit à l'image</span>
                          <p className="font-body text-sm text-muted-foreground">
                            J'autorise le partage de mes créations et photos sur les réseaux sociaux de l'association
                          </p>
                        </div>
                      </label>
                     </div>

                     {/* Check-in aux événements */}
                     <div>
                       <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                         <div className="space-y-0.5">
                           <Label className="font-body font-medium">Check-in aux événements</Label>
                           <p className="font-body text-sm text-muted-foreground">
                             En décochant cette option, vous ne pourrez pas valider votre présence physique et ne recevrez pas les bonus d'XP/OTK associés.
                           </p>
                         </div>
                         <Switch
                           checked={allowEventCheckin}
                           onCheckedChange={setAllowEventCheckin}
                           className="data-[state=checked]:bg-sakura"
                         />
                       </div>
                     </div>

                     {/* Zone de Danger */}
                    <div className="p-6 bg-destructive/5 border-2 border-destructive/20 rounded-xl">
                      <h3 className="font-display text-lg text-destructive flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5" />
                        ZONE DE DANGER
                      </h3>
                      <p className="font-body text-sm text-muted-foreground mb-4">
                        Conformément au RGPD, tu peux demander la suppression de tes données personnelles. 
                        Cette action est irréversible et entraînera la suppression de ton compte, de tes OTK Coins 
                        et de tout ton historique.
                      </p>
                      <Button 
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-white font-display tracking-wide"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        DEMANDER LA SUPPRESSION / DÉMISSION
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto mt-8 bg-sakura hover:bg-sakura/90 text-white font-display tracking-wide"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Enregistrement..." : "ENREGISTRER LES MODIFICATIONS"}
                  </Button>
                </motion.div>
              )}

              {/* Tab: Développement */}
              {activeTab === "dev" && (
                <motion.div
                  key="dev"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
                >
                  <h2 className="font-display text-2xl text-sakura tracking-wide mb-6 flex items-center gap-2">
                    <Code className="w-6 h-6" />
                    OUTILS DE DÉVELOPPEMENT
                  </h2>

                  <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl mb-6">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Cette section est réservée au développement et aux tests. 
                      Ces options ne devraient pas être disponibles en production.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Admin Status Display */}
                    <div className="p-6 bg-muted rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-display text-lg text-foreground">Mode Administrateur</h3>
                            <p className="font-body text-sm text-muted-foreground">
                              {isAdmin 
                                ? "Tu as accès au Dashboard Admin" 
                                : "Ton rôle n'est pas configuré comme admin dans la base de données"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-medium ${isAdmin ? "text-green-500" : "text-muted-foreground"}`}>
                            {isAdmin ? "ACTIF" : "INACTIF"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick links */}
                    {isAdmin && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <p className="text-sm text-green-400 mb-3">✅ Tu es admin ! Accède au dashboard :</p>
                        <Button 
                          onClick={() => navigate("/admin")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Ouvrir le Dashboard Admin
                        </Button>
                      </div>
                    )}

                    {/* Manual Admin Activation Help */}
                    {!isAdmin && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <p className="text-sm text-amber-400 mb-2">
                          🔧 Pour activer le mode admin, exécute cette requête dans Supabase SQL Editor :
                        </p>
                        <code className="text-xs bg-black/30 p-2 rounded block overflow-x-auto">
                          UPDATE profiles SET role = 'admin', role_function = 'admin' WHERE id = '{user?.id}';
                        </code>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
      
      <Footer />

      {/* Sticky save bar – only visible on inline tabs (general / privacy) */}
      {isInlineTab && (
        <StickySaveBar
          status={saveStatus !== "clean" ? saveStatus : isDirty ? "dirty" : "clean"}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};

export default Settings;
