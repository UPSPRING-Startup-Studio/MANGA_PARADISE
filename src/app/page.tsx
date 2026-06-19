import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/features/auth/server";

export default async function HomePage() {
  const { user } = await getAuthContext();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="bg-mp-primary/10 text-mp-primary rounded-full px-3 py-1 text-sm font-semibold">
        Reconstruction en cours
      </span>
      <h1 className="text-foreground text-4xl sm:text-6xl">Manga Paradise</h1>
      <p className="text-muted-foreground max-w-md">
        Nouveau socle Next.js — la plateforme communautaire manga, cosplay et
        événementielle.
      </p>
      {user ? (
        <Link
          href="/espace-membre"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Mon espace
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Commencer
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Se connecter
          </Link>
        </div>
      )}
    </main>
  );
}
