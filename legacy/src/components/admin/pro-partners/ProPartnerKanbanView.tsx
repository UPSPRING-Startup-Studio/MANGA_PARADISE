import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Globe, Star, Plus } from "lucide-react";
import {
  type ProPartner,
  PRO_PARTNER_TYPE_LABELS,
  DIRECTORY_CATEGORY_LABELS,
  PARTNER_STATUS_LABELS,
  PARTNER_STATUS_COLORS,
  type DirectoryCategory,
  type PartnerStatus,
} from "@/hooks/useProPartner";
import PartnerAvatar from "./PartnerAvatar";

// ──────────────────────────────────────────────
// Groupement config
// ──────────────────────────────────────────────

export type KanbanGroupBy = "category" | "partner_status" | "type" | "city";

const CATEGORY_COLUMNS: { key: string; label: string; emoji: string; headerColor: string }[] = [
  { key: "acteurs_publics", label: "Acteurs publics", emoji: "🏛️", headerColor: "border-b-blue-500/50" },
  { key: "boutiques_librairies", label: "Boutiques & librairies", emoji: "🛍️", headerColor: "border-b-amber-500/50" },
  { key: "cinemas", label: "Cinémas", emoji: "🎬", headerColor: "border-b-violet-500/50" },
  { key: "restauration", label: "Restauration", emoji: "🍽️", headerColor: "border-b-red-500/50" },
  { key: "evenements_lieux_culturels", label: "Événements & lieux culturels", emoji: "🎉", headerColor: "border-b-emerald-500/50" },
  { key: "partenaires_associatifs", label: "Partenaires associatifs", emoji: "🧩", headerColor: "border-b-pink-500/50" },
  { key: "artistes_createurs", label: "Artistes & créateurs", emoji: "🎨", headerColor: "border-b-cyan-500/50" },
  { key: "entreprises_marques", label: "Entreprises & marques", emoji: "🏢", headerColor: "border-b-gray-500/50" },
  { key: "__none__", label: "Non catégorisé", emoji: "📁", headerColor: "border-b-slate-500/50" },
];

const PARTNER_STATUS_COLUMNS: { key: string; label: string; emoji: string; headerColor: string }[] = [
  { key: "opportunite", label: "Opportunité", emoji: "🟠", headerColor: "border-b-orange-500/50" },
  { key: "mail_envoye", label: "Mail envoyé", emoji: "🟡", headerColor: "border-b-yellow-500/50" },
  { key: "en_cours_edition", label: "En cours d'édition", emoji: "🔵", headerColor: "border-b-blue-500/50" },
  { key: "attente_signature", label: "Attente de signature", emoji: "🟣", headerColor: "border-b-violet-500/50" },
  { key: "accord_principe", label: "Accord de principe", emoji: "🩵", headerColor: "border-b-cyan-500/50" },
  { key: "convention_signee", label: "Convention signée", emoji: "🟢", headerColor: "border-b-emerald-500/50" },
];

const STATUS_COLUMNS = [
  { key: "draft", label: "Brouillon", emoji: "📝", headerColor: "border-b-blue-500/50" },
  { key: "active", label: "Actif", emoji: "✅", headerColor: "border-b-emerald-500/50" },
  { key: "suspended", label: "Suspendu", emoji: "⏸️", headerColor: "border-b-amber-500/50" },
  { key: "archived", label: "Archivé", emoji: "📦", headerColor: "border-b-slate-500/50" },
];

function getColumnsForGroupBy(groupBy: KanbanGroupBy, partners: (ProPartner & { event_count: number })[]) {
  switch (groupBy) {
    case "category":
      return CATEGORY_COLUMNS;
    case "partner_status":
      return PARTNER_STATUS_COLUMNS;
    case "type": {
      const types = [...new Set(partners.map((p) => p.type))].sort();
      return types.map((t) => ({ key: t, label: PRO_PARTNER_TYPE_LABELS[t] || t, emoji: "🏷️", headerColor: "border-b-slate-500/50" }));
    }
    case "city": {
      const cities = [...new Set(partners.map((p) => p.city || "__none__"))].sort();
      return cities.map((c) => ({
        key: c,
        label: c === "__none__" ? "Ville non renseignée" : c,
        emoji: "📍",
        headerColor: "border-b-slate-500/50",
      }));
    }
    default:
      return CATEGORY_COLUMNS;
  }
}

