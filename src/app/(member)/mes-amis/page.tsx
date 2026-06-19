import type { Metadata } from "next";
import { getNakamasData } from "@/features/friends/server";
import { PersonRow } from "@/features/friends/components/person-row";
import { IncomingActions } from "@/features/friends/components/incoming-actions";
import { RemoveButton } from "@/features/friends/components/remove-button";
import { AddFriend } from "@/features/friends/components/add-friend";

export const metadata: Metadata = { title: "Mes Nakamas" };

export default async function MesAmisPage() {
  const data = await getNakamasData();
  if (!data) return null;
  const { friends, incoming, outgoing } = data;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-4xl">Mes Nakamas</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Ajouter un Nakama</h2>
        <AddFriend />
      </section>

      {incoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">Demandes reçues ({incoming.length})</h2>
          <ul className="flex flex-col gap-3">
            {incoming.map((f) => (
              <li key={f.friendshipId}>
                <PersonRow
                  person={f.person}
                  action={<IncomingActions friendshipId={f.friendshipId} />}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Mes amis ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Tu n&apos;as pas encore de Nakama. Cherche des membres ci-dessus !
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {friends.map((f) => (
              <li key={f.friendshipId}>
                <PersonRow
                  person={f.person}
                  action={
                    <RemoveButton
                      friendshipId={f.friendshipId}
                      label="Retirer"
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">Demandes envoyées ({outgoing.length})</h2>
          <ul className="flex flex-col gap-3">
            {outgoing.map((f) => (
              <li key={f.friendshipId}>
                <PersonRow
                  person={f.person}
                  action={
                    <RemoveButton
                      friendshipId={f.friendshipId}
                      label="Annuler"
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
