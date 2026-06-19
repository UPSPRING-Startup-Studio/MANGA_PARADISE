import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicProfileByUsername } from "@/features/profile/api/profiles";
import { getRelationWith } from "@/features/friends/server";
import { FriendButton } from "@/features/friends/components/friend-button";

type Params = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await fetchPublicProfileByUsername(supabase, username);
  if (!profile) return { title: "Profil introuvable" };
  const name = profile.display_name ?? `@${profile.username}`;
  return {
    title: name,
    description: profile.bio ?? `Le profil de ${name} sur Manga Paradise.`,
  };
}

export default async function PublicProfilePage({ params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await fetchPublicProfileByUsername(supabase, username);
  if (!profile) notFound();

  const relation = profile.id ? await getRelationWith(profile.id) : null;
  const name = profile.display_name ?? `@${profile.username}`;
  const facts = [
    {
      label: "Niveau",
      value: profile.level != null ? `Niv. ${profile.level}` : null,
    },
    { label: "Classe", value: profile.otaku_class },
    { label: "Ville", value: profile.city },
    { label: "Manga favori", value: profile.favorite_manga },
    { label: "Personnage favori", value: profile.favorite_character },
  ].filter((f) => f.value);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {profile.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.cover_image_url}
          alt=""
          className="mb-6 h-40 w-full rounded-2xl object-cover"
        />
      )}

      <div className="flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={name}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div className="bg-mp-primary/10 text-mp-primary flex size-20 items-center justify-center rounded-full text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-3xl">{name}</h1>
          <span className="text-muted-foreground text-sm">
            @{profile.username}
          </span>
        </div>
        {relation && profile.id && (
          <div className="ml-auto">
            <FriendButton targetId={profile.id} initial={relation} />
          </div>
        )}
      </div>

      {profile.bio && (
        <p className="text-muted-foreground mt-6 max-w-prose">{profile.bio}</p>
      )}

      {facts.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="bg-mp-cloud/50 rounded-xl p-3">
              <dt className="text-muted-foreground text-xs font-medium uppercase">
                {f.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {profile.favorite_genres && profile.favorite_genres.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {profile.favorite_genres.map((g) => (
            <span
              key={g}
              className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
            >
              {g}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