function getPartnerGroupKey(partner: ProPartner, groupBy: KanbanGroupBy): string {
  switch (groupBy) {
    case "category":
      return partner.directory_category || "__none__";
    case "partner_status":
      return (partner as any).partner_status || "opportunite";
    case "type":
      return partner.type;
    case "city":
      return partner.city || "__none__";
    default:
      return "__none__";
  }
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

interface ProPartnerKanbanViewProps {
  partners: (ProPartner & { event_count: number })[];
  onSelect: (partner: ProPartner & { event_count: number }) => void;
  onCreateInCategory?: (category: string) => void;
}

export default function ProPartnerKanbanView({ partners, onSelect, onCreateInCategory }: ProPartnerKanbanViewProps) {
  const [groupBy, setGroupBy] = useState<KanbanGroupBy>("category");

  const columns = getColumnsForGroupBy(groupBy, partners);

  const grouped = columns
    .map((col) => {
      const items = partners.filter((p) => getPartnerGroupKey(p, groupBy) === col.key);
      return { ...col, items };
    })
    .filter((col) => col.items.length > 0 || groupBy === "category");

  return (
    <div className="space-y-4">
      {/* Groupement selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-mp-ink-muted">Grouper par :</span>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as KanbanGroupBy)}>
          <SelectTrigger className="w-44 h-8 text-xs bg-white border-slate-600 text-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[200]">
            <SelectItem value="category">Catégorie annuaire</SelectItem>
            <SelectItem value="partner_status">Pipeline CRM</SelectItem>
            <SelectItem value="type">Type juridique</SelectItem>
            <SelectItem value="city">Ville</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban board */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {grouped.map((col) => (
            <div
              key={col.key}
              className={`w-[280px] shrink-0 rounded-xl bg-white/30 border border-mp-border/40 border-b-2 ${col.headerColor}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <h4 className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                  <span>{col.emoji}</span>
                  {col.label}
                </h4>
                <Badge variant="outline" className="text-[10px] text-mp-ink-muted border-slate-600 ml-2 shrink-0">
                  {col.items.length}
                </Badge>
              </div>

              {/* Column cards */}
              <div className="px-2 pb-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {col.items.length === 0 ? (
                  <p className="text-[11px] text-mp-ink-muted text-center py-6">Vide</p>
                ) : (
                  col.items.map((partner) => (
                    <KanbanCard
                      key={partner.id}
                      partner={partner}
                      onClick={() => onSelect(partner)}
                      groupBy={groupBy}
                    />
                  ))
                )}
              </div>

              {/* Add button */}
              {onCreateInCategory && groupBy === "category" && col.key !== "__none__" && (
                <div className="px-2 pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[11px] text-mp-ink-muted hover:text-slate-300 hover:bg-mp-cloud/30"
                    onClick={() => onCreateInCategory(col.key)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ──────────────────────────────────────────────
// Kanban Card
// ──────────────────────────────────────────────

function KanbanCard({
  partner,
  onClick,
  groupBy,
}: {
  partner: ProPartner & { event_count: number };
  onClick: () => void;
  groupBy: KanbanGroupBy;
}) {
  const partnerStatus = (partner as any).partner_status as PartnerStatus | undefined;

  return (
    <Card
      className="bg-mp-paper/80 border-mp-border/40 hover:border-[#E84A2B]/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          <PartnerAvatar
            logoUrl={partner.logo_url}
            name={partner.name}
            category={partner.directory_category}
            size="sm"
          />
          <div className="flex-1 min-w-0 space-y-1.5">
            <h5 className="text-sm font-medium text-slate-100 truncate leading-tight">
              {partner.name}
            </h5>

            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[8px] text-cyan-400 border-cyan-500/30 py-0 px-1.5">
                {PRO_PARTNER_TYPE_LABELS[partner.type] || partner.type}
              </Badge>
              {groupBy !== "category" && partner.directory_category && (
                <Badge variant="outline" className="text-[8px] text-purple-400 border-purple-500/30 py-0 px-1.5">
                  {DIRECTORY_CATEGORY_LABELS[partner.directory_category as DirectoryCategory] || partner.directory_category}
                </Badge>
              )}
              {groupBy !== "partner_status" && partnerStatus && partnerStatus !== "opportunite" && (
                <Badge variant="outline" className={`text-[8px] py-0 px-1.5 ${PARTNER_STATUS_COLORS[partnerStatus] || ""}`}>
                  {PARTNER_STATUS_LABELS[partnerStatus] || partnerStatus}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-mp-ink-muted">
              {partner.city && (
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {partner.city}
                </span>
              )}
              {partner.is_public && <Globe className="h-3 w-3 text-cyan-400 shrink-0" />}
              {partner.is_featured && <Star className="h-3 w-3 text-yellow-400 shrink-0" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
