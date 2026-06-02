import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { useOfficialMangas } from "@/hooks/useOfficialMangas";
import { useOfficialAnimes } from "@/hooks/useOfficialAnimes";
import { useOtakuLibrary, useAddOtakuLibraryItem } from "@/hooks/useOtakuCollections";
import { useCharacterById, RefCharacterWithUniverse } from "@/hooks/useReferenceData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Sparkles, Save, BookOpen, Tv, Plus, X, Upload, User, Flame, Snowflake, Skull,
  Search, Loader2, PlusCircle, Library, Lock, Pencil, Music, MapPin, ShoppingBag, 
  PartyPopper, Skull as SkullIcon
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import CharacterDuelSection from "@/components/otaku/CharacterDuelSection";
import { StickySaveBar, SaveStatus } from "@/components/ui/StickySaveBar";
import { useFormDirtyState } from "@/hooks/useFormDirtyState";
import { useRegisterDirty } from "@/contexts/UnsavedChangesContext";

interface Top3Item {
  id: string;
  title: string;
  image: string;
}

interface OtakuStats {
  shonen: number;
  seinen: number;
  shojo: number;
  isekai: number;
  romance: number;
  horror: number;
}

interface OtakuCategoryTop3 {
  masterclass: (Top3Item | null)[];
  enfers: (Top3Item | null)[];
}

interface OtakuDualTop3 {
  manga: OtakuCategoryTop3;
  anime: OtakuCategoryTop3;
}

const DEFAULT_STATS: OtakuStats = {
  shonen: 50,
  seinen: 50,
  shojo: 50,
  isekai: 50,
  romance: 50,
  horror: 50
};

const DEFAULT_TOP3: OtakuDualTop3 = {
  manga: { masterclass: [null, null, null], enfers: [null, null, null] },
  anime: { masterclass: [null, null, null], enfers: [null, null, null] }
};

