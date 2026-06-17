import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Gamepad2, Save, Plus, X, Crosshair, Smartphone, HeartCrack, Angry
} from "lucide-react";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useRegisterDirty } from "@/contexts/UnsavedChangesContext";
import { useOtakuLibrary, useAddOtakuLibraryItem } from "@/hooks/useOtakuCollections";
import { useAuth } from "@/contexts/AuthContext";
import MediaAddModal, { MediaData } from "@/components/settings/MediaAddModal";

interface GamerIds {
  steam?: string;
  psn?: string;
  xbox?: string;
  nintendo?: string;
  riot?: string;
  battlenet?: string;
  discord?: string;
}

interface GameItem {
  id: string;
  title: string;
  coverImage: string;
}

const platformOptions = [
  { value: "pc", label: "PC", emoji: "🖥️" },
  { value: "ps5", label: "PlayStation", emoji: "🎮" },
  { value: "xbox", label: "Xbox", emoji: "🎮" },
  { value: "switch", label: "Switch", emoji: "🕹️" },
  { value: "mobile", label: "Mobile", emoji: "📱" },
  { value: "retro", label: "Rétro", emoji: "👾" },
];

const gamertTagPlatforms = [
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

const favoriteGenreOptions = [
  { value: "fps", label: "FPS (Pan Pan)" },
  { value: "rpg", label: "RPG / Aventure" },
  { value: "fighting", label: "Combat / Versus" },
  { value: "simulation", label: "Simulation / Gestion" },
  { value: "moba", label: "MOBA / Stratégie" },
  { value: "battle_royale", label: "Battle Royale" },
];

const mobileViceOptions = [
  { value: "gacha", label: "Gacha (Genshin, etc.)" },
  { value: "strategy", label: "Stratégie (Clash, TFT)" },
  { value: "puzzle", label: "Puzzle / Casual" },
  { value: "rhythm", label: "Rhythm Game" },
  { value: "none", label: "Je ne joue pas sur mobile" },
];

const friendshipBreakerOptions = [
  { value: "mario_kart", label: "Mario Kart 🍄" },
  { value: "among_us", label: "Among Us 🔪" },
  { value: "uno", label: "Uno 🃏" },
  { value: "lol", label: "League of Legends 🧂" },
  { value: "overcooked", label: "Overcooked 🍳" },
  { value: "smash", label: "Smash Bros 👊" },
];

const rageTriggerOptions = [
  { value: "lag", label: "Le Lag / Ping" },
  { value: "campers", label: "Les Campers / Tryhards" },
  { value: "teammates", label: "Mes coéquipiers (Noobs)" },
  { value: "bosses", label: "Les Boss impossibles (Souls)" },
  { value: "p2w", label: "Le Pay-to-Win" },
  { value: "save_lost", label: "Perdre ma sauvegarde" },
];

const SettingsGamer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile, updateProfile } = useProfile();
  const { data: library } = useOtakuLibrary(user?.id);
  const addLibraryItem = useAddOtakuLibraryItem();
  
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");
  
  // Gamer profile state
  const [isGamerModeActive, setIsGamerModeActive] = useState(false);
  const [gamingPlatforms, setGamingPlatforms] = useState<string[]>([]);
  const [gamerIds, setGamerIds] = useState<GamerIds>({});
  const [playStyle, setPlayStyle] = useState("");
  
  // ADN Gamer state
  const [favoriteGenre, setFavoriteGenre] = useState("");
  const [mobileVice, setMobileVice] = useState("");
  const [friendshipBreaker, setFriendshipBreaker] = useState("");
  const [rageTrigger, setRageTrigger] = useState("");

  // ── Dirty state detection ──────────────────────────────────────────────────
  type GamerSnapshot = {
    isGamerModeActive: boolean;
    gamingPlatforms: string[];
    gamerIds: GamerIds;
    playStyle: string;
    favoriteGenre: string;
    mobileVice: string;
    friendshipBreaker: string;
    rageTrigger: string;
  };
  const [savedSnapshot, setSavedSnapshot] = useState<GamerSnapshot | null>(null);
  const handleSaveRef = useRef<() => Promise<void>>();

  const currentFormValues = useMemo<GamerSnapshot>(() => ({
    isGamerModeActive, gamingPlatforms, gamerIds, playStyle,
    favoriteGenre, mobileVice, friendshipBreaker, rageTrigger,
  }), [isGamerModeActive, gamingPlatforms, gamerIds, playStyle,
      favoriteGenre, mobileVice, friendshipBreaker, rageTrigger]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  useRegisterDirty("settings-gamer", isDirty, async () => { await handleSaveRef.current?.(); });
  
  // Game library
  const [showGameModal, setShowGameModal] = useState(false);
  const games = library?.filter((item) => item.type === "GAME") || [];

  useEffect(() => {
    if (profile) {
      const extProfile = profile as any;
      const gamerMode = extProfile.is_gamer_mode_active || false;
      const platforms = extProfile.gaming_platforms || [];
      const ids = extProfile.gamer_ids || {};
      const style = extProfile.gamer_play_style || "";
      const genre = extProfile.gamer_favorite_genre || "";
      const mobile = extProfile.gamer_mobile_vice || "";
      const friendship = extProfile.gamer_friendship_breaker || "";
      const rage = extProfile.gamer_rage_trigger || "";

      setIsGamerModeActive(gamerMode);
      setGamingPlatforms(platforms);
      setGamerIds(ids);
      setPlayStyle(style);
      setFavoriteGenre(genre);
      setMobileVice(mobile);
      setFriendshipBreaker(friendship);
      setRageTrigger(rage);

      // Capture baseline for dirty detection (first load only)
      setSavedSnapshot((prev) => prev ?? {
        isGamerModeActive: gamerMode,
        gamingPlatforms: platforms,
        gamerIds: ids,
        playStyle: style,
        favoriteGenre: genre,
        mobileVice: mobile,
        friendshipBreaker: friendship,
        rageTrigger: rage,
      });
    }
  }, [profile]);

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

  const handleAddGame = async (data: MediaData) => {
    if (!user?.id) return;
    
    try {
      await addLibraryItem.mutateAsync({
        user_id: user.id,
        type: "GAME",
        title: data.title,
        cover_url: data.image,
      });
      setShowGameModal(false);
      toast.success(`${data.title} ajouté à ta Ludothèque !`);
    } catch (error) {
      console.error("Error adding game:", error);
      toast.error("Erreur lors de l'ajout du jeu");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const result = await updateProfile({
        is_gamer_mode_active: isGamerModeActive,
        gaming_platforms: gamingPlatforms,
        gamer_ids: gamerIds,
        gamer_play_style: playStyle || null,
        gamer_favorite_genre: favoriteGenre || null,
        gamer_mobile_vice: mobileVice || null,
        gamer_friendship_breaker: friendshipBreaker || null,
        gamer_rage_trigger: rageTrigger || null,
      } as any);

      if (result.error) {
        setSaveStatus("error");
        throw result.error;
      }
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Profil Gamer enregistré !");
    } catch (error) {
      console.error("Error saving gamer profile:", error);
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
    setIsGamerModeActive(savedSnapshot.isGamerModeActive);
    setGamingPlatforms(savedSnapshot.gamingPlatforms);
    setGamerIds(savedSnapshot.gamerIds);
    setPlayStyle(savedSnapshot.playStyle);
    setFavoriteGenre(savedSnapshot.favoriteGenre);
    setMobileVice(savedSnapshot.mobileVice);
    setFriendshipBreaker(savedSnapshot.friendshipBreaker);
    setRageTrigger(savedSnapshot.rageTrigger);
    setSaveStatus("clean");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
    >
      <h2 className="font-display text-2xl text-turquoise tracking-wide mb-6 flex items-center gap-2">
        <Gamepad2 className="w-6 h-6" />
        MON PROFIL GAMER
      </h2>

      <div className="space-y-8">
        {/* Activation Switch */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div>
            <p className="font-display text-foreground">Activer mon Profil Gamer</p>
            <p className="text-sm text-muted-foreground">Affiche ton profil gamer sur ta page publique</p>
          </div>
          <Switch
            checked={isGamerModeActive}
            onCheckedChange={setIsGamerModeActive}
            className="data-[state=checked]:bg-turquoise"
          />
        </div>

        {/* Platforms Section */}
        <div className="p-6 bg-muted/30 rounded-xl space-y-4">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            🎮 MES PLATEFORMES
          </h3>

          <div className="flex flex-wrap gap-3">
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
                  onCheckedChange={() => togglePlatform(platform.value)}
                  className="border-turquoise data-[state=checked]:bg-turquoise"
                />
                <span className="text-lg">{platform.emoji}</span>
                <span className="font-body text-sm">{platform.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gamertags Section */}
        <div className="p-6 bg-muted/30 rounded-xl space-y-4">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            🏷️ MES GAMERTAGS
          </h3>
          <p className="text-sm text-muted-foreground">
            Ajoute tes pseudos pour que tes Nakamas puissent te retrouver en jeu !
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gamertTagPlatforms.map((platform) => (
              <div key={platform.key} className="relative">
                <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                  <span>{platform.icon}</span>
                  {platform.label}
                </Label>
                <Input
                  value={gamerIds[platform.key as keyof GamerIds] || ""}
                  onChange={(e) => updateGamerId(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className="mt-1 bg-muted border-border focus:border-turquoise"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Play Style Section */}
        <div className="p-6 bg-muted/30 rounded-xl space-y-4">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            🎯 MON STYLE DE JEU
          </h3>

          <Select value={playStyle} onValueChange={setPlayStyle}>
            <SelectTrigger className="w-full md:w-96 bg-muted border-border">
              <SelectValue placeholder="Choisis ton style de jeu..." />
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

        {/* ADN Gamer Section */}
        <div className="p-6 bg-muted/30 rounded-xl space-y-6">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            🧬 MON ADN GAMER
          </h3>
          <p className="text-sm text-muted-foreground">
            Révèle ta vraie nature de joueur avec ces questions fun !
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloc 1: Le Style */}
            <div className="space-y-2">
              <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-turquoise" />
                Ton genre de prédilection ?
              </Label>
              <Select value={favoriteGenre} onValueChange={setFavoriteGenre}>
                <SelectTrigger className="w-full bg-muted border-border">
                  <SelectValue placeholder="Choisis ton genre favori..." />
                </SelectTrigger>
                <SelectContent>
                  {favoriteGenreOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bloc 2: Le Vice Mobile */}
            <div className="space-y-2">
              <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-turquoise" />
                Ton vice sur mobile ?
              </Label>
              <Select value={mobileVice} onValueChange={setMobileVice}>
                <SelectTrigger className="w-full bg-muted border-border">
                  <SelectValue placeholder="Choisis ton vice mobile..." />
                </SelectTrigger>
                <SelectContent>
                  {mobileViceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bloc 3: Amitiés Brisées */}
            <div className="space-y-2">
              <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <HeartCrack className="w-4 h-4 text-turquoise" />
                Le jeu qui brise tes amitiés ?
              </Label>
              <Select value={friendshipBreaker} onValueChange={setFriendshipBreaker}>
                <SelectTrigger className="w-full bg-muted border-border">
                  <SelectValue placeholder="Choisis le jeu destructeur..." />
                </SelectTrigger>
                <SelectContent>
                  {friendshipBreakerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bloc 4: La Rage */}
            <div className="space-y-2">
              <Label className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <Angry className="w-4 h-4 text-turquoise" />
                Ton pire générateur de rage ?
              </Label>
              <Select value={rageTrigger} onValueChange={setRageTrigger}>
                <SelectTrigger className="w-full bg-muted border-border">
                  <SelectValue placeholder="Choisis ta source de rage..." />
                </SelectTrigger>
                <SelectContent>
                  {rageTriggerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Game Library Section */}
        <div className="p-6 bg-muted/30 rounded-xl space-y-4">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            🎮 MA LUDOTHÈQUE
          </h3>
          <p className="text-sm text-muted-foreground">
            Tes jeux favoris ({games.length} titres)
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGameModal(true)}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-turquoise/50 hover:border-turquoise flex flex-col items-center justify-center gap-2 bg-turquoise/5 hover:bg-turquoise/10 transition-colors"
            >
              <Plus className="w-8 h-8 text-turquoise" />
              <span className="text-xs font-body text-turquoise">Ajouter</span>
            </motion.button>

            {/* Game Cards */}
            <AnimatePresence>
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden group"
                >
                  <img
                    src={game.cover_url}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-xs font-body truncate w-full">
                      {game.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Game Add Modal */}
      <MediaAddModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        onAdd={handleAddGame}
        type="game"
      />

      <Button 
        onClick={handleSave}
        disabled={saving}
        className="w-full md:w-auto mt-8 bg-turquoise hover:bg-turquoise/90 text-header-bg font-display tracking-wide"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Enregistrement..." : "ENREGISTRER LES MODIFICATIONS"}
      </Button>

      <StickySaveBar
        status={saveStatus !== "clean" ? saveStatus : isDirty ? "dirty" : "clean"}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </motion.div>
  );
};

export default SettingsGamer;
