import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Link2,
  Layers,
  Copy,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEventSeriesList,
  useDeleteEventSeries,
  type EventSeriesWithStats,
} from "@/hooks/useEventSeries";
import EventSeriesEditorSheet from "@/components/admin/event-series/EventSeriesEditorSheet";
import AttachEventToSeriesSheet from "@/components/admin/event-series/AttachEventToSeriesSheet";
import SeriesEditionsTable from "@/components/admin/event-series/SeriesEditionsTable";

const EVENT_TYPE_LABELS: Record<string, string> = {
  convention: "Convention",
  tournoi: "Tournoi",
  atelier: "Atelier",
  meetup: "Meetup",
  concert: "Concert",
  exposition: "Exposition",
  projection: "Projection",
  autre: "Autre",
};

interface AdminEventSeriesProps {
  onNewEdition?: (seriesId: string, seriesName: string) => void;
  onEditEvent?: (event: any) => void;
  onViewEvent?: (event: any) => void;
}

const AdminEventSeries = ({ onNewEdition, onEditEvent, onViewEvent }: AdminEventSeriesProps) => {
  const [search, setSearch] = useState("");
  const { data: seriesList = [], isLoading } = useEventSeriesList(search);
  const deleteMutation = useDeleteEventSeries();

  // Expanded series (inline detail)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [editorState, setEditorState] = useState<{
    open: boolean;
    series: EventSeriesWithStats | null;
  }>({ open: false, series: null });

  const [attachState, setAttachState] = useState<{
    open: boolean;
    seriesId: string;
    seriesName: string;
  }>({ open: false, seriesId: "", seriesName: "" });

  const [deleteTarget, setDeleteTarget] = useState<EventSeriesWithStats | null>(null);

  const toggleExpanded = (seriesId: string) => {
    setExpandedId((prev) => (prev === seriesId ? null : seriesId));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Chargement..."
            : `${seriesList.length} serie${seriesList.length > 1 ? "s" : ""}`}
        </p>
        <Button
          onClick={() => setEditorState({ open: true, series: null })}
          className="gap-2 bg-sakura hover:bg-sakura/90 text-white shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Creer une serie
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-muted/30 border-border focus:border-sakura/50"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-sakura" />
        </div>
      ) : seriesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium mb-1">Aucune serie</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? "Aucune serie ne correspond a ta recherche."
              : "Commence par creer une serie pour regrouper tes evenements recurrents."}
          </p>
          {!search && (
            <Button
              onClick={() => setEditorState({ open: true, series: null })}
              className="gap-2 bg-sakura hover:bg-sakura/90 text-white"
            >
              <Plus className="w-4 h-4" />
              Creer une serie
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {seriesList.map((series) => {
            const isExpanded = expandedId === series.id;

            return (
              <div
                key={series.id}
                className={cn(
                  "rounded-xl border transition-all duration-200",
                  isExpanded
                    ? "border-sakura/30 bg-muted/10"
                    : "border-border bg-transparent hover:border-sakura/20"
                )}
              >
                {/* ── Series header (clickable) ── */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(series.id)}
                  className="w-full flex items-start gap-4 p-4 text-left hover:bg-muted/20 rounded-xl transition-colors"
                >
                  {/* Cover thumbnail */}
                  {series.cover_image ? (
                    <div className="w-16 h-11 rounded-md overflow-hidden shrink-0 bg-muted">
                      <img
                        src={series.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-11 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-display text-sm leading-tight truncate text-foreground">
                        {series.canonical_name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] shrink-0 h-4">
                        /{series.slug}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {series.type_evenement && (
                        <span>
                          {EVENT_TYPE_LABELS[series.type_evenement] || series.type_evenement}
                        </span>
                      )}
                      {series.default_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {series.default_city}
                        </span>
                      )}
                      {series.association_name && (
                        <span className="text-purple-400">{series.association_name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {series.edition_count} edition{series.edition_count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Series description */}
                    {series.description && (
                      <p className="text-xs text-muted-foreground pl-20">
                        {series.description}
                      </p>
                    )}

                    {/* Series actions bar */}
                    <div className="flex items-center gap-1.5 pl-20">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachState({
                            open: true,
                            seriesId: series.id,
                            seriesName: series.canonical_name,
                          });
                        }}
                      >
                        <Link2 className="w-3 h-3" />
                        Rattacher
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewEdition?.(series.id, series.canonical_name);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        Nouvelle edition
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditorState({ open: true, series });
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(series);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </Button>
                    </div>

                    {/* Editions list */}
                    <div className="pl-20">
                      <SeriesEditionsTable
                        seriesId={series.id}
                        seriesName={series.canonical_name}
                        onEditEvent={onEditEvent}
                        onViewEvent={onViewEvent}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Sheet */}
      <EventSeriesEditorSheet
        open={editorState.open}
        onOpenChange={(open) =>
          setEditorState({ open, series: editorState.series })
        }
        series={editorState.series}
        onSuccess={() => setEditorState({ open: false, series: null })}
      />

      {/* Attach Sheet */}
      <AttachEventToSeriesSheet
        open={attachState.open}
        onOpenChange={(open) => setAttachState({ ...attachState, open })}
        seriesId={attachState.seriesId}
        seriesName={attachState.seriesName}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette serie ?</DialogTitle>
            <DialogDescription>
              La serie "{deleteTarget?.canonical_name}" sera supprimee. Les
              evenements rattaches ne seront pas supprimes mais leur series_id
              passera a null.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }
              }}
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventSeries;
