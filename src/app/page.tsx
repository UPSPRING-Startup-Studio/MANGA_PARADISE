import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="bg-mp-primary/10 text-mp-primary rounded-full px-3 py-1 text-sm font-semibold">
        Reconstruction en cours
      </span>
      <h1 className="text-foreground text-6xl">Manga Paradise</h1>
      <p className="text-muted-foreground max-w-md">
        Nouveau socle Next.js — la plateforme communautaire manga, cosplay et
        événementielle.
      </p>
      <Button>Commencer</Button>
    </main>
  );
}
