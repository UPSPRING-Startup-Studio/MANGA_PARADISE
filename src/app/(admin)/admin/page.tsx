import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administration" };

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-4xl">Console d&apos;administration</h1>
      <p className="text-muted-foreground max-w-prose">
        Zone réservée au staff (admin / modérateur). La console complète est
        construite à l&apos;étape 4.
      </p>
    </div>
  );
}
