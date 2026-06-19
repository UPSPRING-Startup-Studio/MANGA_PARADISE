import type { Metadata } from "next";

export const metadata: Metadata = { title: "Espace Pro" };

export default function ProHomePage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-4xl">Espace Pro Partner</h1>
      <p className="text-muted-foreground max-w-prose">
        Zone réservée aux partenaires pro. L&apos;espace pro consolidé est
        construit à l&apos;étape 3.
      </p>
    </div>
  );
}
