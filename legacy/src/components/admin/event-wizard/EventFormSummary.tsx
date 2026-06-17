/**
 * EventFormSummary — Résumé latéral sticky
 * 
 * Affiche un aperçu en temps réel des informations clés de l'événement
 * pendant que l'utilisateur remplit le formulaire.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, MapPin, Users, Ticket, Tag, Image as ImageIcon, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  EVENT_PRESETS,
  POP_CULTURE_MODULES,
  type EventWizardFormData,
} from "./eventFormTypes";

interface EventFormSummaryProps {
  formData: EventWizardFormData;
}

const EventFormSummary = ({ formData }: EventFormSummaryProps) => {
  const preset = EVENT_PRESETS.find((p) => p.id === formData.preset);
  const validDates = formData.schedule.filter((d) => d.date);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="p-4 space-y-4 border-sakura/20 bg-gradient-to-b from-sakura/[0.03] to-transparent">
      {/* Header */}
      <div className="text-center border-b border-border pb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-display">
          Aperçu
        </p>
      </div>

      {/* Cover Image Preview */}
      {formData.image_url ? (
        <div className="relative w-full h-24 rounded-lg overflow-hidden">
          <img
            src={formData.image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {preset && (
            <Badge className="absolute bottom-2 left-2 text-[9px] bg-black/50 text-white border-0">
              {preset.icon} {preset.label}
            </Badge>
          )}
        </div>
      ) : (
        <div className="w-full h-24 rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-border">
          <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
        </div>
      )}

      {/* Title */}
      <div>
        <h4 className="font-display text-base tracking-wide line-clamp-2">
          {formData.title || "Titre de l'événement"}
        </h4>
        {formData.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{formData.subtitle}</p>
        )}
      </div>

      {/* Info Rows */}
      <div className="space-y-2.5 text-xs">
        {/* Category */}
        <SummaryRow
          icon={<Tag className="w-3 h-3" />}
          label="Catégorie"
          value={formData.category !== "general" ? formData.category : undefined}
          fallback="Non définie"
        />

        {/* Dates */}
        <SummaryRow
          icon={<Calendar className="w-3 h-3" />}
          label="Dates"
          value={
            validDates.length > 0
              ? validDates.length === 1
                ? formatDate(validDates[0].date)
                : `${formatDate(validDates[0].date)} — ${formatDate(validDates[validDates.length - 1].date)}`
              : undefined
          }
          fallback="Non définies"
        />

        {/* Format */}
        <SummaryRow
          icon={<Globe className="w-3 h-3" />}
          label="Format"
          value={formData.format === "presentiel" ? "Présentiel" : formData.format === "hybride" ? "Hybride" : "En ligne"}
        />

        {/* Location */}
        {formData.format !== "en-ligne" && (
          <SummaryRow
            icon={<MapPin className="w-3 h-3" />}
            label="Lieu"
            value={
              [formData.venue_name, formData.city].filter(Boolean).join(", ") || undefined
            }
            fallback="Non défini"
          />
        )}

        {/* Capacity */}
        <SummaryRow
          icon={<Users className="w-3 h-3" />}
          label="Capacité"
          value={
            formData.is_capacity_limited && formData.max_attendees
              ? `${formData.max_attendees} places`
              : "Illimitée"
          }
        />

        {/* Pricing */}
        <SummaryRow
          icon={<Ticket className="w-3 h-3" />}
          label="Tarif"
          value={
            formData.is_free
              ? "Gratuit"
              : formData.price_amount
                ? `${formData.price_amount} EUR`
                : "Payant"
          }
        />
      </div>

      {/* Tags */}
      {formData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {formData.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[9px] px-1.5 py-0.5 bg-sakura/5 text-sakura border-sakura/20"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Active Modules */}
      {formData.enabled_modules.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-display">
            Modules actifs
          </p>
          <div className="flex flex-wrap gap-1">
            {formData.enabled_modules.map((modId) => {
              const mod = POP_CULTURE_MODULES.find((m) => m.id === modId);
              if (!mod) return null;
              return (
                <Badge
                  key={modId}
                  variant="outline"
                  className="text-[9px] px-1.5 py-0.5"
                >
                  {mod.icon} {mod.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

// ─── Reusable Summary Row ─────────────────────────────────────────

interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  fallback?: string;
}

const SummaryRow = ({ icon, label, value, fallback = "—" }: SummaryRowProps) => (
  <div className="flex items-start gap-2">
    <div className="text-sakura mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn(
        "text-xs font-medium truncate",
        value ? "text-foreground" : "text-muted-foreground/50"
      )}>
        {value || fallback}
      </p>
    </div>
  </div>
);

export default EventFormSummary;
