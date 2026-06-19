import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Sparkles, Zap } from "lucide-react";
import { getMemberDashboard } from "@/features/gamification/server";
import { StatTile } from "@/features/gamification/components/stat-tile";
import { EventCard } from "@/features/events/components/event-card";

export const metadata: Metadata = { title: "Espace membre" };

export default async function MemberHomePage() {
  const { profile, upcomingEvents, badges } = await getMemberDashboard();
  const name = profile?.display_name ?? profile?.username ?? "otaku";

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête profil */}
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-mp-primary/10 text-mp-primary grid size-16 shrink-0 place-items-center rounded-full text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="text-muted-foreground text-sm">Bon retour,</p>
          <h1 className="truncate text-3xl sm:text-4xl">{name}</h1>
          {profile?.otaku_class && (
            <span className="bg-muted text-muted-foreground mt-1 w-fit rounded-full px-2 py-0.5 text-xs font-semibold">
              {profile.otaku_class}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          icon={<Zap className="size-4" />}
          label="Niveau"
          value={profile?.level ?? 1}
          hint={`${profile?.xp ?? 0} XP au total`}
        />
        <StatTile
          icon={<Sparkles className="size-4" />}
          label="XP du mois"
          value={profile?.monthly_xp ?? 0}
        />
        <StatTile
          icon={<Coins className="size-4" />}
          label="OTK Coins"
          value={profile?.otk_coins ?? 0}
          hint={`${profile?.total_otk_earned ?? 0} gagnés`}
        />
      </div>

      {/* Prochains événements */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl">Mes prochains événements</h2>
          <Link
            href="/agenda"
            className="text-mp-primary shrink-0 text-sm font-medium hover:underline"
          >
            Agenda →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="bg-mp-cloud/50 flex flex-col items-start gap-2 rounded-xl p-5">
            <p className="text-muted-foreground text-sm">
              Tu ne participes à aucun événement à venir.
            </p>
            <Link
              href="/agenda"
              className="text-mp-primary text-sm font-medium hover:underline"
            >
              Parcourir l&apos;agenda →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                isFavorite={false}
                showFavorite={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">Mes badges</h2>
        {badges.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Pas encore de badge — participe à des événements et complète des
            quêtes pour en débloquer.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.id}
                className="border-border bg-card flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium"
                title={b.rarity ?? undefined}
              >
                <span aria-hidden>{b.icon}</span> {b.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
