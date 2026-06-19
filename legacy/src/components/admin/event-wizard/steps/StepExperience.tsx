/**
 * Step 5: Expérience Participant
 * 
 * Informations demandées aux inscrits, accessibilité, allergies,
 * consentement photo/vidéo, badge pseudo, réseaux sociaux.
 */

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accessibility, Camera, BadgeCheck, AtSign, Heart, ClipboardList, Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INPUT_STYLES,
  type EventWizardFormData,
} from "../eventFormTypes";

interface StepExperienceProps {
  formData: EventWizardFormData;
  onChange: (updates: Partial<EventWizardFormData>) => void;
}

const REQUIRED_FIELD_OPTIONS = [
  { id: "email", label: "Email", default: true },
  { id: "phone", label: "Téléphone" },
  { id: "age", label: "Âge / Date de naissance" },
  { id: "pseudo", label: "Pseudo / Gamertag" },
  { id: "cosplay_character", label: "Personnage cosplayé" },
  { id: "cosplay_universe", label: "Univers du cosplay" },
  { id: "dietary", label: "Régime alimentaire" },
  { id: "emergency_contact", label: "Contact d'urgence" },
  { id: "tshirt_size", label: "Taille de t-shirt" },
  { id: "comments", label: "Commentaires / Remarques" },
];

const StepExperience = ({ formData, onChange }: StepExperienceProps) => {
  const toggleRequiredField = (field: string) => {
    const current = formData.required_fields;
    const updated = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    onChange({ required_fields: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Required Fields */}
      <Card className="p-4">
        <Label className="flex items-center gap-2 mb-3 text-sm font-medium">
          <ClipboardList className="w-4 h-4 text-sakura" />
          Informations demandées aux inscrits
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Sélectionne les champs que les participants devront remplir lors de l'inscription.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {REQUIRED_FIELD_OPTIONS.map((field) => {
            const isChecked = formData.required_fields.includes(field.id);
            return (
              <label
                key={field.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm",
                  isChecked
                    ? "border-sakura/30 bg-sakura/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleRequiredField(field.id)}
                  className="data-[state=checked]:bg-sakura data-[state=checked]:border-sakura"
                />
                <span className="text-xs">{field.label}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Accessibility */}
      <Card className="p-4">
        <Label className="flex items-center gap-2 mb-3 text-sm font-medium">
          <Accessibility className="w-4 h-4 text-turquoise" />
          Accessibilité
        </Label>
        <Textarea
          value={formData.accessibility_info}
          onChange={(e) => onChange({ accessibility_info: e.target.value })}
          placeholder="Ex: Accès PMR, interprète LSF, sous-titrage, espace calme disponible..."
          rows={3}
          className={`resize-none ${INPUT_STYLES}`}
        />
      </Card>

      {/* Toggle Options */}
      <div className="space-y-3">
        {/* Allergies */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium text-sm">Allergies / Besoins spécifiques</p>
              <p className="text-xs text-muted-foreground">
                Demander aux inscrits leurs allergies ou besoins alimentaires
              </p>
            </div>
          </div>
          <Switch
            checked={formData.allergy_field_enabled}
            onCheckedChange={(v) => onChange({ allergy_field_enabled: v })}
          />
        </div>

        {/* Photo/Video Consent */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-blue-400" />
            <div>
              <p className="font-medium text-sm">Consentement photo / vidéo</p>
              <p className="text-xs text-muted-foreground">
                Demander le consentement pour la captation d'images
              </p>
            </div>
          </div>
          <Switch
            checked={formData.photo_consent_required}
            onCheckedChange={(v) => onChange({ photo_consent_required: v })}
          />
        </div>

        {/* Badge Pseudo */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-5 h-5 text-sakura" />
            <div>
              <p className="font-medium text-sm">Pseudo sur le badge</p>
              <p className="text-xs text-muted-foreground">
                Afficher le pseudo Manga Paradise sur le badge participant
              </p>
            </div>
          </div>
          <Switch
            checked={formData.badge_pseudo_enabled}
            onCheckedChange={(v) => onChange({ badge_pseudo_enabled: v })}
          />
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <AtSign className="w-5 h-5 text-purple-400" />
            <div>
              <p className="font-medium text-sm">Réseaux sociaux optionnels</p>
              <p className="text-xs text-muted-foreground">
                Permettre aux inscrits de partager leurs réseaux (Twitter, Instagram, TikTok)
              </p>
            </div>
          </div>
          <Switch
            checked={formData.social_links_enabled}
            onCheckedChange={(v) => onChange({ social_links_enabled: v })}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default StepExperience;
