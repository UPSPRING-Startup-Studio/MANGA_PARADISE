import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Database, 
  Loader2, 
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Camera,
  Book,
  Search,
  Eye,
  Tv,
  Upload,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useOfficialMangas } from "@/hooks/useOfficialMangas";
import { useOfficialAnimes } from "@/hooks/useOfficialAnimes";

const AdminDatabase = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("universes");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Universe modal
  const [universeModal, setUniverseModal] = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [universeForm, setUniverseForm] = useState({ name: "" });
  
  // Character modal
  const [characterModal, setCharacterModal] = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [characterForm, setCharacterForm] = useState({ name: "", universe_id: "", official_image_url: "" });

  // Cosplay preview modal
  const [cosplayPreview, setCosplayPreview] = useState<{ open: boolean; item: any }>({ open: false, item: null });

  // Manga modal
  const [mangaModal, setMangaModal] = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [mangaForm, setMangaForm] = useState({ title: "", author: "" });
  const [mangaCoverFile, setMangaCoverFile] = useState<File | null>(null);
  const [mangaCoverPreview, setMangaCoverPreview] = useState<string | null>(null);
  const mangaFileInputRef = useRef<HTMLInputElement>(null);

  // Anime modal
  const [animeModal, setAnimeModal] = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [animeForm, setAnimeForm] = useState({ title: "", studio: "" });
  const [animeCoverFile, setAnimeCoverFile] = useState<File | null>(null);
  const [animeCoverPreview, setAnimeCoverPreview] = useState<string | null>(null);
  const animeFileInputRef = useRef<HTMLInputElement>(null);

  // Official Mangas & Animes hooks
  const { 
    mangas: officialMangas, 
    isLoading: mangasLoading, 
    createManga, 
    updateManga, 
    deleteManga,
    isCreating: isCreatingManga,
    isUpdating: isUpdatingManga
  } = useOfficialMangas();
  
  const { 
    animes: officialAnimes, 
    isLoading: animesLoading, 
    createAnime, 
    updateAnime, 
    deleteAnime,
    isCreating: isCreatingAnime,
    isUpdating: isUpdatingAnime
  } = useOfficialAnimes();

  // Fetch universes
  const { data: universes = [], isLoading: universesLoading } = useQuery({
    queryKey: ["admin-universes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_universes")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch characters
  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ["admin-characters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_characters")
        .select("*, universe:universe_id(name)")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending cosplays
  const { data: cosplays = [], isLoading: cosplaysLoading } = useQuery({
    queryKey: ["admin-cosplays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select("*, profile:user_id(username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Universe mutations
  const saveUniverseMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string }) => {
      const payload = { 
        name: data.name,
        name_normalized: data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      };
      
      if (data.id) {
        const { error } = await supabase.from("ref_universes").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ref_universes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Univers sauvegardé !");
      queryClient.invalidateQueries({ queryKey: ["admin-universes"] });
      setUniverseModal({ open: false, item: null });
      setUniverseForm({ name: "" });
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    },
  });

  const deleteUniverseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ref_universes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Univers supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-universes"] });
    },
  });

  // Character mutations
  const saveCharacterMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string; universe_id: string; official_image_url: string }) => {
      const payload = { 
        name: data.name,
        name_normalized: data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        universe_id: data.universe_id,
        official_image_url: data.official_image_url || null,
      };
      
      if (data.id) {
        const { error } = await supabase.from("ref_characters").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ref_characters").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Personnage sauvegardé !");
      queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
      setCharacterModal({ open: false, item: null });
      setCharacterForm({ name: "", universe_id: "", official_image_url: "" });
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    },
  });

  const deleteCharacterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ref_characters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Personnage supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-characters"] });
    },
  });

  // Cosplay moderation
  const deleteCosplayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cosplay_vestiaire").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cosplay supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-cosplays"] });
      setCosplayPreview({ open: false, item: null });
    },
  });

  const openUniverseModal = (item?: any) => {
    if (item) {
      setUniverseForm({ name: item.name });
    } else {
      setUniverseForm({ name: "" });
    }
    setUniverseModal({ open: true, item });
  };

  const openCharacterModal = (item?: any) => {
    if (item) {
      setCharacterForm({ 
        name: item.name, 
        universe_id: item.universe_id,
        official_image_url: item.official_image_url || ""
      });
    } else {
      setCharacterForm({ name: "", universe_id: "", official_image_url: "" });
    }
    setCharacterModal({ open: true, item });
  };

  const openMangaModal = (item?: any) => {
    if (item) {
      setMangaForm({ title: item.title, author: item.author || "" });
      setMangaCoverPreview(item.cover_url);
    } else {
      setMangaForm({ title: "", author: "" });
      setMangaCoverPreview(null);
    }
    setMangaCoverFile(null);
    setMangaModal({ open: true, item });
  };

  const openAnimeModal = (item?: any) => {
    if (item) {
      setAnimeForm({ title: item.title, studio: item.studio || "" });
      setAnimeCoverPreview(item.cover_url);
    } else {
      setAnimeForm({ title: "", studio: "" });
      setAnimeCoverPreview(null);
    }
    setAnimeCoverFile(null);
    setAnimeModal({ open: true, item });
  };

  const handleMangaCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMangaCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setMangaCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnimeCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnimeCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAnimeCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveManga = async () => {
    if (!mangaForm.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    try {
      if (mangaModal.item) {
        // Update
        await updateManga({
          id: mangaModal.item.id,
          title: mangaForm.title,
          author: mangaForm.author,
          coverFile: mangaCoverFile || undefined,
        });
      } else {
        // Create
        if (!mangaCoverFile) {
          toast.error("La couverture est requise");
          return;
        }
        await createManga({
          title: mangaForm.title,
          author: mangaForm.author,
          coverFile: mangaCoverFile,
        });
        toast.success("Manga créé !");
      }
      setMangaModal({ open: false, item: null });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveAnime = async () => {
    if (!animeForm.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    try {
      if (animeModal.item) {
        // Update
        await updateAnime({
          id: animeModal.item.id,
          title: animeForm.title,
          studio: animeForm.studio,
          coverFile: animeCoverFile || undefined,
        });
      } else {
        // Create
        if (!animeCoverFile) {
          toast.error("La couverture est requise");
          return;
        }
        await createAnime({
          title: animeForm.title,
          studio: animeForm.studio,
          coverFile: animeCoverFile,
        });
        toast.success("Anime créé !");
      }
      setAnimeModal({ open: false, item: null });
    } catch (error) {
      console.error(error);
    }
  };

  // Filter data
  const filteredUniverses = universes.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCharacters = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.universe?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMangas = officialMangas.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAnimes = officialAnimes.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.studio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-2">Otaku Database</h1>
          <p className="text-muted-foreground">Contenu culturel & modération de la vitrine cosplay</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1e1e1e] border border-border/50 flex-wrap">
          <TabsTrigger value="universes" className="gap-2 data-[state=active]:bg-sakura/20">
            <Book className="w-4 h-4" />
            Univers
          </TabsTrigger>
          <TabsTrigger value="characters" className="gap-2 data-[state=active]:bg-sakura/20">
            <Database className="w-4 h-4" />
            Personnages
          </TabsTrigger>
          <TabsTrigger value="mangas" className="gap-2 data-[state=active]:bg-sakura/20">
            <BookOpen className="w-4 h-4" />
            Mangathèque
          </TabsTrigger>
          <TabsTrigger value="animes" className="gap-2 data-[state=active]:bg-turquoise/20">
            <Tv className="w-4 h-4" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="cosplays" className="gap-2 data-[state=active]:bg-sakura/20">
            <Camera className="w-4 h-4" />
            Vitrine Cosplay
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1e1e1e] border-border/50"
            />
          </div>
        </div>

        {/* Universes Tab */}
        <TabsContent value="universes" className="mt-4">
          <Card className="p-6 bg-[#1e1e1e] border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Encyclopédie des Univers</h2>
              <Button onClick={() => openUniverseModal()} className="gap-2" size="sm">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>

            {universesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Nom</TableHead>
                    <TableHead>ID Normalisé</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUniverses.map((u) => (
                    <TableRow key={u.id} className="border-border/30 hover:bg-white/5">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {u.name_normalized}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openUniverseModal(u)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => deleteUniverseMutation.mutate(u.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Characters Tab */}
        <TabsContent value="characters" className="mt-4">
          <Card className="p-6 bg-[#1e1e1e] border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Encyclopédie des Personnages</h2>
              <Button onClick={() => openCharacterModal()} className="gap-2" size="sm">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>

            {charactersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Personnage</TableHead>
                    <TableHead>Univers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCharacters.map((c) => (
                    <TableRow key={c.id} className="border-border/30 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.official_image_url && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={c.official_image_url} />
                              <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.universe?.name || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openCharacterModal(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => deleteCharacterMutation.mutate(c.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Mangas Tab - NEW */}
        <TabsContent value="mangas" className="mt-4">
          <Card className="p-6 bg-[#1e1e1e] border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl text-sakura">Mangathèque Officielle</h2>
                <p className="text-sm text-muted-foreground">{officialMangas.length} mangas référencés</p>
              </div>
              <Button onClick={() => openMangaModal()} className="gap-2 bg-sakura hover:bg-sakura/90" size="sm">
                <Plus className="w-4 h-4" />
                Ajouter un Manga
              </Button>
            </div>

            {mangasLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMangas.map((manga) => (
                  <div key={manga.id} className="group relative">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg">
                      <img 
                        src={manga.cover_url} 
                        alt={manga.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium line-clamp-1">{manga.title}</p>
                      {manga.author && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{manga.author}</p>
                      )}
                    </div>
                    {/* Actions overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="w-7 h-7 bg-black/70 hover:bg-black/90"
                        onClick={() => openMangaModal(manga)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="w-7 h-7"
                        onClick={() => deleteManga(manga.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Animes Tab - NEW */}
        <TabsContent value="animes" className="mt-4">
          <Card className="p-6 bg-[#1e1e1e] border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl text-turquoise">Watchlist Officielle</h2>
                <p className="text-sm text-muted-foreground">{officialAnimes.length} animes référencés</p>
              </div>
              <Button onClick={() => openAnimeModal()} className="gap-2 bg-turquoise hover:bg-turquoise/90 text-header-bg" size="sm">
                <Plus className="w-4 h-4" />
                Ajouter un Anime
              </Button>
            </div>

            {animesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-turquoise" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredAnimes.map((anime) => (
                  <div key={anime.id} className="group relative">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg">
                      <img 
                        src={anime.cover_url} 
                        alt={anime.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium line-clamp-1">{anime.title}</p>
                      {anime.studio && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{anime.studio}</p>
                      )}
                    </div>
                    {/* Actions overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="w-7 h-7 bg-black/70 hover:bg-black/90"
                        onClick={() => openAnimeModal(anime)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="w-7 h-7"
                        onClick={() => deleteAnime(anime.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Cosplays Tab */}
        <TabsContent value="cosplays" className="mt-4">
          <Card className="p-6 bg-[#1e1e1e] border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Vitrine Cosplay - Modération</h2>
              <Badge variant="outline" className="text-muted-foreground">
                {cosplays.length} photos récentes
              </Badge>
            </div>

            {cosplaysLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {cosplays.map((c) => (
                  <div 
                    key={c.id} 
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setCosplayPreview({ open: true, item: c })}
                  >
                    <img 
                      src={c.user_image_url} 
                      alt={c.character_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium truncate">{c.character_name}</p>
                        <p className="text-white/70 text-xs truncate">
                          @{c.profile?.username || "?"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCosplayPreview({ open: true, item: c });
                      }}
                    >
                      <Eye className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Universe Modal */}
      <Dialog open={universeModal.open} onOpenChange={(open) => setUniverseModal({ open, item: universeModal.item })}>
        <DialogContent className="bg-[#1e1e1e] border-border/50">
          <DialogHeader>
            <DialogTitle>{universeModal.item ? "Modifier l'univers" : "Ajouter un univers"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de l'univers *</Label>
              <Input
                value={universeForm.name}
                onChange={(e) => setUniverseForm({ name: e.target.value })}
                placeholder="One Piece, Naruto..."
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUniverseModal({ open: false, item: null })}>
              Annuler
            </Button>
            <Button 
              onClick={() => saveUniverseMutation.mutate({ ...universeForm, id: universeModal.item?.id })}
              disabled={saveUniverseMutation.isPending || !universeForm.name}
            >
              {saveUniverseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Character Modal */}
      <Dialog open={characterModal.open} onOpenChange={(open) => setCharacterModal({ open, item: characterModal.item })}>
        <DialogContent className="bg-[#1e1e1e] border-border/50">
          <DialogHeader>
            <DialogTitle>{characterModal.item ? "Modifier le personnage" : "Ajouter un personnage"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du personnage *</Label>
              <Input
                value={characterForm.name}
                onChange={(e) => setCharacterForm({ ...characterForm, name: e.target.value })}
                placeholder="Luffy, Naruto..."
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Univers *</Label>
              <select
                value={characterForm.universe_id}
                onChange={(e) => setCharacterForm({ ...characterForm, universe_id: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background/50 text-foreground"
              >
                <option value="">Sélectionner un univers</option>
                {universes.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>URL de l'image officielle</Label>
              <Input
                value={characterForm.official_image_url}
                onChange={(e) => setCharacterForm({ ...characterForm, official_image_url: e.target.value })}
                placeholder="https://..."
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCharacterModal({ open: false, item: null })}>
              Annuler
            </Button>
            <Button 
              onClick={() => saveCharacterMutation.mutate({ ...characterForm, id: characterModal.item?.id })}
              disabled={saveCharacterMutation.isPending || !characterForm.name || !characterForm.universe_id}
            >
              {saveCharacterMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manga Modal - NEW */}
      <Dialog open={mangaModal.open} onOpenChange={(open) => setMangaModal({ open, item: mangaModal.item })}>
        <DialogContent className="bg-[#1e1e1e] border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sakura">
              {mangaModal.item ? "Modifier le manga" : "Ajouter un manga"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Cover Upload */}
            <div className="flex justify-center">
              <div 
                onClick={() => mangaFileInputRef.current?.click()}
                className="aspect-[2/3] w-32 rounded-lg border-2 border-dashed border-sakura/50 hover:border-sakura bg-sakura/5 hover:bg-sakura/10 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
              >
                {mangaCoverPreview ? (
                  <img src={mangaCoverPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-sakura/70 mb-2" />
                    <span className="text-xs text-sakura/70 text-center px-2">Couverture (2:3)</span>
                  </>
                )}
              </div>
              <input 
                ref={mangaFileInputRef}
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleMangaCoverChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Titre du manga *</Label>
              <Input
                value={mangaForm.title}
                onChange={(e) => setMangaForm({ ...mangaForm, title: e.target.value })}
                placeholder="One Piece, Naruto..."
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Auteur</Label>
              <Input
                value={mangaForm.author}
                onChange={(e) => setMangaForm({ ...mangaForm, author: e.target.value })}
                placeholder="Eiichiro Oda..."
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMangaModal({ open: false, item: null })}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveManga}
              disabled={isCreatingManga || isUpdatingManga || !mangaForm.title || (!mangaModal.item && !mangaCoverFile)}
              className="bg-sakura hover:bg-sakura/90"
            >
              {(isCreatingManga || isUpdatingManga) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anime Modal - NEW */}
      <Dialog open={animeModal.open} onOpenChange={(open) => setAnimeModal({ open, item: animeModal.item })}>
        <DialogContent className="bg-[#1e1e1e] border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-turquoise">
              {animeModal.item ? "Modifier l'anime" : "Ajouter un anime"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Cover Upload */}
            <div className="flex justify-center">
              <div 
                onClick={() => animeFileInputRef.current?.click()}
                className="aspect-[2/3] w-32 rounded-lg border-2 border-dashed border-turquoise/50 hover:border-turquoise bg-turquoise/5 hover:bg-turquoise/10 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
              >
                {animeCoverPreview ? (
                  <img src={animeCoverPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-turquoise/70 mb-2" />
                    <span className="text-xs text-turquoise/70 text-center px-2">Couverture (2:3)</span>
                  </>
                )}
              </div>
              <input 
                ref={animeFileInputRef}
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleAnimeCoverChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Titre de l'anime *</Label>
              <Input
                value={animeForm.title}
                onChange={(e) => setAnimeForm({ ...animeForm, title: e.target.value })}
                placeholder="Demon Slayer, Attack on Titan..."
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Studio</Label>
              <Input
                value={animeForm.studio}
                onChange={(e) => setAnimeForm({ ...animeForm, studio: e.target.value })}
                placeholder="Ufotable, MAPPA..."
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnimeModal({ open: false, item: null })}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveAnime}
              disabled={isCreatingAnime || isUpdatingAnime || !animeForm.title || (!animeModal.item && !animeCoverFile)}
              className="bg-turquoise hover:bg-turquoise/90 text-header-bg"
            >
              {(isCreatingAnime || isUpdatingAnime) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cosplay Preview Modal */}
      <Dialog open={cosplayPreview.open} onOpenChange={(open) => setCosplayPreview({ open, item: cosplayPreview.item })}>
        <DialogContent className="max-w-2xl bg-[#1e1e1e] border-border/50">
          <DialogHeader>
            <DialogTitle>Modération Cosplay</DialogTitle>
          </DialogHeader>
          
          {cosplayPreview.item && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={cosplayPreview.item.profile?.avatar_url} />
                  <AvatarFallback>
                    {cosplayPreview.item.profile?.username?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{cosplayPreview.item.profile?.username || "?"}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(cosplayPreview.item.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Photo membre</Label>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={cosplayPreview.item.user_image_url} 
                      alt="Cosplay"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Référence officielle</Label>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={cosplayPreview.item.official_image_url} 
                      alt="Officiel"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Personnage:</span>{" "}
                  <span className="font-medium">{cosplayPreview.item.character_name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Univers:</span>{" "}
                  <span className="font-medium">{cosplayPreview.item.universe}</span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="destructive" 
              onClick={() => deleteCosplayMutation.mutate(cosplayPreview.item?.id)}
              disabled={deleteCosplayMutation.isPending}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Censurer / Supprimer
            </Button>
            <Button 
              onClick={() => setCosplayPreview({ open: false, item: null })}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDatabase;
