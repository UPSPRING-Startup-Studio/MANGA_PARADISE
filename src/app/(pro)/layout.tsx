import { AppShell } from "@/components/layout/app-shell";
import { requireArea } from "@/features/auth/server";

/** Groupe (pro) : réservé aux rôles `partner` (et `admin`). */
export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("pro");
  return <AppShell area="pro">{children}</AppShell>;
}
