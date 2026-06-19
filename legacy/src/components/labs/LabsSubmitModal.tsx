import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Upload, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateIdea, LabsCategory } from "@/hooks/useLabsIdeas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface LabsSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: { value: LabsCategory; label: string; emoji: string }[] = [
  { value: "event", label: "Événement", emoji: "🎪" },
  { value: "feature", label: "Fonctionnalité", emoji: "⚡" },
  { value: "merch", label: "Merch / Goodies", emoji: "🎁" },
  { value: "other", label: "Autre", emoji: "💡" },
];

export const LabsSubmitModal = ({ open, onOpenChange }: LabsSubmitModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createIdea = useCreateIdea();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<LabsCategory>("other");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    if (!coverFile) {
      toast.error("Une image de couverture est obligatoire");
      return;
    }

    setUploading(true);

    try {
      // Upload cover image
      const fileExt = coverFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("events")
        .upload(fileName, coverFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("events")
        .getPublicUrl(fileName);

      // Create idea
      await createIdea.mutateAsync({
        title,
        description,
        category,
        cover_url: publicUrl,
      });

      onOpenChange(false);
      setTitle("");
      setDescription("");
      setCategory("other");
      setCoverFile(null);
      setCoverPreview(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la soumission");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Lightbulb className="w-6 h-6 text-gold" />
            Soumettre une idée
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gradient-to-r from-gold/10 to-sakura/10 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Décris ton idée comme si tu devais la vendre à la communauté !</strong>
              {" "}Plus ton idée est claire et inspirante, plus elle a de chances de récolter des votes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'idée *</Label>
            <Input
              id="title"
              placeholder="Ex: Un festival cosplay à Lyon !"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as LabsCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée *</Label>
            <Textarea
              id="description"
              placeholder="Décris ton idée en détail : pourquoi c'est génial, comment ça pourrait fonctionner, ce que ça apporterait à la communauté..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Image de couverture *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-sakura/50 transition-colors">
              {coverPreview ? (
                <div className="space-y-4">
                  <img
                    src={coverPreview}
                    alt="Prévisualisation"
                    className="max-h-48 mx-auto rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                  >
                    Changer l'image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique ou glisse une image ici
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Format recommandé : 16:9, min 1280x720px
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="cta"
              disabled={uploading || createIdea.isPending || !title || !description || !coverFile}
              className="flex-1"
            >
              {uploading ? "Upload en cours..." : createIdea.isPending ? "Envoi..." : "Soumettre mon idée 🚀"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
