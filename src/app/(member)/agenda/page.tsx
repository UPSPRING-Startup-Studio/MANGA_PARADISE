import type { Metadata } from "next";
import { getAgendaData } from "@/features/events/server";
import { AgendaView } from "@/features/events/components/agenda-view";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage() {
  const { events, favoriteIds, participationIds, isAuthed } =
    await getAgendaData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Agenda</h1>
        <p className="text-muted-foreground">
          Conventions, meetups, tournois et plus — trouve ton prochain
          rendez-vous otaku.
        </p>
      </div>
      <AgendaView
        events={events}
        favoriteIds={favoriteIds}
        participationIds={participationIds}
        isAuthed={isAuthed}
      />
    </div>
  );
}
