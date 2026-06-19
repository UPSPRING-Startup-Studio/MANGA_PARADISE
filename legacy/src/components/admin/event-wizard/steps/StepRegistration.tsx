/**
 * Step 3: Inscriptions & Capacité
 * 
 * Type d'inscription, dates d'ouverture/fermeture,
 * capacité, liste d'attente, check-in QR, accompagnants.
 */

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Users, QrCode, UserPlus, Clock, Shield, ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INPUT_STYLES,
  REGISTRATION_TYPES,
  type EventWizardFormData,
  type RegistrationType,
} from "../eventFormTypes";

interface StepRegistrationProps {
  formData: EventWizardFormData;
  onChange: (updates: Partial<EventWizardFormData>) => void;
}

const StepRegistration = ({ formData, onChange }: StepRegistrationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Registration Type Cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-sakura" />
          Type d'inscription
        </Label>
        <div className="space-y-2">
          {REGISTRATION_TYPES.map((type) => (
            <Card
              key={type.value}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer transition-all duration-200",
                formData.registration_type === type.value
                  ? "border-2 border-sakura bg-sakura/5"
                  : "border border-border hover:border-sakura/50 hover:bg-muted/30"
              )}
              onClick={() => onChange({ registration_type: type.value as RegistrationType })}
            >
              <div className="text-xl mt-0.5">{type.icon}</div>
              <div className="flex-1">
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                formData.registration_type === type.value
                  ? "border-sakura"
                  : "border-muted-foreground/30"
              )}>
                {formData.registration_type === type.value && (
                  <div className="w-2 h-2 rounded-full bg-sakura" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Registration Dates */}
      <Card className="p-4">
        <Label className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Clock className="w-4 h-4 text-turquoise" />
          Période d'inscription
        </Label>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ouverture des inscriptions</Label>
            <Input
              type="datetime-local"
              value={formData.registration_open_date}
              onChange={(e) => onChange({ registration_open_date: e.target.value })}
              className={INPUT_STYLES}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fermeture des inscriptions</Label>
            <Input
              type="datetime-local"
              value={formData.registration_close_date}
              onChange={(e) => onChange({ registration_close_date: e.target.value })}
              className={INPUT_STYLES}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Laissez vide pour ouvrir/fermer manuellement.
        </p>
      </Card>

      {/* Capacity */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-sakura" />
            Capacité
          </Label>
          <div className="flex items-center gap-3">
            <span className={cn("text-xs", !formData.is_capacity_limited && "text-sakura font-medium")}>
              Illimité
            </span>
            <Switch
              checked={formData.is_capacity_limited}
              onCheckedChange={(checked) =>
                onChange({ is_capacity_limited: checked, max_attendees: "" })
              }
            />
            <span className={cn("text-xs", formData.is_capacity_limited && "text-sakura font-medium")}>
              Limité
            </span>
          </div>
        </div>

        {formData.is_capacity_limited && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={formData.max_attendees}
                onChange={(e) => onChange({ max_attendees: e.target.value })}
                placeholder="100"
                className={`w-32 ${INPUT_STYLES}`}
              />
              <span className="text-sm text-muted-foreground">personnes max.</span>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Options Row */}
      <div className="space-y-3">
        {/* Waitlist */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <ListOrdered className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Liste d'attente</p>
              <p className="text-xs text-muted-foreground">
                Accepter les inscriptions après la jauge
              </p>
            </div>
          </div>
          <Switch
            checked={formData.enable_waitlist}
            onCheckedChange={(v) => onChange({ enable_waitlist: v })}
          />
        </div>

        {/* QR Check-in */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Check-in QR Code</p>
              <p className="text-xs text-muted-foreground">
                Scanner les participants à l'entrée
              </p>
            </div>
          </div>
          <Switch
            checked={formData.enable_qr_checkin}
            onCheckedChange={(v) => onChange({ enable_qr_checkin: v })}
          />
        </div>

        {/* Companions */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Accompagnants / Invités</p>
              <p className="text-xs text-muted-foreground">
                Permettre aux inscrits d'ajouter des accompagnants
              </p>
            </div>
          </div>
          <Switch
            checked={formData.allow_companions}
            onCheckedChange={(v) => onChange({ allow_companions: v })}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default StepRegistration;
