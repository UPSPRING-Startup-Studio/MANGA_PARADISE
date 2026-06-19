import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/features/events/api/events";
import { getEventDetail } from "@/features/events/server";
import { EventSchedule } from "@/features/events/components/event-schedule";
import { RsvpButton } from "@/features/events/components/rsvp-button";
import { FavoriteButton } from "@/features/events/components/favorite-button";
import { formatEventWhen } from "@/features/events/format";
import { EVENT_TYPE_LABELS } from "@/features/events/lib";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const event = await getEventById(supabase, id);
  return { title: event?.title ?? "Événement" };
}

export default async function EventPage({ params }: Params) {
  const { id } = await params;
  const data = await getEventDetail(id);
  if (!data) notFound();

  const { event, schedule, participantsCount, participating, favorite } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-mp-cloud relative aspect-[3/1] w-full overflow-hidden rounded-2xl">
        {event.cover_image || event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image ?? event.image_url ?? ""}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="text-mp-primary/40 font-heading grid size-full place-items-center text-4xl italic">
            Manga Paradise
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="bg-muted text-muted-foreground w-fit rounded-full px-2 py-0.5 text-xs font-semibold">
              {EVENT_TYPE_LABELS[event.type_evenement ?? "autre"]}
            </span>
            <h1 className="text-4xl">{event.title}</h1>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {formatEventWhen(event)}
              </span>
              {(event.venue_name || event.city) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {[event.venue_name, event.city].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> {participantsCount} participant
                {participantsCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton eventId={event.id} initial={favorite} />
            <RsvpButton eventId={event.id} initial={participating} />
          </div>
        </div>

        {event.description && (
          <p className="text-muted-foreground max-w-prose whitespace-pre-line">
            {event.description}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Programme</h2>
        <EventSchedule schedule={schedule} />
      </section>
    </div>
  );
}
