import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Wrench,
  Camera as CameraIcon,
  MapPin,
  User,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreatePost } from "@/hooks/usePosts";
import { useCosplayVestiaire } from "@/hooks/useCosplayVestiaire";
import { useEvents } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface SmartPostCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userAvatar?: string | null;
}

const SmartPostCreator = ({
  open,
  onOpenChange,
  userId,
  userName,
  userAvatar,
}: SmartPostCreatorProps) => {
  const [postType, setPostType] = useState<"wip" | "showcase">("showcase");
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCosplayId, setSelectedCosplayId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [photographerSearch, setPhotographerSearch] = useState("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<{ id: string; display_name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPostMutation = useCreatePost();

  // Fetch user's cosplays
  const { data: cosplays = [] } = useCosplayVestiaire(userId);

  // Fetch events
  const { data: events = [] } = useEvents();

  // Search photographers
  const { data: photographers = [] } = useQuery({
    queryKey: ["photographer-search", photographerSearch],
    queryFn: async () => {
      if (photographerSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .or(`display_name.ilike.%${photographerSearch}%,username.ilike.%${photographerSearch}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: photographerSearch.length >= 2,
  });

  // Filter upcoming events
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.date >= today || (e.end_date && e.end_date >= today));
  }, [events]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile && !caption.trim()) {
      toast.error("Ajoute au moins une photo ou une description");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl: string | undefined;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("cosplays")
          .upload(`posts/${fileName}`, mediaFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("cosplays")
          .getPublicUrl(`posts/${fileName}`);

        mediaUrl = urlData.publicUrl;
      }

      await createPostMutation.mutateAsync({
        authorId: userId,
        contentType: mediaFile ? (mediaFile.type.startsWith("video/") ? "video" : "image") : "text",
        category: "cosplay",
        content: caption.trim() || undefined,
        mediaUrl,
        postType,
        relatedCosplayId: selectedCosplayId || undefined,
        relatedEventId: selectedEventId || undefined,
        taggedPhotographerId: selectedPhotographer?.id || undefined,
      });

      // Reset form
      setCaption("");
      setPostType("showcase");
      setSelectedCosplayId("");
      setSelectedEventId("");
      setSelectedPhotographer(null);
      handleRemoveMedia();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#362F4B] border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sakura" />
            Nouveau Smart Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Author preview */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <Avatar className="w-10 h-10 border-2 border-sakura/30">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-sakura/20 text-sakura">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-turquoise flex items-center gap-1">
                💡 Poster rapporte +10 XP
              </p>
            </div>
          </div>

          {/* Media Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
              isDragging ? "border-sakura bg-sakura/10" : "border-white/20 hover:border-white/40",
              mediaPreview ? "aspect-video" : "aspect-[16/10]"
            )}
          >
            {mediaPreview ? (
              <>
                {mediaFile?.type.startsWith("video/") ? (
                  <video src={mediaPreview} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Glisse ta photo ici</p>
                <p className="text-muted-foreground text-xs mt-1">ou clique pour sélectionner</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />
          </div>

          {/* Post Type Switch */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Type de post</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={postType === "wip" ? "default" : "outline"}
                onClick={() => setPostType("wip")}
                className={cn(
                  "gap-2 justify-start h-12",
                  postType === "wip"
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30"
                    : "border-white/10 hover:bg-white/5"
                )}
              >
                <Wrench className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">🛠️ WIP</p>
                  <p className="text-[10px] opacity-70">Work In Progress</p>
                </div>
              </Button>
              <Button
                type="button"
                variant={postType === "showcase" ? "default" : "outline"}
                onClick={() => setPostType("showcase")}
                className={cn(
                  "gap-2 justify-start h-12",
                  postType === "showcase"
                    ? "bg-turquoise/20 text-turquoise border-turquoise/50 hover:bg-turquoise/30"
                    : "border-white/10 hover:bg-white/5"
                )}
              >
                <CameraIcon className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">✨ Showcase</p>
                  <p className="text-[10px] opacity-70">Photo finale</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Smart Context Selectors */}
          <div className="space-y-3 p-4 bg-white/5 rounded-xl">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              🔗 Contexte Intelligent
            </p>

            {/* Cosplay selector */}
            {cosplays.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Quel cosplay ?
                </Label>
                <Select value={selectedCosplayId} onValueChange={setSelectedCosplayId}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-9">
                    <SelectValue placeholder="Sélectionner un cosplay..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#362F4B] border-white/10">
                    <SelectItem value="">Aucun</SelectItem>
                    {cosplays.map((cosplay) => (
                      <SelectItem key={cosplay.id} value={cosplay.id}>
                        {cosplay.character_name} ({cosplay.universe})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Event selector */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Quel événement ?
              </Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9">
                  <SelectValue placeholder="Sélectionner un événement..." />
                </SelectTrigger>
                <SelectContent className="bg-[#362F4B] border-white/10 max-h-48">
                  <SelectItem value="">Aucun</SelectItem>
                  {upcomingEvents.slice(0, 20).map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      📍 {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Photographer search */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                Crédit photographe
              </Label>
              {selectedPhotographer ? (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <Badge variant="secondary" className="bg-sakura/20 text-sakura gap-1">
                    📸 @{selectedPhotographer.display_name}
                    <button onClick={() => setSelectedPhotographer(null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={photographerSearch}
                    onChange={(e) => setPhotographerSearch(e.target.value)}
                    className="bg-white/5 border-white/10 h-9 pl-8"
                  />
                  {photographers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[#362F4B] border border-white/10 rounded-lg overflow-hidden">
                      {photographers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPhotographer({ id: p.id, display_name: p.display_name || p.username || 'User' });
                            setPhotographerSearch("");
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-sakura/20 text-sakura">
                              {(p.display_name || p.username || "U").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{p.display_name || p.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Description</Label>
            <Textarea
              placeholder="Décris ton cosplay, ton avancement, tes techniques... 🌸"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-sakura/50 min-h-[80px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/1000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!caption.trim() && !mediaFile)}
            className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              "Publier"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartPostCreator;
