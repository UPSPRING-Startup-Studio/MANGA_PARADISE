import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { useGuildCategories, useCreateGuild } from "@/hooks/useGuilds";

interface CreateGuildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGuildModal({ open, onOpenChange }: CreateGuildModalProps) {
  const { data: categories } = useGuildCategories();
  const createGuild = useCreateGuild();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accessType, setAccessType] = useState<"public" | "private">("public");
  const [city, setCity] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !categoryId) return;

    try {
      await createGuild.mutateAsync({
        name,
        description,
        category_id: categoryId,
        access_type: accessType,
        city: city || undefined,
        bannerFile: bannerFile || undefined,
      });

      // Reset form on success
      setName("");
      setDescription("");
      setCategoryId("");
      setAccessType("public");
      setCity("");
      setBannerFile(null);
      setBannerPreview(null);
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error("Guild creation failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">⚔️ Créer une Guilde</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Bannière</Label>
            <div 
              className="relative h-32 rounded-lg border-2 border-dashed border-border hover:border-sakura/50 transition-colors overflow-hidden cursor-pointer"
              onClick={() => document.getElementById("banner-upload")?.click()}
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">Cliquer pour uploader</span>
                </div>
              )}
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </div>
          </div>

          {/* Guild Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la guilde *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Les Chasseurs de Titans"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Access Type */}
          <div className="space-y-3">
            <Label>Type d'accès</Label>
            <RadioGroup
              value={accessType}
              onValueChange={(val) => setAccessType(val as "public" | "private")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal cursor-pointer">
                  🌐 Public (tout le monde peut rejoindre)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal cursor-pointer">
                  🔒 Sur candidature
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">Ville (optionnel)</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Paris, Lyon, Toulouse..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre guilde en quelques mots..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full bg-sakura hover:bg-sakura/90"
            disabled={createGuild.isPending || !name || !categoryId}
          >
            {createGuild.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Créer la guilde
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
