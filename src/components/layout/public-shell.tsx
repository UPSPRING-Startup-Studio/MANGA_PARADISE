import Link from "next/link";
import { getAuthContext } from "@/features/auth/server";

/** Coquille des pages publiques : en-tête léger, CTA selon la session. */
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthContext();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-heading text-mp-primary text-xl italic"
          >
            Manga Paradise
          </Link>
          <Link
            href={user ? "/espace-membre" : "/login"}
            className="bg-mp-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-semibold"
          >
            {user ? "Mon espace" : "Connexion"}
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