const SettingsOtaku = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  // Official databases for Pantheon
  const { mangas: officialMangas, isLoading: mangasLoading, searchMangas, createManga, isCreating: isCreatingManga } = useOfficialMangas();
  const { animes: officialAnimes, isLoading: animesLoading, searchAnimes, createAnime, isCreating: isCreatingAnime } = useOfficialAnimes();
  
  // User's personal library
  const { data: libraryItems = [], isLoading: libraryLoading } = useOtakuLibrary(user?.id);
  const addLibraryItem = useAddOtakuLibraryItem();
  
  const isCreating = isCreatingManga || isCreatingAnime;
  
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("clean");
  const [isOtakuModeActive, setIsOtakuModeActive] = useState(false);
  
  // MASTER SWITCH - Controls entire page
  const [activeUniverse, setActiveUniverse] = useState<'manga' | 'anime'>('manga');
  
  // Character duel IDs
  const [bestCharacterId, setBestCharacterId] = useState<string | null>(null);
  const [worstCharacterId, setWorstCharacterId] = useState<string | null>(null);
  
  // Activités Favorites
  const [activities, setActivities] = useState<string[]>([]);
  
  // Top 3 Pantheon - Dual structure for Manga & Anime
  const [otakuTop3, setOtakuTop3] = useState<OtakuDualTop3>(DEFAULT_TOP3);
  const [showTop3Modal, setShowTop3Modal] = useState(false);
  const [top3Target, setTop3Target] = useState<{ type: "masterclass" | "enfers"; index: number } | null>(null);
  const [top3Search, setTop3Search] = useState("");
  
  // Masterclass Lock States
  const [isMangaMasterclassLocked, setIsMangaMasterclassLocked] = useState(false);
  const [isAnimeMasterclassLocked, setIsAnimeMasterclassLocked] = useState(false);
  
  // Enfers Lock States
  const [isMangaEnfersLocked, setIsMangaEnfersLocked] = useState(false);
  const [isAnimeEnfersLocked, setIsAnimeEnfersLocked] = useState(false);
  
  // Collection Modal
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState("");
  
  // Create Entry Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryCover, setNewEntryCover] = useState<File | null>(null);
  const [newEntryPreview, setNewEntryPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Radar Stats
  const [otakuStats, setOtakuStats] = useState<OtakuStats>(DEFAULT_STATS);

  // Lifestyle ADN fields
  const [otakuFirstManga, setOtakuFirstManga] = useState("");
  const [otakuFavoriteArtist, setOtakuFavoriteArtist] = useState("");
  const [otakuJapanDestination, setOtakuJapanDestination] = useState("");
  const [otakuJapanMustBuy, setOtakuJapanMustBuy] = useState("");
  const [otakuConActivity, setOtakuConActivity] = useState("");
  const [otakuSocialNightmare, setOtakuSocialNightmare] = useState("");

  // ── Dirty state detection ──────────────────────────────────────────────────
  type OtakuSnapshot = {
    isOtakuModeActive: boolean;
    activities: string[];
    otakuTop3: OtakuDualTop3;
    otakuStats: OtakuStats;
    otakuFirstManga: string;
    otakuFavoriteArtist: string;
    otakuJapanDestination: string;
    otakuJapanMustBuy: string;
    otakuConActivity: string;
    otakuSocialNightmare: string;
  };
  const [savedSnapshot, setSavedSnapshot] = useState<OtakuSnapshot | null>(null);

  const currentFormValues = useMemo<OtakuSnapshot>(() => ({
    isOtakuModeActive,
    activities,
    otakuTop3,
    otakuStats,
    otakuFirstManga,
    otakuFavoriteArtist,
    otakuJapanDestination,
    otakuJapanMustBuy,
    otakuConActivity,
    otakuSocialNightmare,
  }), [isOtakuModeActive, activities, otakuTop3, otakuStats,
      otakuFirstManga, otakuFavoriteArtist, otakuJapanDestination,
      otakuJapanMustBuy, otakuConActivity, otakuSocialNightmare]);

  const isDirty = useFormDirtyState(savedSnapshot, currentFormValues);

  useRegisterDirty("settings-otaku", isDirty, async () => { await handleSaveRef.current?.(); });

  const handleSaveRef = useRef<() => Promise<void>>();

  const activityOptions = [
    "Lire des mangas", "Regarder des anime", "Conventions", 
    "Cosplay", "Gaming", "Figurines", "Dessin"
  ];

  const japanDestinationOptions = [
    "Akihabara",
    "Un Konbini",
    "Pokémon Center",
    "Shibuya Crossing",
    "Un Maid Café",
    "Un Onsen",
    "Nintendo World"
  ];

  const japanMustBuyOptions = [
    "Figurines & Gunpla",
    "Snacks & Bouffe",
    "Vêtements & Kimono",
    "Gachapon",
    "Tomes & Artbooks",
    "Retro Gaming"
  ];

  const conActivityOptions = [
    "Chasse aux Goodies",
    "Admirer les Cosplays",
    "Concours & Scène",
    "Dédicaces",
    "Manger",
    "Zone Gaming"
  ];

  const socialNightmareOptions = [
    "Le Spoil sauvage",
    "Oublier les paroles en Karaoké",
    "Acheter un truc 2x trop cher",
    "Plus de batterie pour les photos",
    "Croiser son ex en convention"
  ];

  // Filter library by active universe
  const mangaCollection = libraryItems.filter(item => item.type === "MANGA");
  const animeCollection = libraryItems.filter(item => item.type === "ANIME");
  const currentCollection = activeUniverse === 'manga' ? mangaCollection : animeCollection;

  // Load profile data including lock states
  useEffect(() => {
    if (profile) {
      setActivities(profile.favorite_activities || []);
      
      const extProfile = profile as any;
      setIsOtakuModeActive(extProfile.is_otaku_mode_active || false);
      
      // Load character duel IDs
      setBestCharacterId(extProfile.best_character_id || null);
      setWorstCharacterId(extProfile.worst_character_id || null);
      
      // Load podium lock states from profile
      const lockStates = extProfile.podium_lock_states;
      if (lockStates) {
        setIsMangaMasterclassLocked(lockStates.mangaMasterclass || false);
        setIsAnimeMasterclassLocked(lockStates.animeMasterclass || false);
        setIsMangaEnfersLocked(lockStates.mangaEnfers || false);
        setIsAnimeEnfersLocked(lockStates.animeEnfers || false);
      }
      
      // Handle migration from old format to new dual format
      const savedTop3 = extProfile.otaku_top3;
      if (savedTop3) {
        if (savedTop3.manga && savedTop3.anime) {
          setOtakuTop3(savedTop3);
        } else if (savedTop3.masterclass || savedTop3.enfers) {
          setOtakuTop3({
            manga: { 
              masterclass: savedTop3.masterclass || [null, null, null], 
              enfers: savedTop3.enfers || [null, null, null] 
            },
            anime: { masterclass: [null, null, null], enfers: [null, null, null] }
          });
        } else {
          setOtakuTop3(DEFAULT_TOP3);
        }
      } else {
        setOtakuTop3(DEFAULT_TOP3);
      }
      setOtakuStats(extProfile.otaku_stats || DEFAULT_STATS);
      
      // Load lifestyle ADN fields
      const firstManga = extProfile.otaku_first_manga || "";
      const favoriteArtist = extProfile.otaku_favorite_artist || "";
      const japanDestination = extProfile.otaku_japan_destination || "";
      const japanMustBuy = extProfile.otaku_japan_must_buy || "";
      const conActivity = extProfile.otaku_con_activity || "";
      const socialNightmare = extProfile.otaku_social_nightmare || "";

      setOtakuFirstManga(firstManga);
      setOtakuFavoriteArtist(favoriteArtist);
      setOtakuJapanDestination(japanDestination);
      setOtakuJapanMustBuy(japanMustBuy);
      setOtakuConActivity(conActivity);
      setOtakuSocialNightmare(socialNightmare);

      // Capture baseline for dirty detection (first load only)
      setSavedSnapshot((prev) => {
        if (prev) return prev; // don't overwrite after user edits
        const resolvedTop3 = (() => {
          const st = extProfile.otaku_top3;
          if (!st) return DEFAULT_TOP3;
          if (st.manga && st.anime) return st;
          if (st.masterclass || st.enfers) {
            return {
              manga: { masterclass: st.masterclass || [null, null, null], enfers: st.enfers || [null, null, null] },
              anime: { masterclass: [null, null, null], enfers: [null, null, null] },
            };
          }
          return DEFAULT_TOP3;
        })();
        return {
          isOtakuModeActive: extProfile.is_otaku_mode_active || false,
          activities: profile.favorite_activities || [],
          otakuTop3: resolvedTop3,
          otakuStats: extProfile.otaku_stats || DEFAULT_STATS,
          otakuFirstManga: firstManga,
          otakuFavoriteArtist: favoriteArtist,
          otakuJapanDestination: japanDestination,
          otakuJapanMustBuy: japanMustBuy,
          otakuConActivity: conActivity,
          otakuSocialNightmare: socialNightmare,
        };
      });
    }
  }, [profile]);
  
  // Fetch character data from IDs
  const { data: bestCharacter } = useCharacterById(bestCharacterId);
  const { data: worstCharacter } = useCharacterById(worstCharacterId);
  
  // Handle character selection
  const handleSelectBestCharacter = async (character: RefCharacterWithUniverse) => {
    setBestCharacterId(character.id);
    try {
      await updateProfile({ best_character_id: character.id } as any);
      toast.success(`${character.name} est ton GOAT !`);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };
  
  const handleSelectWorstCharacter = async (character: RefCharacterWithUniverse) => {
    setWorstCharacterId(character.id);
    try {
      await updateProfile({ worst_character_id: character.id } as any);
      toast.success(`${character.name} te hante désormais...`);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  // Add to collection (otaku_library)
  const handleAddToCollection = async (item: { id: string; title: string; cover_url: string }) => {
    if (!user?.id) return;
    
    try {
      await addLibraryItem.mutateAsync({
        user_id: user.id,
        type: activeUniverse === 'manga' ? 'MANGA' : 'ANIME',
        title: item.title,
        cover_url: item.cover_url,
      });
      setShowCollectionModal(false);
      setCollectionSearch("");
    } catch (error) {
      console.error("Error adding to collection:", error);
    }
  };

  const handleDeleteFromCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from("otaku_library")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["otaku-library", user?.id] });
      toast.success(activeUniverse === 'manga' ? "Manga retiré" : "Animé retiré");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const openTop3Modal = (type: "masterclass" | "enfers", index: number) => {
    setTop3Target({ type, index });
    setTop3Search("");
    setShowCreateForm(false);
    setNewEntryTitle("");
    setNewEntryCover(null);
    setNewEntryPreview(null);
    setShowTop3Modal(true);
  };

  const selectTop3Item = async (item: { id: string; title: string; cover_url: string }) => {
    if (!top3Target) return;
    
    const top3Item: Top3Item = {
      id: item.id,
      title: item.title,
      image: item.cover_url,
    };
    
    const newTop3 = { ...otakuTop3 };
    newTop3[activeUniverse] = {
      ...newTop3[activeUniverse],
      [top3Target.type]: newTop3[activeUniverse][top3Target.type].map((slot, i) => 
        i === top3Target.index ? top3Item : slot
      )
    };
    setOtakuTop3(newTop3);
    
    try {
      await updateProfile({
        otaku_top3: newTop3,
      } as any);
      toast.success(`${top3Item.title} ajouté !`);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
    
    setShowTop3Modal(false);
    setTop3Target(null);
  };

  const removeTop3Item = async (type: "masterclass" | "enfers", index: number) => {
    const newTop3 = { ...otakuTop3 };
    newTop3[activeUniverse] = {
      ...newTop3[activeUniverse],
      [type]: newTop3[activeUniverse][type].map((slot, i) => 
        i === index ? null : slot
      )
    };
    setOtakuTop3(newTop3);
    
    try {
      await updateProfile({
        otaku_top3: newTop3,
      } as any);
      toast.success(`${activeUniverse === 'manga' ? 'Manga' : 'Anime'} retiré`);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewEntryCover(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewEntryPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntryTitle.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!newEntryCover) {
      toast.error("La couverture est requise");
      return;
    }

    try {
      let newEntry: { id: string; title: string; cover_url: string };
      
      if (activeUniverse === 'manga') {
        newEntry = await createManga({
          title: newEntryTitle.trim(),
          coverFile: newEntryCover,
        });
      } else {
        newEntry = await createAnime({
          title: newEntryTitle.trim(),
          coverFile: newEntryCover,
        });
      }
      
      if (showTop3Modal && top3Target) {
        await selectTop3Item(newEntry);
      } else if (showCollectionModal) {
        await handleAddToCollection(newEntry);
      }
      
      toast.success(`${newEntry.title} créé et ajouté !`);
      setShowCreateForm(false);
      setNewEntryTitle("");
      setNewEntryCover(null);
      setNewEntryPreview(null);
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error(`Erreur lors de la création`);
    }
  };

  const updateStat = useCallback((key: keyof OtakuStats, value: number[]) => {
    setOtakuStats(prev => ({ ...prev, [key]: value[0] }));
  }, []);

  // Save podium lock state to database
  const savePodiumLockState = async (key: 'mangaMasterclass' | 'animeMasterclass' | 'mangaEnfers' | 'animeEnfers', value: boolean) => {
    const currentLockStates = {
      mangaMasterclass: isMangaMasterclassLocked,
      animeMasterclass: isAnimeMasterclassLocked,
      mangaEnfers: isMangaEnfersLocked,
      animeEnfers: isAnimeEnfersLocked,
    };
    const newLockStates = { ...currentLockStates, [key]: value };
    
    try {
      await updateProfile({
        podium_lock_states: newLockStates,
      } as any);
    } catch (error) {
      console.error("Error saving lock state:", error);
    }
  };

  const radarData = [
    { genre: "Shonen", value: otakuStats.shonen, fullMark: 100 },
    { genre: "Seinen", value: otakuStats.seinen, fullMark: 100 },
    { genre: "Shojo", value: otakuStats.shojo, fullMark: 100 },
    { genre: "Isekai", value: otakuStats.isekai, fullMark: 100 },
    { genre: "Romance", value: otakuStats.romance, fullMark: 100 },
    { genre: "Horror", value: otakuStats.horror, fullMark: 100 },
  ];

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const result = await updateProfile({
        is_otaku_mode_active: isOtakuModeActive,
        favorite_activities: activities,
        otaku_top3: otakuTop3,
        otaku_stats: otakuStats,
        best_character_id: bestCharacterId,
        worst_character_id: worstCharacterId,
        otaku_first_manga: otakuFirstManga || null,
        otaku_favorite_artist: otakuFavoriteArtist || null,
        otaku_japan_destination: otakuJapanDestination || null,
        otaku_japan_must_buy: otakuJapanMustBuy || null,
        otaku_con_activity: otakuConActivity || null,
        otaku_social_nightmare: otakuSocialNightmare || null,
      } as any);

      if (result.error) {
        setSaveStatus("error");
        throw result.error;
      }
      // Update snapshot so form is no longer dirty
      setSavedSnapshot(currentFormValues);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("clean"), 2500);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Profil otaku enregistré !");
    } catch (error) {
      console.error("Error saving otaku profile:", error);
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
    setIsOtakuModeActive(savedSnapshot.isOtakuModeActive);
    setActivities(savedSnapshot.activities);
    setOtakuTop3(savedSnapshot.otakuTop3);
    setOtakuStats(savedSnapshot.otakuStats);
    setOtakuFirstManga(savedSnapshot.otakuFirstManga);
    setOtakuFavoriteArtist(savedSnapshot.otakuFavoriteArtist);
    setOtakuJapanDestination(savedSnapshot.otakuJapanDestination);
    setOtakuJapanMustBuy(savedSnapshot.otakuJapanMustBuy);
    setOtakuConActivity(savedSnapshot.otakuConActivity);
    setOtakuSocialNightmare(savedSnapshot.otakuSocialNightmare);
    setSaveStatus("clean");
  };

  // Get search results from real database based on active universe
  const searchResults = activeUniverse === 'manga' 
    ? searchMangas(top3Search)
    : searchAnimes(top3Search);

  const collectionSearchResults = activeUniverse === 'manga'
    ? searchMangas(collectionSearch)
    : searchAnimes(collectionSearch);

  // Theme colors based on active universe
  const themeColor = activeUniverse === 'manga' ? 'sakura' : 'turquoise';
  const themeBg = activeUniverse === 'manga' ? 'from-sakura/10 to-sakura/5' : 'from-turquoise/10 to-turquoise/5';
  const themeBorder = activeUniverse === 'manga' ? 'border-sakura/30' : 'border-turquoise/30';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-[16px] p-6 md:p-8 shadow-xl"
    >
      <h2 className={`font-display text-2xl ${activeUniverse === 'manga' ? 'text-sakura' : 'text-turquoise'} tracking-wide mb-6 flex items-center gap-2 transition-colors duration-300`}>
        <Sparkles className="w-6 h-6" />
        MON PROFIL OTAKU
      </h2>

      <div className="space-y-8">
        {/* Activation Switch */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div>
            <p className="font-display text-foreground">ACTIVER MON PROFIL OTAKU</p>
            <p className="text-sm text-muted-foreground">Rejoins la communauté des otakus, des fans de manga et d'animé de Manga Paradise.</p>
          </div>
          <Switch
            checked={isOtakuModeActive}
            onCheckedChange={setIsOtakuModeActive}
            className={`${activeUniverse === 'manga' ? 'data-[state=checked]:bg-sakura' : 'data-[state=checked]:bg-turquoise'}`}
          />
        </div>

        {/* ========== MASTER SWITCH ========== */}
        <div className="relative">
          <div className="flex gap-0 p-1.5 bg-muted/50 rounded-2xl">
            <button
              onClick={() => setActiveUniverse('manga')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-display text-lg tracking-wide transition-all duration-300 ${
                activeUniverse === 'manga'
                  ? 'bg-gradient-to-r from-sakura to-sakura/80 text-white shadow-lg shadow-sakura/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <BookOpen className="w-6 h-6" />
              MANGA
            </button>
            <button
              onClick={() => setActiveUniverse('anime')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-display text-lg tracking-wide transition-all duration-300 ${
                activeUniverse === 'anime'
                  ? 'bg-gradient-to-r from-turquoise to-turquoise/80 text-header-bg shadow-lg shadow-turquoise/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Tv className="w-6 h-6" />
              ANIMÉ
            </button>
          </div>
        </div>

        {/* LE DUEL - Best vs Worst Character */}
        <CharacterDuelSection
          bestCharacter={bestCharacter || null}
          worstCharacter={worstCharacter || null}
          onSelectBest={handleSelectBestCharacter}
          onSelectWorst={handleSelectWorstCharacter}
        />

        {/* ========== PANTHEON SECTION ========== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeUniverse + "-pantheon"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <h3 className={`font-display text-lg ${activeUniverse === 'manga' ? 'text-sakura' : 'text-turquoise'} flex items-center gap-2 transition-colors duration-300`}>
              🏆 MON PANTHÉON {activeUniverse === 'manga' ? 'MANGA' : 'ANIMÉ'}
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Masterclass - Golden Podium Side */}
              {(() => {
                const masterclassItems = otakuTop3[activeUniverse].masterclass;
                const allMasterclassFilled = masterclassItems.every(item => item !== null);
                const isMasterclassLocked = activeUniverse === 'manga' ? isMangaMasterclassLocked : isAnimeMasterclassLocked;
                const setMasterclassLocked = activeUniverse === 'manga' ? setIsMangaMasterclassLocked : setIsAnimeMasterclassLocked;

                return (
                  <div className={`p-5 rounded-xl transition-all duration-500 ${
                    isMasterclassLocked 
                      ? 'bg-gradient-to-t from-amber-900/30 via-yellow-900/20 to-amber-500/10 border-2 border-amber-400/60' 
                      : 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display text-base flex items-center gap-2 text-amber-400">
                        <Flame className="w-5 h-5" />
                        MES MASTERCLASS
                      </h4>
                      
                      {isMasterclassLocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMasterclassLocked(false);
                            savePodiumLockState(activeUniverse === 'manga' ? 'mangaMasterclass' : 'animeMasterclass', false);
                          }}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                    </div>
                    
                    {isMasterclassLocked ? (
                      /* ===== GOLDEN PODIUM - LOCKED VIEW ===== */
                      <div className="relative">
                        {/* Glory Glow Background */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-radial from-amber-400/30 via-yellow-500/15 to-transparent rounded-full blur-2xl" />
                        
                        {/* Podium Container */}
                        <div className="flex items-end justify-center gap-3 md:gap-4 py-6 relative">
                          
                          {/* #2 - Silver - Left */}
                          {masterclassItems[1] && (
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="relative w-24 md:w-32 lg:w-40 mb-4 z-10"
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-gray-400/30 border-2 border-gray-300/60 ring-2 ring-gray-300/30 transition-all duration-300 cursor-pointer hover:ring-4 hover:ring-slate-300 hover:shadow-xl hover:shadow-slate-300/50 hover:scale-105">
                                <img 
                                  src={masterclassItems[1].image} 
                                  alt={masterclassItems[1].title}
                                  className="w-full h-full object-cover brightness-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl md:text-3xl drop-shadow-lg">🥈</div>
                              <p className="absolute bottom-1 left-1 right-1 text-[10px] md:text-xs text-white font-medium line-clamp-1 text-center drop-shadow-lg">
                                {masterclassItems[1].title}
                              </p>
                            </motion.div>
                          )}
                          
                          {/* #1 - Gold - Center (Elevated) */}
                          {masterclassItems[0] && (
                            <motion.div
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="relative w-32 md:w-44 lg:w-52 -mb-4 z-20"
                            >
                              {/* Intense Golden Halo */}
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full h-20 bg-gradient-to-b from-amber-400/50 via-yellow-400/30 to-transparent rounded-full blur-xl" />
                              <div className="absolute inset-0 bg-gradient-radial from-amber-300/20 to-transparent rounded-lg blur-md scale-110" />
                              
                              <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-amber-500/40 border-3 border-amber-400 ring-4 ring-amber-400/30 relative scale-105 transition-all duration-300 cursor-pointer hover:ring-[6px] hover:ring-amber-400 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] hover:scale-110">
                                <img 
                                  src={masterclassItems[0].image} 
                                  alt={masterclassItems[0].title}
                                  className="w-full h-full object-cover brightness-110 saturate-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/70 via-transparent to-amber-400/10" />
                              </div>
                              {/* Gold Medal Badge */}
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">🥇</div>
                              <p className="absolute bottom-2 left-2 right-2 text-xs md:text-sm text-amber-100 font-bold line-clamp-1 text-center drop-shadow-lg">
                                {masterclassItems[0].title}
                              </p>
                            </motion.div>
                          )}
                          
                          {/* #3 - Bronze - Right */}
                          {masterclassItems[2] && (
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="relative w-24 md:w-32 lg:w-40 mb-4 z-10"
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-amber-700/30 border-2 border-amber-700/60 ring-2 ring-amber-700/30 transition-all duration-300 cursor-pointer hover:ring-4 hover:ring-orange-700 hover:shadow-xl hover:shadow-orange-700/50 hover:scale-105">
                                <img 
                                  src={masterclassItems[2].image} 
                                  alt={masterclassItems[2].title}
                                  className="w-full h-full object-cover brightness-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl md:text-3xl drop-shadow-lg">🥉</div>
                              <p className="absolute bottom-1 left-1 right-1 text-[10px] md:text-xs text-white font-medium line-clamp-1 text-center drop-shadow-lg">
                                {masterclassItems[2].title}
                              </p>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Glory Badge */}
                        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-400/80">
                          <Lock className="w-3 h-3" />
                          <span>Hall of Fame</span>
                        </div>
                      </div>
                    ) : (
                      /* ===== EDIT MODE ===== */
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          {masterclassItems.map((item, index) => (
                            <div key={index} className="relative group">
                              {item ? (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg"
                                >
                                  <img 
                                    src={item.image} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                  <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium line-clamp-2">
                                    {item.title}
                                  </p>
                                  <button
                                    onClick={() => removeTop3Item("masterclass", index)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                  <div className="absolute top-1 left-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
                                    {index + 1}
                                  </div>
                                </motion.div>
                              ) : (
                                <button
                                  onClick={() => openTop3Modal("masterclass", index)}
                                  className="aspect-[2/3] w-full rounded-lg border-2 border-dashed border-amber-500/50 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 flex flex-col items-center justify-center gap-2 transition-all"
                                >
                                  <Plus className="w-6 h-6 text-amber-500" />
                                  <span className="text-xs text-amber-500">#{index + 1}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Crown Button */}
                        {allMasterclassFilled && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4"
                          >
                            <Button
                              onClick={() => {
                                setMasterclassLocked(true);
                                savePodiumLockState(activeUniverse === 'manga' ? 'mangaMasterclass' : 'animeMasterclass', true);
                              }}
                              className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-amber-900 font-display tracking-wide shadow-lg shadow-amber-500/30 border border-amber-300/50"
                            >
                              <Sparkles className="w-5 h-5 mr-2" />
                              👑 CONSACRER AU PANTHÉON 👑
                            </Button>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Enfers - Fiery Pit Side */}
              {(() => {
                const enfersItems = otakuTop3[activeUniverse].enfers;
                const allEnfersFilled = enfersItems.every(item => item !== null);
                const isEnfersLocked = activeUniverse === 'manga' ? isMangaEnfersLocked : isAnimeEnfersLocked;
                const setEnfersLocked = activeUniverse === 'manga' ? setIsMangaEnfersLocked : setIsAnimeEnfersLocked;

                return (
                  <div className={`p-5 rounded-xl transition-all duration-500 ${
                    isEnfersLocked 
                      ? 'bg-gradient-to-b from-red-900/30 via-orange-900/20 to-red-950/40 border-2 border-red-500/60' 
                      : 'bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-display text-base flex items-center gap-2 ${
                        isEnfersLocked ? 'text-red-400' : 'text-red-400'
                      }`}>
                        <Flame className="w-5 h-5" />
                        MES ENFERS / OVERRATED
                      </h4>
                      
                      {isEnfersLocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEnfersLocked(false);
                            savePodiumLockState(activeUniverse === 'manga' ? 'mangaEnfers' : 'animeEnfers', false);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                    </div>
                    
                    {isEnfersLocked ? (
                      /* ===== ENFERS PODIUM - LOCKED VIEW (Same structure as Masterclass) ===== */
                      <div className="relative">
                        {/* Fire Glow Background */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-radial from-red-500/30 via-orange-500/15 to-transparent rounded-full blur-2xl" />
                        
                        {/* Podium Container - Same as Masterclass (items-end for ascending V) */}
                        <div className="flex items-end justify-center gap-3 md:gap-4 py-6 relative">
                          
                          {/* #2 - Silver - Left */}
                          {enfersItems[1] && (
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="relative w-24 md:w-32 lg:w-40 mb-4 z-10"
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-red-500/30 border-2 border-gray-300/60 ring-2 ring-gray-300/30 transition-all duration-300 cursor-pointer hover:ring-4 hover:ring-red-600 hover:shadow-xl hover:shadow-red-600/60 hover:scale-105">
                                <img 
                                  src={enfersItems[1].image} 
                                  alt={enfersItems[1].title}
                                  className="w-full h-full object-cover sepia brightness-75 contrast-125"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent" />
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl md:text-3xl drop-shadow-lg">🥈</div>
                              <p className="absolute bottom-1 left-1 right-1 text-[10px] md:text-xs text-orange-200 font-medium line-clamp-1 text-center drop-shadow-lg">
                                {enfersItems[1].title}
                              </p>
                            </motion.div>
                          )}
                          
                          {/* #1 - Gold - Center (Elevated) */}
                          {enfersItems[0] && (
                            <motion.div
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="relative w-32 md:w-44 lg:w-52 -mb-4 z-20"
                            >
                              {/* Intense Fire Halo */}
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full h-20 bg-gradient-to-b from-red-500/50 via-orange-400/30 to-transparent rounded-full blur-xl" />
                              <div className="absolute inset-0 bg-gradient-radial from-red-500/20 to-transparent rounded-lg blur-md scale-110" />
                              
                              <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-red-600/40 border-3 border-red-500 ring-4 ring-red-500/30 relative scale-105 transition-all duration-300 cursor-pointer hover:ring-[6px] hover:ring-red-600 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:scale-110">
                                <img 
                                  src={enfersItems[0].image} 
                                  alt={enfersItems[0].title}
                                  className="w-full h-full object-cover sepia brightness-50 contrast-125 saturate-150"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-transparent to-red-500/10" />
                              </div>
                              {/* Gold Medal Badge */}
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]">🥇</div>
                              <p className="absolute bottom-2 left-2 right-2 text-xs md:text-sm text-red-100 font-bold line-clamp-1 text-center drop-shadow-lg">
                                {enfersItems[0].title}
                              </p>
                            </motion.div>
                          )}
                          
                          {/* #3 - Bronze - Right */}
                          {enfersItems[2] && (
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="relative w-24 md:w-32 lg:w-40 mb-4 z-10"
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-red-500/30 border-2 border-amber-700/60 ring-2 ring-amber-700/30 transition-all duration-300 cursor-pointer hover:ring-4 hover:ring-red-600 hover:shadow-xl hover:shadow-red-600/60 hover:scale-105">
                                <img 
                                  src={enfersItems[2].image} 
                                  alt={enfersItems[2].title}
                                  className="w-full h-full object-cover sepia brightness-75 contrast-125"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent" />
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl md:text-3xl drop-shadow-lg">🥉</div>
                              <p className="absolute bottom-1 left-1 right-1 text-[10px] md:text-xs text-orange-200 font-medium line-clamp-1 text-center drop-shadow-lg">
                                {enfersItems[2].title}
                              </p>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Fire Badge */}
                        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-red-400/80">
                          <Lock className="w-3 h-3" />
                          <span>Condamnés aux Enfers</span>
                        </div>
                      </div>
                    ) : (
                      /* ===== EDIT MODE ===== */
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          {enfersItems.map((item, index) => (
                            <div key={index} className="relative group">
                              {item ? (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg border border-red-500/30"
                                >
                                  <img 
                                    src={item.image} 
                                    alt={item.title}
                                    className="w-full h-full object-cover sepia brightness-90"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent" />
                                  <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium line-clamp-2">
                                    {item.title}
                                  </p>
                                  <button
                                    onClick={() => removeTop3Item("enfers", index)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                  <div className="absolute top-1 left-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center font-bold text-xs text-white">
                                    {index + 1}
                                  </div>
                                </motion.div>
                              ) : (
                                <button
                                  onClick={() => openTop3Modal("enfers", index)}
                                  className="aspect-[2/3] w-full rounded-lg border-2 border-dashed border-red-500/50 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 flex flex-col items-center justify-center gap-2 transition-all"
                                >
                                  <Plus className="w-6 h-6 text-red-500" />
                                  <span className="text-xs text-red-500">#{index + 1}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Condemn Button */}
                        {allEnfersFilled && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4"
                          >
                            <Button
                              onClick={() => {
                                setEnfersLocked(true);
                                savePodiumLockState(activeUniverse === 'manga' ? 'mangaEnfers' : 'animeEnfers', true);
                              }}
                              className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-500 hover:via-orange-400 hover:to-red-500 text-white font-display tracking-wide shadow-lg shadow-red-500/30 border border-red-400/50"
                            >
                              <Flame className="w-5 h-5 mr-2 animate-pulse" />
                              🔥 CONDAMNER AUX ENFERS 🔥
                            </Button>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ========== COLLECTION SECTION ========== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeUniverse + "-collection"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className={`p-6 rounded-xl bg-gradient-to-br ${themeBg} border ${themeBorder} transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-display text-lg flex items-center gap-2 ${activeUniverse === 'manga' ? 'text-sakura' : 'text-turquoise'}`}>
                <Library className="w-5 h-5" />
                {activeUniverse === 'manga' ? 'MA MANGATHÈQUE' : 'MA WATCHLIST'}
              </h3>
              <span className="text-sm text-muted-foreground">
                {currentCollection.length} {activeUniverse === 'manga' ? 'mangas' : 'animés'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCollectionSearch("");
                  setShowCreateForm(false);
                  setShowCollectionModal(true);
                }}
                className={`aspect-[2/3] rounded-lg border-2 border-dashed ${
                  activeUniverse === 'manga' 
                    ? 'border-sakura/50 hover:border-sakura bg-sakura/5 hover:bg-sakura/10' 
                    : 'border-turquoise/50 hover:border-turquoise bg-turquoise/5 hover:bg-turquoise/10'
                } flex flex-col items-center justify-center gap-2 transition-colors`}
              >
                <Plus className={`w-8 h-8 ${activeUniverse === 'manga' ? 'text-sakura' : 'text-turquoise'}`} />
                <span className={`text-xs font-body ${activeUniverse === 'manga' ? 'text-sakura' : 'text-turquoise'}`}>
                  Ajouter
                </span>
              </motion.button>

              {/* Collection Cards */}
              <AnimatePresence>
                {libraryLoading ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  currentCollection.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative group"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                        <img 
                          src={item.cover_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="absolute bottom-1 left-1 right-1 text-[10px] text-white font-medium line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.title}
                        </p>
                        <button
                          onClick={() => handleDeleteFromCollection(item.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Radar Chart - Genre Affinities */}
        <div className="p-6 bg-muted/30 rounded-xl space-y-4">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            📊 MES TYPES DE {activeUniverse === 'manga' ? 'MANGAS' : 'ANIMÉS'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="genre" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Radar
                    name="Affinité"
                    dataKey="value"
                    stroke={activeUniverse === 'manga' ? "hsl(var(--sakura))" : "hsl(var(--turquoise))"}
                    fill={activeUniverse === 'manga' ? "hsl(var(--sakura))" : "hsl(var(--turquoise))"}
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {[
                { key: "shonen" as const, label: "Shonen", emoji: "⚔️" },
                { key: "seinen" as const, label: "Seinen", emoji: "🎭" },
                { key: "shojo" as const, label: "Shojo", emoji: "💖" },
                { key: "isekai" as const, label: "Isekai", emoji: "🌀" },
                { key: "romance" as const, label: "Romance", emoji: "💕" },
                { key: "horror" as const, label: "Horror", emoji: "👻" },
              ].map(({ key, label, emoji }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span>{emoji}</span> {label}
                    </span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {otakuStats[key]}%
                    </span>
                  </div>
                  <Slider
                    value={[otakuStats[key]]}
                    onValueChange={(value) => updateStat(key, value)}
                    max={100}
                    step={5}
                    className={`${activeUniverse === 'manga' 
                      ? '[&_[role=slider]]:border-sakura [&_[role=slider]]:bg-sakura' 
                      : '[&_[role=slider]]:border-turquoise [&_[role=slider]]:bg-turquoise'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== MON ADN OTAKU SECTION ========== */}
        <div className={`rounded-2xl border ${themeBorder} bg-gradient-to-br ${themeBg} p-6`}>
          <h3 className={`font-display text-xl ${activeUniverse === 'manga' ? 'text-sakura' : 'text-turquoise'} mb-6 flex items-center gap-2`}>
            🧬 MON ADN OTAKU
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloc 1: Mes Racines & Goûts */}
            <div className="space-y-4">
              <h4 className="font-display text-sm text-muted-foreground tracking-wide flex items-center gap-2">
                📖 MES RACINES & GOÛTS
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Ton tout premier Manga lu ?
                  </Label>
                  <Input
                    value={otakuFirstManga}
                    onChange={(e) => setOtakuFirstManga(e.target.value)}
                    placeholder="Ex: Dragon Ball, Naruto, One Piece..."
                    className="bg-muted/50"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Music className="w-4 h-4 text-pink-500" />
                    Ton Artiste / Groupe J-Music préféré ?
                  </Label>
                  <Input
                    value={otakuFavoriteArtist}
                    onChange={(e) => setOtakuFavoriteArtist(e.target.value)}
                    placeholder="Ex: YOASOBI, LiSA, Eve, Kenshi Yonezu..."
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </div>

            {/* Bloc 2: Objectif Japon */}
            <div className="space-y-4">
              <h4 className="font-display text-sm text-muted-foreground tracking-wide flex items-center gap-2">
                🇯🇵 OBJECTIF JAPON
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Premier endroit où tu vas au Japon ?
                  </Label>
                  <Select value={otakuJapanDestination} onValueChange={setOtakuJapanDestination}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ta destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {japanDestinationOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    Ton achat obligatoire au Japon ?
                  </Label>
                  <Select value={otakuJapanMustBuy} onValueChange={setOtakuJapanMustBuy}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ton must-have..." />
                    </SelectTrigger>
                    <SelectContent>
                      {japanMustBuyOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bloc 3: Vie Sociale & IRL */}
            <div className="space-y-4">
              <h4 className="font-display text-sm text-muted-foreground tracking-wide flex items-center gap-2">
                🤪 VIE SOCIALE & IRL
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <PartyPopper className="w-4 h-4 text-purple-500" />
                    Ton activité préférée en Convention ?
                  </Label>
                  <Select value={otakuConActivity} onValueChange={setOtakuConActivity}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ton activité..." />
                    </SelectTrigger>
                    <SelectContent>
                      {conActivityOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Skull className="w-4 h-4 text-red-600" />
                    Ton pire cauchemar social ?
                  </Label>
                  <Select value={otakuSocialNightmare} onValueChange={setOtakuSocialNightmare}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Choisis ta hantise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {socialNightmareOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activités Favorites */}
        <div>
          <Label className="font-body text-sm text-muted-foreground mb-3 block">
            🎯 Mes Activités Favorites
          </Label>
          <div className="flex flex-wrap gap-2">
            {activityOptions.map((activity) => (
              <button
                key={activity}
                onClick={() => toggleArrayItem(activities, setActivities, activity)}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  activities.includes(activity)
                    ? activeUniverse === 'manga' 
                      ? "bg-sakura text-white" 
                      : "bg-turquoise text-header-bg"
                    : activeUniverse === 'manga'
                      ? "bg-muted text-muted-foreground hover:bg-sakura/20 hover:text-sakura"
                      : "bg-muted text-muted-foreground hover:bg-turquoise/20 hover:text-turquoise"
                }`}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full ${
            activeUniverse === 'manga' 
              ? 'bg-sakura hover:bg-sakura/90' 
              : 'bg-turquoise hover:bg-turquoise/90 text-header-bg'
          } font-display tracking-wide h-12 transition-colors duration-300`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          ENREGISTRER MON PROFIL OTAKU
        </Button>
      </div>

      {/* ========== TOP 3 SELECTION MODAL ========== */}
      <Dialog open={showTop3Modal} onOpenChange={(open) => {
        setShowTop3Modal(open);
        if (!open) {
          setShowCreateForm(false);
          setNewEntryTitle("");
          setNewEntryCover(null);
          setNewEntryPreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {top3Target?.type === "masterclass" ? (
                <>
                  <Flame className="w-5 h-5 text-amber-500" />
                  Ajouter un Masterclass ({activeUniverse === 'manga' ? 'Manga' : 'Animé'})
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 text-red-500" />
                  Ajouter aux Enfers ({activeUniverse === 'manga' ? 'Manga' : 'Animé'})
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {!showCreateForm ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Rechercher un ${activeUniverse === 'manga' ? 'manga' : 'animé'}...`}
                  value={top3Search}
                  onChange={(e) => setTop3Search(e.target.value)}
                  className="bg-muted pl-10"
                />
              </div>

              <div className={`text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                activeUniverse === 'manga' 
                  ? 'bg-sakura/20 text-sakura' 
                  : 'bg-turquoise/20 text-turquoise'
              }`}>
                {activeUniverse === 'manga' ? <BookOpen className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                {activeUniverse === 'manga' ? 'Base Mangathèque' : 'Base Watchlist'}
              </div>
              
              {(activeUniverse === 'manga' ? mangasLoading : animesLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectTop3Item(item)}
                      className={`relative aspect-[2/3] rounded-lg overflow-hidden hover:ring-2 ${
                        activeUniverse === 'manga' ? 'hover:ring-sakura' : 'hover:ring-turquoise'
                      } transition-all group`}
                    >
                      <img 
                        src={item.cover_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <p className="absolute bottom-1 left-1 right-1 text-[10px] text-white font-medium line-clamp-2">
                        {item.title}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">
                    {top3Search ? 'Aucun résultat trouvé' : `Tapez pour rechercher un ${activeUniverse === 'manga' ? 'manga' : 'animé'}`}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowCreateForm(true)}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Créer une nouvelle fiche
              </Button>
            </div>
          ) : (
            <CreateEntryForm
              activeUniverse={activeUniverse}
              title={newEntryTitle}
              setTitle={setNewEntryTitle}
              preview={newEntryPreview}
              onCoverUpload={handleCoverUpload}
              fileInputRef={fileInputRef}
              onBack={() => setShowCreateForm(false)}
              onCreate={handleCreateEntry}
              isCreating={isCreating}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ========== COLLECTION ADD MODAL ========== */}
      <Dialog open={showCollectionModal} onOpenChange={(open) => {
        setShowCollectionModal(open);
        if (!open) {
          setShowCreateForm(false);
          setNewEntryTitle("");
          setNewEntryCover(null);
          setNewEntryPreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeUniverse === 'manga' ? (
                <>
                  <BookOpen className="w-5 h-5 text-sakura" />
                  Ajouter à ma Mangathèque
                </>
              ) : (
                <>
                  <Tv className="w-5 h-5 text-turquoise" />
                  Ajouter à ma Watchlist
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {!showCreateForm ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Rechercher un ${activeUniverse === 'manga' ? 'manga' : 'animé'}...`}
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  className="bg-muted pl-10"
                  autoFocus
                />
              </div>
              
              {(activeUniverse === 'manga' ? mangasLoading : animesLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : collectionSearchResults.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto">
                  {collectionSearchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddToCollection(item)}
                      className={`relative aspect-[2/3] rounded-lg overflow-hidden hover:ring-2 ${
                        activeUniverse === 'manga' ? 'hover:ring-sakura' : 'hover:ring-turquoise'
                      } transition-all group`}
                    >
                      <img 
                        src={item.cover_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <p className="absolute bottom-1 left-1 right-1 text-[10px] text-white font-medium line-clamp-2">
                        {item.title}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">
                    {collectionSearch ? 'Aucun résultat trouvé' : `Tapez pour rechercher un ${activeUniverse === 'manga' ? 'manga' : 'animé'}`}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowCreateForm(true)}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Créer une nouvelle fiche
              </Button>
            </div>
          ) : (
            <CreateEntryForm
              activeUniverse={activeUniverse}
              title={newEntryTitle}
              setTitle={setNewEntryTitle}
              preview={newEntryPreview}
              onCoverUpload={handleCoverUpload}
              fileInputRef={fileInputRef}
              onBack={() => setShowCreateForm(false)}
              onCreate={handleCreateEntry}
              isCreating={isCreating}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Sticky save bar */}
      <StickySaveBar
        status={saveStatus !== "clean" ? saveStatus : isDirty ? "dirty" : "clean"}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </motion.div>
  );
};

// Extracted Create Entry Form Component
interface CreateEntryFormProps {
  activeUniverse: 'manga' | 'anime';
  title: string;
  setTitle: (title: string) => void;
  preview: string | null;
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onBack: () => void;
  onCreate: () => void;
  isCreating: boolean;
}

const CreateEntryForm = ({
  activeUniverse,
  title,
  setTitle,
  preview,
  onCoverUpload,
  fileInputRef,
  onBack,
  onCreate,
  isCreating,
}: CreateEntryFormProps) => (
  <div className="space-y-4">
    <button
      onClick={onBack}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      ← Retour à la recherche
    </button>
    
    <div className="space-y-2">
      <Label htmlFor="entry-title">
        Titre {activeUniverse === 'manga' ? 'du Manga' : "de l'Animé"}
      </Label>
      <Input
        id="entry-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={activeUniverse === 'manga' ? "Ex: Chainsaw Man" : "Ex: Solo Leveling"}
        className="bg-muted"
      />
    </div>
    
    <div className="space-y-2">
      <Label>Couverture (Format Portrait 2:3)</Label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-[2/3] max-w-[120px] border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-${activeUniverse === 'manga' ? 'sakura' : 'turquoise'} ${
          preview ? 'border-green-500/50' : 'border-border'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-2">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-[10px] text-center">Ajouter</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onCoverUpload}
        className="hidden"
      />
    </div>

    <Button
      onClick={onCreate}
      disabled={isCreating}
      className={`w-full ${
        activeUniverse === 'manga' 
          ? 'bg-sakura hover:bg-sakura/90' 
          : 'bg-turquoise hover:bg-turquoise/90 text-header-bg'
      }`}
    >
      {isCreating ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <PlusCircle className="w-4 h-4 mr-2" />
      )}
      CRÉER ET AJOUTER
    </Button>
  </div>
);

export default SettingsOtaku;
