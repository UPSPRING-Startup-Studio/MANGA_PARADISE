import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import { EVENT_TYPE_LABELS, type EventRow } from "@/features/events/lib";
import { formatEventWhen } from "@/features/events/format";
import { FavoriteButton } from "@/features/events/components/favorite-button";

export function EventCard({
  event,
  isFavorite,
  showFavorite,
}: {
  event: EventRow;
  isFavorite: boolean;
  showFavorite: boolean;
}) {
  return (
    <article className="border-border bg-card relative flex flex-col overflow-hidden rounded-xl border">
      <Link href={`/evenements/${event.id}`} className="flex flex-col">
        <div className="bg-mp-cloud relative aspect-video w-full overflow-hidden">
          {event.image_url || event.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image_url ?? event.cover_image ?? ""}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="text-mp-primary/40 font-heading grid size-full place-items-center text-3xl italic">
              Manga Paradise
            </div>
          )}
          <span className="bg-background/85 text-foreground absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur">
            {EVENT_TYPE_LABELS[event.type_evenement ?? "autre"]}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-lg font-semibold">{event.title}</h3>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <CalendarDays className="size-4" /> {formatEventWhen(event)}
          </p>
          {event.city && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="size-4" /> {event.city}
            </p>
          )}
        </div>
      </Link>
      {showFavorite && (
        <div className="absolute top-2 right-2">
          <FavoriteButton eventId={event.id} initial={isFavorite} />
        </div>
      )}
    </article>
  );
}
