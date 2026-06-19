import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import type { Area } from "@/lib/rbac";

const AREA_LABELS: Record<Exclude<Area, "public">, string> = {
  member: "Espace membre",
  association: "Association",
  pro: "Espace Pro",
  admin: "Administration",
};

/**
 * Coquille des zones connectées : barre supérieure responsive
 * (marque + libellé de zone + navigation) et conteneur de contenu centré.
 */
export function AppShell({
  area,
  children,
}: {
  area: Exclude<Area, "public">;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border bg-card/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/espace-membre"
              className="font-heading text-mp-primary truncate text-xl italic"
            >
              Manga Paradise
            </Link>
            <span className="bg-muted text-muted-foreground hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline">
              {AREA_LABELS[area]}
            </span>
          </div>
          <AppNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
