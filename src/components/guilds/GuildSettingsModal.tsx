import { useState, useEffect } from "react";
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
import { Edit, Loader2, Save } from "lucide-react";
import { GuildWithDetails, useUpdateGuild } from "@/hooks/useGuildDetails";

interface GuildSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildId: string;
  guild: GuildWithDetails;
}

export function GuildSettingsModal({ 
  open, 
  onOpenChange,
  guildId,
  guild
}: GuildSettingsModalProps) {
  const updateGuild = useUpdateGuild();
  
  const [form, setForm] = useState({
    name: guild.name,
    description: guild.description || "",
    city: guild.city || "",
    access_type: guild.access_type as "public" | "private",
  });

  // Reset form when guild changes
  useEffect(() => {
    setForm({
      name: guild.name,
      description: guild.description || "",
      city: guild.city || "",
      access_type: guild.access_type as "public" | "private",
    });
  }, [guild]);

  const handleSave = () => {
    updateGuild.mutate({
      guildId,
      data: {
        name: form.name,
        description: form.description || null,
        city: form.city?.trim() || null,
        access_type: form.access_type,
      },
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-muted-foreground" />
            Paramètres de la guilde
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guild-name">Nom de la guilde</Label>
            <Input
              id="guild-name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nom de la guilde"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guild-description">Description</Label>
            <Textarea
              id="guild-description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre guilde..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guild-city">Ville (optionnel)</Label>
            <Input
              id="guild-city"
              value={form.city}
              onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Paris, Lyon, Marseille..."
            />
          </div>

          <div className="space-y-2">
            <Label>Type d'accès</Label>
            <Select 
              value={form.access_type} 
              onValueChange={(value: "public" | "private") => setForm(prev => ({ ...prev, access_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Tout le monde peut rejoindre</SelectItem>
                <SelectItem value="private">Candidature - Validation requise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSave}
            disabled={updateGuild.isPending || !form.name}
            className="w-full bg-sakura hover:bg-sakura/90"
          >
            {updateGuild.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
