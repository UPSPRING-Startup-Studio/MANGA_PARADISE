import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Shirt, Check, Eye, Edit3, ExternalLink } from "lucide-react";
import type { UnifiedLineup } from "@/hooks/useUnifiedLineups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface LineUpCardProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string | null;
  eventImageUrl?: string | null;
  lineups: UnifiedLineup[];
  variant: 'upcoming' | 'history';
  onClick?: () => void;
  onEdit?: () => void;
}

const LineUpCard = ({
  eventId,
  eventTitle,
  eventDate,
  eventEndDate,
  eventImageUrl,
  lineups,
  variant,
  onClick,
  onEdit,
}: LineUpCardProps) => {
  const navigate = useNavigate();
  const isHistory = variant === 'history';
  const year = format(parseISO(eventDate), 'yyyy');

  // Get unique cosplays worn
  const cosplaysWorn = lineups.filter(l => l.cosplay).map(l => l.cosplay!);

  // Navigate to event with tracking param
  const goToEvent = () => {
    navigate(`/evenements/${eventId}?from=cosplay_planning`);
  };

  const civilDays = lineups.filter(l => !l.cosplay_plan_id).length;

  if (isHistory) {
    return (
      <div
        onClick={onClick}
        className="bg-muted/50 hover:bg-muted/80 rounded-xl p-4 border border-border/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          {eventImageUrl && (
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              <img
                src={eventImageUrl}
                alt={eventTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {!eventImageUrl && (
            <div className="w-14 h-14 bg-muted-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-display text-sm text-foreground truncate">
                {eventTitle} {year}
              </p>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px]">
                <Check className="w-3 h-3 mr-1" />
                Terminé
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {cosplaysWorn.slice(0, 4).map((cosplay, idx) => (
                  <img
                    key={idx}
                    src={cosplay.image_url ?? ""}
                    alt={cosplay.character_name}
                    className="w-8 h-8 rounded-full border-2 border-background object-cover"
                    title={cosplay.character_name}
                  />
                ))}
                {civilDays > 0 && (
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <Shirt className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {lineups.length} jour{lineups.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                goToEvent();
              }}
              title="Voir l'événement"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              title="Voir le détail"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Modifier"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-64 bg-background/80 backdrop-blur rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-3" onClick={goToEvent}>
        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm text-foreground truncate">
            {eventTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(eventDate), 'dd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-center gap-2" onClick={onClick}>
        <div className="flex -space-x-3">
          {lineups.slice(0, 4).map((l) =>
            l.cosplay ? (
              <img
                key={l.id}
                src={l.cosplay.image_url ?? ""}
                alt={l.cosplay.character_name}
                className="w-10 h-10 rounded-full border-2 border-background object-cover"
              />
            ) : (
              <div
                key={l.id}
                className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center"
              >
                <Shirt className="w-4 h-4 text-muted-foreground" />
              </div>
            )
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {lineups.length} jour{lineups.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default LineUpCard;
