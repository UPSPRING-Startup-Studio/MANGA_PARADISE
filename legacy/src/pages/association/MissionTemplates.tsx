import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Layers,
  Plus,
  Copy,
  Pencil,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMissionTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDuplicateTemplate,
  POLE_OPTIONS,
  MISSION_TYPE_OPTIONS,
  type MissionTemplate,
} from "@/hooks/association/useMissionSchema";
import {
  LEADER_ROLES,
  type Association,
  type AssociationRole,
} from "@/hooks/useAssociation";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const BUREAU_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "secretaire",
  "tresorier",
];

const NONE_VALUE = "__none__";

const MissionTemplatesPage = () => {
  const { association, role: viewerRole } =
    useOutletContext<AssociationContext>();
  const associationId = association?.id;
  const isBureau = viewerRole ? BUREAU_ROLES.includes(viewerRole) : false;

  const {
    data: templates,
    isLoading,
    error,
    refetch,
  } = useMissionTemplates(associationId);
  const duplicateTemplate = useDuplicateTemplate();

  const [search, setSearch] = useState("");
  const [editSheet, setEditSheet] = useState<{
    open: boolean;
    template: MissionTemplate | null;
  }>({ open: false, template: null });

  const filtered = useMemo(() => {
    if (!templates) return [];
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.pole || "").toLowerCase().includes(q) ||
        (t.mission_type || "").toLowerCase().includes(q)
    );
  }, [templates, search]);

  // Guard: no association loaded yet
  if (!association) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Templates de mission
          </h1>
          <p className="text-muted-foreground mt-1">
            Modèles réutilisables pour créer des missions rapidement
          </p>
        </div>
        {isBureau && (
          <Button
            onClick={() => setEditSheet({ open: true, template: null })}
            className="gap-2 bg-emerald-600 hover:bg-emerald-600/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Créer un template
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-6 bg-red-500/5 border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">
                Erreur de chargement
              </p>
              <p className="text-xs text-red-300/70 mt-1">
                {(error as Error).message ||
                  "Impossible de charger les templates. Vérifie que les migrations SQL ont été appliquées."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-red-300 hover:text-red-200 shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Search */}
      {!isLoading && !error && templates && templates.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#111827]/60 border-border/40"
          />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !error && filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => {
            const poleOpt = POLE_OPTIONS.find((p) => p.value === tpl.pole);
            const typeOpt = MISSION_TYPE_OPTIONS.find(
              (t) => t.value === tpl.mission_type
            );
            return (
              <Card
                key={tpl.id}
                className="p-5 bg-[#111827]/40 border-border/30 hover:border-emerald-500/30 transition-all group relative"
              >
                {isBureau && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setEditSheet({ open: true, template: tpl })
                        }
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => duplicateTemplate.mutate(tpl.id)}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Dupliquer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                  {tpl.icon ? (
                    <span className="text-lg">{tpl.icon}</span>
                  ) : (
                    <Layers className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                <h3 className="font-medium text-foreground mb-1">
                  {tpl.name}
                </h3>
                {tpl.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {tpl.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {poleOpt && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-border/40"
                    >
                      {poleOpt.emoji} {poleOpt.label}
                    </Badge>
                  )}
                  {typeOpt && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-border/40"
                    >
                      {typeOpt.emoji} {typeOpt.label}
                    </Badge>
                  )}
                  {tpl.is_global && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500/30 text-amber-300"
                    >
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      Global
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : !error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Aucun template
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Crée des templates pour accélérer la création de missions
            récurrentes.
          </p>
          {isBureau && (
            <Button
              onClick={() => setEditSheet({ open: true, template: null })}
              className="gap-2 bg-emerald-600 hover:bg-emerald-600/90"
            >
              <Plus className="h-4 w-4" />
              Créer un premier template
            </Button>
          )}
        </div>
      ) : null}

      {/* Edit/Create Sheet */}
      {associationId && (
        <TemplateEditorSheet
          open={editSheet.open}
          onOpenChange={(open) =>
            !open && setEditSheet({ open: false, template: null })
          }
          associationId={associationId}
          template={editSheet.template}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Template Editor Sheet
// ──────────────────────────────────────────────

function TemplateEditorSheet({
  open,
  onOpenChange,
  associationId,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
  template: MissionTemplate | null;
}) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [pole, setPole] = useState(NONE_VALUE);
  const [missionType, setMissionType] = useState(NONE_VALUE);

  // FIX: useEffect au lieu de useMemo pour synchroniser l'état
  useEffect(() => {
    if (open) {
      setName(template?.name || "");
      setSlug(template?.slug || "");
      setDescription(template?.description || "");
      setIcon(template?.icon || "");
      setPole(template?.pole || NONE_VALUE);
      setMissionType(template?.mission_type || NONE_VALUE);
    }
  }, [open, template]);

  const autoSlug = (n: string) =>
    n
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSubmit = () => {
    const finalSlug = slug || autoSlug(name);
    if (!name.trim() || !finalSlug) return;

    const poleValue = pole === NONE_VALUE ? null : pole;
    const typeValue = missionType === NONE_VALUE ? null : missionType;

    if (template) {
      updateTemplate.mutate(
        {
          id: template.id,
          updates: {
            name,
            slug: finalSlug,
            description: description || null,
            icon: icon || null,
            pole: poleValue,
            mission_type: typeValue,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTemplate.mutate(
        {
          association_id: associationId,
          name,
          slug: finalSlug,
          description: description || null,
          icon: icon || null,
          pole: poleValue,
          mission_type: typeValue,
          default_values: {},
          custom_field_values: {},
          enabled_sections: [],
        },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-[#0D0D0D] border-l border-border/50"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {template ? "Modifier le template" : "Créer un template"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Nom *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!template) setSlug(autoSlug(e.target.value));
              }}
              placeholder="Ex: Accueil visiteurs convention"
              className="bg-[#111827]/60 border-border/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
              Slug technique
            </Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="accueil-visiteurs-convention"
              className="bg-[#111827]/60 border-border/40 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris ce template..."
              rows={3}
              className="bg-[#111827]/60 border-border/40 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
              Icône (emoji)
            </Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="👋"
              className="bg-[#111827]/60 border-border/40 w-20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Pôle</Label>
            <Select value={pole} onValueChange={setPole}>
              <SelectTrigger className="bg-[#111827]/60 border-border/40">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Aucun</SelectItem>
                {POLE_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.emoji} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
              Type de mission
            </Label>
            <Select value={missionType} onValueChange={setMissionType}>
              <SelectTrigger className="bg-[#111827]/60 border-border/40">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Aucun</SelectItem>
                {MISSION_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-600/90"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : template ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MissionTemplatesPage;
