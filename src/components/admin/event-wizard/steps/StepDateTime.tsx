/**
 * Step 2: Date & Lieu
 * 
 * Format (présentiel/hybride/en ligne), planning multi-jours,
 * lieu/salle, ville, région, infos d'accès, URL en ligne.
 */

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  MapPin, Building, Map, Globe, Info 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import EventScheduleForm from "../../EventScheduleForm";
import {
  INPUT_STYLES,
  SELECT_STYLES,
  REGIONS_DATA,
  EVENT_FORMATS,
  type EventWizardFormData,
  type EventFormat,
} from "../eventFormTypes";

interface StepDateTimeProps {
  formData: EventWizardFormData;
  onChange: (updates: Partial<EventWizardFormData>) => void;
}

const StepDateTime = ({ formData, onChange }: StepDateTimeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Event Format Cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Format de l'événement *</Label>
        <div className="grid grid-cols-3 gap-3">
          {EVENT_FORMATS.map((fmt) => (
            <Card
              key={fmt.value}
              className={cn(
                "p-3 cursor-pointer transition-all duration-200 text-center",
                "hover:border-sakura/50 hover:-translate-y-0.5",
                formData.format === fmt.value
                  ? "border-2 border-sakura bg-sakura/5 shadow-[0_0_12px_rgba(255,107,190,0.2)]"
                  : "border border-border hover:bg-muted/30"
              )}
              onClick={() => onChange({ format: fmt.value as EventFormat })}
            >
              <div className="text-2xl mb-1">{fmt.icon}</div>
              <p className="text-xs font-medium">{fmt.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{fmt.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule Section */}
      <Card className="p-4 border-sakura/20 bg-sakura/5">
        <EventScheduleForm
          schedule={formData.schedule}
          onChange={(schedule) => onChange({ schedule })}
        />
      </Card>

      {/* Location Section — Hidden for online-only */}
      {formData.format !== "en-ligne" && (
        <Card className="p-4">
          <Label className="flex items-center gap-2 mb-4 text-sm font-medium">
            <MapPin className="w-4 h-4 text-sakura" />
            Localisation
          </Label>

          <div className="space-y-4">
            {/* Venue */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Building className="w-3 h-3" />
                Lieu / Salle
              </Label>
              <Input
                value={formData.venue_name}
                onChange={(e) => onChange({ venue_name: e.target.value })}
                placeholder="Ex: Palais des Festivals"
                className={INPUT_STYLES}
              />
            </div>

            {/* City & Region */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Ville
                </Label>
                <Input
                  value={formData.city}
                  onChange={(e) => onChange({ city: e.target.value })}
                  placeholder="Ex: Cannes"
                  className={INPUT_STYLES}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Map className="w-3 h-3" />
                  Région / Département
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(v) => onChange({ region: v })}
                >
                  <SelectTrigger className={SELECT_STYLES}>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-white dark:bg-white">
                    {REGIONS_DATA.map((region) => (
                      <SelectGroup key={region.label}>
                        <SelectLabel className="text-xs font-bold text-sakura py-2">
                          {region.label}
                        </SelectLabel>
                        {region.options.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Access Info */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Informations d'accès (optionnel)
              </Label>
              <Textarea
                value={formData.access_info}
                onChange={(e) => onChange({ access_info: e.target.value })}
                placeholder="Transports en commun, parking, entrée handicapé, etc."
                rows={2}
                className={`resize-none ${INPUT_STYLES}`}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Online URL — Shown for hybride & en-ligne */}
      {(formData.format === "hybride" || formData.format === "en-ligne") && (
        <Card className="p-4 border-turquoise/20 bg-turquoise/5">
          <Label className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Globe className="w-4 h-4 text-turquoise" />
            Lien en ligne
          </Label>
          <Input
            type="url"
            value={formData.online_url}
            onChange={(e) => onChange({ online_url: e.target.value })}
            placeholder="Ex: https://discord.gg/... ou https://twitch.tv/..."
            className={INPUT_STYLES}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Lien Discord, Twitch, Zoom ou toute plateforme de streaming/visio.
          </p>
        </Card>
      )}
    </motion.div>
  );
};

export default StepDateTime;
