import { useState } from "react";
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
import { CalendarDays, Globe, MapPin, Loader2 } from "lucide-react";
import { useCreateGuildEvent } from "@/hooks/useGuildEvents";

interface CreateGuildEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildId: string;
}

export function CreateGuildEventModal({ 
  open, 
  onOpenChange, 
  guildId 
}: CreateGuildEventModalProps) {
  const createEvent = useCreateGuildEvent();
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location_type: "online" as "online" | "irl",
    location_address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.start_date || !form.start_time) {
      return;
    }

    const start_time = new Date(`${form.start_date}T${form.start_time}`).toISOString();
    let end_time: string | undefined;
    
    if (form.end_date && form.end_time) {
      end_time = new Date(`${form.end_date}T${form.end_time}`).toISOString();
    }

    createEvent.mutate({
      guild_id: guildId,
      title: form.title,
      description: form.description || undefined,
      start_time,
      end_time,
      location_type: form.location_type,
      location_address: form.location_address || undefined,
    }, {
      onSuccess: () => {
        setForm({
          title: "",
          description: "",
          start_date: "",
          start_time: "",
          end_date: "",
          end_time: "",
          location_type: "online",
          location_address: "",
        });
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-sakura" />
            Créer un événement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Titre de l'événement *</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Réunion de guilde, Sortie convention..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez l'événement..."
              rows={3}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début *</Label>
              <Input
                id="start-date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Heure de début *</Label>
              <Input
                id="start-time"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Heure de fin</Label>
              <Input
                id="end-time"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Location Type */}
          <div className="space-y-2">
            <Label>Type de lieu</Label>
            <Select 
              value={form.location_type}
              onValueChange={(value: "online" | "irl") => setForm(prev => ({ ...prev, location_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    En ligne
                  </div>
                </SelectItem>
                <SelectItem value="irl">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    En présentiel (IRL)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Address (for IRL) */}
          {form.location_type === "irl" && (
            <div className="space-y-2">
              <Label htmlFor="location-address">Adresse / Lieu</Label>
              <Input
                id="location-address"
                value={form.location_address}
                onChange={(e) => setForm(prev => ({ ...prev, location_address: e.target.value }))}
                placeholder="Adresse ou nom du lieu..."
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-sakura hover:bg-sakura/90"
              disabled={createEvent.isPending || !form.title || !form.start_date || !form.start_time}
            >
              {createEvent.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CalendarDays className="w-4 h-4 mr-2" />
              )}
              Créer l'événement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
