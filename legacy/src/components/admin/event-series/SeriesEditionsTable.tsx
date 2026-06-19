import { CalendarDays, MapPin, Unlink, Loader2, Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSeriesEditions, useDetachEventFromSeries } from "@/hooks/useEventSeries";

interface Props {
  seriesId: string;
  seriesName: string;
  onEditEvent?: (event: any) => void;
  onViewEvent?: (event: any) => void;
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

function getTemporalBadge(event: any): { label: string; className: string } | null {
  const now = new Date();
  const start = new Date(event.date_debut || event.date);
  const end = new Date(event.date_fin || event.date_debut || event.date);
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

  if (start > now) return { label: "A venir", className: "bg-turquoise/15 text-turquoise border-turquoise/30" };
  if (start <= now && endOfDay >= now) return { label: "En cours", className: "bg-green-500/15 text-green-400 border-green-500/30" };
  return { label: "Passe", className: "bg-muted/50 text-muted-foreground border-muted" };
}

const SeriesEditionsTable = ({ seriesId, seriesName, onEditEvent, onViewEvent }: Props) => {
  const { data: editions = [], isLoading } = useSeriesEditions(seriesId);
  const detachMutation = useDetachEventFromSeries();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (editions.length === 0) {
    return (
      <div className="text-center py-6">
        <CalendarDays className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Aucun evenement rattache.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {editions.map((event) => {
        const temporal = getTemporalBadge(event);

        return (
          <div
            key={event.id}
            className="group flex items-center gap-3 rounded-xl border border-border bg-transparent p-3 min-w-0 hover:bg-muted/30 transition-all duration-150"
          >
            {/* Thumbnail */}
            {event.image_url ? (
              <div className="w-14 h-10 rounded-md overflow-hidden shrink-0 bg-muted">
                <img
                  src={event.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-tight truncate text-foreground">
                  {event.title}
                </p>
                {temporal && (
                  <Badge variant="outline" className={`text-[10px] h-4 shrink-0 ${temporal.className}`}>
                    {temporal.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(event.date_debut || event.date)}
                </span>
                {event.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.city}
                  </span>
                )}
                {event.edition_label && (
                  <Badge variant="outline" className="text-[10px] h-4">
                    {event.edition_label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
              {onEditEvent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Editer cet evenement"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEvent(event);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {onViewEvent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Ouvrir la page"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEvent(event);
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  detachMutation.mutate({ eventId: event.id, seriesId });
                }}
                disabled={detachMutation.isPending}
                title="Detacher de la serie"
              >
                <Unlink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeriesEditionsTable;
