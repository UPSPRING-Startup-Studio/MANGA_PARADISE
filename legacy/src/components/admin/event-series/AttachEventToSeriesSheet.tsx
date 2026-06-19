import { useState } from "react";
import { Search, Loader2, Link2, CalendarDays, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUnattachedSeriesEvents,
  useAttachEventToSeries,
} from "@/hooks/useEventSeries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  seriesName: string;
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

const AttachEventToSeriesSheet = ({
  open,
  onOpenChange,
  seriesId,
  seriesName,
}: Props) => {
  const [search, setSearch] = useState("");
  const { data: events, isLoading } = useUnattachedSeriesEvents(search);
  const attachEvent = useAttachEventToSeries();

  const handleAttach = (eventId: string) => {
    attachEvent.mutate({ eventId, seriesId });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full bg-[#1a1a2e] border-mp-border/50">
        <SheetHeader>
          <SheetTitle className="text-slate-50">
            Rattacher a "{seriesName}"
          </SheetTitle>
          <SheetDescription className="text-mp-ink-muted">
            Selectionne les evenements a rattacher a cette serie
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
            <Input
              placeholder="Rechercher par titre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/50 border-slate-600/50 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-sakura/50"
            />
          </div>

          {/* Event list */}
          <ScrollArea className="max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-mp-ink-muted" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-2 pr-2">
                {events.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-xl border border-mp-border/30 bg-white/30 p-3 hover:bg-white/50 hover:border-sakura/25 transition-all duration-150 min-w-0"
                  >
                    {/* Thumbnail */}
                    {event.image_url ? (
                      <div className="w-16 h-12 rounded-md overflow-hidden shrink-0 bg-mp-cloud">
                        <img
                          src={event.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-md bg-mp-cloud flex items-center justify-center shrink-0">
                        <CalendarDays className="h-5 w-5 text-mp-ink-muted" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-mp-ink-muted">
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
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      size="sm"
                      onClick={() => handleAttach(event.id)}
                      disabled={attachEvent.isPending}
                      className="shrink-0 gap-1.5 bg-sakura/80 hover:bg-sakura text-white text-xs h-7 px-3"
                    >
                      {attachEvent.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Link2 className="h-3 w-3" />
                      )}
                      Rattacher
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-10 w-10 text-mp-ink-muted mb-3" />
                <p className="text-sm text-mp-ink-muted">
                  {search.length >= 2
                    ? "Aucun evenement non rattache ne correspond."
                    : "Aucun evenement disponible."}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AttachEventToSeriesSheet;
