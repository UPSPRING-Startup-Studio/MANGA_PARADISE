import type { Metadata } from "next";
import Link from "next/link";
import { getMyProfile } from "@/features/profile/server";
import { ProfileForm } from "@/features/profile/components/profile-form";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const profile = await getMyProfile();

  const initial = {
    displayName: profile?.display_name ?? "",
    bio: profile?.bio ?? "",
    city: profile?.city ?? "",
    favoriteManga: profile?.favorite_manga ?? "",
    favoriteCharacter: profile?.favorite_character ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-4xl">Mon profil</h1>
        {profile?.username && (
          <Link
            href={`/u/${profile.username}`}
            className="text-mp-primary text-sm font-medium hover:underline"
          >
            Voir mon profil public →
          </Link>
        )}
      </div>
      <ProfileForm initial={initial} />
    </div>
  );
}
